/**
 * Update Exercise Images in Database
 *
 * This script updates the exercises table with image URLs
 * from the imported free-exercise-db images.
 *
 * Usage:
 *   npx ts-node scripts/update-exercise-images.ts
 *
 * Options:
 *   --dry-run    Preview changes without updating database
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MAPPING_FILE_PATH = path.join(process.cwd(), 'scripts', 'exercise-mapping.json');

interface ExerciseMapping {
  massimino_name: string;
  aliases: string[];
  free_exercise_db_id: string | null;
  category: string;
  status?: string;
}

interface MappingFile {
  exercises: ExerciseMapping[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function updateExerciseImages(dryRun: boolean) {
  console.log('\n========================================');
  console.log('  Update Exercise Images in Database');
  console.log('========================================\n');

  if (dryRun) {
    console.log('** DRY RUN MODE - No database changes will be made **\n');
  }

  // Load mapping file
  const mappingData: MappingFile = JSON.parse(fs.readFileSync(MAPPING_FILE_PATH, 'utf-8'));
  console.log(`Loaded ${mappingData.exercises.length} exercises from mapping file\n`);

  let updatedCount = 0;
  let notFoundCount = 0;
  let skippedCount = 0;
  let alreadyHasImageCount = 0;

  for (const exercise of mappingData.exercises) {
    // Skip exercises without mapping
    if (!exercise.free_exercise_db_id || exercise.status === 'no_match') {
      skippedCount++;
      continue;
    }

    const slug = slugify(exercise.massimino_name);
    const imageUrl = `/exercises/${slug}/0.jpg`;

    // Build search terms: main name + aliases
    const searchTerms = [exercise.massimino_name, ...exercise.aliases];

    // Find matching exercise in database
    let dbExercise: { id: string; name: string; imageUrl: string | null } | null = null;
    for (const term of searchTerms) {
      const found = await prisma.exercises.findFirst({
        where: {
          OR: [
            { name: { equals: term, mode: 'insensitive' } },
            { name: { contains: term, mode: 'insensitive' } }
          ]
        },
        select: { id: true, name: true, imageUrl: true }
      });
      if (found) {
        dbExercise = found;
        break;
      }
    }

    if (!dbExercise) {
      console.log(`  ⚠ Not in DB: ${exercise.massimino_name}`);
      notFoundCount++;
      continue;
    }

    // Check if already has image
    if (dbExercise.imageUrl) {
      console.log(`  ○ Already has image: ${dbExercise.name}`);
      alreadyHasImageCount++;
      continue;
    }

    // Update the exercise with image URL
    if (!dryRun) {
      await prisma.exercises.update({
        where: { id: dbExercise.id },
        data: { imageUrl }
      });
    }

    console.log(`  ✓ Updated: ${dbExercise.name} -> ${imageUrl}`);
    updatedCount++;
  }

  console.log('\n========================================');
  console.log('  Update Summary');
  console.log('========================================\n');
  console.log(`Total in mapping:      ${mappingData.exercises.length}`);
  console.log(`Updated:               ${updatedCount}`);
  console.log(`Already had image:     ${alreadyHasImageCount}`);
  console.log(`Not found in DB:       ${notFoundCount}`);
  console.log(`Skipped (no match):    ${skippedCount}`);

  await prisma.$disconnect();
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run update
updateExerciseImages(dryRun)
  .then(() => {
    console.log('\nUpdate complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Update failed:', error);
    process.exit(1);
  });
