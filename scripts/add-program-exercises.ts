/**
 * Add Program Exercises with Media
 *
 * This script:
 * 1. Reads exercise names from programs
 * 2. Creates missing exercises in the database
 * 3. Links exercises to local images using fuzzy matching
 *
 * Usage:
 *   npx ts-node scripts/add-program-exercises.ts [--dry-run]
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';
import * as fs from 'fs';
import * as path from 'path';

const PUBLIC_EXERCISES_PATH = path.join(process.cwd(), 'public', 'exercises');

// Exercise name -> local folder mappings for common variations
const EXERCISE_MAPPINGS: Record<string, string> = {
  // Squats
  'back squats': 'barbell-back-squat',
  'barbell back squats': 'barbell-back-squat',
  'front squats': 'front-squat',
  'goblet squat': 'goblet-squat',
  'goblet squats': 'goblet-squat',
  'hack squats': 'hack-squat',
  'bodyweight squat': 'bodyweight-squat',
  'bodyweight squats': 'bodyweight-squat',
  'dumbbell squat': 'goblet-squat',
  'ball squat': 'wall-sit',
  'bulgarian split squats': 'bulgarian-split-squat',

  // Presses
  'dumbbell chest press': 'dumbbell-bench-press',
  'incline dumbbell chest press': 'incline-dumbbell-press',
  'decline dumbbell chest press': 'decline-dumbbell-press',
  'behind the neck overhead press': 'behind-the-neck-press',

  // Rows
  'barbell bent over row': 'barbell-row',
  'bent over dumbbell reverse fly': 'rear-delt-fly',

  // Curls
  'barbell curl (heavy)': 'barbell-curl',
  'alternating dumbbell curls': 'dumbbell-curl',
  'barbell curls': 'barbell-curl',
  'biceps curls': 'dumbbell-curl',
  'cable curls': 'cable-curl',
  'hammer curls': 'hammer-curl',

  // Flies
  'dumbbell chest fly': 'dumbbell-flye',
  'flat dumbbell flyes': 'dumbbell-flye',
  'incline dumbbell flyes': 'incline-dumbbell-flye',

  // Deadlifts
  'barbell deadlift': 'deadlift',
  'barbell deadlifts': 'deadlift',
  'barbell deadlifts (optional)': 'deadlift',

  // Shoulders
  'dumbbell lateral raise': 'lateral-raise',
  'lateral raises': 'lateral-raise',
  'front raises': 'front-raise',
  'face pulls': 'face-pull',
  'barbell shrugs': 'shrug',
  'dumbbell shrugs': 'shrug',

  // Triceps
  'dumbbell overhead triceps extension': 'overhead-tricep-extension',
  'triceps pushdowns': 'tricep-pushdown',
  'skull crushers': 'skull-crusher',

  // Legs
  'leg curls': 'lying-leg-curl',
  'leg extensions': 'leg-extension',
  'calf raises': 'standing-calf-raise',
  'standing calf raises': 'standing-calf-raise',
  'seated calf raises': 'seated-calf-raise',
  'lunges': 'lunge',

  // Back
  'pull ups': 'pull-up',
  'chin ups': 'chin-up',
  'lat pulldowns': 'lat-pulldown',
  'lat pulldown': 'lat-pulldown',
  'seated rows': 'seated-cable-row',
  'good mornings': 'good-morning',
  'bodyweight good mornings': 'good-morning',
  'hyperextensions': 'hyperextension',
  '45-degree hyperextension': 'hyperextension',

  // Core
  'crunches': 'crunch',
  'reverse crunches': 'reverse-crunch',
  'planks': 'plank',
  'plank': 'plank',
  'leg raises': 'leg-raise',
  'hanging leg raises': 'hanging-knee-raise',
  'mountain climbers': 'mountain-climber',

  // Other
  'dips': 'dips',
  'dip (weighted if possible)': 'dips',
  'push ups': 'push-up',
  'push-ups': 'push-up',
  'burpees': 'burpee',
  "farmer's carry": 'farmers-walk',
  'farmers carry': 'farmers-walk',
  'step ups': 'step-up',
  'box step-ups': 'step-up',
  'box step-ups with knee drive': 'step-up',
  'jump squats': 'jump-squat',
  'box jumps': 'box-jump',
  'box jump': 'box-jump',
  'box jump-up': 'box-jump',
  'box jump-up with stabilization': 'box-jump',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function findBestLocalImage(exerciseName: string, localFolders: string[]): string | null {
  const nameLower = exerciseName.toLowerCase().trim();

  // 1. Check direct mapping
  if (EXERCISE_MAPPINGS[nameLower] && localFolders.includes(EXERCISE_MAPPINGS[nameLower])) {
    return EXERCISE_MAPPINGS[nameLower];
  }

  // 2. Try exact slug match
  const slug = slugify(exerciseName);
  if (localFolders.includes(slug)) {
    return slug;
  }

  // 3. Try simplified name (remove parentheses, common suffixes)
  const simplified = slug
    .replace(/-?\([^)]*\)/g, '')
    .replace(/-(heavy|light|optional|weighted|if-possible|controlled-tempo)$/g, '')
    .replace(/^(barbell|dumbbell|cable|machine|smith-machine|ez-bar|bodyweight)-/g, '')
    .trim();

  if (simplified && localFolders.includes(simplified)) {
    return simplified;
  }

  // 4. Try partial match
  for (const folder of localFolders) {
    if (simplified && (folder.includes(simplified) || simplified.includes(folder))) {
      return folder;
    }
  }

  return null;
}

function inferCategory(name: string): string {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('squat') || nameLower.includes('lunge') || nameLower.includes('leg') || nameLower.includes('calf')) return 'Legs';
  if (nameLower.includes('press') || nameLower.includes('fly') || nameLower.includes('chest') || nameLower.includes('push')) return 'Chest';
  if (nameLower.includes('row') || nameLower.includes('pull') || nameLower.includes('lat') || nameLower.includes('back')) return 'Back';
  if (nameLower.includes('curl') || nameLower.includes('bicep')) return 'Arms';
  if (nameLower.includes('tricep') || nameLower.includes('dip') || nameLower.includes('pushdown')) return 'Arms';
  if (nameLower.includes('shoulder') || nameLower.includes('raise') || nameLower.includes('shrug')) return 'Shoulders';
  if (nameLower.includes('crunch') || nameLower.includes('plank') || nameLower.includes('core')) return 'Core';
  return 'Strength';
}

function inferBodyPart(name: string): string | null {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('chest') || nameLower.includes('fly') || nameLower.includes('bench')) return 'Chest';
  if (nameLower.includes('back') || nameLower.includes('row') || nameLower.includes('lat') || nameLower.includes('pull')) return 'Back';
  if (nameLower.includes('shoulder') || nameLower.includes('delt')) return 'Shoulders';
  if (nameLower.includes('bicep') || nameLower.includes('curl')) return 'Arms';
  if (nameLower.includes('tricep')) return 'Arms';
  if (nameLower.includes('leg') || nameLower.includes('squat') || nameLower.includes('lunge')) return 'Legs';
  if (nameLower.includes('calf') || nameLower.includes('calves')) return 'Calves';
  if (nameLower.includes('core') || nameLower.includes('ab') || nameLower.includes('crunch')) return 'Core';
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('\n========================================');
  console.log('  Add Program Exercises with Media');
  console.log('========================================\n');

  if (dryRun) {
    console.log('** DRY RUN MODE **\n');
  }

  // Load exercise names from analysis
  const exerciseStatusPath = '/tmp/exercise_media_status.json';
  if (!fs.existsSync(exerciseStatusPath)) {
    console.error('Run the analysis first to generate /tmp/exercise_media_status.json');
    process.exit(1);
  }

  const status = JSON.parse(fs.readFileSync(exerciseStatusPath, 'utf-8'));
  const withoutMedia = status.without_media || [];
  const notFound = status.not_found || [];

  console.log(`Exercises to process:`);
  console.log(`  Without media: ${withoutMedia.length}`);
  console.log(`  Not found: ${notFound.length}`);

  // Get local folders
  const localFolders = fs.existsSync(PUBLIC_EXERCISES_PATH)
    ? fs.readdirSync(PUBLIC_EXERCISES_PATH).filter(f =>
        fs.statSync(path.join(PUBLIC_EXERCISES_PATH, f)).isDirectory()
      )
    : [];
  console.log(`\nLocal image folders: ${localFolders.length}`);

  // Get system user for media attribution
  const admin = await prisma.users.findFirst({ where: { role: 'ADMIN' } });
  const systemUserId = admin?.id || (await prisma.users.findFirst())?.id;
  if (!systemUserId) {
    console.error('No user found');
    process.exit(1);
  }

  let createdCount = 0;
  let updatedCount = 0;
  let linkedMediaCount = 0;

  // Process exercises without media (update existing)
  console.log('\n--- Updating exercises without media ---');
  for (const name of withoutMedia) {
    const localFolder = findBestLocalImage(name, localFolders);
    if (!localFolder) continue;

    const imageUrl = `/exercises/${localFolder}/0.jpg`;

    // Find the exercise in database
    const exercise = await prisma.exercises.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { aliasNames: { has: name.toLowerCase() } },
        ],
      },
    });

    if (exercise && !exercise.imageUrl) {
      console.log(`✓ ${name} -> ${imageUrl}`);
      if (!dryRun) {
        await prisma.exercises.update({
          where: { id: exercise.id },
          data: {
            imageUrl,
            hasMedia: true,
            mediaCount: 1,
            updatedAt: new Date(),
          },
        });
      }
      updatedCount++;
    }
  }

  // Process not found exercises (create new)
  console.log('\n--- Creating missing exercises ---');
  for (const name of notFound) {
    const localFolder = findBestLocalImage(name, localFolders);
    const imageUrl = localFolder ? `/exercises/${localFolder}/0.jpg` : null;
    const slug = slugify(name);

    // Check if already exists
    const existing = await prisma.exercises.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug },
        ],
      },
    });

    if (existing) {
      // Update with image if we found one
      if (localFolder && !existing.imageUrl) {
        console.log(`✓ Update: ${name} -> ${imageUrl}`);
        if (!dryRun) {
          await prisma.exercises.update({
            where: { id: existing.id },
            data: {
              imageUrl,
              hasMedia: true,
              mediaCount: 1,
              aliasNames: Array.from(new Set([...(existing.aliasNames || []), name.toLowerCase()])),
              updatedAt: new Date(),
            },
          });
        }
        updatedCount++;
      }
      continue;
    }

    // Create new exercise
    const category = inferCategory(name);
    const bodyPart = inferBodyPart(name);

    console.log(`+ Create: ${name}${imageUrl ? ` (${imageUrl})` : ' (no image)'}`);

    if (!dryRun) {
      await prisma.exercises.create({
        data: {
          id: crypto.randomUUID(),
          name,
          slug,
          category,
          muscleGroups: [],
          equipment: [],
          isActive: true,
          difficulty: 'BEGINNER',
          usageCount: 0,
          commonMistakes: [],
          formCues: [],
          isCustom: false,
          bodyPart,
          type: 'Resistance',
          tags: ['program-exercise'],
          aliasNames: [name.toLowerCase()],
          curated: false,
          source: 'PROGRAM_IMPORT',
          imageUrl,
          hasMedia: !!imageUrl,
          mediaCount: imageUrl ? 1 : 0,
          updatedAt: new Date(),
        },
      });

      // Create media entry if we have an image
      if (imageUrl) {
        const newEx = await prisma.exercises.findFirst({ where: { slug } });
        if (newEx) {
          await prisma.exercise_media.create({
            data: {
              id: crypto.randomUUID(),
              userId: systemUserId,
              globalExerciseId: newEx.id,
              provider: 'upload',
              url: imageUrl,
              title: name,
              thumbnailUrl: imageUrl,
              visibility: 'public',
              status: 'approved',
              updatedAt: new Date(),
            },
          });
          linkedMediaCount++;
        }
      }
    }
    createdCount++;
  }

  console.log('\n========================================');
  console.log('  Summary');
  console.log('========================================\n');
  console.log(`Created: ${createdCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Media linked: ${linkedMediaCount}`);

  if (dryRun) {
    console.log('\n** DRY RUN - No changes made **');
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
