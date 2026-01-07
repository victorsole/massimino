/**
 * Fix Remaining Exercises Without Media
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

async function main() {
  console.log('Fixing remaining exercises without media...\n');

  const fixes = [
    { name: 'Triceps Pushdown', imageUrl: '/exercises/tricep-pushdown/0.jpg' },
    { name: 'Bodyweight Squats', imageUrl: '/exercises/barbell-back-squat/0.jpg' },
    { name: 'Push-ups', imageUrl: '/exercises/dips/0.jpg' }, // Use dips as closest alternative
    { name: 'Push-up', imageUrl: '/exercises/dips/0.jpg' },
    { name: 'Face Pulls', imageUrl: '/exercises/face-pull/0.jpg' },
    { name: 'Pullups', imageUrl: '/exercises/pull-up/0.jpg' },
    { name: 'Pull-ups', imageUrl: '/exercises/pull-up/0.jpg' },
    { name: 'Pull-up', imageUrl: '/exercises/pull-up/0.jpg' },
    { name: 'Chin-Ups', imageUrl: '/exercises/chin-up/0.jpg' },
    { name: 'Chin Up', imageUrl: '/exercises/chin-up/0.jpg' },
    { name: 'Overhead Press', imageUrl: '/exercises/overhead-press/0.jpg' },
    { name: 'Landmine Press', imageUrl: '/exercises/overhead-press/0.jpg' },
    { name: 'Butt Kick', imageUrl: '/exercises/lunge/0.jpg' },
    { name: 'Depth Jump', imageUrl: '/exercises/barbell-back-squat/0.jpg' },
    { name: 'Fire Hydrant', imageUrl: '/exercises/lunge/0.jpg' },
    { name: 'Pallof Press', imageUrl: '/exercises/cable-crossover/0.jpg' },
    { name: 'Tuck Jump', imageUrl: '/exercises/barbell-back-squat/0.jpg' },
  ];

  let updated = 0;

  for (const fix of fixes) {
    const exercise = await prisma.exercises.findFirst({
      where: {
        OR: [
          { name: { equals: fix.name, mode: 'insensitive' } },
          { aliasNames: { has: fix.name.toLowerCase() } },
        ],
      },
    });

    if (exercise && !exercise.imageUrl) {
      await prisma.exercises.update({
        where: { id: exercise.id },
        data: {
          imageUrl: fix.imageUrl,
          hasMedia: true,
          mediaCount: 1,
          updatedAt: new Date(),
        },
      });
      console.log(`✓ ${exercise.name} -> ${fix.imageUrl}`);
      updated++;
    }
  }

  console.log(`\nUpdated: ${updated}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
