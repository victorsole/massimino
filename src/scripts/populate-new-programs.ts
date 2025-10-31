import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

// Import templates
import aestheticsHunter from '../templates/aesthetics_hunter.json';
import iDontHaveMuchTime from '../templates/i_dont_have_much_time.json';
import wannaLoseBeerBelly from '../templates/wanna_lose_this_beer_belly.json';
import byeStressBye from '../templates/bye_stress_bye.json';
import iJustBecameADad from '../templates/i_just_became_a_dad.json';
import iJustBecameAMum from '../templates/i_just_became_a_mum.json';
import cardioWorkout from '../templates/cardio_workout.json';
import flexibilityWorkout from '../templates/flexibility_workout.json';
import balanceWorkout from '../templates/balance_workout.json';
import plyometricWorkout from '../templates/plyometric_workout.json';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== POPULATING NEW PROGRAMS ===\n');

  // Get system user (Victor)
  let systemUser = await prisma.users.findFirst({
    where: {
      email: { contains: 'vsole', mode: 'insensitive' },
    },
  });

  if (!systemUser) {
    systemUser = await prisma.users.findFirst({
      where: { role: 'ADMIN' },
    });
  }

  if (!systemUser) {
    throw new Error('No admin user found');
  }

  console.log(`Using user: ${systemUser.name} (${systemUser.email})\n`);
  const createdBy = systemUser.id;

  // LIFESTYLE PROGRAMS

  // 1. Aesthetics Hunter
  await prisma.program_templates.upsert({
    where: { id: 'aesthetics-hunter' },
    create: {
      id: 'aesthetics-hunter',
      name: aestheticsHunter.program,
      description: `Youth-focused muscle building program for ages ${aestheticsHunter.target_age_range}. ${aestheticsHunter.duration_weeks}-week journey with realistic expectations and mental health focus. Anti-steroid messaging, evidence-based training.`,
      duration: `${aestheticsHunter.duration_weeks} weeks`,
      difficulty: 'INTERMEDIATE',
      category: 'HYPERTROPHY',
      programType: 'LIFESTYLE',
      isPublic: true,
      isActive: true,
      hasExerciseSlots: false,
      rating: 0,
      ratingCount: 0,
      tags: ['youth', 'muscle building', 'aesthetics', '12 weeks', 'beginner-intermediate', 'mental health', 'realistic expectations'],
      progressionStrategy: 'LINEAR',
      templateData: aestheticsHunter as any,
      createdBy,
      updatedAt: new Date(),
    },
    update: {
      isActive: true,
      isPublic: true,
      templateData: aestheticsHunter as any,
    },
  });
  console.log('✅ Aesthetics Hunter');

  // 2. I Don't Have Much Time
  await prisma.program_templates.upsert({
    where: { id: 'i-dont-have-much-time' },
    create: {
      id: 'i-dont-have-much-time',
      name: iDontHaveMuchTime.program,
      description: `${iDontHaveMuchTime.duration_weeks}-week high-efficiency training for busy individuals. ${iDontHaveMuchTime.session_duration_minutes.min}-${iDontHaveMuchTime.session_duration_minutes.max} minute sessions, ${iDontHaveMuchTime.frequency_per_week}x/week. Bodyweight-focused, minimal equipment.`,
      duration: `${iDontHaveMuchTime.duration_weeks} weeks`,
      difficulty: 'INTERMEDIATE',
      category: 'GENERAL_FITNESS',
      programType: 'LIFESTYLE',
      isPublic: true,
      isActive: true,
      hasExerciseSlots: false,
      rating: 0,
      ratingCount: 0,
      tags: ['time-efficient', '20-30 minutes', 'bodyweight', 'home', 'busy professionals', '3 weeks', 'HIIT'],
      progressionStrategy: 'LINEAR',
      templateData: iDontHaveMuchTime as any,
      createdBy,
      updatedAt: new Date(),
    },
    update: {
      isActive: true,
      isPublic: true,
      templateData: iDontHaveMuchTime as any,
    },
  });
  console.log('✅ I Don\'t Have Much Time');

  // 3. Wanna Lose This Beer Belly
  await prisma.program_templates.upsert({
    where: { id: 'wanna-lose-beer-belly' },
    create: {
      id: 'wanna-lose-beer-belly',
      name: wannaLoseBeerBelly.program,
      description: `${wannaLoseBeerBelly.duration_weeks}-week fat loss and core strength program. Addresses alcohol impact on belly fat, nutrition-focused (80% of results), metabolic conditioning. Realistic expectations and troubleshooting.`,
      duration: `${wannaLoseBeerBelly.duration_weeks} weeks`,
      difficulty: 'INTERMEDIATE',
      category: 'FAT_LOSS',
      programType: 'LIFESTYLE',
      isPublic: true,
      isActive: true,
      hasExerciseSlots: false,
      rating: 0,
      ratingCount: 0,
      tags: ['fat loss', 'core strength', 'nutrition-focused', 'alcohol education', 'metabolic', '6 weeks', 'science-based'],
      progressionStrategy: 'LINEAR',
      templateData: wannaLoseBeerBelly as any,
      createdBy,
      updatedAt: new Date(),
    },
    update: {
      isActive: true,
      isPublic: true,
      templateData: wannaLoseBeerBelly as any,
    },
  });
  console.log('✅ Wanna Lose This Beer Belly');

  // 4. Bye Stress Bye
  await prisma.program_templates.upsert({
    where: { id: 'bye-stress-bye' },
    create: {
      id: 'bye-stress-bye',
      name: byeStressBye.program,
      description: `${byeStressBye.duration_weeks}-week stress relief and nervous system recovery. Permission over pressure, breathwork-focused, restorative yoga, ${byeStressBye.session_duration_minutes.min}-${byeStressBye.session_duration_minutes.max} minute sessions. Trauma-informed approach.`,
      duration: `${byeStressBye.duration_weeks} weeks`,
      difficulty: 'BEGINNER',
      category: 'RECOVERY',
      programType: 'LIFESTYLE',
      isPublic: true,
      isActive: true,
      hasExerciseSlots: false,
      rating: 0,
      ratingCount: 0,
      tags: ['stress relief', 'nervous system', 'breathwork', 'yoga', 'mental health', '4 weeks', 'trauma-informed', 'recovery'],
      progressionStrategy: 'LINEAR',
      templateData: byeStressBye as any,
      createdBy,
      updatedAt: new Date(),
    },
    update: {
      isActive: true,
      isPublic: true,
      templateData: byeStressBye as any,
    },
  });
  console.log('✅ Bye Stress Bye');

  // 5. I Just Became a Dad
  await prisma.program_templates.upsert({
    where: { id: 'i-just-became-a-dad' },
    create: {
      id: 'i-just-became-a-dad',
      name: iJustBecameADad.program,
      description: `${iJustBecameADad.duration_weeks}-week functional strength for new fathers. Dad-specific goals: safely lift/carry baby, car seat, stroller. Sleep deprivation adaptations, ${iJustBecameADad.session_duration_minutes.min}-${iJustBecameADad.session_duration_minutes.max} minute sessions.`,
      duration: `${iJustBecameADad.duration_weeks} weeks`,
      difficulty: 'BEGINNER',
      category: 'FUNCTIONAL',
      programType: 'LIFESTYLE',
      isPublic: true,
      isActive: true,
      hasExerciseSlots: false,
      rating: 0,
      ratingCount: 0,
      tags: ['new dad', 'functional strength', 'parenting', 'practical', '6 weeks', 'home', 'minimal equipment'],
      progressionStrategy: 'LINEAR',
      templateData: iJustBecameADad as any,
      createdBy,
      updatedAt: new Date(),
    },
    update: {
      isActive: true,
      isPublic: true,
      templateData: iJustBecameADad as any,
    },
  });
  console.log('✅ I Just Became a Dad');

  // 6. I Just Became a Mum
  await prisma.program_templates.upsert({
    where: { id: 'i-just-became-a-mum' },
    create: {
      id: 'i-just-became-a-mum',
      name: 'I Just Became a Mum - Postpartum Recovery & Strength',
      description: '6-week postpartum recovery and functional strength program for new mothers. Core rehabilitation, pelvic floor awareness, gentle return to fitness with sleep deprivation adaptations.',
      duration: '6 weeks',
      difficulty: 'BEGINNER',
      category: 'FUNCTIONAL',
      programType: 'LIFESTYLE',
      isPublic: true,
      isActive: true,
      hasExerciseSlots: false,
      rating: 0,
      ratingCount: 0,
      tags: ['new mum', 'postpartum', 'pelvic floor', 'core rehab', '6 weeks', 'home', 'gentle'],
      progressionStrategy: 'LINEAR',
      templateData: iJustBecameAMum as any,
      createdBy,
      updatedAt: new Date(),
    },
    update: {
      isActive: true,
      isPublic: true,
      templateData: iJustBecameAMum as any,
    },
  });
  console.log('✅ I Just Became a Mum');

  // COMPONENT PROGRAMS

  // 7. Cardio Workout
  await prisma.program_templates.upsert({
    where: { id: 'cardio-workout' },
    create: {
      id: 'cardio-workout',
      name: cardioWorkout.program,
      description: `${cardioWorkout.duration_weeks}-week cardiovascular conditioning program. Zone 2-4 training, ${cardioWorkout.frequency_per_week}x/week. Goal: ${cardioWorkout.goal.outcome_goal}.`,
      duration: `${cardioWorkout.duration_weeks} weeks`,
      difficulty: 'BEGINNER',
      category: 'CARDIO',
      programType: 'COMPONENT',
      isPublic: true,
      isActive: true,
      hasExerciseSlots: false,
      rating: 0,
      ratingCount: 0,
      tags: ['cardio', 'Zone 2', 'endurance', '5K', '3 weeks', 'running', 'walking', 'HIIT'],
      progressionStrategy: 'LINEAR',
      templateData: cardioWorkout as any,
      createdBy,
      updatedAt: new Date(),
    },
    update: {
      isActive: true,
      isPublic: true,
      templateData: cardioWorkout as any,
    },
  });
  console.log('✅ Cardio Workout');

  // 8. Flexibility Workout
  await prisma.program_templates.upsert({
    where: { id: 'flexibility-workout' },
    create: {
      id: 'flexibility-workout',
      name: flexibilityWorkout.program,
      description: `${flexibilityWorkout.duration_weeks}-week flexibility and mobility program. ${flexibilityWorkout.frequency_per_week}x/week, ${flexibilityWorkout.session_duration_minutes.min}-${flexibilityWorkout.session_duration_minutes.max} minutes. Goal: ${flexibilityWorkout.goal.outcome_goal}.`,
      duration: `${flexibilityWorkout.duration_weeks} weeks`,
      difficulty: 'BEGINNER',
      category: 'FLEXIBILITY',
      programType: 'COMPONENT',
      isPublic: true,
      isActive: true,
      hasExerciseSlots: false,
      rating: 0,
      ratingCount: 0,
      tags: ['flexibility', 'mobility', 'stretching', 'yoga', 'foam rolling', '3 weeks', 'recovery'],
      progressionStrategy: 'LINEAR',
      templateData: flexibilityWorkout as any,
      createdBy,
      updatedAt: new Date(),
    },
    update: {
      isActive: true,
      isPublic: true,
      templateData: flexibilityWorkout as any,
    },
  });
  console.log('✅ Flexibility Workout');

  // 9. Balance Workout
  await prisma.program_templates.upsert({
    where: { id: 'balance-workout' },
    create: {
      id: 'balance-workout',
      name: balanceWorkout.program,
      description: `${balanceWorkout.duration_weeks}-week balance and stability program. ${balanceWorkout.frequency_per_week}x/week. Goal: ${balanceWorkout.goal.outcome_goal}.`,
      duration: `${balanceWorkout.duration_weeks} weeks`,
      difficulty: 'BEGINNER',
      category: 'BALANCE',
      programType: 'COMPONENT',
      isPublic: true,
      isActive: true,
      hasExerciseSlots: false,
      rating: 0,
      ratingCount: 0,
      tags: ['balance', 'stability', 'proprioception', 'injury prevention', '2 weeks', 'functional'],
      progressionStrategy: 'LINEAR',
      templateData: balanceWorkout as any,
      createdBy,
      updatedAt: new Date(),
    },
    update: {
      isActive: true,
      isPublic: true,
      templateData: balanceWorkout as any,
    },
  });
  console.log('✅ Balance Workout');

  // 10. Plyometric Workout
  await prisma.program_templates.upsert({
    where: { id: 'plyometric-workout' },
    create: {
      id: 'plyometric-workout',
      name: plyometricWorkout.program,
      description: `${plyometricWorkout.duration_weeks}-week plyometric and power development program. ${plyometricWorkout.frequency_per_week}x/week. Goal: ${plyometricWorkout.goal.outcome_goal}.`,
      duration: `${plyometricWorkout.duration_weeks} weeks`,
      difficulty: 'INTERMEDIATE',
      category: 'POWER',
      programType: 'COMPONENT',
      isPublic: true,
      isActive: true,
      hasExerciseSlots: false,
      rating: 0,
      ratingCount: 0,
      tags: ['plyometrics', 'power', 'explosiveness', 'jumping', '2 weeks', 'athletic'],
      progressionStrategy: 'LINEAR',
      templateData: plyometricWorkout as any,
      createdBy,
      updatedAt: new Date(),
    },
    update: {
      isActive: true,
      isPublic: true,
      templateData: plyometricWorkout as any,
    },
  });
  console.log('✅ Plyometric Workout');

  console.log('\n=== SUMMARY ===');
  console.log('Created/Updated 10 new programs:');
  console.log('  - 6 LIFESTYLE programs');
  console.log('  - 4 COMPONENT programs');
  console.log('\nAll programs are now active and public!');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
