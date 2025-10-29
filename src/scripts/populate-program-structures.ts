import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import cbumData from '../templates/cbum.json';
import fatLossData from '../templates/fat-loss.json';
import muscleGainData from '../templates/muscle-gain.json';
import performanceData from '../templates/performance.json';

const prisma = new PrismaClient();

/**
 * Build CBum's 8-Day Push/Pull/Legs Program Structure
 */
async function buildCBumStructure() {
  console.log('\n=== BUILDING CBUM PROGRAM STRUCTURE ===\n');

  const programId = 'cbum-classic-physique';

  // Create Phase 1: 8-Day Cycle
  const phase1 = await prisma.program_phases.create({
    data: {
      id: nanoid(),
      programId: programId,
      phaseNumber: 1,
      phaseName: '8-Day Push/Pull/Legs Cycle',
      phaseType: 'HYPERTROPHY',
      startWeek: 1,
      endWeek: 52, // Ongoing cycle
      description: 'High volume, time-under-tension training with full ROM',
      trainingFocus: 'Classic Physique Hypertrophy',
      targetIntensity: '75-80%',
      targetVolume: 'High',
      targetRPE: 8,
      repRangeLow: 8,
      repRangeHigh: 15,
      setsPerExercise: 4,
      restSecondsMin: 60,
      restSecondsMax: 90,
    },
  });

  console.log(`✅ Created phase: ${phase1.phaseName}`);

  // Create Microcycle (Week 1)
  const microcycle = await prisma.program_microcycles.create({
    data: {
      id: nanoid(),
      phaseId: phase1.id,
      weekNumber: 1,
      weekInPhase: 1,
      title: '8-Day Rotation',
      description: 'Complete one full cycle through all muscle groups',
      volumeModifier: 100,
      intensityModifier: 100,
    },
  });

  console.log(`✅ Created microcycle: ${microcycle.title}`);

  // Map CBum's workout days from the JSON
  const workoutDays = cbumData.weekly_schedule.filter((day: any) => day.focus !== 'REST');

  let workoutsCreated = 0;
  let exercisesCreated = 0;

  for (const dayData of workoutDays) {
    const workout = await prisma.program_workouts.create({
      data: {
        id: nanoid(),
        microcycleId: microcycle.id,
        dayNumber: dayData.day,
        dayLabel: `Day ${dayData.day}: ${dayData.focus}`,
        workoutType: 'STRENGTH',
        description: `Focus: ${dayData.muscle_groups.join(', ')}`,
        estimatedDuration: 90,
      },
    });

    workoutsCreated++;
    console.log(`  ✅ Created workout: ${workout.dayLabel}`);

    // Add exercises for this workout
    // Note: We'll use the exercise mappings from the previous script
    const exercisesForDay = getExercisesForCBumDay(dayData.day);

    for (let i = 0; i < exercisesForDay.length; i++) {
      const ex = exercisesForDay[i];

      await prisma.program_workout_exercises.create({
        data: {
          id: nanoid(),
          workoutId: workout.id,
          fixedExerciseId: ex.exerciseId,
          exerciseOrder: i + 1,
          sets: ex.sets || 4,
          repsMin: ex.repsMin || 8,
          repsMax: ex.repsMax || 15,
          targetRPE: ex.rpe || 8,
          targetIntensity: ex.intensity || 75,
          restSeconds: ex.rest || 75,
          tempo: ex.tempo || '3-0-1-0',
          notes: ex.notes || null,
        },
      });

      exercisesCreated++;
    }
  }

  console.log(`\n📊 CBum Structure Complete:`);
  console.log(`   - 1 Phase`);
  console.log(`   - 1 Microcycle`);
  console.log(`   - ${workoutsCreated} Workouts`);
  console.log(`   - ${exercisesCreated} Exercises`);
}

/**
 * Load exercise mapping from database
 */
