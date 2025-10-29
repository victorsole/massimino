import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import cbumData from '../templates/cbum.json';
import fatLossData from '../templates/fat-loss.json';
import muscleGainData from '../templates/muscle-gain.json';
import performanceData from '../templates/performance.json';

const prisma = new PrismaClient();

interface ExerciseMatch {
  id: string;
  name: string;
  hasMedia: boolean;
  videoUrl: string | null;
  imageUrl: string | null;
}

/**
 * Search for exercise in database, prioritizing those with media
 */
async function findExerciseWithMedia(searchTerms: string[]): Promise<ExerciseMatch | null> {
  for (const searchTerm of searchTerms) {
    // First try: Find exercises WITH media
    const withMedia = await prisma.exercises.findFirst({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
        OR: [
          { videoUrl: { not: null } },
          { imageUrl: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        videoUrl: true,
        imageUrl: true,
      },
    });

    if (withMedia) {
      console.log(`✅ [WITH MEDIA] ${searchTerm} -> ${withMedia.name}`);
      return {
        ...withMedia,
        hasMedia: true,
      };
    }

    // Second try: Find any matching exercise
    const anyMatch = await prisma.exercises.findFirst({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        videoUrl: true,
        imageUrl: true,
      },
    });

    if (anyMatch) {
      console.log(`⚪ [NO MEDIA] ${searchTerm} -> ${anyMatch.name}`);
      return {
        ...anyMatch,
        hasMedia: false,
      };
    }
  }

  console.log(`❌ NOT FOUND: ${searchTerms.join(', ')}`);
  return null;
}

/**
 * Update CBum program with real exercises
 */
async function updateCBumExercises() {
  console.log('\n=== UPDATING CBUM PROGRAM EXERCISES ===\n');

  const programId = 'cbum-classic-physique';

  // Get the first microcycle
  const microcycle = await prisma.program_microcycles.findFirst({
    where: {
      program_phases: {
        programId: programId,
      },
    },
    include: {
      program_workouts: {
        orderBy: { dayNumber: 'asc' },
      },
    },
  });

  if (!microcycle || microcycle.program_workouts.length === 0) {
    console.log('❌ No workouts found for CBum program');
    return;
  }

  let totalExercises = 0;
  let withMedia = 0;

  // Map workouts to days in the template
  const dayMapping = [1, 2, 3, 4, 5, 6, 7, 8]; // CBum has 8-day cycle

  for (let i = 0; i < Math.min(microcycle.program_workouts.length, dayMapping.length); i++) {
    const workout = microcycle.program_workouts[i];
    const dayNum = dayMapping[i];

    // Find the corresponding day in the template
    const dayData = cbumData.weekly_schedule.find((d: any) => d.day === dayNum);
    if (!dayData || dayData.focus === 'REST') continue;

    console.log(`\nWorkout ${i + 1}: ${dayData.focus}`);

    // Delete existing placeholder exercises
    await prisma.workout_exercises.deleteMany({
      where: { workoutId: workout.id },
    });

    // Add real exercises from template
    const exercises = dayData.exercises || [];
    let exerciseOrder = 1;

    for (const ex of exercises) {
      const searchTerms = [
        ex.exercise_name,
        ex.exercise_name.replace(/ \(.*?\)/g, ''), // Remove parentheses
        ex.exercise_name.split(' ')[0], // First word
      ];

      const match = await findExerciseWithMedia(searchTerms);
      if (match) {
        await prisma.workout_exercises.create({
          data: {
            id: nanoid(),
            workoutId: workout.id,
            exerciseId: match.id,
            exerciseOrder: exerciseOrder++,
            sets: ex.sets || 4,
            repsMin: ex.reps_min || ex.reps || 8,
            repsMax: ex.reps_max || ex.reps || 15,
            targetRPE: ex.rpe || 8,
            restSeconds: ex.rest_seconds || 75,
            tempo: ex.tempo || null,
            notes: ex.notes || null,
          },
        });
        totalExercises++;
        if (match.hasMedia) withMedia++;
      }
    }
  }

  console.log(`\n✅ Updated CBum program: ${totalExercises} exercises (${withMedia} with media)`);
}

