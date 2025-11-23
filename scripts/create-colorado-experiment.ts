// Script to create The Colorado Experiment program template
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const USER_ID = '9462f027-9916-41db-8d39-294c7858b516';

async function findExercise(exerciseName: string): Promise<string | null> {
  // Try exact match first
  let exercise = await prisma.exercises.findFirst({
    where: { name: exerciseName }
  });

  if (exercise) return exercise.id;

  // Try variations
  const variations = [
    exerciseName,
    exerciseName.replace('Barbell ', ''),
    exerciseName.replace('Dumbbell ', ''),
    exerciseName.replace('Machine ', ''),
    exerciseName.replace(' Machine', ''),
    exerciseName.replace(' or ', ' ').split(' ')[0],
    exerciseName.split(' (')[0], // Remove parenthetical
  ];

  for (const variation of variations) {
    exercise = await prisma.exercises.findFirst({
      where: {
        OR: [
          { name: { contains: variation, mode: 'insensitive' } },
          { aliasNames: { has: variation } }
        ]
      }
    });
    if (exercise) return exercise.id;
  }

  return null;
}

async function main() {
  try {
    console.log('💪 Creating The Colorado Experiment Program');
    console.log('═══════════════════════════════════════════\n');

    // Load the Colorado Experiment JSON
    const jsonPath = path.join(__dirname, '../src/templates/colorado_experiment.json');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const programId = 'colorado-experiment-hit';
    const now = new Date();

    // Create program template
    console.log('Creating program template...');
    const program = await prisma.program_templates.create({
      data: {
        id: programId,
        users: {
          connect: { id: USER_ID }
        },
        name: data.program_info.name,
        description: `${data.program_info.description}\n\n⚠️ ${data.program_info.warning}\n\nCreated by ${data.program_info.creator} in ${data.program_info.year_created}.`,
        duration: `${data.program_info.duration_weeks} weeks`,
        difficulty: 'ADVANCED',
        category: 'HYPERTROPHY',
        programType: 'PERIODIZATION',
        isPublic: true,
        isActive: true,
        hasExerciseSlots: false,
        rating: 0,
        ratingCount: 0,
        tags: ['HIT', 'high intensity', 'Arthur Jones', 'advanced', 'full body', 'low volume'],
        progressionStrategy: 'LINEAR',
        autoRegulation: false,
        createdAt: now,
        updatedAt: now
      }
    });
    console.log(`✅ Created program: ${program.name}\n`);

    // Create phases
    for (const phase of data.workout_phases) {
      console.log(`Creating Phase ${phase.phase_number}: ${phase.phase_name}...`);

      const [startWeek, endWeek] = phase.weeks.split('-').map((w: string) => parseInt(w));

      const phaseId = crypto.randomUUID();
      await prisma.program_phases.create({
        data: {
          id: phaseId,
          program_templates: {
            connect: { id: programId }
          },
          phaseNumber: phase.phase_number,
          phaseName: phase.phase_name,
          phaseType: 'HYPERTROPHY',
          startWeek: startWeek,
          endWeek: endWeek,
          description: phase.description,
          trainingFocus: phase.intensity_level,
          targetRPE: phase.phase_number === 1 ? 9 : 10,
          repRangeLow: parseInt(phase.rep_range.split('-')[0]),
          repRangeHigh: parseInt(phase.rep_range.split('-')[1])
        }
      });

      console.log(`✅ Phase ${phase.phase_number} created`);

      // Create microcycles (weeks)
      const microcycles: string[] = [];
      for (let week = startWeek; week <= endWeek; week++) {
        const microcycleId = crypto.randomUUID();
        await prisma.program_microcycles.create({
          data: {
            id: microcycleId,
            program_phases: {
              connect: { id: phaseId }
            },
            weekNumber: week,
            weekInPhase: week - startWeek + 1,
            title: `Week ${week}`,
            description: `${phase.phase_name} - Week ${week}`,
            volumeModifier: 1.0,
            intensityModifier: 1.0
          }
        });
        microcycles.push(microcycleId);
      }

      console.log(`✅ Created ${microcycles.length} weeks`);

      // Create workouts (3x per week - Mon/Wed/Fri)
      const workoutDays = ['Monday', 'Wednesday', 'Friday'];
      let exercisesFound = 0;
      let exercisesNotFound = 0;

      for (const microcycleId of microcycles) {
        for (let dayNum = 1; dayNum <= 3; dayNum++) {
          const workoutId = crypto.randomUUID();

          await prisma.program_workouts.create({
            data: {
              id: workoutId,
              program_microcycles: {
                connect: { id: microcycleId }
              },
              dayNumber: dayNum,
              dayLabel: workoutDays[dayNum - 1],
              workoutType: 'FULLBODY',
              description: phase.workout.workout_name,
              estimatedDuration: parseInt(phase.workout.estimated_duration_minutes)
            }
          });

          // Add exercises
          let order = 1;
          for (const exercise of phase.workout.exercises) {
            const exerciseId = await findExercise(exercise.exercise_name);

            if (!exerciseId) {
              console.log(`  ⚠️  Exercise not found: ${exercise.exercise_name}`);
              exercisesNotFound++;
              continue;
            }

            exercisesFound++;

            const repsMatch = exercise.reps.match(/(\d+)-(\d+)/);
            const repsMin = repsMatch ? parseInt(repsMatch[1]) : 8;
            const repsMax = repsMatch ? parseInt(repsMatch[2]) : 12;

            const notes = [
              exercise.instructions,
              `Failure Protocol: ${exercise.failure_protocol}`,
              `Progression: ${exercise.progression_notes}`
            ].join('\n\n');

            await prisma.program_workout_exercises.create({
              data: {
                id: crypto.randomUUID(),
                program_workouts: {
                  connect: { id: workoutId }
                },
                exercises: {
                  connect: { id: exerciseId }
                },
                exerciseOrder: order,
                sets: exercise.sets,
                repsMin: repsMin,
                repsMax: repsMax,
                restSeconds: exercise.rest_seconds,
                notes: notes,
                tempo: exercise.tempo,
                targetRPE: phase.phase_number === 1 ? 9 : 10
              }
            });

            order++;
          }
        }
      }

      console.log(`✅ Exercises: ${exercisesFound} found, ${exercisesNotFound} not found\n`);
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('🎉 SUCCESS! The Colorado Experiment Created');
    console.log('═══════════════════════════════════════════');
    console.log('\n📊 Summary:');
    console.log(`   Program: ${data.program_info.name}`);
    console.log(`   Duration: ${data.program_info.duration_weeks} weeks`);
    console.log(`   Phases: ${data.workout_phases.length}`);
    console.log(`   Training Days: 3x per week (Mon/Wed/Fri)`);
    console.log(`   Creator: ${data.program_info.creator} (${data.program_info.year_created})`);
    console.log('\n✨ Program now visible at /workout-log?tab=programs&type=PERIODIZATION!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