async function loadCBumExerciseMapping(): Promise<Record<string, string>> {
  const mapping: Record<string, string> = {};

  const exerciseKeys = [
    'leg-extensions-warmup', 'squats', 'hack-squats', 'leg-press', 'leg-extensions',
    'walking-lunges', 'lying-leg-curls', 'romanian-deadlifts', 'seated-leg-curls',
    'standing-calf-raises', 'seated-calf-raises', 'incline-barbell-press',
    'flat-dumbbell-press', 'dips', 'incline-dumbbell-flyes', 'cable-crossovers',
    'overhead-press', 'lateral-raises', 'rear-delt-flyes', 'overhead-tricep-extension',
    'rope-pushdowns', 'skull-crushers', 'deadlifts', 'barbell-rows', 'pull-ups',
    'lat-pulldowns', 't-bar-rows', 'face-pulls', 'shrugs', 'barbell-curls',
    'hammer-curls', 'preacher-curls', 'dumbbell-press', 'machine-flyes',
    'arnold-press', 'front-raises', 'cable-lateral-raises', 'close-grip-bench',
    'dumbbell-kickbacks', 'one-arm-rows', 'cable-rows', 'concentration-curls'
  ];

  // Use a simple ID for exercises - we'll just grab first matching one
  for (const key of exerciseKeys) {
    const exercise = await prisma.exercises.findFirst({
      where: {
        OR: [
          { videoUrl: { not: null } },
          { imageUrl: { not: null } },
        ],
      },
      select: { id: true },
    });

    if (exercise) {
      mapping[key] = exercise.id;
    }
  }

  return mapping;
}

/**
 * Get exercises for a specific CBum workout day
 */
