// Script to create program templates for castell training
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const USER_ID = '9462f027-9916-41db-8d39-294c7858b516';

async function main() {
  try {
    console.log('🏰 Creating Castell Program Templates');
    console.log('════════════════════════════════════\n');

    // Load the castellers JSON
    const jsonPath = path.join(__dirname, '../src/templates/castellers.json');
    const castellData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // Group programs by position
    const programsByPosition: Record<string, any[]> = {};

    for (const program of castellData.workout_programs) {
      if (!programsByPosition[program.position]) {
        programsByPosition[program.position] = [];
      }
      programsByPosition[program.position].push(program);
    }

    console.log('📋 Creating Program Templates...\n');

    let templateCount = 0;

    // Create one program template per position with multiple workout sessions
    for (const [position, programs] of Object.entries(programsByPosition)) {
      console.log(`\n💪 ${position} Training Program`);
      console.log(`   Workouts: ${programs.length}`);

      const programId = crypto.randomUUID();
      const now = new Date();

      // Create program template
      const programTemplate = await prisma.program_templates.create({
        data: {
          id: programId,
          users: {
            connect: { id: USER_ID }
          },
          name: `Castell Training: ${position}`,
          description: `Comprehensive training program for ${position} position in castells. Includes ${programs.length} specialized workout sessions focusing on strength, endurance, and castell-specific movements.`,
          duration: '8 weeks',
          difficulty: programs[0].difficulty?.toUpperCase() || 'INTERMEDIATE',
          category: 'STRENGTH',
          isPublic: true,
          programType: 'CUSTOM',
          tags: ['castells', 'team', 'mannekes', position.toLowerCase()],
          hasExerciseSlots: false,
          autoRegulation: false,
          createdAt: now,
          updatedAt: now
        }
      });

      console.log(`   ✅ Program template created: ${programTemplate.name}`);

      // Create a single phase for this program
      const phaseId = crypto.randomUUID();
      await prisma.program_phases.create({
        data: {
          id: phaseId,
          program_templates: {
            connect: { id: programId }
          },
          phaseNumber: 1,
          phaseName: `${position} Training`,
          phaseType: 'STRENGTH',
          startWeek: 1,
          endWeek: 8,
          description: `Main training phase for ${position} position in castells`,
          trainingFocus: 'Castell-Specific Strength',
          targetRPE: 7,
          repRangeLow: 6,
          repRangeHigh: 15
        }
      });

      console.log(`   ✅ Phase created`);

      // Create microcycles (weeks) - let's create 8 weeks with workouts cycling through
      const microcycles: string[] = [];
      for (let week = 1; week <= 8; week++) {
        const microcycleId = crypto.randomUUID();
        await prisma.program_microcycles.create({
          data: {
            id: microcycleId,
            program_phases: {
              connect: { id: phaseId }
            },
            weekNumber: week,
            weekInPhase: week,
            title: `Week ${week}`,
            description: `Training week ${week} for ${position}`,
            volumeModifier: 1.0,
            intensityModifier: 1.0
          }
        });
        microcycles.push(microcycleId);
      }

      console.log(`   ✅ Created 8 weeks of microcycles`);

      // Create workouts - distribute the program workouts across weeks
      let workoutNumber = 1;
      for (const program of programs) {
        // Add this workout to each week (cycling through days)
        for (let weekIdx = 0; weekIdx < microcycles.length; weekIdx++) {
          const workoutId = crypto.randomUUID();
          const dayNumber = workoutNumber; // Day 1, 2, or 3 depending on which program

          await prisma.program_workouts.create({
            data: {
              id: workoutId,
              program_microcycles: {
                connect: { id: microcycles[weekIdx] }
              },
              dayNumber: dayNumber,
              dayLabel: program.name,
              workoutType: program.training_type === 'Gym' ? 'FULLBODY' : 'BODYWEIGHT',
              description: program.description,
              estimatedDuration: program.duration_minutes
            }
          });

          // Add exercises to this workout
          let exerciseOrder = 1;
          const exercises = program.main_workout.exercises;

          for (const exercise of exercises) {
          // Find the exercise in the database
          let foundEx = await prisma.exercises.findFirst({
            where: { name: exercise.name }
          });

          // Try without trailing 's' if not found
          if (!foundEx && exercise.name.endsWith('s')) {
            foundEx = await prisma.exercises.findFirst({
              where: { name: exercise.name.slice(0, -1) }
            });
          }

          // Try partial match as last resort
          if (!foundEx) {
            const exercises = await prisma.exercises.findMany({
              where: {
                OR: [
                  { name: { contains: exercise.name.split(' ')[0], mode: 'insensitive' } },
                  { aliasNames: { has: exercise.name } }
                ]
              },
              take: 1
            });
            foundEx = exercises[0] || null;
          }

          if (!foundEx) {
            continue;
          }

          // Parse reps
          const repsString = typeof exercise.reps === 'string' ? exercise.reps : `${exercise.reps}`;

          await prisma.program_workout_exercises.create({
            data: {
              id: crypto.randomUUID(),
              program_workouts: {
                connect: { id: workoutId }
              },
              exercises: {
                connect: { id: foundEx.id }
              },
              exerciseOrder: exerciseOrder,
              sets: exercise.sets || 3,
              repsMin: parseInt(repsString) || 10,
              repsMax: parseInt(repsString) || 10,
              restSeconds: exercise.rest_seconds || 60,
              notes: exercise.notes || null,
              tempo: exercise.tempo || null,
              targetRPE: 7
            }
          });

          exerciseOrder++;
          }
        }

        workoutNumber++;
      }

      templateCount++;
    }

    console.log('\n\n');
    console.log('════════════════════════════════════');
    console.log('🎉 SUCCESS! Program Templates Created');
    console.log('════════════════════════════════════');
    console.log(`\n📊 Summary:`);
    console.log(`   Program Templates: ${templateCount}`);
    console.log(`   Total Positions: ${Object.keys(programsByPosition).length}`);
    console.log('\n💪 Programs created:');
    for (const position of Object.keys(programsByPosition)) {
      console.log(`   • Castell Training: ${position}`);
    }
    console.log('\n✨ Programs now visible in /workout-log?tab=programs!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
