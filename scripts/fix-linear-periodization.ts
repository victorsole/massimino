/**
 * Fix Linear Periodization exercise matching
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

async function main() {
  console.log('=== Checking Romanian Deadlift and Glute Bridge ===\n');

  // Check Romanian Deadlift
  const rdl = await prisma.exercises.findMany({
    where: {
      OR: [
        { name: { contains: 'Romanian', mode: 'insensitive' } },
        { aliasNames: { has: 'Romanian Deadlift' } }
      ]
    },
    select: { id: true, name: true, aliasNames: true, imageUrl: true },
    take: 5
  });

  console.log('Romanian Deadlift matches:');
  for (const ex of rdl) {
    console.log(`  - ${ex.name} (${ex.imageUrl ? 'HAS MEDIA' : 'NO MEDIA'})`);
    console.log(`    Aliases: ${ex.aliasNames?.join(', ') || 'none'}`);
  }

  // Check Glute Bridge
  const gb = await prisma.exercises.findMany({
    where: {
      OR: [
        { name: { contains: 'Glute', mode: 'insensitive' } },
        { aliasNames: { has: 'Glute Bridge' } }
      ]
    },
    select: { id: true, name: true, aliasNames: true, imageUrl: true },
    take: 5
  });

  console.log('\nGlute Bridge matches:');
  for (const ex of gb) {
    console.log(`  - ${ex.name} (${ex.imageUrl ? 'HAS MEDIA' : 'NO MEDIA'})`);
    console.log(`    Aliases: ${ex.aliasNames?.join(', ') || 'none'}`);
  }

  // Find an exercise with media and add the exact alias
  console.log('\n=== Adding exact aliases ===');

  // Romanian Deadlift - find one with media
  const rdlWithMedia = await prisma.exercises.findFirst({
    where: {
      name: { contains: 'Romanian Deadlift', mode: 'insensitive' },
      imageUrl: { not: null }
    }
  });

  if (rdlWithMedia) {
    if (!rdlWithMedia.aliasNames?.includes('Romanian Deadlift')) {
      await prisma.exercises.update({
        where: { id: rdlWithMedia.id },
        data: {
          aliasNames: [...(rdlWithMedia.aliasNames || []), 'Romanian Deadlift'],
          updatedAt: new Date()
        }
      });
      console.log(`Added "Romanian Deadlift" alias to "${rdlWithMedia.name}"`);
    } else {
      console.log(`"${rdlWithMedia.name}" already has Romanian Deadlift alias`);
    }
  } else {
    console.log('No Romanian Deadlift with media found');
    // Create one using free-exercise-db source
    const anyRdl = await prisma.exercises.findFirst({
      where: { name: { contains: 'Romanian', mode: 'insensitive' } },
      select: { id: true, name: true, imageUrl: true, source: true, sourceId: true }
    });
    if (anyRdl) {
      console.log(`Found: ${anyRdl.name} with imageUrl: ${anyRdl.imageUrl}`);
    }
  }

  // Glute Bridge - find one with media
  const gbWithMedia = await prisma.exercises.findFirst({
    where: {
      OR: [
        { name: { contains: 'Glute Bridge', mode: 'insensitive' } },
        { name: { contains: 'Hip Bridge', mode: 'insensitive' } },
        { name: { contains: 'Hip Thrust', mode: 'insensitive' } }
      ],
      imageUrl: { not: null }
    }
  });

  if (gbWithMedia) {
    if (!gbWithMedia.aliasNames?.includes('Glute Bridge')) {
      await prisma.exercises.update({
        where: { id: gbWithMedia.id },
        data: {
          aliasNames: [...(gbWithMedia.aliasNames || []), 'Glute Bridge'],
          updatedAt: new Date()
        }
      });
      console.log(`Added "Glute Bridge" alias to "${gbWithMedia.name}"`);
    } else {
      console.log(`"${gbWithMedia.name}" already has Glute Bridge alias`);
    }
  } else {
    console.log('No Glute Bridge with media found');
    const anyGb = await prisma.exercises.findFirst({
      where: {
        OR: [
          { name: { contains: 'Glute', mode: 'insensitive' } },
          { name: { contains: 'Bridge', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, imageUrl: true }
    });
    if (anyGb) {
      console.log(`Found: ${anyGb.name} with imageUrl: ${anyGb.imageUrl}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