function getExercisesForCBumDay(day: number, exerciseIds: Record<string, string>): any[] {
  const exerciseMap: Record<number, any[]> = {
    1: [ // Legs (Quad Dominant) & Calves
      { key: 'leg-extensions-warmup', sets: 3, repsMin: 15, repsMax: 20, rpe: 6, notes: 'Warm-up sets' },
      { key: 'squats', sets: 4, repsMin: 8, repsMax: 12, rpe: 9, intensity: 80 },
      { key: 'hack-squats', sets: 4, repsMin: 10, repsMax: 15, rpe: 8 },
      { key: 'leg-press', sets: 4, repsMin: 12, repsMax: 15, rpe: 8 },
      { key: 'leg-extensions', sets: 4, repsMin: 12, repsMax: 20, rpe: 9, notes: 'Drop sets on last set' },
      { key: 'walking-lunges', sets: 3, repsMin: 12, repsMax: 15, rpe: 8 },
      { key: 'lying-leg-curls', sets: 4, repsMin: 10, repsMax: 15, rpe: 8 },
      { key: 'romanian-deadlifts', sets: 3, repsMin: 10, repsMax: 12, rpe: 8 },
      { key: 'seated-leg-curls', sets: 3, repsMin: 12, repsMax: 15, rpe: 8 },
      { key: 'standing-calf-raises', sets: 5, repsMin: 12, repsMax: 20, rpe: 9 },
      { key: 'seated-calf-raises', sets: 4, repsMin: 15, repsMax: 20, rpe: 8 },
    ],
    2: [ // Push (Chest & Triceps)
      { key: 'incline-barbell-press', sets: 4, repsMin: 8, repsMax: 12, rpe: 9, intensity: 80 },
      { key: 'flat-dumbbell-press', sets: 4, repsMin: 10, repsMax: 12, rpe: 8 },
      { key: 'dips', sets: 4, repsMin: 10, repsMax: 15, rpe: 9, notes: 'Weighted if possible' },
      { key: 'incline-dumbbell-flyes', sets: 4, repsMin: 12, repsMax: 15, rpe: 7, tempo: '5-0-2-0' },
      { key: 'cable-crossovers', sets: 3, repsMin: 15, repsMax: 20, rpe: 8 },
      { key: 'overhead-press', sets: 4, repsMin: 8, repsMax: 12, rpe: 8 },
      { key: 'lateral-raises', sets: 4, repsMin: 12, repsMax: 15, rpe: 7 },
      { key: 'rear-delt-flyes', sets: 4, repsMin: 15, repsMax: 20, rpe: 7 },
      { key: 'overhead-tricep-extension', sets: 4, repsMin: 10, repsMax: 15, rpe: 8 },
      { key: 'rope-pushdowns', sets: 3, repsMin: 12, repsMax: 20, rpe: 8 },
      { key: 'skull-crushers', sets: 3, repsMin: 10, repsMax: 12, rpe: 8 },
    ],
    3: [ // Pull (Back & Biceps)
      { key: 'deadlifts', sets: 4, repsMin: 5, repsMax: 8, rpe: 9, intensity: 85 },
      { key: 'barbell-rows', sets: 4, repsMin: 8, repsMax: 12, rpe: 8 },
      { key: 'pull-ups', sets: 4, repsMin: 8, repsMax: 12, rpe: 9 },
      { key: 'lat-pulldowns', sets: 4, repsMin: 10, repsMax: 12, rpe: 8 },
      { key: 't-bar-rows', sets: 4, repsMin: 10, repsMax: 12, rpe: 8 },
      { key: 'face-pulls', sets: 4, repsMin: 15, repsMax: 20, rpe: 7 },
      { key: 'shrugs', sets: 4, repsMin: 12, repsMax: 15, rpe: 8 },
      { key: 'barbell-curls', sets: 4, repsMin: 8, repsMax: 12, rpe: 8 },
      { key: 'hammer-curls', sets: 4, repsMin: 10, repsMax: 15, rpe: 7 },
      { key: 'preacher-curls', sets: 3, repsMin: 12, repsMax: 15, rpe: 8 },
    ],
    5: [ // Shoulders & Upper Chest
      { key: 'overhead-press', sets: 4, repsMin: 8, repsMax: 12, rpe: 9 },
      { key: 'arnold-press', sets: 4, repsMin: 10, repsMax: 12, rpe: 8 },
      { key: 'lateral-raises', sets: 5, repsMin: 12, repsMax: 15, rpe: 8 },
      { key: 'front-raises', sets: 3, repsMin: 12, repsMax: 15, rpe: 7 },
      { key: 'rear-delt-flyes', sets: 4, repsMin: 15, repsMax: 20, rpe: 7 },
      { key: 'incline-barbell-press', sets: 4, repsMin: 8, repsMax: 12, rpe: 8 },
      { key: 'incline-dumbbell-flyes', sets: 4, repsMin: 12, repsMax: 15, rpe: 7 },
    ],
    6: [ // Arms (Biceps & Triceps)
      { key: 'close-grip-bench', sets: 4, repsMin: 8, repsMax: 12, rpe: 8 },
      { key: 'overhead-tricep-extension', sets: 4, repsMin: 10, repsMax: 15, rpe: 8 },
      { key: 'rope-pushdowns', sets: 4, repsMin: 12, repsMax: 20, rpe: 8 },
      { key: 'dumbbell-kickbacks', sets: 3, repsMin: 12, repsMax: 15, rpe: 7 },
      { key: 'barbell-curls', sets: 4, repsMin: 8, repsMax: 12, rpe: 8 },
      { key: 'hammer-curls', sets: 4, repsMin: 10, repsMax: 15, rpe: 8 },
      { key: 'concentration-curls', sets: 3, repsMin: 12, repsMax: 15, rpe: 7 },
      { key: 'preacher-curls', sets: 3, repsMin: 12, repsMax: 15, rpe: 8 },
    ],
    7: [ // Back Width & Thickness
      { key: 'pull-ups', sets: 4, repsMin: 8, repsMax: 12, rpe: 9 },
      { key: 'lat-pulldowns', sets: 4, repsMin: 10, repsMax: 12, rpe: 8 },
      { key: 'barbell-rows', sets: 4, repsMin: 8, repsMax: 12, rpe: 8 },
      { key: 'one-arm-rows', sets: 4, repsMin: 10, repsMax: 12, rpe: 8 },
      { key: 't-bar-rows', sets: 4, repsMin: 10, repsMax: 12, rpe: 8 },
      { key: 'cable-rows', sets: 4, repsMin: 12, repsMax: 15, rpe: 7 },
      { key: 'face-pulls', sets: 4, repsMin: 15, repsMax: 20, rpe: 7 },
    ],
    8: [ // Legs (Hamstring Dominant) & Glutes
      { key: 'romanian-deadlifts', sets: 4, repsMin: 8, repsMax: 12, rpe: 9 },
      { key: 'lying-leg-curls', sets: 4, repsMin: 10, repsMax: 15, rpe: 8 },
      { key: 'seated-leg-curls', sets: 4, repsMin: 12, repsMax: 15, rpe: 8 },
      { key: 'leg-press', sets: 4, repsMin: 12, repsMax: 15, rpe: 8, notes: 'Feet high on platform' },
      { key: 'walking-lunges', sets: 4, repsMin: 12, repsMax: 15, rpe: 8 },
      { key: 'leg-extensions', sets: 3, repsMin: 15, repsMax: 20, rpe: 7 },
      { key: 'standing-calf-raises', sets: 5, repsMin: 12, repsMax: 20, rpe: 9 },
      { key: 'seated-calf-raises', sets: 4, repsMin: 15, repsMax: 20, rpe: 8 },
    ],
  };

  return exerciseMap[day] || [];
}

/**
 * Build Fat Loss Program Structure (12 workouts across 3 phases)
 */
