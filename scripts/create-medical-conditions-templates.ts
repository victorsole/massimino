// Script to create program templates for medical conditions training
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const USER_ID = '9462f027-9916-41db-8d39-294c7858b516';

async function main() {
  try {
    console.log('🏥 Creating Medical Conditions Program Templates');
    console.log('════════════════════════════════════════════════\n');

    // Load the medical conditions JSON
    const jsonPath = path.join(__dirname, '../src/templates/medical_conditions.json');
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');

    // The file contains multiple JSON objects, so we need to parse them separately
    const jsonObjects = fileContent.trim().split(/\n\s*\n\s*(?={)/);
    let allWorkouts: any[] = [];

    for (const jsonStr of jsonObjects) {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.medical_condition_workouts) {
          allWorkouts = allWorkouts.concat(parsed.medical_condition_workouts);
        }
        if (parsed.medical_condition_workouts_part2) {
          allWorkouts = allWorkouts.concat(parsed.medical_condition_workouts_part2);
        }
      } catch (e) {
        console.error('Failed to parse JSON object:', e);
      }
    }

    const medicalData = { medical_condition_workouts: allWorkouts };

    console.log('Creating Program Templates...\n');

    let templateCount = 0;

    // Create one program template per medical condition
    for (const program of medicalData.medical_condition_workouts) {
      console.log(`\n ${program.name} (${program.condition})`);
      console.log(`   Workouts: ${program.workouts.length}`);

      const programId = crypto.randomUUID();
      const now = new Date();

      // Parse duration from training_frequency if available
      const durationWeeks = program.progression_timeline
        ? Object.keys(program.progression_timeline).length * 2
        : 4;

      // Determine difficulty based on condition
      const difficulty = program.condition.includes('Recovery') || program.condition.includes('Post')
        ? 'BEGINNER'
        : 'INTERMEDIATE';

      // Create program template
      const programTemplate = await prisma.program_templates.create({
        data: {
          id: programId,
          users: {
            connect: { id: USER_ID }
          },
          name: program.name,
          description: `${program.description}\n\n⚠️ Medical Disclaimer: ${program.medical_disclaimer}`,
          duration: `${durationWeeks} weeks`,
          difficulty: difficulty,
          category: 'HEALTH',
          isPublic: true,
          programType: 'MEDICAL_CONDITION',
          tags: ['medical', 'recovery', 'modified', program.condition.toLowerCase().split(' ')[0]],
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
          phaseName: `${program.condition} Training`,
          phaseType: 'DELOAD',
          startWeek: 1,
          endWeek: durationWeeks,
          description: program.description,
          trainingFocus: 'Safe Training During Recovery',
          targetRPE: 5,
          repRangeLow: 12,
          repRangeHigh: 20
        }
      });

      console.log(`   ✅ Phase created`);

      // Create microcycles (weeks)
      const microcycles: string[] = [];
      for (let week = 1; week <= durationWeeks; week++) {
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
            description: `Recovery week ${week}`,
            volumeModifier: 1.0,
            intensityModifier: 1.0
          }
        });
        microcycles.push(microcycleId);
      }

      console.log(`   ✅ Created ${durationWeeks} weeks of microcycles`);

      // Create workouts - distribute the workouts across weeks
      let workoutNumber = 1;
      for (const workout of program.workouts) {
        // Add this workout to each week (cycling through days)
        for (let weekIdx = 0; weekIdx < microcycles.length; weekIdx++) {
          const workoutId = crypto.randomUUID();
          const dayNumber = workoutNumber;

          // Determine workout type based on focus
          let workoutType = 'FULLBODY';
          if (workout.focus?.toLowerCase().includes('upper')) {
            workoutType = 'UPPERBODY';
          } else if (workout.focus?.toLowerCase().includes('lower')) {
            workoutType = 'LOWERBODY';
          }

          await prisma.program_workouts.create({
            data: {
              id: workoutId,
              program_microcycles: {
                connect: { id: microcycles[weekIdx] }
              },
              dayNumber: dayNumber,
              dayLabel: workout.day,
              workoutType: workoutType,
              description: workout.focus || '',
              estimatedDuration: parseInt(program.session_duration?.match(/\d+/)?.[0] || '30')
            }
          });

          // Add exercises to this workout
          let exerciseOrder = 1;
          const exercises = workout.exercises || [];

          for (const exercise of exercises) {
            // Find the exercise in the database
            let foundEx = await prisma.exercises.findFirst({
              where: { name: exercise.exercise_name }
            });

            // Try without trailing 's' if not found
            if (!foundEx && exercise.exercise_name.endsWith('s')) {
              foundEx = await prisma.exercises.findFirst({
                where: { name: exercise.exercise_name.slice(0, -1) }
              });
            }

            // Try partial match as last resort
            if (!foundEx) {
              const foundExercises = await prisma.exercises.findMany({
                where: {
                  OR: [
                    { name: { contains: exercise.exercise_name.split(' ')[0], mode: 'insensitive' } },
                    { aliasNames: { has: exercise.exercise_name } }
                  ]
                },
                take: 1
              });
              foundEx = foundExercises[0] || null;
            }

            if (!foundEx) {
              console.log(`   ⚠️  Exercise not found: ${exercise.exercise_name}`);
              continue;
            }

            // Parse reps or use duration
            let repsMin = 12;
            let repsMax = 15;
            let notes = exercise.notes || '';

            if (exercise.reps) {
              const repsString = typeof exercise.reps === 'string' ? exercise.reps : `${exercise.reps}`;
              const repsMatch = repsString.match(/(\d+)(?:-(\d+))?/);
              if (repsMatch) {
                repsMin = parseInt(repsMatch[1]);
                repsMax = parseInt(repsMatch[2] || repsMatch[1]);
              }
            } else if (exercise.duration_minutes) {
              notes = `Duration: ${exercise.duration_minutes} minutes. ${notes}`;
              repsMin = 1;
              repsMax = 1;
            }

            if (exercise.intensity) {
              notes = `Intensity: ${exercise.intensity}. ${notes}`;
            }

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
                repsMin: repsMin,
                repsMax: repsMax,
                restSeconds: exercise.rest_seconds || 60,
                notes: notes.trim() || null,
                tempo: exercise.tempo || null,
                targetRPE: 5
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
    console.log('════════════════════════════════════════════════');
    console.log('🎉 SUCCESS! Medical Conditions Templates Created');
    console.log('════════════════════════════════════════════════');
    console.log(`\n📊 Summary:`);
    console.log(`   Program Templates: ${templateCount}`);
    console.log(`   Total Conditions: ${medicalData.medical_condition_workouts.length}`);
    console.log('\n🏥 Programs created:');
    for (const program of medicalData.medical_condition_workouts) {
      console.log(`   • ${program.name} (${program.condition})`);
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
