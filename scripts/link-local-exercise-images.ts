/**
 * Link Local Exercise Images to Database
 *
 * This script:
 * 1. Reads exercises from the database
 * 2. Checks if local images exist in public/exercises/{slug}/
 * 3. Updates the exercise imageUrl to point to local images
 * 4. Creates exercise_media entries for the images
 *
 * Usage:
 *   npx ts-node scripts/link-local-exercise-images.ts [--dry-run] [--verbose]
 */

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';
import * as fs from 'fs';
import * as path from 'path';

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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Generate simplified variations of a name for fuzzy matching
function getNameVariants(name: string): string[] {
  const slug = slugify(name);
  const variants = [slug];

  // Remove common prefixes/suffixes
  const simplified = slug
    .replace(/^(single-leg-|30-legs-|30-arms-|lever-|resistance-band-|cable-|machine-|smith-machine-|barbell-|dumbbell-|ez-|ez-bar-)/gi, '')
    .replace(/-variation$|-gethin-variation$|-v-2$|-declined$/, '');
  if (simplified !== slug) variants.push(simplified);

  // Remove parenthetical content slugified
  const withoutParens = slug.replace(/-\([^)]+\)/, '');
  if (withoutParens !== slug) variants.push(withoutParens);

  return [...new Set(variants)].filter(v => v.length > 2);
}

function findLocalImages(slug: string): string[] {
  const folderPath = path.join(PUBLIC_EXERCISES_PATH, slug);
  if (!fs.existsSync(folderPath)) {
    return [];
  }
  return fs.readdirSync(folderPath).filter(f =>
    f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.gif')
  );
}

