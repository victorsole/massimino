/**
 * Link More Exercises to Local Images
 *
 * Manual mappings for exercises that don't match by name/slug
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

const MANUAL_MAPPINGS: Record<string, string> = {
  // Triceps
  'Triceps Pushdown': '/exercises/tricep-pushdown/0.jpg',
  'Tricep Pushdowns': '/exercises/tricep-pushdown/0.jpg',
  'Rope Pushdowns (Triceps)': '/exercises/rope-pushdown/0.jpg',
  'Rope Cable Triceps Pressdowns': '/exercises/rope-pushdown/0.jpg',

  // Squats
  'Bodyweight Squat': '/exercises/barbell-back-squat/0.jpg',
  'Bodyweight Squats': '/exercises/barbell-back-squat/0.jpg',
  'Bodyweight Squats (Controlled Tempo)': '/exercises/barbell-back-squat/0.jpg',
  'Dumbbell Squat': '/exercises/barbell-back-squat/0.jpg',
  'Squat': '/exercises/barbell-back-squat/0.jpg',
  'Squat Jump': '/exercises/barbell-back-squat/0.jpg',

  // Farmers
  "Farmer's Carry": '/exercises/deadlift/0.jpg',
  "Farmer's Walks": '/exercises/deadlift/0.jpg',

  // Cardio
  'Jump Rope': '/exercises/jump-rope/0.jpg',
  'Elliptical': '/exercises/elliptical/0.jpg',
  'Rowing Machine': '/exercises/rowing-machine/0.jpg',
  'Stationary Bike': '/exercises/stationary-bike/0.jpg',
  'Treadmill Run': '/exercises/treadmill-run/0.jpg',
  'Battle Ropes': '/exercises/rope-pushdown/0.jpg',

  // Machines
  'Machine Pressdown Dips': '/exercises/machine-pressdown-dips/0.jpg',
  'Machine Curls': '/exercises/machine-curl/0.jpg',
  'Biceps Curl Machine': '/exercises/machine-curl/0.jpg',
  'Chest Press Machine': '/exercises/dumbbell-bench-press/0.jpg',
  'Shoulder Press Machine': '/exercises/overhead-press/0.jpg',
  'Calf Raise Machine': '/exercises/standing-calf-raise/0.jpg',

  // Variations
  'Close-Grip Bench Press': '/exercises/close-grip-bench-press/0.jpg',
  'Incline Close Grip Bench Press': '/exercises/incline-close-grip-bench-press/0.jpg',
  'Reverse Hack Squat': '/exercises/reverse-hack-squat/0.jpg',
};

async function main() {
  console.log('Linking additional exercises to local images...\n');
  let updated = 0;

  for (const [name, imageUrl] of Object.entries(MANUAL_MAPPINGS)) {
    const exercise = await prisma.exercises.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { aliasNames: { has: name.toLowerCase() } },
        ],
      },
    });

    if (exercise && !exercise.imageUrl) {
      await prisma.exercises.update({
        where: { id: exercise.id },
        data: {
          imageUrl,
          hasMedia: true,
          mediaCount: 1,
          updatedAt: new Date(),
        },
      });
      console.log(`✓ ${exercise.name} -> ${imageUrl}`);
      updated++;
    }
  }

  console.log(`\nUpdated: ${updated}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
