/**
 * Fix Rope Pushdown exercise alias
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

async function main() {
  // Find rope pushdown exercises
  const pushdowns = await prisma.exercises.findMany({
    where: {
      OR: [
        { name: { contains: 'Rope Pushdown', mode: 'insensitive' } },
        { name: { contains: 'Tricep Pushdown', mode: 'insensitive' } },
        { name: { contains: 'Triceps Pushdown', mode: 'insensitive' } },
        { name: { contains: 'Cable Pushdown', mode: 'insensitive' } }
      ],
      imageUrl: { not: null }
    },
    select: { id: true, name: true, aliasNames: true, imageUrl: true },
    take: 5
  });

  console.log('Found pushdown exercises:');
  for (const ex of pushdowns) {
    console.log(`- ${ex.name} (${ex.imageUrl ? 'has media' : 'no media'})`);
  }

  // Add alias to the first one with media
  if (pushdowns.length > 0) {
    const target = pushdowns[0];
    const aliasToAdd = 'Rope Pushdowns (Triceps)';

    if (!target.aliasNames?.includes(aliasToAdd)) {
      await prisma.exercises.update({
        where: { id: target.id },
        data: {
          aliasNames: [...(target.aliasNames || []), aliasToAdd, 'Rope Pushdowns', 'Tricep Rope Pushdown'],
          updatedAt: new Date()
        }
      });
      console.log(`Added aliases to "${target.name}"`);
    } else {
      console.log(`"${target.name}" already has the alias`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
