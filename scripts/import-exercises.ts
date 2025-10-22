// scripts/import-exercises.ts
/**
 * Import Exercises from Google Sheets
 * This script imports all exercises from the Google Sheets database
 */

import { PrismaClient } from '@prisma/client';
import { publishExercise } from '../src/lib/integrations/firebase'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient();

// Google Sheets CSV export URL
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1KdlE6VrQBhauGQsNDllGLQQK6vVkWoXX/export?format=csv&gid=1613515785';


async function downloadAndParseCSV(): Promise<any[]> {
  try {
    console.log('📥 Downloading exercises from Google Sheets...');
    
    const response = await fetch(GOOGLE_SHEETS_CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to download CSV: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log(`📄 Downloaded CSV with ${csvText.length} characters`);
    
    const records = parse(csvText, { columns: true, skip_empty_lines: true }) as any[]
    console.log(`📊 Parsed ${records.length} rows from CSV`);
    return records;
  } catch (error) {
    console.error('❌ Error downloading/parsing CSV:', error);
    throw error;
  }
}

// Types are inferred from CSV headers by csv-parse

function parseMuscleGroups(muscleGroupsStr: string): string[] {
  if (!muscleGroupsStr) return [];
  return muscleGroupsStr
    .split(',')
    .map(mg => mg.trim())
    .filter(mg => mg.length > 0);
}

function parseEquipment(equipmentStr: string): string[] {
  if (!equipmentStr) return [];
  return equipmentStr
    .split(',')
    .map(eq => eq.trim())
    .filter(eq => eq.length > 0);
}

function normalizeDifficulty(difficulty: string): string {
  const normalized = difficulty?.trim().toUpperCase();
  if (['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(normalized)) {
    return normalized;
  }
  return 'BEGINNER'; // Default fallback
}

async function importExercises() {
  try {
    console.log('🌱 Starting exercise import...');
    
    // Download and parse CSV
    const csvData = await downloadAndParseCSV();
    
    // Transform data for Prisma
    const exercises = csvData.map((row: any, index: number) => {
      // Skip header row if it exists
      if (index === 0 && row.name === 'name') {
        return null;
      }
      
      return {
        name: row.name?.trim() || `Exercise ${index}`,
        category: row.category?.trim() || 'Other',
        muscleGroups: parseMuscleGroups(row.muscleGroups || row.muscle_groups || ''),
        equipment: parseEquipment(row.equipment || ''),
        instructions: row.instructions?.trim() || null,
        videoUrl: row.videoUrl?.trim() || row.video_url?.trim() || null,
        imageUrl: row.imageUrl?.trim() || row.image_url?.trim() || null,
        difficulty: normalizeDifficulty(row.difficulty || 'BEGINNER'),
        safetyNotes: row.safetyNotes?.trim() || row.safety_notes?.trim() || null,
        isActive: true,
        usageCount: 0,
      };
    }).filter(exercise => exercise !== null);
    
    console.log(`🔄 Processing ${exercises.length} exercises...`);
    
    // Clear existing exercises (optional - comment out if you want to keep existing data)
    // Upsert mode to preserve existing data
    let importedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    for (const ex of exercises) {
      try {
        const upserted = await prisma.exercises.upsert({
          where: { name: ex.name },
          create: ex,
          update: ex,
        })
        if (upserted.createdAt.getTime() === upserted.updatedAt.getTime()) importedCount++
        else updatedCount++
      } catch (e) {
        failedCount++
        console.warn('Row failed:', ex.name, e)
      }
    }
    console.log(`🎉 Import completed! Imported ${importedCount}, Updated ${updatedCount}, Failed ${failedCount}`);
    // Optional: Mirror to Firestore if configured
    try {
      console.log('🔁 Mirroring exercises to Firestore (if configured)...')
      const all = await prisma.exercises.findMany()
      let mirrored = 0
      for (const ex of all) {
        await publishExercise({
          id: ex.id,
          name: ex.name,
          category: ex.category,
          muscleGroups: ex.muscleGroups,
          equipment: ex.equipment,
          difficulty: ex.difficulty,
          instructions: ex.instructions,
          safetyNotes: ex.safetyNotes,
          imageUrl: ex.imageUrl,
          videoUrl: ex.videoUrl,
          isActive: ex.isActive,
          usageCount: ex.usageCount,
          lastUsed: ex.lastUsed,
        })
        mirrored++
        if (mirrored % 200 === 0) console.log(`  ...mirrored ${mirrored}/${all.length}`)
      }
      console.log(`✅ Mirrored ${mirrored} exercises to Firestore`)
    } catch (e) {
      console.warn('⚠️ Skipped Firestore mirroring (missing env or dependency):', e)
    }
    // Verify import
    const totalExercises = await prisma.exercises.count();
    console.log(`📊 Total exercises in database: ${totalExercises}`);
    
    // Show some statistics
    const categories = await prisma.exercises.groupBy({
      by: ['category'],
      _count: { category: true },
    });
    
    console.log('📈 Exercise categories:');
    categories.forEach(cat => {
      console.log(`  - ${cat.category}: ${cat._count.category} exercises`);
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (require.main === module) {
  importExercises()
    .then(() => {
      console.log('✅ Exercise import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Exercise import failed:', error);
      process.exit(1);
    });
}

export { importExercises };
