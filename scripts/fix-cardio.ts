/**
 * Fix Cardio exercise to have media
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

async function main() {
  // Find Cardio exercise
  const cardio = await prisma.exercises.findFirst({
    where: { name: { contains: 'Cardio', mode: 'insensitive' } },
    select: { id: true, name: true, aliasNames: true, imageUrl: true }
  });

  if (!cardio) {
    console.log('No Cardio exercise found');
    return;
  }

  console.log('Found:', cardio.name);
  console.log('Has media:', !!cardio.imageUrl);
  console.log('Aliases:', cardio.aliasNames);

  // Find an exercise with media for Cardio
  const cardioWithMedia = await prisma.exercises.findFirst({
    where: {
      OR: [
        { name: { contains: 'Jogging', mode: 'insensitive' } },
        { name: { contains: 'Running', mode: 'insensitive' } },
        { name: { contains: 'Treadmill', mode: 'insensitive' } },
        { name: { contains: 'Elliptical', mode: 'insensitive' } }
      ],
      imageUrl: { not: null }
    },
    select: { name: true, imageUrl: true }
  });

  console.log('Cardio with media:', cardioWithMedia?.name);

  // Update Cardio with image
  if (cardioWithMedia && !cardio.imageUrl) {
    await prisma.exercises.update({
      where: { id: cardio.id },
      data: {
        imageUrl: cardioWithMedia.imageUrl,
        hasMedia: true,
        updatedAt: new Date()
      }
    });
    console.log('Updated Cardio with image from:', cardioWithMedia.name);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
