/**
 * Exercise Media Import Script
 *
 * This script imports exercise images from free-exercise-db (public domain)
 * into Massimino's public/exercises folder and updates the database.
 *
 * Source: https://github.com/yuhonas/free-exercise-db (Unlicense - Public Domain)
 *
 * Usage:
 *   npx ts-node scripts/import-exercise-media.ts
 *
 * Options:
 *   --dry-run    Preview changes without writing files
 *   --db-update  Also update database with image URLs
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const FREE_EXERCISE_DB_PATH = '/tmp/free-exercise-db';
const PUBLIC_EXERCISES_PATH = path.join(process.cwd(), 'public', 'exercises');
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

interface FreeExerciseDbEntry {
  id: string;
  name: string;
  images: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  category: string;
  instructions: string[];
}

interface ImportResult {
  exercise: string;
  status: 'success' | 'skipped' | 'error';
  imagesCopied: number;
  message?: string;
  publicPath?: string;
}

// Utility to create slug from exercise name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Copy images from free-exercise-db to public folder
function copyExerciseImages(
  freeExerciseDbId: string,
  targetSlug: string,
  dryRun: boolean
): { copied: number; targetPath: string } {
  const sourcePath = path.join(FREE_EXERCISE_DB_PATH, 'exercises', freeExerciseDbId);
  const targetPath = path.join(PUBLIC_EXERCISES_PATH, targetSlug);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source path not found: ${sourcePath}`);
  }

  // Get image files from source
  const files = fs.readdirSync(sourcePath).filter(f =>
    f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.gif')
  );

  if (files.length === 0) {
    throw new Error(`No images found in: ${sourcePath}`);
  }

  if (!dryRun) {
    // Create target directory
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    // Copy images
    for (const file of files) {
      const sourceFile = path.join(sourcePath, file);
      const targetFile = path.join(targetPath, file);
      fs.copyFileSync(sourceFile, targetFile);
    }
  }

  return { copied: files.length, targetPath };
}

// Main import function
async function importExerciseMedia(options: { dryRun: boolean; dbUpdate: boolean }) {
  console.log('\n========================================');
  console.log('  Exercise Media Import Script');
  console.log('========================================\n');

  if (options.dryRun) {
    console.log('** DRY RUN MODE - No files will be written **\n');
  }

  // Check if free-exercise-db exists
  if (!fs.existsSync(FREE_EXERCISE_DB_PATH)) {
    console.error(`Error: free-exercise-db not found at ${FREE_EXERCISE_DB_PATH}`);
    console.log('Please run: git clone --depth 1 https://github.com/yuhonas/free-exercise-db.git /tmp/free-exercise-db');
    process.exit(1);
  }

  // Load mapping file
  if (!fs.existsSync(MAPPING_FILE_PATH)) {
    console.error(`Error: Mapping file not found at ${MAPPING_FILE_PATH}`);
    process.exit(1);
  }

  const mappingData: MappingFile = JSON.parse(fs.readFileSync(MAPPING_FILE_PATH, 'utf-8'));
  console.log(`Loaded ${mappingData.exercises.length} exercises from mapping file\n`);

  // Create public exercises directory if it doesn't exist
  if (!options.dryRun && !fs.existsSync(PUBLIC_EXERCISES_PATH)) {
    fs.mkdirSync(PUBLIC_EXERCISES_PATH, { recursive: true });
  }

  // Process each exercise
  const results: ImportResult[] = [];
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const exercise of mappingData.exercises) {
    const slug = slugify(exercise.massimino_name);

    // Skip exercises without mapping
    if (!exercise.free_exercise_db_id || exercise.status === 'no_match') {
      results.push({
        exercise: exercise.massimino_name,
        status: 'skipped',
        imagesCopied: 0,
        message: 'No free-exercise-db match'
      });
      skippedCount++;
      continue;
    }

    try {
      const { copied, targetPath } = copyExerciseImages(
        exercise.free_exercise_db_id,
        slug,
        options.dryRun
      );

      results.push({
        exercise: exercise.massimino_name,
        status: 'success',
        imagesCopied: copied,
        publicPath: `/exercises/${slug}`
      });
      successCount++;

      console.log(`✓ ${exercise.massimino_name} - ${copied} images copied to /exercises/${slug}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        exercise: exercise.massimino_name,
        status: 'error',
        imagesCopied: 0,
        message: errorMessage
      });
      errorCount++;

      console.log(`✗ ${exercise.massimino_name} - Error: ${errorMessage}`);
    }
  }

  // Print summary
  console.log('\n========================================');
  console.log('  Import Summary');
  console.log('========================================\n');
  console.log(`Total exercises:  ${mappingData.exercises.length}`);
  console.log(`Successful:       ${successCount}`);
  console.log(`Skipped:          ${skippedCount}`);
  console.log(`Errors:           ${errorCount}`);
  console.log(`Coverage:         ${((successCount / mappingData.exercises.length) * 100).toFixed(1)}%`);

  // List skipped exercises
  const skipped = results.filter(r => r.status === 'skipped');
  if (skipped.length > 0) {
    console.log('\nExercises without media (need manual sourcing):');
    skipped.forEach(r => console.log(`  - ${r.exercise}`));
  }

  // List errors
  const errors = results.filter(r => r.status === 'error');
  if (errors.length > 0) {
    console.log('\nExercises with errors:');
    errors.forEach(r => console.log(`  - ${r.exercise}: ${r.message}`));
  }

  // Generate database update SQL if requested
  if (options.dbUpdate && !options.dryRun) {
    console.log('\n========================================');
    console.log('  Database Update');
    console.log('========================================\n');

    const successful = results.filter(r => r.status === 'success');
    console.log('SQL to update exercises with image URLs:\n');

    for (const result of successful) {
      const imageUrl = `${result.publicPath}/0.jpg`;
      console.log(`UPDATE exercises SET "imageUrl" = '${imageUrl}' WHERE name ILIKE '%${result.exercise}%';`);
    }
  }

  // Write results to JSON file
  const resultsPath = path.join(process.cwd(), 'scripts', 'import-results.json');
  if (!options.dryRun) {
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total: mappingData.exercises.length, success: successCount, skipped: skippedCount, errors: errorCount },
      results
    }, null, 2));
    console.log(`\nResults written to: ${resultsPath}`);
  }

  return results;
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dbUpdate = args.includes('--db-update');

// Run import
importExerciseMedia({ dryRun, dbUpdate })
  .then(() => {
    console.log('\nImport complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