async function getSystemUserId(): Promise<string | null> {
  const admin = await prisma.users.findFirst({ where: { role: 'ADMIN' } });
  if (admin) return admin.id;
  const any = await prisma.users.findFirst();
  return any ? any.id : null;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  console.log('\n========================================');
  console.log('  Link Local Exercise Images to Database');
  console.log('========================================\n');

  if (dryRun) {
    console.log('** DRY RUN MODE - No database changes **\n');
  }

  // Load mapping file for reference
  let mapping: MappingFile | null = null;
  if (fs.existsSync(MAPPING_FILE_PATH)) {
    mapping = JSON.parse(fs.readFileSync(MAPPING_FILE_PATH, 'utf-8'));
    console.log(`Loaded ${mapping?.exercises.length || 0} exercises from mapping file`);
  }

  // Build a lookup from slug/aliases to mapping entry
  const mappingLookup = new Map<string, ExerciseMapping>();
  if (mapping) {
    for (const entry of mapping.exercises) {
      // Add by massimino_name slug
      mappingLookup.set(slugify(entry.massimino_name), entry);
      // Add by aliases
      for (const alias of entry.aliases) {
        mappingLookup.set(slugify(alias), entry);
      }
    }
  }

  // Get all available local image folders
  const localFolders = fs.existsSync(PUBLIC_EXERCISES_PATH)
    ? fs.readdirSync(PUBLIC_EXERCISES_PATH).filter(f =>
        fs.statSync(path.join(PUBLIC_EXERCISES_PATH, f)).isDirectory()
      )
    : [];
  console.log(`Found ${localFolders.length} local exercise folders\n`);

  // Get all exercises from database
  const exercises = await prisma.exercises.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      aliasNames: true,
    },
  });
  console.log(`Found ${exercises.length} exercises in database\n`);

  const systemUserId = await getSystemUserId();
  if (!systemUserId) {
    console.error('No user found for media attribution');
    process.exit(1);
  }

  let updatedCount = 0;
  let mediaCreatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;

  const notFoundExercises: string[] = [];
  const updatedExercises: string[] = [];

  for (const exercise of exercises) {
    const slug = exercise.slug || slugify(exercise.name);

    // Try to find local images by:
    // 1. Direct slug match
    // 2. Mapping lookup by slug
    // 3. Mapping lookup by alias slugs

    let localFolder: string | null = null;
    let images: string[] = [];

    // Try direct slug match
    if (localFolders.includes(slug)) {
      localFolder = slug;
      images = findLocalImages(slug);
    }

    // Try by exercise name variations if no direct match
    if (images.length === 0) {
      const nameSlug = slugify(exercise.name);
      if (localFolders.includes(nameSlug)) {
        localFolder = nameSlug;
        images = findLocalImages(nameSlug);
      }
    }

    // Try fuzzy matching with name variants (e.g., "Leg Extension Gethin Variation" -> "leg-extension")
    if (images.length === 0) {
      const variants = getNameVariants(exercise.name);
      for (const variant of variants) {
        if (localFolders.includes(variant)) {
          localFolder = variant;
          images = findLocalImages(variant);
          break;
        }
      }
    }

    // Try mapping lookup
    if (images.length === 0) {
      const mappingEntry = mappingLookup.get(slug) || mappingLookup.get(slugify(exercise.name));
      if (mappingEntry && mappingEntry.free_exercise_db_id) {
        // The free_exercise_db_id might be different from our slug
        // Try to find a folder that matches the massimino_name
        const mappingSlug = slugify(mappingEntry.massimino_name);
        if (localFolders.includes(mappingSlug)) {
          localFolder = mappingSlug;
          images = findLocalImages(mappingSlug);
        }
      }
    }

    // Try aliases from the database
    if (images.length === 0 && exercise.aliasNames) {
      for (const alias of exercise.aliasNames) {
        const aliasSlug = slugify(alias);
        if (localFolders.includes(aliasSlug)) {
          localFolder = aliasSlug;
          images = findLocalImages(aliasSlug);
          break;
        }
      }
    }

    if (images.length === 0) {
      notFoundCount++;
      if (verbose) {
        notFoundExercises.push(exercise.name);
      }
      continue;
    }

    // Found local images!
    const primaryImage = images.find(i => i === '0.jpg') || images[0];
    const localImageUrl = `/exercises/${localFolder}/${primaryImage}`;

    // Check if already has this URL
    if (exercise.imageUrl === localImageUrl) {
      skippedCount++;
      continue;
    }

    if (verbose) {
      console.log(`✓ ${exercise.name} -> ${localImageUrl} (${images.length} images)`);
    }

    if (!dryRun) {
      // Update exercise imageUrl
      await prisma.exercises.update({
        where: { id: exercise.id },
        data: {
          imageUrl: localImageUrl,
          hasMedia: true,
          mediaCount: images.length,
          lastMediaAddedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create exercise_media entry for the primary image
      const existingMedia = await prisma.exercise_media.findFirst({
        where: {
          globalExerciseId: exercise.id,
          url: localImageUrl,
        },
      });

      if (!existingMedia) {
        await prisma.exercise_media.create({
          data: {
            id: crypto.randomUUID(),
            userId: systemUserId,
            globalExerciseId: exercise.id,
            userExerciseId: null,
            provider: 'upload',
            url: localImageUrl,
            title: exercise.name,
            thumbnailUrl: localImageUrl,
            visibility: 'public',
            status: 'approved',
            updatedAt: new Date(),
          },
        });
        mediaCreatedCount++;
      }
    }

    updatedCount++;
    updatedExercises.push(exercise.name);
  }

  // Print summary
  console.log('\n========================================');
  console.log('  Summary');
  console.log('========================================\n');
  console.log(`Total exercises:     ${exercises.length}`);
  console.log(`Updated:             ${updatedCount}`);
  console.log(`Media entries:       ${mediaCreatedCount}`);
  console.log(`Skipped (no change): ${skippedCount}`);
  console.log(`No local images:     ${notFoundCount}`);
  console.log(`Coverage:            ${((updatedCount / exercises.length) * 100).toFixed(1)}%`);

  if (verbose && notFoundExercises.length > 0 && notFoundExercises.length <= 50) {
    console.log('\nExercises without local images (first 50):');
    notFoundExercises.slice(0, 50).forEach(name => console.log(`  - ${name}`));
  }

  if (dryRun) {
    console.log('\n** DRY RUN - No changes made. Run without --dry-run to apply changes **');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