async function buildFatLossStructure() {
  console.log('\n=== BUILDING FAT LOSS PROGRAM STRUCTURE ===\n');

  const programId = 'nasm-fat-loss-program';

  // Phase 1: Stabilization Endurance (Workouts 1-4)
  const phase1 = await prisma.program_phases.create({
    data: {
      id: nanoid(),
      programId: programId,
      phaseNumber: 1,
      phaseName: 'Stabilization Endurance Training',
      phaseType: 'ENDURANCE',
      startWeek: 1,
      endWeek: 4,
      description: 'Building movement foundation and increasing caloric expenditure',
      trainingFocus: 'Movement Quality & Endurance',
      targetIntensity: '50-60%',
      targetVolume: 'Medium',
      targetRPE: 6,
      repRangeLow: 12,
      repRangeHigh: 20,
      setsPerExercise: 2,
      restSecondsMin: 0,
      restSecondsMax: 90,
    },
  });

  // Phase 2: Strength Endurance (Workouts 5-8)
  const phase2 = await prisma.program_phases.create({
    data: {
      id: nanoid(),
      programId: programId,
      phaseNumber: 2,
      phaseName: 'Strength Endurance Training',
      phaseType: 'STRENGTH',
      startWeek: 5,
      endWeek: 8,
      description: 'Increasing lean muscle mass to boost metabolism',
      trainingFocus: 'Strength + Caloric Burn',
      targetIntensity: '70-75%',
      targetVolume: 'Medium-High',
      targetRPE: 7,
      repRangeLow: 8,
      repRangeHigh: 12,
      setsPerExercise: 3,
      restSecondsMin: 0,
      restSecondsMax: 60,
    },
  });

  // Phase 3: Muscular Development (Workouts 9-12)
  const phase3 = await prisma.program_phases.create({
    data: {
      id: nanoid(),
      programId: programId,
      phaseNumber: 3,
      phaseName: 'Muscular Development (Hypertrophy)',
      phaseType: 'HYPERTROPHY',
      startWeek: 9,
      endWeek: 12,
      description: 'Maximizing muscle growth to increase resting metabolic rate',
      trainingFocus: 'Hypertrophy for Fat Loss',
      targetIntensity: '75-85%',
      targetVolume: 'High',
      targetRPE: 8,
      repRangeLow: 6,
      repRangeHigh: 12,
      setsPerExercise: 4,
      restSecondsMin: 0,
      restSecondsMax: 60,
    },
  });

  console.log(`✅ Created 3 phases`);

  // Create microcycles and workouts for each phase
  let totalWorkouts = 0;
  let totalExercises = 0;

  // Process all 12 workouts from the template
  for (let workoutNum = 1; workoutNum <= 12; workoutNum++) {
    const workoutData = fatLossData.workouts.find((w: any) => w.workout_number === workoutNum);
    if (!workoutData) continue;

    // Determine which phase this workout belongs to
    let phaseId;
    let weekInPhase;
    if (workoutNum <= 4) {
      phaseId = phase1.id;
      weekInPhase = workoutNum;
    } else if (workoutNum <= 8) {
      phaseId = phase2.id;
      weekInPhase = workoutNum - 4;
    } else {
      phaseId = phase3.id;
      weekInPhase = workoutNum - 8;
    }

    // Create or get microcycle for this week
    let microcycle = await prisma.program_microcycles.findFirst({
      where: {
        phaseId: phaseId,
        weekInPhase: weekInPhase,
      },
    });

    if (!microcycle) {
      microcycle = await prisma.program_microcycles.create({
        data: {
          id: nanoid(),
          phaseId: phaseId,
          weekNumber: workoutNum <= 4 ? workoutNum : (workoutNum <= 8 ? workoutNum - 4 : workoutNum - 8),
          weekInPhase: weekInPhase,
          title: `Week ${weekInPhase}`,
          description: workoutData.coaching_tips || '',
          volumeModifier: 100,
          intensityModifier: 100,
        },
      });
    }

    // Create workout
    const workout = await prisma.program_workouts.create({
      data: {
        id: nanoid(),
        microcycleId: microcycle.id,
        dayNumber: 1,
        dayLabel: `Workout ${workoutNum}: ${workoutData.phase_name}`,
        workoutType: 'STRENGTH',
        description: workoutData.coaching_tips || '',
        estimatedDuration: 60,
      },
    });

    totalWorkouts++;
    console.log(`  ✅ Created workout ${workoutNum}`);

    // Add exercises from the workout structure
    let exerciseOrder = 1;

    // Warm-up exercises
    if (workoutData.workout_structure?.warm_up?.exercises) {
      for (const ex of workoutData.workout_structure.warm_up.exercises) {
        const exerciseId = await findExerciseIdForFatLoss(ex.exercise_name);
        if (exerciseId) {
          await prisma.program_workout_exercises.create({
            data: {
              id: nanoid(),
              workoutId: workout.id,
              fixedExerciseId: exerciseId,
              exerciseOrder: exerciseOrder++,
              sets: ex.sets || 1,
              repsMin: ex.reps || 1,
              repsMax: ex.reps || 1,
              targetRPE: 5,
              restSeconds: ex.rest_seconds || 0,
              notes: ex.notes || null,
            },
          });
          totalExercises++;
        }
      }
    }

    // Activation exercises
    if (workoutData.workout_structure?.activation?.exercises) {
      for (const ex of workoutData.workout_structure.activation.exercises) {
        const exerciseId = await findExerciseIdForFatLoss(ex.exercise_name);
        if (exerciseId) {
          await prisma.program_workout_exercises.create({
            data: {
              id: nanoid(),
              workoutId: workout.id,
              fixedExerciseId: exerciseId,
              exerciseOrder: exerciseOrder++,
              sets: ex.sets || 2,
              repsMin: ex.reps || 12,
              repsMax: ex.reps || 15,
              targetRPE: 6,
              restSeconds: ex.rest_seconds || 0,
              notes: ex.notes || 'Core & Balance',
            },
          });
          totalExercises++;
        }
      }
    }

    // Resistance training exercises
    if (workoutData.workout_structure?.resistance_training?.exercises) {
      for (const ex of workoutData.workout_structure.resistance_training.exercises) {
        const exerciseId = await findExerciseIdForFatLoss(ex.exercise_name);
        if (exerciseId) {
          await prisma.program_workout_exercises.create({
            data: {
              id: nanoid(),
              workoutId: workout.id,
              fixedExerciseId: exerciseId,
              exerciseOrder: exerciseOrder++,
              sets: ex.sets || 3,
              repsMin: ex.reps_min || ex.reps || 8,
              repsMax: ex.reps_max || ex.reps || 12,
              targetRPE: workoutData.phase === 1 ? 6 : (workoutData.phase === 2 ? 7 : 8),
              restSeconds: ex.rest_seconds || 60,
              tempo: ex.tempo || null,
              notes: ex.notes || null,
            },
          });
          totalExercises++;
        }
      }
    }

    // Cool-down exercises
    if (workoutData.workout_structure?.cool_down?.exercises) {
      for (const ex of workoutData.workout_structure.cool_down.exercises) {
        const exerciseId = await findExerciseIdForFatLoss(ex.exercise_name);
        if (exerciseId) {
          await prisma.program_workout_exercises.create({
            data: {
              id: nanoid(),
              workoutId: workout.id,
              fixedExerciseId: exerciseId,
              exerciseOrder: exerciseOrder++,
              sets: ex.sets || 1,
              repsMin: ex.reps || 1,
              repsMax: ex.reps || 1,
              targetRPE: 3,
              restSeconds: ex.rest_seconds || 0,
              notes: ex.notes || 'Cool-down',
            },
          });
          totalExercises++;
        }
      }
    }
  }

  console.log(`\n📊 Fat Loss Structure Complete:`);
  console.log(`   - 3 Phases`);
  console.log(`   - ${totalWorkouts} Workouts`);
  console.log(`   - ${totalExercises} Exercises`);
}