/**
 * Update Fat Loss program with real exercises
 */
async function updateFatLossExercises() {
  console.log('\n=== UPDATING FAT LOSS PROGRAM EXERCISES ===\n');

  const programId = 'nasm-fat-loss-program';

  const microcycle = await prisma.program_microcycles.findFirst({
    where: {
      program_phases: {
        programId: programId,
      },
    },
    include: {
      program_workouts: {
        orderBy: { dayNumber: 'asc' },
      },
    },
  });

  if (!microcycle || microcycle.program_workouts.length === 0) {
    console.log('❌ No workouts found for Fat Loss program');
    return;
  }

  let totalExercises = 0;
  let withMedia = 0;

  for (let i = 0; i < Math.min(microcycle.program_workouts.length, fatLossData.workouts.length); i++) {
    const workout = microcycle.program_workouts[i];
    const workoutData = fatLossData.workouts[i];

    console.log(`\nWorkout ${i + 1}: ${workoutData.workout_name}`);

    // Delete existing placeholder exercises
    await prisma.workout_exercises.deleteMany({
      where: { workoutId: workout.id },
    });

    // Add exercises from all sections
    let exerciseOrder = 1;
    const allExercises = [
      ...(workoutData.workout_structure?.warm_up?.exercises || []),
      ...(workoutData.workout_structure?.resistance_training?.exercises || []),
      ...(workoutData.workout_structure?.core?.exercises || []),
      ...(workoutData.workout_structure?.cool_down?.exercises || []),
    ];

    for (const ex of allExercises) {
      const searchTerms = [
        ex.exercise_name,
        ex.exercise_name.replace(/ \(.*?\)/g, ''),
        ex.exercise_name.split(' ')[0],
      ];

      const match = await findExerciseWithMedia(searchTerms);
      if (match) {
        await prisma.workout_exercises.create({
          data: {
            id: nanoid(),
            workoutId: workout.id,
            exerciseId: match.id,
            exerciseOrder: exerciseOrder++,
            sets: ex.sets || 3,
            repsMin: ex.reps || 12,
            repsMax: ex.reps || 15,
            targetRPE: 7,
            restSeconds: ex.rest_seconds || 60,
            tempo: ex.tempo || null,
            notes: ex.notes || null,
          },
        });
        totalExercises++;
        if (match.hasMedia) withMedia++;
      }
    }
  }

  console.log(`\n✅ Updated Fat Loss program: ${totalExercises} exercises (${withMedia} with media)`);
}

/**
 * Update Muscle Gain program with real exercises (same structure as Fat Loss)
 */
async function updateMuscleGainExercises() {
  console.log('\n=== UPDATING MUSCLE GAIN PROGRAM EXERCISES ===\n');

  const programId = 'nasm-muscle-gain-program';

  const microcycle = await prisma.program_microcycles.findFirst({
    where: {
      program_phases: {
        programId: programId,
      },
    },
    include: {
      program_workouts: {
        orderBy: { dayNumber: 'asc' },
      },
    },
  });

  if (!microcycle || microcycle.program_workouts.length === 0) {
    console.log('❌ No workouts found for Muscle Gain program');
    return;
  }

  let totalExercises = 0;
  let withMedia = 0;

  for (let i = 0; i < Math.min(microcycle.program_workouts.length, muscleGainData.workouts.length); i++) {
    const workout = microcycle.program_workouts[i];
    const workoutData = muscleGainData.workouts[i];

    console.log(`\nWorkout ${i + 1}: ${workoutData.workout_name}`);

    // Delete existing placeholder exercises
    await prisma.workout_exercises.deleteMany({
      where: { workoutId: workout.id },
    });

    // Add exercises
    let exerciseOrder = 1;
    const allExercises = [
      ...(workoutData.workout_structure?.warm_up?.exercises || []),
      ...(workoutData.workout_structure?.resistance_training?.exercises || []),
      ...(workoutData.workout_structure?.core?.exercises || []),
      ...(workoutData.workout_structure?.cool_down?.exercises || []),
    ];

    for (const ex of allExercises) {
      const searchTerms = [
        ex.exercise_name,
        ex.exercise_name.replace(/ \(.*?\)/g, ''),
        ex.exercise_name.split(' ')[0],
      ];

      const match = await findExerciseWithMedia(searchTerms);
      if (match) {
        await prisma.workout_exercises.create({
          data: {
            id: nanoid(),
            workoutId: workout.id,
            exerciseId: match.id,
            exerciseOrder: exerciseOrder++,
            sets: ex.sets || 3,
            repsMin: ex.reps || 8,
            repsMax: ex.reps || 12,
            targetRPE: 8,
            restSeconds: ex.rest_seconds || 60,
            tempo: ex.tempo || null,
            notes: ex.notes || null,
          },
        });
        totalExercises++;
        if (match.hasMedia) withMedia++;
      }
    }
  }

  console.log(`\n✅ Updated Muscle Gain program: ${totalExercises} exercises (${withMedia} with media)`);
}

