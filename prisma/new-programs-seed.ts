/**
 * New Programs Seed
 * Creates the new program templates: Verdabros Ski, GGF Ballet, Post-Christmas Rentree
 */

import { PrismaClient, PhaseType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🏋️ Seeding New Program Templates...');

  // Get system user
  const systemUser = await prisma.users.findFirst({
    where: { email: 'system@massimino.fitness' }
  });

  if (!systemUser) {
    throw new Error('System user not found. Run periodization-seed.ts first.');
  }

  // Load JSON templates
  const templatesDir = path.join(process.cwd(), 'src', 'templates');

  // 1. Verdabros Pro Ski Fitness
  console.log('📝 Creating Verdabros Pro Ski Fitness Program...');
  const verdabrosJson = JSON.parse(fs.readFileSync(path.join(templatesDir, 'verdabros_ski_fitness.json'), 'utf-8'));

  await prisma.program_templates.upsert({
    where: { id: 'verdabros-ski-fitness' },
    update: {
      templateData: verdabrosJson,
      updatedAt: new Date(),
    },
    create: {
      id: 'verdabros-ski-fitness',
      name: 'The Verdabros Pro Ski Fitness Workout',
      description: 'Train like Lucas, Oliver & Anton Verdaguer Forn - Spanish freestyle skiing champions from the tiny Pyrenean village of Meranges. This program builds the explosive power, core stability, and single-leg strength essential for mogul skiing and aerial maneuvers. Perfect for skiers, snowboarders, and any athlete seeking explosive performance.',
      createdBy: systemUser.id,
      duration: '8 weeks',
      difficulty: 'INTERMEDIATE',
      category: 'ATHLETIC_PERFORMANCE',
      isPublic: true,
      price: 0,
      rating: 5.0,
      ratingCount: 0,
      isActive: true,
      tags: ['Skiing', 'Moguls', 'Freestyle', 'Athletic Performance', 'Plyometrics', 'Core Stability', 'Balance', 'Explosive Power', 'Winter Sports'],
      programType: 'ATHLETE',
      hasExerciseSlots: false,
      progressionStrategy: 'LINEAR',
      autoRegulation: false,
      templateData: verdabrosJson,
      updatedAt: new Date(),
    }
  });

  // Delete existing phases and recreate
  await prisma.program_phases.deleteMany({ where: { programId: 'verdabros-ski-fitness' } });
  await prisma.program_phases.createMany({
    data: [
      {
        programId: 'verdabros-ski-fitness',
        phaseNumber: 1,
        phaseName: 'Foundation',
        phaseType: PhaseType.HYPERTROPHY,
        startWeek: 1,
        endWeek: 2,
        description: 'Build base strength and movement quality',
        targetIntensity: '65-70%',
        targetVolume: 'MEDIUM',
        repRangeLow: 10,
        repRangeHigh: 12,
        setsPerExercise: 3,
        restSecondsMin: 60,
        restSecondsMax: 90,
      },
      {
        programId: 'verdabros-ski-fitness',
        phaseNumber: 2,
        phaseName: 'Power Development',
        phaseType: PhaseType.POWER,
        startWeek: 3,
        endWeek: 5,
        description: 'Explosive power and reactive strength',
        targetIntensity: '75-85%',
        targetVolume: 'MEDIUM',
        repRangeLow: 5,
        repRangeHigh: 8,
        setsPerExercise: 4,
        restSecondsMin: 90,
        restSecondsMax: 120,
      },
      {
        programId: 'verdabros-ski-fitness',
        phaseNumber: 3,
        phaseName: 'Competition Prep',
        phaseType: PhaseType.REALIZATION,
        startWeek: 6,
        endWeek: 8,
        description: 'Sport-specific conditioning and peaking',
        targetIntensity: '80-90%',
        targetVolume: 'LOW',
        repRangeLow: 3,
        repRangeHigh: 6,
        setsPerExercise: 4,
        restSecondsMin: 120,
        restSecondsMax: 180,
      },
    ]
  });
  console.log('✅ Created Verdabros Pro Ski Fitness Program with phases');

  // 2. GGF Ballet Fitness
  console.log('📝 Creating GGF Fitness Workout for Ballet Dancers...');
  const ggfJson = JSON.parse(fs.readFileSync(path.join(templatesDir, 'ggf_ballet_fitness.json'), 'utf-8'));

  await prisma.program_templates.upsert({
    where: { id: 'ggf-ballet-fitness' },
    update: {
      templateData: ggfJson,
      updatedAt: new Date(),
    },
    create: {
      id: 'ggf-ballet-fitness',
      name: 'The GGF Fitness Workout for Ballet Dancers',
      description: 'A professional ballet dancer\'s approach to strength training. Build strength without bulk, improve balance and control, and prevent injuries while maintaining the flexibility dancers need. Based on the training principles of Gabriel Garcia Forn. Perfect for dancers, gymnasts, and anyone seeking elegant strength and body control.',
      createdBy: systemUser.id,
      duration: '8 weeks',
      difficulty: 'INTERMEDIATE',
      category: 'ATHLETIC_PERFORMANCE',
      isPublic: true,
      price: 0,
      rating: 5.0,
      ratingCount: 0,
      isActive: true,
      tags: ['Ballet', 'Dance', 'Flexibility', 'Core Strength', 'Balance', 'Toning', 'Injury Prevention', 'Artistic Athletes', 'Gymnastics'],
      programType: 'ATHLETE',
      hasExerciseSlots: false,
      progressionStrategy: 'LINEAR',
      autoRegulation: false,
      templateData: ggfJson,
      updatedAt: new Date(),
    }
  });

  // Delete existing phases and recreate
  await prisma.program_phases.deleteMany({ where: { programId: 'ggf-ballet-fitness' } });
  await prisma.program_phases.createMany({
    data: [
      {
        programId: 'ggf-ballet-fitness',
        phaseNumber: 1,
        phaseName: 'Activation & Foundation',
        phaseType: PhaseType.HYPERTROPHY,
        startWeek: 1,
        endWeek: 2,
        description: 'Wake up stabilizers, establish movement patterns',
        targetIntensity: '60-65%',
        targetVolume: 'MEDIUM',
        repRangeLow: 12,
        repRangeHigh: 15,
        setsPerExercise: 3,
        restSecondsMin: 45,
        restSecondsMax: 60,
      },
      {
        programId: 'ggf-ballet-fitness',
        phaseNumber: 2,
        phaseName: 'Strength Endurance',
        phaseType: PhaseType.ENDURANCE,
        startWeek: 3,
        endWeek: 5,
        description: 'Build muscular endurance for long rehearsals and performances',
        targetIntensity: '65-70%',
        targetVolume: 'HIGH',
        repRangeLow: 15,
        repRangeHigh: 20,
        setsPerExercise: 3,
        restSecondsMin: 30,
        restSecondsMax: 45,
      },
      {
        programId: 'ggf-ballet-fitness',
        phaseNumber: 3,
        phaseName: 'Performance Peak',
        phaseType: PhaseType.POWER,
        startWeek: 6,
        endWeek: 8,
        description: 'Power, control, and movement quality',
        targetIntensity: '70-75%',
        targetVolume: 'MEDIUM',
        repRangeLow: 10,
        repRangeHigh: 12,
        setsPerExercise: 3,
        restSecondsMin: 45,
        restSecondsMax: 60,
      },
    ]
  });
  console.log('✅ Created GGF Fitness Workout for Ballet Dancers with phases');

  // 3. Post Christmas Holidays Rentree
  console.log('📝 Creating Post Christmas Holidays Rentree Workout...');
  const christmasJson = JSON.parse(fs.readFileSync(path.join(templatesDir, 'post_christmas_rentree.json'), 'utf-8'));

  await prisma.program_templates.upsert({
    where: { id: 'post-christmas-rentree' },
    update: {
      templateData: christmasJson,
      updatedAt: new Date(),
    },
    create: {
      id: 'post-christmas-rentree',
      name: 'Post Christmas Holidays Rentree Workout',
      description: 'Your New Year resolution made real. This 6-week program is designed specifically for those returning to fitness after the holiday season. Progressive full-body workouts that burn fat, rebuild muscle, and establish sustainable habits - without burning you out. Perfect for January resolutioners and anyone getting back on track after a break.',
      createdBy: systemUser.id,
      duration: '6 weeks',
      difficulty: 'BEGINNER',
      category: 'FAT_LOSS',
      isPublic: true,
      price: 0,
      rating: 5.0,
      ratingCount: 0,
      isActive: true,
      tags: ['Fat Loss', 'Muscle Building', 'New Year', 'Beginner Friendly', 'Full Body', 'Metabolic Training', 'Lifestyle', 'Return to Fitness', 'Weight Loss'],
      programType: 'LIFESTYLE',
      hasExerciseSlots: false,
      progressionStrategy: 'LINEAR',
      autoRegulation: false,
      templateData: christmasJson,
      updatedAt: new Date(),
    }
  });

  // Delete existing phases and recreate
  await prisma.program_phases.deleteMany({ where: { programId: 'post-christmas-rentree' } });
  await prisma.program_phases.createMany({
    data: [
      {
        programId: 'post-christmas-rentree',
        phaseNumber: 1,
        phaseName: 'Re-Entry',
        phaseType: PhaseType.HYPERTROPHY,
        startWeek: 1,
        endWeek: 2,
        description: 'Ease back into training, rebuild movement patterns',
        targetIntensity: '60-65%',
        targetVolume: 'MEDIUM',
        repRangeLow: 12,
        repRangeHigh: 15,
        setsPerExercise: 3,
        restSecondsMin: 60,
        restSecondsMax: 90,
      },
      {
        programId: 'post-christmas-rentree',
        phaseNumber: 2,
        phaseName: 'Build Up',
        phaseType: PhaseType.HYPERTROPHY,
        startWeek: 3,
        endWeek: 4,
        description: 'Increase intensity, add complexity',
        targetIntensity: '70-75%',
        targetVolume: 'HIGH',
        repRangeLow: 10,
        repRangeHigh: 12,
        setsPerExercise: 4,
        restSecondsMin: 60,
        restSecondsMax: 90,
      },
      {
        programId: 'post-christmas-rentree',
        phaseNumber: 3,
        phaseName: 'Push Through',
        phaseType: PhaseType.STRENGTH,
        startWeek: 5,
        endWeek: 6,
        description: 'Maximum effort, fat loss focus',
        targetIntensity: '75-80%',
        targetVolume: 'HIGH',
        repRangeLow: 8,
        repRangeHigh: 12,
        setsPerExercise: 4,
        restSecondsMin: 60,
        restSecondsMax: 90,
      },
    ]
  });
  console.log('✅ Created Post Christmas Holidays Rentree Workout with phases');

  console.log('🎉 New programs seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding new programs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
