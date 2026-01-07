/**
 * Check Program Exercise Media Coverage
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

async function main() {
  // Total exercises
  const total = await prisma.exercises.count();

  // With media (imageUrl not null)
  const withMedia = await prisma.exercises.count({
    where: { imageUrl: { not: null } }
  });

  // Without media
  const withoutMedia = total - withMedia;
  const coverage = ((withMedia / total) * 100).toFixed(1);

  console.log('=== Overall Media Coverage ===');
  console.log(`Total exercises: ${total}`);
  console.log(`With media: ${withMedia} (${coverage}%)`);
  console.log(`Without media: ${withoutMedia}`);

  // Get exercises without media from active programs
  const programTemplates = await prisma.program_templates.findMany({
    where: { isActive: true },
    select: { id: true, name: true, templateData: true }
  });

  console.log('\n=== Program Exercise Coverage ===');

  const allMissing: string[] = [];

  for (const prog of programTemplates) {
    const data = prog.templateData as any;
    if (!data) {
      console.log(`${prog.name}: No templateData`);
      continue;
    }

    // Extract exercise names from different template structures
    const exerciseNames: string[] = [];

    if (data.workout_sessions) {
      for (const session of data.workout_sessions) {
        for (const section of session.sections || []) {
          for (const ex of section.exercises || []) {
            if (ex.exercise_name) exerciseNames.push(ex.exercise_name);
          }
        }
      }
    }
    if (data.the_six_exercises) {
      for (const ex of data.the_six_exercises) {
        if (ex.exercise_name) exerciseNames.push(ex.exercise_name);
      }
    }
    if (data.workouts) {
      for (const workout of data.workouts) {
        // Direct exercises array
        for (const ex of workout.exercises || []) {
          if (ex.exercise_name || ex.name) exerciseNames.push(ex.exercise_name || ex.name);
        }
        // Nested workout_structure (NASM format)
        const ws = workout.workout_structure;
        if (ws) {
          const sections = ['warm_up', 'activation', 'resistance', 'core', 'cool_down', 'cardio', 'plyometric', 'saq'];
          for (const section of sections) {
            for (const ex of ws[section]?.exercises || []) {
              if (ex.exercise_name) exerciseNames.push(ex.exercise_name);
            }
          }
        }
      }
    }

    // CBum format: day_X_name.sections[].exercises[]
    const dayKeys = Object.keys(data).filter(k => k.startsWith('day_'));
    for (const dayKey of dayKeys) {
      const day = data[dayKey];
      if (day?.sections) {
        for (const section of day.sections) {
          for (const ex of section.exercises || []) {
            if (ex.exercise || ex.exercise_name) exerciseNames.push(ex.exercise || ex.exercise_name);
          }
        }
      }
    }

    if (exerciseNames.length === 0) {
      console.log(`${prog.name}: No exercises found in templateData`);
      continue;
    }

    // Check which have media
    let withM = 0;
    let withoutM = 0;
    const missing: string[] = [];

    for (const name of exerciseNames) {
      // Try multiple matching strategies
      let ex = await prisma.exercises.findFirst({
        where: {
          OR: [
            { name: { equals: name, mode: 'insensitive' } },
            { aliasNames: { has: name } }
          ],
          imageUrl: { not: null }
        },
        select: { name: true, imageUrl: true }
      });

      // If not found, try contains search
      if (!ex) {
        ex = await prisma.exercises.findFirst({
          where: {
            name: { contains: name, mode: 'insensitive' },
            imageUrl: { not: null }
          },
          select: { name: true, imageUrl: true }
        });
      }

      // If still not found, try partial name matching for compound exercises
      if (!ex && name.includes(' ')) {
        const words = name.split(' ');
        for (const word of words) {
          if (word.length > 4) {
            ex = await prisma.exercises.findFirst({
              where: {
                name: { contains: word, mode: 'insensitive' },
                imageUrl: { not: null }
              },
              select: { name: true, imageUrl: true }
            });
            if (ex) break;
          }
        }
      }

      if (ex?.imageUrl) {
        withM++;
      } else {
        withoutM++;
        missing.push(name);
        if (!allMissing.includes(name)) allMissing.push(name);
      }
    }

    const pctg = ((withM / exerciseNames.length) * 100).toFixed(0);
    const missingStr = missing.length > 0
      ? ` - Missing: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`
      : '';
    console.log(`${prog.name}: ${withM}/${exerciseNames.length} (${pctg}%)${missingStr}`);
  }

  if (allMissing.length > 0) {
    console.log('\n=== All Missing Exercises ===');
    for (const name of allMissing) {
      console.log(`- ${name}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