/**
 * Update Performance program with real exercises
 */
async function updatePerformanceExercises() {
  console.log('\n=== UPDATING PERFORMANCE PROGRAM EXERCISES ===\n');

  const programId = 'nasm-performance-program';

  const microcycle = await prisma.program_microcycles.findFirst({
    where: {
      program_phases: {
        programId: programId,
      },
    },
    include: {
      program_workouts: {
        orderBy: { dayNumber: 'asc' },
      },
    },
  });

  if (!microcycle || microcycle.program_workouts.length === 0) {
    console.log('❌ No workouts found for Performance program');
    return;
  }

  let totalExercises = 0;
  let withMedia = 0;

  for (let i = 0; i < Math.min(microcycle.program_workouts.length, performanceData.workouts.length); i++) {
    const workout = microcycle.program_workouts[i];
    const workoutData = performanceData.workouts[i];

    console.log(`\nWorkout ${i + 1}: ${workoutData.workout_name}`);

    // Delete existing placeholder exercises
    await prisma.workout_exercises.deleteMany({
      where: { workoutId: workout.id },
    });

    // Add exercises
    let exerciseOrder = 1;
    const allExercises = [
      ...(workoutData.workout_structure?.warm_up?.exercises || []),
      ...(workoutData.workout_structure?.resistance_training?.exercises || []),
      ...(workoutData.workout_structure?.core?.exercises || []),
      ...(workoutData.workout_structure?.cool_down?.exercises || []),
    ];

    for (const ex of allExercises) {
      const searchTerms = [
        ex.exercise_name,
        ex.exercise_name.replace(/ \(.*?\)/g, ''),
        ex.exercise_name.split(' ')[0],
      ];

      const match = await findExerciseWithMedia(searchTerms);
      if (match) {
        await prisma.workout_exercises.create({
          data: {
            id: nanoid(),
            workoutId: workout.id,
            exerciseId: match.id,
            exerciseOrder: exerciseOrder++,
            sets: ex.sets || 3,
            repsMin: ex.reps || 6,
            repsMax: ex.reps || 10,
            targetRPE: 9,
            restSeconds: ex.rest_seconds || 120,
            tempo: ex.tempo || null,
            notes: ex.notes || null,
          },
        });
        totalExercises++;
        if (match.hasMedia) withMedia++;
      }
    }
  }

  console.log(`\n✅ Updated Performance program: ${totalExercises} exercises (${withMedia} with media)`);
}

async function main() {
  console.log('=================================================');
  console.log('  UPDATE PROGRAM EXERCISES WITH REAL EXERCISES');
  console.log('  Prioritizing exercises with media');
  console.log('=================================================');

  try {
    await updateCBumExercises();
    await updateFatLossExercises();
    await updateMuscleGainExercises();
    await updatePerformanceExercises();

    console.log('\n=================================================');
    console.log('✅ ALL PROGRAMS UPDATED WITH REAL EXERCISES!');
    console.log('=================================================\n');
  } catch (error) {
    console.error('Error updating programs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
