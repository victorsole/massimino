import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

async function main() {
  const exercisesWithoutMedia = await prisma.exercises.findMany({
    where: {
      isActive: true,
      OR: [
        { hasMedia: false },
        { AND: [{ imageUrl: null }, { videoUrl: null }] }
      ]
    },
    select: {
      name: true,
      category: true,
      bodyPart: true,
      muscleGroups: true
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  console.log('=== EXERCISES WITHOUT MEDIA ===');
  console.log('Total: ' + exercisesWithoutMedia.length);

  let currentCategory = '';
  for (const ex of exercisesWithoutMedia) {
    if (ex.category !== currentCategory) {
      currentCategory = ex.category;
      console.log('\n--- ' + currentCategory.toUpperCase() + ' ---');
    }
    const muscles = ex.muscleGroups?.length ? ' (' + ex.muscleGroups.join(', ') + ')' : '';
    console.log('• ' + ex.name + muscles);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
