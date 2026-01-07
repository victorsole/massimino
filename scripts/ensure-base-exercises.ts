/**
 * Ensure Base Exercises Exist
 *
 * Creates essential exercises from the mapping file if they don't exist.
 * This ensures programs can properly link to exercises with media.
 *
 * Usage:
 *   npx ts-node scripts/ensure-base-exercises.ts [--dry-run]
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';
import * as fs from 'fs';
import * as path from 'path';

const MAPPING_FILE_PATH = path.join(process.cwd(), 'scripts', 'exercise-mapping.json');
const PUBLIC_EXERCISES_PATH = path.join(process.cwd(), 'public', 'exercises');

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

const CATEGORY_MAP: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Arms',
  triceps: 'Arms',
  legs: 'Legs',
  calves: 'Legs',
  forearms: 'Arms',
  abs: 'Core',
  cardio: 'Cardio',
  mobility: 'Flexibility',
};

const BODY_PART_MAP: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Arms',
  triceps: 'Arms',
  legs: 'Legs',
  calves: 'Calves',
  forearms: 'Forearms',
  abs: 'Core',
  cardio: 'Full Body',
  mobility: 'Full Body',
};

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('\n========================================');
  console.log('  Ensure Base Exercises Exist');
  console.log('========================================\n');

  if (dryRun) {
    console.log('** DRY RUN MODE - No database changes **\n');
  }

  // Load mapping file
  if (!fs.existsSync(MAPPING_FILE_PATH)) {
    console.error('Mapping file not found:', MAPPING_FILE_PATH);
    process.exit(1);
  }

  const mapping: MappingFile = JSON.parse(fs.readFileSync(MAPPING_FILE_PATH, 'utf-8'));
  console.log(`Loaded ${mapping.exercises.length} exercises from mapping file\n`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const entry of mapping.exercises) {
    if (entry.status === 'no_match') {
      skippedCount++;
      continue;
    }

    const name = entry.massimino_name;
    const slug = slugify(name);
    const category = CATEGORY_MAP[entry.category] || 'Strength';
    const bodyPart = BODY_PART_MAP[entry.category] || null;

    // Check if exercise exists
    const existing = await prisma.exercises.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug: slug },
        ],
      },
    });

    // Check if local images exist
    const localPath = path.join(PUBLIC_EXERCISES_PATH, slug);
    const hasLocalImages = fs.existsSync(localPath);
    const imageUrl = hasLocalImages ? `/exercises/${slug}/0.jpg` : null;

    if (existing) {
      // Check if we need to update with local image
      if (hasLocalImages && !existing.imageUrl?.startsWith('/exercises/')) {
        if (!dryRun) {
          await prisma.exercises.update({
            where: { id: existing.id },
            data: {
              imageUrl,
              hasMedia: true,
              mediaCount: 1,
              aliasNames: Array.from(new Set([...(existing.aliasNames || []), ...entry.aliases])),
              updatedAt: new Date(),
            },
          });
        }
        console.log(`✓ Updated: ${name} (added local image)`);
        updatedCount++;
      } else {
        // Just ensure aliases are up to date
        const newAliases = entry.aliases.filter(a => !existing.aliasNames?.includes(a));
        if (newAliases.length > 0 && !dryRun) {
          await prisma.exercises.update({
            where: { id: existing.id },
            data: {
              aliasNames: Array.from(new Set([...(existing.aliasNames || []), ...newAliases])),
              updatedAt: new Date(),
            },
          });
          console.log(`✓ Updated aliases: ${name} (+${newAliases.length} aliases)`);
          updatedCount++;
        } else {
          skippedCount++;
        }
      }
    } else {
      // Create the exercise
      if (!dryRun) {
        await prisma.exercises.create({
          data: {
            id: crypto.randomUUID(),
            name,
            slug,
            category,
            muscleGroups: [],
            equipment: [],
            instructions: null,
            videoUrl: null,
            imageUrl,
            isActive: true,
            difficulty: 'BEGINNER',
            safetyNotes: null,
            usageCount: 0,
            commonMistakes: [],
            formCues: [],
            isCustom: false,
            bodyPart,
            movementPattern: null,
            type: 'Resistance',
            tags: [entry.category, 'free-exercise-db'],
            aliasNames: entry.aliases,
            curated: true,
            source: 'CSV_IMPORT',
            hasMedia: !!imageUrl,
            mediaCount: imageUrl ? 1 : 0,
            updatedAt: new Date(),
          },
        });
      }
      console.log(`✓ Created: ${name}${imageUrl ? ' (with image)' : ''}`);
      createdCount++;
    }
  }

  console.log('\n========================================');
  console.log('  Summary');
  console.log('========================================\n');
  console.log(`Created:  ${createdCount}`);
  console.log(`Updated:  ${updatedCount}`);
  console.log(`Skipped:  ${skippedCount}`);

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
