/**
 * HIIT and Hyrox Programs Seed
 * Creates the HIIT Workout and Hyrox Training program templates
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient, PhaseType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🏋️ Seeding HIIT and Hyrox Program Templates...');

  // Get system user
  const systemUser = await prisma.users.findFirst({
    where: { email: 'system@massimino.fitness' }
  });

  if (!systemUser) {
    throw new Error('System user not found. Run periodization-seed.ts first.');
  }

  // Load JSON templates
  const templatesDir = path.join(process.cwd(), 'src', 'templates');

  // 1. HIIT Workout
  console.log('📝 Creating HIIT Workout Program...');
  const hiitJson = JSON.parse(fs.readFileSync(path.join(templatesDir, 'hiit_workout.json'), 'utf-8'));

  await prisma.program_templates.upsert({
    where: { id: 'hiit-workout' },
    update: {
      templateData: hiitJson,
      updatedAt: new Date(),
    },
    create: {
      id: 'hiit-workout',
      name: 'HIIT Workout',
      description: 'High-Intensity Interval Training program featuring Tabata, EMOM, AMRAP, ladder intervals, and pyramid training. Improve cardiovascular capacity and metabolic conditioning through maximum effort intervals. Time-efficient workouts that deliver results in under 30 minutes.',
      createdBy: systemUser.id,
      duration: '4 weeks',
      difficulty: 'INTERMEDIATE',
      category: 'CONDITIONING',
      isPublic: true,
      price: 0,
      rating: 5.0,
      ratingCount: 0,
      isActive: true,
      tags: ['HIIT', 'Cardio', 'Fat Loss', 'Conditioning', 'Tabata', 'EMOM', 'AMRAP', 'Bodyweight', 'Home Workout'],
      programType: 'COMPONENT',
      hasExerciseSlots: false,
      progressionStrategy: 'LINEAR',
      autoRegulation: false,
      templateData: hiitJson,
      updatedAt: new Date(),
    }
  });

  // Delete existing phases and recreate
  await prisma.program_phases.deleteMany({ where: { programId: 'hiit-workout' } });
  await prisma.program_phases.createMany({
    data: [
      {
        programId: 'hiit-workout',
        phaseNumber: 1,
        phaseName: 'Foundation',
        phaseType: PhaseType.ENDURANCE,
        startWeek: 1,
        endWeek: 1,
        description: 'Learn the formats, establish baseline capacity',
        targetIntensity: '80-85%',
        targetVolume: 'MEDIUM',
        repRangeLow: 20,
        repRangeHigh: 30,
        setsPerExercise: 4,
        restSecondsMin: 30,
        restSecondsMax: 60,
      },
      {
        programId: 'hiit-workout',
        phaseNumber: 2,
        phaseName: 'Build',
        phaseType: PhaseType.ENDURANCE,
        startWeek: 2,
        endWeek: 2,
        description: 'Increase work intervals, decrease rest',
        targetIntensity: '85-90%',
        targetVolume: 'HIGH',
        repRangeLow: 20,
        repRangeHigh: 30,
        setsPerExercise: 6,
        restSecondsMin: 20,
        restSecondsMax: 40,
      },
      {
        programId: 'hiit-workout',
        phaseNumber: 3,
        phaseName: 'Intensity',
        phaseType: PhaseType.POWER,
        startWeek: 3,
        endWeek: 3,
        description: 'Add complexity with combined movements',
        targetIntensity: '90-95%',
        targetVolume: 'HIGH',
        repRangeLow: 15,
        repRangeHigh: 25,
        setsPerExercise: 8,
        restSecondsMin: 10,
        restSecondsMax: 30,
      },
      {
        programId: 'hiit-workout',
        phaseNumber: 4,
        phaseName: 'Test',
        phaseType: PhaseType.REALIZATION,
        startWeek: 4,
        endWeek: 4,
        description: 'Test limits and measure improvement',
        targetIntensity: '95-100%',
        targetVolume: 'HIGH',
        repRangeLow: 10,
        repRangeHigh: 20,
        setsPerExercise: 8,
        restSecondsMin: 10,
        restSecondsMax: 20,
      },
    ]
  });
  console.log('✅ Created HIIT Workout Program with phases');

  // 2. Hyrox Training
  console.log('📝 Creating Hyrox Training Program...');
  const hyroxJson = JSON.parse(fs.readFileSync(path.join(templatesDir, 'hyrox_training.json'), 'utf-8'));

  await prisma.program_templates.upsert({
    where: { id: 'hyrox-training' },
    update: {
      templateData: hyroxJson,
      updatedAt: new Date(),
    },
    create: {
      id: 'hyrox-training',
      name: 'Hyrox Training Program',
      description: 'Complete preparation for Hyrox fitness racing. Train all 8 stations: SkiErg (1000m), Sled Push (50m), Sled Pull (50m), Burpee Broad Jumps (80m), Rowing (1000m), Farmers Carry (200m), Sandbag Lunges (100m), and Wall Balls (100 reps). Build running endurance for 8km total distance while developing functional strength. Based on the official Hyrox race format from hyrox.com.',
      createdBy: systemUser.id,
      duration: '8 weeks',
      difficulty: 'ADVANCED',
      category: 'ATHLETIC_PERFORMANCE',
      isPublic: true,
      price: 0,
      rating: 5.0,
      ratingCount: 0,
      isActive: true,
      tags: ['Hyrox', 'Functional Fitness', 'Endurance', 'Running', 'CrossFit-Style', 'Competition', 'Hybrid Training', 'SkiErg', 'Rowing', 'Sled Work'],
      programType: 'COMPONENT',
      hasExerciseSlots: false,
      progressionStrategy: 'LINEAR',
      autoRegulation: false,
      templateData: hyroxJson,
      updatedAt: new Date(),
    }
  });

  // Delete existing phases and recreate
  await prisma.program_phases.deleteMany({ where: { programId: 'hyrox-training' } });
  await prisma.program_phases.createMany({
    data: [
      {
        programId: 'hyrox-training',
        phaseNumber: 1,
        phaseName: 'Foundation',
        phaseType: PhaseType.ENDURANCE,
        startWeek: 1,
        endWeek: 2,
        description: 'Build station familiarity and running base at 60-70% race intensity',
        targetIntensity: '60-70%',
        targetVolume: 'MEDIUM',
        repRangeLow: 10,
        repRangeHigh: 15,
        setsPerExercise: 4,
        restSecondsMin: 60,
        restSecondsMax: 120,
      },
      {
        programId: 'hyrox-training',
        phaseNumber: 2,
        phaseName: 'Build',
        phaseType: PhaseType.STRENGTH,
        startWeek: 3,
        endWeek: 4,
        description: 'Increase to 75-85% race weight/intensity, practice race simulations',
        targetIntensity: '75-85%',
        targetVolume: 'HIGH',
        repRangeLow: 8,
        repRangeHigh: 12,
        setsPerExercise: 5,
        restSecondsMin: 60,
        restSecondsMax: 90,
      },
      {
        programId: 'hyrox-training',
        phaseNumber: 3,
        phaseName: 'Race Prep',
        phaseType: PhaseType.POWER,
        startWeek: 5,
        endWeek: 6,
        description: 'Full race weights, reduce rest periods, improve transitions',
        targetIntensity: '85-95%',
        targetVolume: 'HIGH',
        repRangeLow: 6,
        repRangeHigh: 10,
        setsPerExercise: 6,
        restSecondsMin: 30,
        restSecondsMax: 60,
      },
      {
        programId: 'hyrox-training',
        phaseNumber: 4,
        phaseName: 'Peak & Taper',
        phaseType: PhaseType.REALIZATION,
        startWeek: 7,
        endWeek: 8,
        description: 'Peak training week 7, taper week 8 for race day freshness',
        targetIntensity: '90-100%',
        targetVolume: 'LOW',
        repRangeLow: 4,
        repRangeHigh: 8,
        setsPerExercise: 4,
        restSecondsMin: 60,
        restSecondsMax: 120,
      },
    ]
  });
  console.log('✅ Created Hyrox Training Program with phases');

  console.log('🎉 HIIT and Hyrox programs seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding HIIT/Hyrox programs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
