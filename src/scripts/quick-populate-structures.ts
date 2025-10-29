import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

/**
 * Quickly create basic structure for each program so they display properly
 */
async function main() {
  console.log('=== QUICK STRUCTURE POPULATION ===\n');

  const programs = [
    { id: 'cbum-classic-physique', name: 'CBum', phases: 1, weeks: 8 },
    { id: 'nasm-fat-loss-program', name: 'Fat Loss', phases: 3, weeks: 12 },
    { id: 'nasm-muscle-gain-program', name: 'Muscle Gain', phases: 3, weeks: 12 },
    { id: 'nasm-performance-program', name: 'Performance', phases: 3, weeks: 12 },
  ];

  // Get any exercise with media to use as placeholder
  const sampleExercise = await prisma.exercises.findFirst({
    where: {
      OR: [
        { videoUrl: { not: null } },
        { imageUrl: { not: null } },
      ],
    },
    select: { id: true, name: true },
  });

  if (!sampleExercise) {
    console.log('❌ No exercises with media found');
    return;
  }

  console.log(`Using sample exercise: ${sampleExercise.name}\n`);

  for (const prog of programs) {
    console.log(`Processing ${prog.name}...`);

    // Check if already has structure
    const existing = await prisma.program_phases.findFirst({
      where: { programId: prog.id },
    });

    if (existing) {
      console.log(`  ⏭️  Already has phases, skipping`);
      continue;
    }

    // Create basic phase
    const phase = await prisma.program_phases.create({
      data: {
        id: nanoid(),
        programId: prog.id,
        phaseNumber: 1,
        phaseName: 'Main Phase',
        phaseType: 'HYPERTROPHY',
        startWeek: 1,
        endWeek: prog.weeks,
        description: 'Progressive training phase',
        trainingFocus: 'Overall Development',
        targetIntensity: '70-80%',
        targetVolume: 'Medium-High',
        targetRPE: 8,
        repRangeLow: 8,
        repRangeHigh: 12,
        setsPerExercise: 3,
        restSecondsMin: 60,
        restSecondsMax: 90,
      },
    });

    // Create microcycle
    const microcycle = await prisma.program_microcycles.create({
      data: {
        id: nanoid(),
        phaseId: phase.id,
        weekNumber: 1,
        weekInPhase: 1,
        title: 'Week 1',
        description: 'Foundation week',
        volumeModifier: 100,
        intensityModifier: 100,
      },
    });

    // Create 4 workouts
    for (let day = 1; day <= 4; day++) {
      const workout = await prisma.program_workouts.create({
        data: {
          id: nanoid(),
          microcycleId: microcycle.id,
          dayNumber: day,
          dayLabel: `Day ${day}`,
          workoutType: 'STRENGTH',
          description: `Training day ${day}`,
          estimatedDuration: 60,
        },
      });

      // Add 5 sample exercises to each workout
      for (let i = 1; i <= 5; i++) {
        await prisma.program_workout_exercises.create({
          data: {
            id: nanoid(),
            workoutId: workout.id,
            fixedExerciseId: sampleExercise.id,
            exerciseOrder: i,
            sets: 3,
            repsMin: 8,
            repsMax: 12,
            targetRPE: 8,
            targetIntensity: '75%',
            restSeconds: 75,
            notes: null,
          },
        });
      }
    }

    console.log(`  ✅ Created 1 phase, 1 microcycle, 4 workouts, 20 exercises`);
  }

  console.log('\n✅ All programs now have basic structure!\n');

  await prisma.$disconnect();
}

main().catch(console.error);
