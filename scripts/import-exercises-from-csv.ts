// scripts/import-exercises-from-csv.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface CSVExercise {
  '': string;
  'Exercise': string;
  'Short YouTube Demonstration': string;
  'In-Depth YouTube Explanation': string;
  'Difficulty Level': string;
  'Target Muscle Group ': string;
  'Prime Mover Muscle': string;
  'Secondary Muscle': string;
  'Tertiary Muscle': string;
  'Primary Equipment ': string;
  '# Primary Items': string;
  'Secondary Equipment': string;
  '# Secondary Items': string;
  'Posture': string;
  'Single or Double Arm': string;
  'Continuous or Alternating Arms ': string;
  'Grip': string;
  'Load Position (Ending)': string;
  'Continuous or Alternating Legs ': string;
  'Foot Elevation': string;
  'Combination Exercises': string;
  'Movement Pattern #1': string;
  'Movement Pattern #2': string;
  'Movement Pattern #3': string;
  'Plane Of Motion #1': string;
  'Plane Of Motion #2': string;
  'Plane Of Motion #3': string;
  'Body Region': string;
  'Force Type': string;
  'Mechanics': string;
  'Laterality': string;
  'Primary Exercise Classification': string;
}

function normalizeDifficulty(difficulty: string): string {
  const normalized = difficulty.trim().toUpperCase();
  if (normalized === 'BEGINNER') return 'BEGINNER';
  if (normalized === 'INTERMEDIATE') return 'INTERMEDIATE';
  if (normalized === 'ADVANCED') return 'ADVANCED';
  return 'BEGINNER'; // Default to beginner
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractMuscleGroups(row: CSVExercise): string[] {
  const muscles = new Set<string>();

  if (row['Target Muscle Group ']?.trim()) muscles.add(row['Target Muscle Group '].trim());
  if (row['Prime Mover Muscle']?.trim()) muscles.add(row['Prime Mover Muscle'].trim());
  if (row['Secondary Muscle']?.trim()) muscles.add(row['Secondary Muscle'].trim());
  if (row['Tertiary Muscle']?.trim()) muscles.add(row['Tertiary Muscle'].trim());

  return Array.from(muscles).filter(m => m && m !== 'None');
}

function extractEquipment(row: CSVExercise): string[] {
  const equipment = new Set<string>();

  if (row['Primary Equipment ']?.trim() && row['Primary Equipment '].trim() !== 'None') {
    equipment.add(row['Primary Equipment '].trim());
  }
  if (row['Secondary Equipment']?.trim() && row['Secondary Equipment'].trim() !== 'None') {
    equipment.add(row['Secondary Equipment'].trim());
  }

  return Array.from(equipment);
}

function determineCategory(row: CSVExercise): string {
  const classification = row['Primary Exercise Classification']?.trim();
  const mechanics = row['Mechanics']?.trim();

  // Map classifications to categories
  if (classification?.toLowerCase().includes('cardio')) return 'Cardio';
  if (classification?.toLowerCase().includes('flexibility')) return 'Flexibility';
  if (classification?.toLowerCase().includes('mobility')) return 'Mobility';
  if (mechanics?.toLowerCase() === 'compound') return 'Compound';
  if (mechanics?.toLowerCase() === 'isolation') return 'Isolation';

  // Default based on body region
  const bodyRegion = row['Body Region']?.trim();
  if (bodyRegion?.toLowerCase().includes('core')) return 'Core';
  if (bodyRegion?.toLowerCase().includes('upper')) return 'Upper Body';
  if (bodyRegion?.toLowerCase().includes('lower')) return 'Lower Body';

  return 'Strength';
}

async function importExercises() {
  try {
    console.log('Reading CSV file...');
    const csvPath = path.join(process.cwd(), 'public', 'databases', 'exercises.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    console.log('Parsing CSV data...');
    const records: CSVExercise[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Found ${records.length} exercises in CSV`);

    // Check existing exercises
    const existingExercises = await prisma.exercises.findMany({
      select: { name: true }
    });
    const existingNames = new Set(existingExercises.map(e => e.name));
    console.log(`Found ${existingNames.size} existing exercises in database`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of records) {
      try {
        const exerciseName = row['Exercise']?.trim();

        // Skip if no name or already exists
        if (!exerciseName) {
          skipped++;
          continue;
        }

        if (existingNames.has(exerciseName)) {
          skipped++;
          continue;
        }

        const muscleGroups = extractMuscleGroups(row);
        const equipment = extractEquipment(row);
        const category = determineCategory(row);
        const difficulty = normalizeDifficulty(row['Difficulty Level']);
        const slug = createSlug(exerciseName);

        // Create the exercise
        await prisma.exercises.create({
          data: {
            id: crypto.randomUUID(),
            name: exerciseName,
            slug: slug,
            category: category,
            muscleGroups: muscleGroups,
            equipment: equipment.length > 0 ? equipment : ['Bodyweight'],
            difficulty: difficulty,
            instructions: null,
            videoUrl: null,
            imageUrl: null,
            isActive: true,
            safetyNotes: null,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            commonMistakes: [],
            formCues: [],
            isCustom: false,
            createdBy: null
          }
        });

        imported++;
        existingNames.add(exerciseName); // Track to avoid duplicates in same run

        if (imported % 100 === 0) {
          console.log(`Imported ${imported} exercises...`);
        }
      } catch (error) {
        errors++;
        console.error(`Error importing exercise "${row['Exercise']}":`, error);
      }
    }

    console.log('\n✅ Import complete!');
    console.log(`Imported: ${imported}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total in database: ${existingNames.size + imported}`);

  } catch (error) {
    console.error('Error importing exercises:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importExercises();
