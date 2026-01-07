/**
 * Free Exercise DB Importer
 *
 * Imports exercises from yuhonas/free-exercise-db (800+ exercises with images)
 * Uses GitHub raw URLs for images:
 *   https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises/{id}/0.jpg
 *
 * Usage:
 *   npx ts-node scripts/import-free-exercise-db.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main';
const EXERCISES_JSON_URL = `${GITHUB_RAW_BASE}/dist/exercises.json`;

type FreeExerciseDbExercise = {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapDifficulty(level: string): string {
  switch (level.toLowerCase()) {
    case 'beginner': return 'BEGINNER';
    case 'intermediate': return 'INTERMEDIATE';
    case 'expert':
    case 'advanced': return 'ADVANCED';
    default: return 'BEGINNER';
  }
}

function mapCategory(category: string): string {
  switch (category.toLowerCase()) {
    case 'strength': return 'Strength';
    case 'stretching': return 'Flexibility';
    case 'cardio': return 'Cardio';
    case 'plyometrics': return 'Plyometrics';
    case 'powerlifting': return 'Strength';
    case 'strongman': return 'Strength';
    case 'olympic weightlifting': return 'Olympic';
    default: return 'Strength';
  }
}

async function getSystemUserId(): Promise<string | null> {
  const admin = await prisma.users.findFirst({ where: { role: 'ADMIN' } });
  if (admin) return admin.id;
  const any = await prisma.users.findFirst();
  return any ? any.id : null;
}

async function fetchExercises(): Promise<FreeExerciseDbExercise[]> {
  console.log('Fetching exercises from free-exercise-db...');
  const res = await fetch(EXERCISES_JSON_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function upsertExercise(ex: FreeExerciseDbExercise, systemUserId: string | null) {
  const slug = slugify(ex.name);
  const primaryImage = ex.images && ex.images.length > 0
    ? `${GITHUB_RAW_BASE}/dist/exercises/${ex.id}/${ex.images[0]}`
    : null;

  const muscleGroups = [...new Set([...(ex.primaryMuscles || []), ...(ex.secondaryMuscles || [])])];
  const equipment = ex.equipment ? [ex.equipment] : [];
  const instructions = (ex.instructions || []).join('\n');

  // First try to find by sourceId
  let existing = await prisma.exercises.findFirst({
    where: { source: 'FREE_EXERCISE_DB', sourceId: ex.id },
  });

  // If not found, try by name
  if (!existing) {
    existing = await prisma.exercises.findFirst({
      where: { name: { equals: ex.name, mode: 'insensitive' } },
    });
  }

  // If not found, try by slug
  if (!existing) {
    existing = await prisma.exercises.findFirst({
      where: { slug },
    });
  }

  if (existing) {
    // Update existing exercise - only update imageUrl if it's null
    const updateData: any = {
      muscleGroups,
      equipment,
      difficulty: mapDifficulty(ex.level),
      updatedAt: new Date(),
    };

    // Only update imageUrl if the exercise doesn't have one
    if (!existing.imageUrl && primaryImage) {
      updateData.imageUrl = primaryImage;
      updateData.hasMedia = true;
      updateData.mediaCount = ex.images?.length || 1;
    }

    // Update instructions if empty
    if (!existing.instructions && instructions) {
      updateData.instructions = instructions;
    }

    // Update bodyPart if empty
    if (!existing.bodyPart && ex.primaryMuscles?.[0]) {
      updateData.bodyPart = ex.primaryMuscles[0];
    }

    // Update source if not set
    if (!existing.source) {
      updateData.source = 'FREE_EXERCISE_DB';
      updateData.sourceId = ex.id;
    }

    await prisma.exercises.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Create media entry if we added an image
    if (!existing.imageUrl && primaryImage && systemUserId) {
      const mediaExists = await prisma.exercise_media.findFirst({
        where: { globalExerciseId: existing.id, url: primaryImage },
      });
      if (!mediaExists) {
        await prisma.exercise_media.create({
          data: {
            id: crypto.randomUUID(),
            userId: systemUserId,
            globalExerciseId: existing.id,
            provider: 'free-exercise-db',
            url: primaryImage,
            title: ex.name,
            visibility: 'public',
            status: 'approved',
            updatedAt: new Date(),
          },
        });
      }
    }

    return { action: 'updated', hasNewImage: !existing.imageUrl && !!primaryImage };
  }

  // Create new exercise
  const newExercise = await prisma.exercises.create({
    data: {
      id: crypto.randomUUID(),
      name: ex.name,
      slug,
      category: mapCategory(ex.category),
      muscleGroups,
      equipment,
      instructions: instructions || null,
      imageUrl: primaryImage,
      difficulty: mapDifficulty(ex.level),
      bodyPart: ex.primaryMuscles?.[0] || null,
      movementPattern: ex.mechanic || null,
      type: ex.force || null,
      tags: [ex.category, ...(ex.primaryMuscles || [])].map(t => t.toLowerCase()),
      aliasNames: [],
      isActive: true,
      isCustom: false,
      curated: false,
      hasMedia: !!primaryImage,
      mediaCount: ex.images?.length || 0,
      source: 'FREE_EXERCISE_DB',
      sourceId: ex.id,
      updatedAt: new Date(),
    },
  });

  // Create media entry
  if (primaryImage && systemUserId) {
    await prisma.exercise_media.create({
      data: {
        id: crypto.randomUUID(),
        userId: systemUserId,
        globalExerciseId: newExercise.id,
        provider: 'free-exercise-db',
        url: primaryImage,
        title: ex.name,
        visibility: 'public',
        status: 'approved',
        updatedAt: new Date(),
      },
    });
  }

  return { action: 'created', hasNewImage: !!primaryImage };
}

async function processBatch(
  exercises: FreeExerciseDbExercise[],
  systemUserId: string,
  startIdx: number
): Promise<{ created: number; updated: number; withNewImage: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let withNewImage = 0;
  let errors = 0;

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    try {
      const result = await upsertExercise(ex, systemUserId);
      if (result.action === 'created') created++;
      if (result.action === 'updated') updated++;
      if (result.hasNewImage) withNewImage++;
    } catch (error) {
      errors++;
      if (errors > 5) {
        console.log(`Too many errors in batch, stopping at ${startIdx + i}`);
        break;
      }
    }
  }

  return { created, updated, withNewImage, errors };
}

async function main() {
  console.log('=== Free Exercise DB Importer ===\n');

  const exercises = await fetchExercises();
  console.log(`Fetched ${exercises.length} exercises\n`);

  const systemUserId = await getSystemUserId();
  if (!systemUserId) {
    console.error('No user found for media attribution');
    process.exit(1);
  }

  const BATCH_SIZE = 50;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalWithNewImage = 0;

  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);

    // Reconnect before each batch to avoid connection timeout
    await prisma.$disconnect();
    await prisma.$connect();

    const result = await processBatch(batch, systemUserId, i);
    totalCreated += result.created;
    totalUpdated += result.updated;
    totalWithNewImage += result.withNewImage;

    console.log(`Progress: ${Math.min(i + BATCH_SIZE, exercises.length)}/${exercises.length} (created: ${totalCreated}, updated: ${totalUpdated})`);
  }

  console.log('\n=== Summary ===');
  console.log(`Created: ${totalCreated}`);
  console.log(`Updated: ${totalUpdated}`);
  console.log(`New images added: ${totalWithNewImage}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
