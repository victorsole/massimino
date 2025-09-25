/**
 * Import Exercises from Local CSV File
 * This script imports all exercises from a local CSV file
 * 
 * Instructions:
 * 1. Export your Google Sheets as CSV
 * 2. Save it as 'exercises.csv' in the scripts folder
 * 3. Run: npx ts-node scripts/import-exercises-local.ts
 */

import { PrismaClient } from '@prisma/client';
import { publishExercise } from '../src/lib/integrations/firebase'
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync'
import { join } from 'path';

const prisma = new PrismaClient();

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

async function importExercisesFromFile() {
  try {
    console.log('🌱 Starting exercise import from local CSV...');
    
    // Read CSV file
    const csvPath = join(__dirname, 'exercises.csv');
    console.log(`📁 Reading CSV from: ${csvPath}`);
    
    const csvText = readFileSync(csvPath, 'utf-8');
    console.log(`📄 Read CSV with ${csvText.length} characters`);
    
    // Parse CSV
    const records = parse(csvText, { columns: true, skip_empty_lines: true }) as any[]
    console.log(`📊 Parsed ${records.length} rows from CSV`);
    
    // Transform data for Prisma
    const exercises = records.map((row: any, index: number) => {
      // Skip header row if it exists
      if (index === 0 && row.Exercise === 'Exercise') {
        return null;
      }
      
      return {
        name: row.Exercise?.trim() || `Exercise ${index}`,
        category: row['Primary Exercise Classification']?.trim() || 'Other',
        muscleGroups: parseMuscleGroups(
          (row['Target Muscle Group '] || '') + ',' + 
          (row['Prime Mover Muscle'] || '') + ',' + 
          (row['Secondary Muscle'] || '') + ',' + 
          (row['Tertiary Muscle'] || '')
        ),
        equipment: parseEquipment(
          (row['Primary Equipment '] || '') + ',' + 
          (row['Secondary Equipment'] || '')
        ),
        instructions: row['In-Depth YouTube Explanation']?.trim() || null,
        videoUrl: row['Short YouTube Demonstration']?.trim() || null,
        imageUrl: null, // No image column in your data
        difficulty: normalizeDifficulty(row['Difficulty Level'] || 'BEGINNER'),
        safetyNotes: row['Posture']?.trim() || null,
        isActive: true,
        usageCount: 0,
      };
    }).filter(exercise => exercise !== null);
    
    console.log(`🔄 Processing ${exercises.length} exercises...`);
    
    // Clear existing exercises (handle foreign key constraints)
    // Upsert mode (no clearing): update if name exists, otherwise create
    
    let importedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    for (const ex of exercises) {
      try {
        const upserted = await prisma.exercise.upsert({
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
      const all = await prisma.exercise.findMany()
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
    const totalExercises = await prisma.exercise.count();
    console.log(`📊 Total exercises in database: ${totalExercises}`);
    
    // Show some statistics
    const categories = await prisma.exercise.groupBy({
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
  importExercisesFromFile()
    .then(() => {
      console.log('✅ Exercise import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Exercise import failed:', error);
      process.exit(1);
    });
}

export { importExercisesFromFile };
