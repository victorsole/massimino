/**
 * Programs Seed
 * Creates complete program templates with phases, workouts, and exercises
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🏋️ Seeding Program Templates...');

  // Get system user
  const systemUser = await prisma.users.findFirst({
    where: { email: 'system@massimino.fitness' }
  });

  if (!systemUser) {
    throw new Error('System user not found. Run periodization-seed.ts first.');
  }

  // Get Arnold
  const arnold = await prisma.legendary_athletes.findUnique({
    where: { slug: 'arnold-schwarzenegger' }
  });

  if (!arnold) {
    throw new Error('Arnold not found. Run periodization-seed.ts first.');
  }

  // Get exercises we need
  const benchPress = await prisma.exercises.findFirst({ where: { name: { contains: 'Bench Press', mode: 'insensitive' } } });
  const squat = await prisma.exercises.findFirst({ where: { name: { equals: 'Squat', mode: 'insensitive' } } });
  const pullup = await prisma.exercises.findFirst({ where: { name: { contains: 'Pull-up', mode: 'insensitive' } } });
  const shoulderPress = await prisma.exercises.findFirst({ where: { name: { contains: 'Shoulder Press', mode: 'insensitive' } } });
  const curl = await prisma.exercises.findFirst({ where: { name: { contains: 'Curl', mode: 'insensitive' } } });

  console.log('📝 Creating Arnold\'s Golden Six Program...');

  // ===========================
  // ARNOLD'S GOLDEN SIX
  // ===========================

  const goldenSix = await prisma.program_templates.upsert({
    where: { id: 'arnold-golden-six' },
    update: {},
    create: {
      id: 'arnold-golden-six',
      name: 'Arnold\'s Golden Six',
      description: 'Arnold Schwarzenegger\'s foundational full-body routine from the 1960s. This beginner-friendly program builds overall mass and strength with 6 fundamental exercises trained 3 times per week. Perfect for establishing a solid base.',
      createdBy: systemUser.id,
      duration: '12 weeks',
      difficulty: 'BEGINNER',
      category: 'BODYBUILDING',
      isPublic: true,
      price: 0,
      rating: 5.0,
      ratingCount: 0,
      isActive: true,
      tags: ['Arnold', 'Full Body', 'Beginner', 'Mass Building', 'Golden Era'],
      programType: 'ATHLETE',
      athleteId: arnold.id,
      hasExerciseSlots: false,
      progressionStrategy: 'LINEAR',
      autoRegulation: false,
      updatedAt: new Date(),
    }
  });

  // Create single phase (entire 12 weeks)
  const goldenSixPhase = await prisma.program_phases.create({
    data: {
      id: crypto.randomUUID(),
      programId: goldenSix.id,
      phaseNumber: 1,
      phaseName: 'Foundation Building',
      phaseType: 'HYPERTROPHY',
      startWeek: 1,
      endWeek: 12,
      description: 'Build foundational mass and strength with compound movements',
      trainingFocus: 'Overall Development',
      targetIntensity: '70-75%',
      targetVolume: 'MEDIUM',
      targetRPE: 7,
      repRangeLow: 10,
      repRangeHigh: 10,
      setsPerExercise: 4,
      restSecondsMin: 90,
      restSecondsMax: 120,
    }
  });

  // Create 12 microcycles (weeks)
  for (let week = 1; week <= 12; week++) {
    const microcycle = await prisma.program_microcycles.create({
      data: {
        id: crypto.randomUUID(),
        phaseId: goldenSixPhase.id,
        weekNumber: week,
        weekInPhase: week,
        title: `Week ${week}`,
        description: week === 1 ? 'Focus on form and building the mind-muscle connection' :
                     week === 12 ? 'Test your strength gains this final week' :
                     'Progressive overload - add weight when you can complete all reps',
        volumeModifier: 1.0,
        intensityModifier: 1.0,
      }
    });

    // Create 3 workouts per week (Mon, Wed, Fri)
    for (let day = 1; day <= 3; day++) {
      const dayName = day === 1 ? 'Monday' : day === 2 ? 'Wednesday' : 'Friday';

      const workout = await prisma.program_workouts.create({
        data: {
          id: crypto.randomUUID(),
          microcycleId: microcycle.id,
          dayNumber: day,
          dayLabel: `${dayName} - Full Body`,
          workoutType: 'FULLBODY',
          description: 'Complete all 6 exercises with perfect form. Rest 90-120 seconds between sets.',
          estimatedDuration: 60,
        }
      });

      // Add the 6 exercises
      const exercises = [
        { exercise: squat, order: 1, name: 'Barbell Squat' },
        { exercise: benchPress, order: 2, name: 'Barbell Bench Press' },
        { exercise: pullup, order: 3, name: 'Pull-ups' },
        { exercise: shoulderPress, order: 4, name: 'Overhead Press' },
        { exercise: curl, order: 5, name: 'Barbell Curl' },
        { exercise: null, order: 6, name: 'Sit-ups' }, // We'll use null for exercises not in DB
      ];

      for (const ex of exercises) {
        await prisma.program_workout_exercises.create({
          data: {
            id: crypto.randomUUID(),
            workoutId: workout.id,
            exerciseOrder: ex.order,
            fixedExerciseId: ex.exercise?.id || null,
            sets: 4,
            repsMin: 10,
            repsMax: 10,
            targetRPE: 7,
            restSeconds: 90,
            notes: ex.order === 6 ? 'Perform as many reps as possible' : 'Strict form, controlled tempo',
            intensityTechniques: [],
          }
        });
      }
    }
  }

  console.log('✅ Created Arnold\'s Golden Six with 12 weeks, 36 workouts');

  // ===========================
  // LINEAR PERIODIZATION TEMPLATE
  // ===========================

  console.log('📝 Creating Linear Periodization Program...');

  const linearProgram = await prisma.program_templates.upsert({
    where: { id: 'linear-periodization-12week' },
    update: {},
    create: {
      id: 'linear-periodization-12week',
      name: 'Linear Periodization (12 Weeks)',
      description: 'Classic periodization model progressing from hypertrophy to strength to power. Customize exercises for your gym equipment. Perfect for intermediate lifters looking to peak for competition or break through plateaus.',
      createdBy: systemUser.id,
      duration: '12 weeks',
      difficulty: 'INTERMEDIATE',
      category: 'STRENGTH',
      isPublic: true,
      price: 0,
      rating: 4.9,
      ratingCount: 0,
      isActive: true,
      tags: ['Periodization', 'Customizable', 'Strength', 'Peaking', 'Science-Based'],
      programType: 'PERIODIZATION',
      athleteId: null,
      hasExerciseSlots: true,
      progressionStrategy: 'LINEAR',
      autoRegulation: true,
      updatedAt: new Date(),
    }
  });

  // Create exercise slots
  const slots = [
    { num: 1, label: 'Horizontal Push (Compound)', pattern: 'HORIZONTAL_PUSH', muscles: ['Chest', 'Triceps', 'Shoulders'] },
    { num: 2, label: 'Vertical Pull (Compound)', pattern: 'VERTICAL_PULL', muscles: ['Back', 'Biceps', 'Lats'] },
    { num: 3, label: 'Squat Pattern', pattern: 'SQUAT_PATTERN', muscles: ['Quads', 'Glutes', 'Core'] },
    { num: 4, label: 'Hinge Pattern', pattern: 'HINGE_PATTERN', muscles: ['Hamstrings', 'Glutes', 'Lower Back'] },
    { num: 5, label: 'Vertical Push (Compound)', pattern: 'VERTICAL_PUSH', muscles: ['Shoulders', 'Triceps'] },
    { num: 6, label: 'Horizontal Pull (Compound)', pattern: 'HORIZONTAL_PULL', muscles: ['Back', 'Biceps', 'Rear Delts'] },
  ];

  for (const slot of slots) {
    await prisma.exercise_slots.create({
      data: {
        id: crypto.randomUUID(),
        programId: linearProgram.id,
        slotNumber: slot.num,
        slotLabel: slot.label,
        exerciseType: 'COMPOUND',
        movementPattern: slot.pattern as any,
        muscleTargets: slot.muscles,
        equipmentOptions: ['Barbell', 'Dumbbell', 'Machine'],
        requiresSpotter: slot.pattern === 'HORIZONTAL_PUSH',
        difficultyMin: 'INTERMEDIATE',
        suggestedExerciseIds: [], // Will populate based on available exercises
        description: `Choose a ${slot.label.toLowerCase()} that fits your gym equipment`,
        isRequired: true,
      }
    });
  }

  // Phase 1: Hypertrophy (Weeks 1-4)
  const hypertrophyPhase = await prisma.program_phases.create({
    data: {
      id: crypto.randomUUID(),
      programId: linearProgram.id,
      phaseNumber: 1,
      phaseName: 'Hypertrophy Phase',
      phaseType: 'HYPERTROPHY',
      startWeek: 1,
      endWeek: 4,
      description: 'Build muscle mass with moderate weights and higher volume',
      trainingFocus: 'Volume and Time Under Tension',
      targetIntensity: '70-75%',
      targetVolume: 'HIGH',
      targetRPE: 8,
      repRangeLow: 8,
      repRangeHigh: 12,
      setsPerExercise: 4,
      restSecondsMin: 60,
      restSecondsMax: 90,
    }
  });

  // Phase 2: Strength (Weeks 5-8)
  const strengthPhase = await prisma.program_phases.create({
    data: {
      id: crypto.randomUUID(),
      programId: linearProgram.id,
      phaseNumber: 2,
      phaseName: 'Strength Phase',
      phaseType: 'STRENGTH',
      startWeek: 5,
      endWeek: 8,
      description: 'Build maximal strength with heavier weights and lower reps',
      trainingFocus: 'Maximal Strength Development',
      targetIntensity: '80-85%',
      targetVolume: 'MEDIUM',
      targetRPE: 9,
      repRangeLow: 4,
      repRangeHigh: 6,
      setsPerExercise: 5,
      restSecondsMin: 120,
      restSecondsMax: 180,
    }
  });

  // Phase 3: Power (Weeks 9-11)
  const powerPhase = await prisma.program_phases.create({
    data: {
      id: crypto.randomUUID(),
      programId: linearProgram.id,
      phaseNumber: 3,
      phaseName: 'Power Phase',
      phaseType: 'POWER',
      startWeek: 9,
      endWeek: 11,
      description: 'Peak your strength with very heavy weights',
      trainingFocus: 'Maximal Strength and Neural Efficiency',
      targetIntensity: '90-95%',
      targetVolume: 'LOW',
      targetRPE: 9,
      repRangeLow: 1,
      repRangeHigh: 3,
      setsPerExercise: 6,
      restSecondsMin: 180,
      restSecondsMax: 300,
    }
  });

  // Phase 4: Deload (Week 12)
  const deloadPhase = await prisma.program_phases.create({
    data: {
      id: crypto.randomUUID(),
      programId: linearProgram.id,
      phaseNumber: 4,
      phaseName: 'Deload Week',
      phaseType: 'DELOAD',
      startWeek: 12,
      endWeek: 12,
      description: 'Recovery week with reduced volume and intensity',
      trainingFocus: 'Recovery and Adaptation',
      targetIntensity: '60-65%',
      targetVolume: 'LOW',
      targetRPE: 6,
      repRangeLow: 8,
      repRangeHigh: 10,
      setsPerExercise: 3,
      restSecondsMin: 60,
      restSecondsMax: 90,
      deloadPercentage: 50,
    }
  });

  const phases = [
    { phase: hypertrophyPhase, weeks: [1, 2, 3, 4] },
    { phase: strengthPhase, weeks: [5, 6, 7, 8] },
    { phase: powerPhase, weeks: [9, 10, 11] },
    { phase: deloadPhase, weeks: [12] },
  ];

  // Create microcycles and workouts for each phase
  for (const { phase, weeks } of phases) {
    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      if (!week) continue;

      const microcycle = await prisma.program_microcycles.create({
        data: {
          id: crypto.randomUUID(),
          phaseId: phase.id,
          weekNumber: week,
          weekInPhase: i + 1,
          title: `Week ${week}`,
          description: week === 1 ? 'Ease into the program' :
                       week === 12 ? 'Recovery week - light weights, focus on form' :
                       'Progress from last week',
          volumeModifier: 1.0,
          intensityModifier: 1.0,
        }
      });

      // Create 4 workouts per week (Upper/Lower split, 2x per week)
      const workoutDays = [
        { day: 1, label: 'Monday - Upper Power', type: 'UPPER', slots: [1, 2, 5] },
        { day: 2, label: 'Tuesday - Lower Power', type: 'LOWER', slots: [3, 4] },
        { day: 4, label: 'Thursday - Upper Hypertrophy', type: 'UPPER', slots: [1, 6, 5] },
        { day: 5, label: 'Friday - Lower Hypertrophy', type: 'LOWER', slots: [3, 4] },
      ];

      for (const wd of workoutDays) {
        const workout = await prisma.program_workouts.create({
          data: {
            id: crypto.randomUUID(),
            microcycleId: microcycle.id,
            dayNumber: wd.day,
            dayLabel: wd.label,
            workoutType: wd.type,
            description: `${phase.phaseName} - ${wd.type === 'UPPER' ? 'Upper body' : 'Lower body'} workout`,
            estimatedDuration: 60,
          }
        });

        // Get the exercise slots for this workout
        const workoutSlots = await prisma.exercise_slots.findMany({
          where: {
            programId: linearProgram.id,
            slotNumber: { in: wd.slots }
          }
        });

        // Add exercises using slots
        for (let i = 0; i < workoutSlots.length; i++) {
          const slot = workoutSlots[i];
          if (!slot) continue;

          await prisma.program_workout_exercises.create({
            data: {
              id: crypto.randomUUID(),
              workoutId: workout.id,
              exerciseOrder: i + 1,
              slotId: slot.id,
              fixedExerciseId: null, // User will choose
              sets: phase.setsPerExercise ?? 4,
              repsMin: phase.repRangeLow ?? 8,
              repsMax: phase.repRangeHigh ?? 12,
              targetRPE: phase.targetRPE ?? 8,
              restSeconds: phase.restSecondsMin ?? 90,
              notes: phase.phaseName === 'Deload Week' ? 'Light weight, focus on recovery' : null,
              intensityTechniques: [],
            }
          });
        }
      }
    }
  }

  console.log('✅ Created Linear Periodization with 4 phases, 12 weeks, 48 workouts');

  console.log('🎉 Program templates seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding programs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