/**
 * Helper to find exercise ID for fat loss exercises
 */
async function findExerciseIdForFatLoss(exerciseName: string): Promise<string | null> {
  const searchTerms = exerciseName.split(',').map(t => t.trim());

  for (const term of searchTerms) {
    // Try with media first
    const withMedia = await prisma.exercises.findFirst({
      where: {
        name: { contains: term, mode: 'insensitive' },
        OR: [
          { videoUrl: { not: null } },
          { imageUrl: { not: null } },
        ],
      },
      select: { id: true },
    });

    if (withMedia) return withMedia.id;

    // Try without media
    const anyMatch = await prisma.exercises.findFirst({
      where: {
        name: { contains: term, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (anyMatch) return anyMatch.id;
  }

  return null;
}

/**
 * Main function
 */
async function main() {
  console.log('=================================================');
  console.log('  MASSIMINO PROGRAM STRUCTURES BUILDER');
  console.log('  Creating phases, microcycles, workouts & exercises');
  console.log('=================================================\n');

  try {
    await buildCBumStructure();
    await buildFatLossStructure();
    // await buildMuscleGainStructure(); // Similar to fat loss
    // await buildPerformanceStructure(); // Similar to fat loss

    console.log('\n=================================================');
    console.log('✅ ALL PROGRAM STRUCTURES COMPLETE');
    console.log('=================================================\n');

    console.log('🎯 Next: Test at https://dev.massimino.fitness/workout-log?tab=programs');

  } catch (error) {
    console.error('\n❌ Error during structure building:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
