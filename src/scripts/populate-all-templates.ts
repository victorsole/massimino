import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import cbumData from '../templates/cbum.json';
import ronnieData from '../templates/ronnie_coleman_volume.json';
import fatLossData from '../templates/fat-loss.json';
import muscleGainData from '../templates/muscle-gain.json';
import performanceData from '../templates/performance.json';
import microMesocyclesData from '../templates/micro_mesocycles.json';

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
 * Populate CBum's program
 */
async function populateCBum() {
  console.log('\n=== POPULATING CHRIS BUMSTEAD (CBUM) PROGRAM ===\n');

  const athleteData = cbumData.athlete_info;
  const programData = cbumData.program_structure;

  // Check if legendary athlete exists
  let athlete = await prisma.legendary_athletes.findFirst({
    where: { slug: 'chris-bumstead' },
  });

  if (!athlete) {
    athlete = await prisma.legendary_athletes.create({
      data: {
        id: nanoid(),
        name: athleteData.name,
        slug: 'chris-bumstead',
        yearsActive: '2017-Present',
        eraLabel: 'Modern Era (2019-2024)',
        discipline: 'BODYBUILDING',
        achievements: [athleteData.achievements],
        bio: `${athleteData.nickname} - ${athleteData.training_philosophy}`,
        trainingPhilosophy: athleteData.training_philosophy,
        imageUrl: null,
        videoUrl: null,
        nationality: 'Canadian',
        birthYear: 1995,
      },
    });
    console.log(`✅ Created legendary athlete: ${athlete.name}`);
  }

  // Create or update program template
  const programId = 'cbum-classic-physique';
  let program = await prisma.program_templates.findUnique({
    where: { id: programId },
  });

  if (!program) {
    program = await prisma.program_templates.create({
      data: {
        id: programId,
        name: cbumData.template_name,
        description: `${athleteData.achievements}. ${athleteData.training_philosophy}. ${programData.split_type} with ${programData.frequency}.`,
        athleteId: athlete.id,
        duration: '8 days per cycle',
        difficulty: 'ADVANCED',
        category: 'HYPERTROPHY',
        programType: 'ATHLETE',
        isPublic: true,
        isActive: true,
        hasExerciseSlots: false,
        rating: 0,
        ratingCount: 0,
        tags: ['8-day split', 'high volume', 'classic physique', 'time under tension', 'advanced'],
        progressionStrategy: 'LINEAR',
        createdBy: (global as any).SYSTEM_USER_ID,
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Created program: ${program.name}`);
  }

  // Exercise mapping for CBum's program
  const cbumExerciseMap: Record<string, string[]> = {
    // Leg Day 1
    'leg-extensions-warmup': ['Leg Extension', 'Machine Leg Extension'],
    'squats': ['Barbell Squat', 'Back Squat', 'Barbell Back Squat'],
    'hack-squats': ['Hack Squat', 'Machine Hack Squat'],
    'leg-press': ['Leg Press', '45 Degree Leg Press'],
    'leg-extensions': ['Leg Extension', 'Machine Leg Extension'],
    'walking-lunges': ['Walking Lunge', 'Dumbbell Walking Lunge'],
    'lying-leg-curls': ['Lying Leg Curl', 'Lying Hamstring Curl'],
    'romanian-deadlifts': ['Romanian Deadlift', 'RDL', 'Dumbbell Romanian Deadlift'],
    'seated-leg-curls': ['Seated Leg Curl', 'Seated Hamstring Curl'],
    'standing-calf-raises': ['Standing Calf Raise', 'Machine Standing Calf Raise'],
    'seated-calf-raises': ['Seated Calf Raise', 'Machine Seated Calf Raise'],

    // Push Day 1
    'incline-barbell-press': ['Incline Barbell Bench Press', 'Incline Bench Press'],
    'flat-dumbbell-press': ['Dumbbell Bench Press', 'Flat Dumbbell Press'],
    'dips': ['Dip', 'Chest Dip', 'Weighted Dip'],
    'incline-dumbbell-flyes': ['Incline Dumbbell Fly', 'Incline Fly'],
    'cable-crossovers': ['Cable Crossover', 'Cable Fly', 'Standing Cable Crossover'],
    'overhead-press': ['Overhead Press', 'Military Press', 'Barbell Shoulder Press'],
    'lateral-raises': ['Lateral Raise', 'Dumbbell Lateral Raise'],
    'rear-delt-flyes': ['Reverse Fly', 'Bent Over Reverse Fly', 'Rear Delt Fly'],
    'overhead-tricep-extension': ['Overhead Tricep Extension', 'Dumbbell Overhead Tricep Extension'],
    'rope-pushdowns': ['Tricep Pushdown', 'Cable Tricep Pushdown', 'Rope Pushdown'],
    'skull-crushers': ['Skullcrusher', 'Lying Tricep Extension', 'EZ Bar Skullcrusher'],

    // Pull Day 1
    'deadlifts': ['Barbell Deadlift', 'Deadlift', 'Conventional Deadlift'],
    'barbell-rows': ['Barbell Row', 'Bent Over Barbell Row', 'Bent Over Row'],
    'pull-ups': ['Pull Up', 'Wide Grip Pull Up'],
    'lat-pulldowns': ['Lat Pulldown', 'Wide Grip Lat Pulldown'],
    't-bar-rows': ['T-Bar Row', 'T Bar Row'],
    'face-pulls': ['Face Pull', 'Cable Face Pull'],
    'shrugs': ['Barbell Shrug', 'Dumbbell Shrug'],
    'barbell-curls': ['Barbell Curl', 'Standing Barbell Curl'],
    'hammer-curls': ['Hammer Curl', 'Dumbbell Hammer Curl'],
    'preacher-curls': ['Preacher Curl', 'EZ Bar Preacher Curl'],

    // Additional variations
    'dumbbell-press': ['Dumbbell Bench Press', 'Dumbbell Press'],
    'machine-flyes': ['Machine Fly', 'Pec Deck', 'Machine Chest Fly'],
    'arnold-press': ['Arnold Press', 'Dumbbell Arnold Press'],
    'front-raises': ['Front Raise', 'Dumbbell Front Raise'],
    'cable-lateral-raises': ['Cable Lateral Raise'],
    'close-grip-bench': ['Close Grip Bench Press'],
    'dumbbell-kickbacks': ['Tricep Kickback', 'Dumbbell Kickback'],
    'one-arm-rows': ['One Arm Dumbbell Row', 'Single Arm Row'],
    'cable-rows': ['Seated Cable Row', 'Cable Row'],
    'concentration-curls': ['Concentration Curl', 'Dumbbell Concentration Curl'],
  };

  // Find exercises with media priority
  const exerciseMapping: Record<string, string> = {};
  let withMediaCount = 0;

  console.log('\n=== Searching for CBum exercises (prioritizing media) ===');
  for (const [key, searchTerms] of Object.entries(cbumExerciseMap)) {
    const match = await findExerciseWithMedia(searchTerms);
    if (match) {
      exerciseMapping[key] = match.id;
      if (match.hasMedia) withMediaCount++;
    }
  }

  console.log(`\n📊 Found ${Object.keys(exerciseMapping).length}/${Object.keys(cbumExerciseMap).length} exercises`);
  console.log(`📸 ${withMediaCount} exercises have media (videos/images)`);

  return { program, exerciseMapping, athlete };
}

/**
 * Populate Fat Loss program
 */
async function populateFatLoss() {
  console.log('\n=== POPULATING FAT LOSS PROGRAM ===\n');

  const programId = 'nasm-fat-loss-program';
  let program = await prisma.program_templates.findUnique({
    where: { id: programId },
  });

  if (!program) {
    program = await prisma.program_templates.create({
      data: {
        id: programId,
        name: fatLossData.program_name,
        description: fatLossData.description,
        athleteId: null,
        duration: fatLossData.duration,
        difficulty: 'BEGINNER',
        category: 'FAT_LOSS',
        programType: 'PERIODIZATION',
        isPublic: true,
        isActive: true,
        hasExerciseSlots: false,
        rating: 0,
        ratingCount: 0,
        tags: ['NASM', 'OPT Model', 'fat loss', 'metabolic', 'periodization'],
        progressionStrategy: 'BLOCK',
        createdBy: (global as any).SYSTEM_USER_ID,
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Created program: ${program.name}`);
  }

  // Common exercises in fat loss programs
  const fatLossExerciseMap: Record<string, string[]> = {
    'floor-bridge': ['Glute Bridge', 'Hip Bridge', 'Floor Bridge'],
    'floor-cobra': ['Cobra', 'Floor Cobra', 'Prone Cobra'],
    'ball-squat': ['Ball Squat', 'Stability Ball Squat', 'Wall Ball Squat'],
    'step-up': ['Step Up', 'Box Step Up', 'Dumbbell Step Up'],
    'ball-dumbbell-chest-press': ['Dumbbell Bench Press', 'Stability Ball Dumbbell Press'],
    'standing-cable-row': ['Standing Cable Row', 'Cable Row'],
    'single-leg-squat': ['Single Leg Squat', 'Bulgarian Split Squat', 'Pistol Squat'],
    'single-leg-deadlift': ['Single Leg Deadlift', 'Single Leg RDL'],
    'ball-push-up': ['Push Up', 'Stability Ball Push Up'],
    'standing-row': ['Standing Row', 'Cable Row', 'Band Row'],
    'squat': ['Bodyweight Squat', 'Air Squat', 'Barbell Squat'],
    'bench-press': ['Barbell Bench Press', 'Bench Press'],
    'lat-pulldown': ['Lat Pulldown', 'Wide Grip Lat Pulldown'],
    'overhead-press': ['Overhead Press', 'Military Press', 'Shoulder Press'],
    'leg-press': ['Leg Press', '45 Degree Leg Press'],
    'leg-curl': ['Leg Curl', 'Lying Leg Curl', 'Seated Leg Curl'],
    'bicep-curl': ['Bicep Curl', 'Dumbbell Curl', 'Barbell Curl'],
    'tricep-pushdown': ['Tricep Pushdown', 'Cable Tricep Pushdown'],
    'plank': ['Plank', 'Front Plank'],
    'bicycle-crunch': ['Bicycle Crunch'],
    'mountain-climber': ['Mountain Climber'],
    'burpee': ['Burpee'],
    'jumping-jack': ['Jumping Jack'],
    'high-knee': ['High Knees', 'High Knee Run'],
  };

  const exerciseMapping: Record<string, string> = {};
  let withMediaCount = 0;

  console.log('\n=== Searching for Fat Loss exercises (prioritizing media) ===');
  for (const [key, searchTerms] of Object.entries(fatLossExerciseMap)) {
    const match = await findExerciseWithMedia(searchTerms);
    if (match) {
      exerciseMapping[key] = match.id;
      if (match.hasMedia) withMediaCount++;
    }
  }

  console.log(`\n📊 Found ${Object.keys(exerciseMapping).length}/${Object.keys(fatLossExerciseMap).length} exercises`);
  console.log(`📸 ${withMediaCount} exercises have media (videos/images)`);

  return { program, exerciseMapping };
}

/**
 * Populate Muscle Gain program
 */
async function populateMuscleGain() {
  console.log('\n=== POPULATING MUSCLE GAIN PROGRAM ===\n');

  const programId = 'nasm-muscle-gain-program';
  let program = await prisma.program_templates.findUnique({
    where: { id: programId },
  });

  if (!program) {
    program = await prisma.program_templates.create({
      data: {
        id: programId,
        name: muscleGainData.program_name,
        description: muscleGainData.description,
        athleteId: null,
        duration: muscleGainData.duration,
        difficulty: 'INTERMEDIATE',
        category: 'HYPERTROPHY',
        programType: 'PERIODIZATION',
        isPublic: true,
        isActive: true,
        hasExerciseSlots: false,
        rating: 0,
        ratingCount: 0,
        tags: ['NASM', 'OPT Model', 'muscle gain', 'hypertrophy', 'periodization'],
        progressionStrategy: 'BLOCK',
        createdBy: (global as any).SYSTEM_USER_ID,
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Created program: ${program.name}`);
  }

  // Reuse exercise mapping from fat loss (similar exercises)
  return await populateFatLoss();
}

/**
 * Populate Performance program
 */
async function populatePerformance() {
  console.log('\n=== POPULATING PERFORMANCE PROGRAM ===\n');

  const programId = 'nasm-performance-program';
  let program = await prisma.program_templates.findUnique({
    where: { id: programId },
  });

  if (!program) {
    program = await prisma.program_templates.create({
      data: {
        id: programId,
        name: performanceData.program_name,
        description: performanceData.description,
        athleteId: null,
        duration: performanceData.duration,
        difficulty: 'ADVANCED',
        category: 'PERFORMANCE',
        programType: 'PERIODIZATION',
        isPublic: true,
        isActive: true,
        hasExerciseSlots: false,
        rating: 0,
        ratingCount: 0,
        tags: ['NASM', 'OPT Model', 'performance', 'power', 'periodization'],
        progressionStrategy: 'BLOCK',
        createdBy: (global as any).SYSTEM_USER_ID,
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Created program: ${program.name}`);
  }

  const performanceExerciseMap: Record<string, string[]> = {
    // Power exercises
    'box-jump': ['Box Jump', 'Plyometric Box Jump'],
    'medicine-ball-throw': ['Medicine Ball Slam', 'Medicine Ball Chest Pass', 'Med Ball Throw'],
    'squat-jump': ['Squat Jump', 'Jump Squat'],
    'power-clean': ['Power Clean', 'Hang Power Clean', 'Barbell Power Clean'],
    'push-press': ['Push Press', 'Barbell Push Press'],
    'kettlebell-swing': ['Kettlebell Swing', 'Russian Kettlebell Swing'],
    'sled-push': ['Sled Push', 'Prowler Push'],
    'battle-ropes': ['Battle Rope', 'Battle Ropes Wave'],
    'agility-ladder': ['Agility Ladder Drill', 'Ladder Drill'],
    'cone-drill': ['Cone Drill', '5-10-5 Drill', 'Pro Agility'],
    // Strength exercises
    'back-squat': ['Barbell Squat', 'Back Squat', 'Barbell Back Squat'],
    'front-squat': ['Front Squat', 'Barbell Front Squat'],
    'deadlift': ['Barbell Deadlift', 'Deadlift', 'Conventional Deadlift'],
    'bench-press': ['Barbell Bench Press', 'Bench Press'],
    'overhead-press': ['Overhead Press', 'Military Press', 'Shoulder Press'],
  };

  const exerciseMapping: Record<string, string> = {};
  let withMediaCount = 0;

  console.log('\n=== Searching for Performance exercises (prioritizing media) ===');
  for (const [key, searchTerms] of Object.entries(performanceExerciseMap)) {
    const match = await findExerciseWithMedia(searchTerms);
    if (match) {
      exerciseMapping[key] = match.id;
      if (match.hasMedia) withMediaCount++;
    }
  }

  console.log(`\n📊 Found ${Object.keys(exerciseMapping).length}/${Object.keys(performanceExerciseMap).length} exercises`);
  console.log(`📸 ${withMediaCount} exercises have media (videos/images)`);

  return { program, exerciseMapping };
}

/**
 * Main function
 */
async function main() {
  console.log('=================================================');
  console.log('  MASSIMINO TEMPLATES POPULATION SCRIPT');
  console.log('  Prioritizing exercises with media (video/images)');
  console.log('=================================================\n');

  try {
    // Get or create system user for template creation
    let systemUser = await prisma.users.findFirst({
      where: {
        email: { contains: 'vsole', mode: 'insensitive' },
      },
    });

    if (!systemUser) {
      console.log('❌ Could not find Victor\'s user. Using first ADMIN user...');
      systemUser = await prisma.users.findFirst({
        where: { role: 'ADMIN' },
      });
    }

    if (!systemUser) {
      throw new Error('No admin user found. Please ensure Victor\'s account exists.');
    }

    console.log(`✅ Using user: ${systemUser.name} (${systemUser.email}) as template creator\n`);

    // Store system user ID globally
    (global as any).SYSTEM_USER_ID = systemUser.id;

    // Populate all programs
    const cbum = await populateCBum();
    const fatLoss = await populateFatLoss();
    const muscleGain = await populateMuscleGain();
    const performance = await populatePerformance();

    console.log('\n=================================================');
    console.log('✅ POPULATION COMPLETE');
    console.log('=================================================\n');

    console.log('📋 Summary:');
    console.log(`  - CBum Program: ${Object.keys(cbum.exerciseMapping).length} exercises mapped`);
    console.log(`  - Fat Loss: ${Object.keys(fatLoss.exerciseMapping).length} exercises mapped`);
    console.log(`  - Muscle Gain: ${Object.keys(muscleGain.exerciseMapping).length} exercises mapped`);
    console.log(`  - Performance: ${Object.keys(performance.exerciseMapping).length} exercises mapped`);

    console.log('\n💡 Next steps:');
    console.log('  1. Create phases for each program');
    console.log('  2. Create microcycles within phases');
    console.log('  3. Create workouts within microcycles');
    console.log('  4. Populate workout exercises using the mappings');
    console.log('  5. Test at https://dev.massimino.fitness/workout-log?tab=programs');

  } catch (error) {
    console.error('\n❌ Error during population:', error);
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
