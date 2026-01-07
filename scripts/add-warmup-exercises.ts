/**
 * Add warmup/foam roll exercises with media
 * These are commonly missing from exercise databases
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

const WARMUP_EXERCISES = [
  {
    name: 'Foam Roll: Calves',
    category: 'Flexibility',
    muscleGroups: ['calves'],
    equipment: ['foam roller'],
    aliases: ['Foam Roll Calves', 'Calf Foam Roll', 'SMR Calves']
  },
  {
    name: 'Foam Roll: Adductors',
    category: 'Flexibility',
    muscleGroups: ['adductors', 'inner thigh'],
    equipment: ['foam roller'],
    aliases: ['Foam Roll Adductors', 'Adductor Foam Roll', 'SMR Adductors']
  },
  {
    name: 'Foam Roll: Lats',
    category: 'Flexibility',
    muscleGroups: ['lats', 'latissimus dorsi'],
    equipment: ['foam roller'],
    aliases: ['Foam Roll Lats', 'Lat Foam Roll', 'SMR Lats']
  },
  {
    name: 'Foam Roll: Tensor Fascia Latae',
    category: 'Flexibility',
    muscleGroups: ['tensor fascia latae', 'TFL', 'hip'],
    equipment: ['foam roller'],
    aliases: ['Foam Roll TFL', 'TFL Foam Roll', 'SMR TFL']
  },
  {
    name: 'Foam Roll: Thoracic Spine',
    category: 'Flexibility',
    muscleGroups: ['upper back', 'thoracic spine'],
    equipment: ['foam roller'],
    aliases: ['Foam Roll Thoracic', 'T-Spine Foam Roll', 'SMR Thoracic Spine']
  },
  {
    name: 'Static Stretch: Calves',
    category: 'Flexibility',
    muscleGroups: ['calves'],
    equipment: [],
    aliases: ['Calf Stretch', 'Standing Calf Stretch']
  },
  {
    name: 'Static Stretch: Adductors',
    category: 'Flexibility',
    muscleGroups: ['adductors'],
    equipment: [],
    aliases: ['Adductor Stretch', 'Groin Stretch']
  },
  {
    name: 'Static Stretch: Lats',
    category: 'Flexibility',
    muscleGroups: ['lats'],
    equipment: [],
    aliases: ['Lat Stretch', 'Latissimus Stretch']
  },
  {
    name: 'Cardio',
    category: 'Cardio',
    muscleGroups: ['cardiovascular'],
    equipment: [],
    aliases: ['Cardio Warm-up', 'Cardiovascular Exercise', 'Aerobic Exercise']
  },
  {
    name: 'Bird Dog',
    category: 'Core',
    muscleGroups: ['core', 'lower back', 'glutes'],
    equipment: [],
    aliases: ['Quadruped Bird Dog', 'Bird Dog Exercise']
  },
  {
    name: 'Knee-up',
    category: 'Core',
    muscleGroups: ['hip flexors', 'core'],
    equipment: [],
    aliases: ['Knee Up', 'High Knees', 'Knee Raise']
  }
];

// Mapping compound exercise names to their base exercise for aliasing
const COMPOUND_ALIASES: Record<string, string[]> = {
  'Foam Roll: Calves, Adductors, Lats': ['Foam Roll: Calves', 'Foam Roll: Adductors', 'Foam Roll: Lats'],
  'Foam Roll: Calves, Adductors, Tensor Fascia Latae, Lats': ['Foam Roll: Calves', 'Foam Roll: Adductors', 'Foam Roll: Tensor Fascia Latae', 'Foam Roll: Lats'],
  'Foam Roll: Calves, Tensor Fascia Latae, Thoracic-Spine': ['Foam Roll: Calves', 'Foam Roll: Tensor Fascia Latae', 'Foam Roll: Thoracic Spine'],
  'Static Stretch: Calves, Adductors, Lats': ['Static Stretch: Calves', 'Static Stretch: Adductors', 'Static Stretch: Lats'],
  'Static Stretch: Calves, Tensor Fascia Latae, Erector Spinae': ['Static Stretch: Calves', 'Static Stretch: Tensor Fascia Latae'],
};

async function getSystemUserId(): Promise<string | null> {
  const admin = await prisma.users.findFirst({ where: { role: 'ADMIN' } });
  if (admin) return admin.id;
  const any = await prisma.users.findFirst();
  return any ? any.id : null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function findExerciseWithMedia(searchTerms: string[]): Promise<string | null> {
  for (const term of searchTerms) {
    const ex = await prisma.exercises.findFirst({
      where: {
        name: { contains: term, mode: 'insensitive' },
        imageUrl: { not: null }
      },
      select: { imageUrl: true }
    });
    if (ex?.imageUrl) return ex.imageUrl;
  }
  return null;
}

async function main() {
  console.log('=== Adding Warmup Exercises ===\n');

  const systemUserId = await getSystemUserId();
  let created = 0;
  let updated = 0;

  for (const ex of WARMUP_EXERCISES) {
    const slug = slugify(ex.name);

    // Check if exercise exists
    let existing = await prisma.exercises.findFirst({
      where: {
        OR: [
          { name: { equals: ex.name, mode: 'insensitive' } },
          { slug }
        ]
      }
    });

    // Try to find an image from similar exercises
    const searchTerms = [
      ex.name.split(':')[0]?.trim() || ex.name,
      ...ex.muscleGroups,
      ...ex.aliases
    ];
    const imageUrl = await findExerciseWithMedia(searchTerms);

    if (existing) {
      // Update with aliases
      const newAliases = [...new Set([...(existing.aliasNames || []), ...ex.aliases])];
      await prisma.exercises.update({
        where: { id: existing.id },
        data: {
          aliasNames: newAliases,
          imageUrl: existing.imageUrl || imageUrl,
          hasMedia: !!(existing.imageUrl || imageUrl),
          updatedAt: new Date()
        }
      });
      console.log(`Updated: ${ex.name} (aliases: ${ex.aliases.length})`);
      updated++;
    } else {
      // Create new exercise
      const newExercise = await prisma.exercises.create({
        data: {
          id: crypto.randomUUID(),
          name: ex.name,
          slug,
          category: ex.category,
          muscleGroups: ex.muscleGroups,
          equipment: ex.equipment,
          difficulty: 'BEGINNER',
          aliasNames: ex.aliases,
          imageUrl,
          hasMedia: !!imageUrl,
          mediaCount: imageUrl ? 1 : 0,
          isActive: true,
          isCustom: false,
          curated: true,
          tags: [...ex.muscleGroups, ex.category.toLowerCase()],
          updatedAt: new Date()
        }
      });
      console.log(`Created: ${ex.name} (${imageUrl ? 'with media' : 'no media'})`);
      created++;

      // Create media entry if we have an image
      if (imageUrl && systemUserId) {
        await prisma.exercise_media.create({
          data: {
            id: crypto.randomUUID(),
            userId: systemUserId,
            globalExerciseId: newExercise.id,
            provider: 'system',
            url: imageUrl,
            title: ex.name,
            visibility: 'public',
            status: 'approved',
            updatedAt: new Date()
          }
        });
      }
    }
  }

  // Add compound name aliases to base exercises
  console.log('\n=== Adding Compound Aliases ===\n');

  for (const [compoundName, baseNames] of Object.entries(COMPOUND_ALIASES)) {
    for (const baseName of baseNames) {
      const baseEx = await prisma.exercises.findFirst({
        where: {
          OR: [
            { name: { equals: baseName, mode: 'insensitive' } },
            { aliasNames: { has: baseName } }
          ]
        }
      });

      if (baseEx && !baseEx.aliasNames?.includes(compoundName)) {
        await prisma.exercises.update({
          where: { id: baseEx.id },
          data: {
            aliasNames: [...(baseEx.aliasNames || []), compoundName],
            updatedAt: new Date()
          }
        });
        console.log(`Added "${compoundName}" alias to "${baseEx.name}"`);
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
