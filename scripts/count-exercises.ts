/**
 * Count exercises in database
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

async function main() {
  // Total exercises
  const total = await prisma.exercises.count();
  console.log('Total exercises:', total);

  // Active exercises
  const active = await prisma.exercises.count({
    where: { isActive: true }
  });
  console.log('Active exercises (isActive: true):', active);

  // Inactive exercises
  const inactive = await prisma.exercises.count({
    where: { isActive: false }
  });
  console.log('Inactive exercises (isActive: false):', inactive);

  // Not set isActive (default)
  const notSet = total - active - inactive;
  console.log('isActive not explicitly set:', notSet);

  // Curated exercises
  const curated = await prisma.exercises.count({
    where: { curated: true }
  });
  console.log('Curated exercises:', curated);

  // Non-curated but active
  const nonCuratedActive = await prisma.exercises.count({
    where: { curated: false, isActive: true }
  });
  console.log('Non-curated but active:', nonCuratedActive);

  // Check isActive default value
  const sample = await prisma.exercises.findMany({
    take: 5,
    select: { name: true, isActive: true }
  });
  console.log('\nSample exercises isActive values:', sample);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
