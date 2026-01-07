/**
 * Check CBum program exercises for media
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

async function main() {
  // Get CBum program
  const cbum = await prisma.program_templates.findFirst({
    where: { id: 'cbum-classic-physique' },
    select: { id: true, name: true, templateData: true }
  });

  if (!cbum) {
    console.log('CBum program not found');
    return;
  }

  console.log('=== CBum Program Exercise Media Check ===\n');

  const data = cbum.templateData as any;
  if (!data) {
    console.log('No templateData');
    return;
  }

  // Extract exercises from day_X_name.sections[].exercises[]
  const dayKeys = Object.keys(data).filter(k => k.startsWith('day_'));
  const allExercises: string[] = [];

  for (const dayKey of dayKeys) {
    const day = data[dayKey];
    if (day?.sections) {
      for (const section of day.sections) {
        for (const ex of section.exercises || []) {
          if (ex.exercise) allExercises.push(ex.exercise);
        }
      }
    }
  }

  console.log(`Found ${allExercises.length} exercises in template\n`);

  let withMedia = 0;
  let withoutMedia = 0;
  const missing: string[] = [];

  for (const name of allExercises) {
    // Skip rest days
    if (name.toLowerCase().includes('rest')) {
      withMedia++;
      continue;
    }

    const ex = await prisma.exercises.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { name: { contains: name, mode: 'insensitive' } },
          { aliasNames: { has: name } }
        ],
        imageUrl: { not: null }
      },
      select: { name: true, imageUrl: true }
    });

    if (ex?.imageUrl) {
      withMedia++;
    } else {
      withoutMedia++;
      if (!missing.includes(name)) missing.push(name);
      console.log(`Missing media: ${name}`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`With media: ${withMedia}/${allExercises.length}`);
  console.log(`Without media: ${withoutMedia}`);

  if (missing.length > 0) {
    console.log('\n=== Exercises needing media ===');
    for (const name of missing) {
      console.log(`- ${name}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
