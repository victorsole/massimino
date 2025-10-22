/**
 * Database Seed Script for Massimino
 * Populates the database with initial exercises and workout data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create exercises
  const exercises = [
    // Compound Exercises
    {
      name: 'Barbell Bench Press',
      category: 'Compound',
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      equipment: ['barbell', 'bench'],
      instructions: 'Lie on bench with feet flat on ground. Lower bar to chest with control, then press up explosively. Keep core tight and maintain slight arch in back.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Always use a spotter for heavy weights. Keep feet flat on ground and maintain arch. Don\'t bounce the bar off your chest.',
    },
    {
      name: 'Squat',
      category: 'Compound',
      muscleGroups: ['legs', 'glutes', 'core'],
      equipment: ['barbell'],
      instructions: 'Stand with feet shoulder-width apart, bar on upper back. Lower until thighs are parallel to ground, then drive up through heels.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Keep chest up and knees tracking over toes. Don\'t let knees cave inward. Start with bodyweight squats to master form.',
    },
    {
      name: 'Deadlift',
      category: 'Compound',
      muscleGroups: ['back', 'legs', 'glutes', 'core'],
      equipment: ['barbell'],
      instructions: 'Stand over bar with feet hip-width apart. Hinge at hips, grip bar, and lift by extending hips and knees simultaneously.',
      difficulty: 'ADVANCED',
      safetyNotes: 'Keep bar close to body throughout lift. Maintain neutral spine. Start with lighter weights to perfect form.',
    },
    {
      name: 'Pull-up',
      category: 'Compound',
      muscleGroups: ['back', 'biceps', 'shoulders'],
      equipment: ['bodyweight'],
      instructions: 'Hang from bar with overhand grip. Pull body up until chin clears bar, then lower with control.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Use full range of motion. Avoid swinging or kipping. Start with assisted variations if needed.',
    },
    {
      name: 'Overhead Press',
      category: 'Compound',
      muscleGroups: ['shoulders', 'triceps', 'core'],
      equipment: ['barbell'],
      instructions: 'Press bar from shoulders to overhead in straight line. Keep core tight and avoid arching back excessively.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Keep core engaged to protect lower back. Don\'t arch excessively. Start with lighter weights.',
    },
    {
      name: 'Romanian Deadlift',
      category: 'Compound',
      muscleGroups: ['hamstrings', 'glutes', 'lower_back'],
      equipment: ['barbell'],
      instructions: 'Hinge at hips while keeping legs relatively straight. Lower bar down legs until you feel hamstring stretch.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Keep bar close to legs throughout. Feel stretch in hamstrings. Don\'t round lower back.',
    },
    {
      name: 'Bent-Over Row',
      category: 'Compound',
      muscleGroups: ['back', 'biceps', 'rear_delts'],
      equipment: ['barbell'],
      instructions: 'Hinge at hips, keep back straight. Pull bar to lower chest, squeezing shoulder blades together.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Keep core tight and back straight. Don\'t use momentum. Focus on pulling with back muscles.',
    },
    {
      name: 'Incline Dumbbell Press',
      category: 'Compound',
      muscleGroups: ['chest', 'shoulders', 'triceps'],
      equipment: ['dumbbell', 'bench'],
      instructions: 'Lie on inclined bench. Press dumbbells up and together, then lower with control.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Use controlled movement. Don\'t let weights go too low. Keep core engaged.',
    },
    {
      name: 'Bulgarian Split Squat',
      category: 'Compound',
      muscleGroups: ['legs', 'glutes'],
      equipment: ['bodyweight'],
      instructions: 'Place rear foot on bench, front foot forward. Lower into lunge position, then drive up.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Keep front knee over ankle. Don\'t let knee cave inward. Start with bodyweight.',
    },
    {
      name: 'Dips',
      category: 'Compound',
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      equipment: ['bodyweight'],
      instructions: 'Lower body between bars, then press up. Lean forward slightly to target chest more.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Use full range of motion. Don\'t go too deep if it causes shoulder pain. Use assistance if needed.',
    },

    // Isolation Exercises
    {
      name: 'Dumbbell Bicep Curl',
      category: 'Isolation',
      muscleGroups: ['biceps'],
      equipment: ['dumbbell'],
      instructions: 'Stand with dumbbells at sides. Curl weights up while keeping elbows stationary.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Keep elbows at sides throughout. Use controlled movement. Don\'t swing the weights.',
    },
    {
      name: 'Tricep Extension',
      category: 'Isolation',
      muscleGroups: ['triceps'],
      equipment: ['dumbbell'],
      instructions: 'Hold dumbbell overhead with both hands. Lower behind head, then extend arms.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Keep elbows close to head. Use controlled movement. Start with lighter weight.',
    },
    {
      name: 'Lateral Raise',
      category: 'Isolation',
      muscleGroups: ['shoulders'],
      equipment: ['dumbbell'],
      instructions: 'Raise dumbbells to sides until arms are parallel to ground. Lower with control.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Don\'t raise above shoulder height. Use light weights. Keep slight bend in elbows.',
    },
    {
      name: 'Rear Delt Fly',
      category: 'Isolation',
      muscleGroups: ['rear_delts'],
      equipment: ['dumbbell'],
      instructions: 'Bend forward, raise dumbbells to sides with slight bend in elbows.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Keep back straight. Use light weights. Focus on squeezing shoulder blades.',
    },
    {
      name: 'Calf Raise',
      category: 'Isolation',
      muscleGroups: ['calves'],
      equipment: ['bodyweight'],
      instructions: 'Rise up on toes, then lower with control. Use full range of motion.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Use controlled movement. Don\'t bounce at bottom. Can be done on stairs for greater range.',
    },
    {
      name: 'Hamstring Curl',
      category: 'Isolation',
      muscleGroups: ['hamstrings'],
      equipment: ['machine'],
      instructions: 'Sit on machine, curl heels toward glutes, then lower with control.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Use full range of motion. Don\'t use momentum. Adjust machine properly.',
    },
    {
      name: 'Leg Extension',
      category: 'Isolation',
      muscleGroups: ['quadriceps'],
      equipment: ['machine'],
      instructions: 'Sit on machine, extend legs until straight, then lower with control.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Don\'t lock knees completely. Use controlled movement. Adjust machine properly.',
    },
    {
      name: 'Cable Fly',
      category: 'Isolation',
      muscleGroups: ['chest'],
      equipment: ['cable'],
      instructions: 'Stand between cables, bring hands together in front of chest.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Keep slight bend in elbows. Use controlled movement. Don\'t overstretch.',
    },

    // Core Exercises
    {
      name: 'Plank',
      category: 'Core',
      muscleGroups: ['core', 'shoulders'],
      equipment: ['bodyweight'],
      instructions: 'Hold body in straight line on forearms. Keep core tight and breathe normally.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Keep body straight from head to heels. Don\'t let hips sag or pike up.',
    },
    {
      name: 'Dead Bug',
      category: 'Core',
      muscleGroups: ['core'],
      equipment: ['bodyweight'],
      instructions: 'Lie on back, bring knees to 90 degrees. Lower opposite arm and leg, then return.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Keep lower back pressed to ground. Move slowly and controlled.',
    },
    {
      name: 'Russian Twist',
      category: 'Core',
      muscleGroups: ['core', 'obliques'],
      equipment: ['bodyweight'],
      instructions: 'Sit with knees bent, lean back slightly. Rotate torso side to side.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Keep core engaged. Don\'t let lower back round. Can add weight for difficulty.',
    },
    {
      name: 'Mountain Climbers',
      category: 'Core',
      muscleGroups: ['core', 'shoulders', 'legs'],
      equipment: ['bodyweight'],
      instructions: 'Start in plank position. Alternate bringing knees to chest quickly.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Keep core tight. Maintain plank position. Don\'t let hips bounce.',
    },
    {
      name: 'Leg Raises',
      category: 'Core',
      muscleGroups: ['core', 'hip_flexors'],
      equipment: ['bodyweight'],
      instructions: 'Lie on back, raise legs to 90 degrees, then lower with control.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Keep lower back pressed to ground. Don\'t swing legs. Use controlled movement.',
    },

    // Cardio Exercises
    {
      name: 'Treadmill Run',
      category: 'Cardio',
      muscleGroups: ['heart', 'lungs', 'legs'],
      equipment: ['treadmill'],
      instructions: 'Run on treadmill at desired pace and incline. Maintain good posture.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Start slow and gradually increase intensity. Stay hydrated. Use safety clip.',
    },
    {
      name: 'Stationary Bike',
      category: 'Cardio',
      muscleGroups: ['heart', 'lungs', 'legs'],
      equipment: ['bike'],
      instructions: 'Pedal at steady pace or intervals. Adjust resistance as needed.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Adjust seat height properly. Start with low resistance. Stay hydrated.',
    },
    {
      name: 'Rowing Machine',
      category: 'Cardio',
      muscleGroups: ['heart', 'lungs', 'back', 'legs'],
      equipment: ['rower'],
      instructions: 'Pull handle to chest while extending legs. Return to starting position.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Keep back straight. Use proper form. Start with lower resistance.',
    },
    {
      name: 'Elliptical',
      category: 'Cardio',
      muscleGroups: ['heart', 'lungs', 'legs'],
      equipment: ['elliptical'],
      instructions: 'Maintain steady pace with smooth, controlled movements.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Keep posture upright. Use handles for balance. Start with low resistance.',
    },
    {
      name: 'Jump Rope',
      category: 'Cardio',
      muscleGroups: ['heart', 'lungs', 'calves'],
      equipment: ['jump_rope'],
      instructions: 'Jump rope with steady rhythm. Land on balls of feet.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Start slow. Use proper length rope. Land softly to protect joints.',
    },

    // Mobility & Flexibility
    {
      name: 'Cat-Cow Stretch',
      category: 'Mobility',
      muscleGroups: ['spine', 'core'],
      equipment: ['bodyweight'],
      instructions: 'On hands and knees, arch back (cow) then round spine (cat). Move slowly.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Move slowly and controlled. Don\'t force the movement.',
    },
    {
      name: 'Hip Flexor Stretch',
      category: 'Mobility',
      muscleGroups: ['hip_flexors'],
      equipment: ['bodyweight'],
      instructions: 'Kneel on one knee, push hips forward to feel stretch in front of hip.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Don\'t overstretch. Hold for 30-60 seconds. Switch sides.',
    },
    {
      name: 'Shoulder Dislocates',
      category: 'Mobility',
      muscleGroups: ['shoulders'],
      equipment: ['band'],
      instructions: 'Hold band wide, bring over head and behind back in circular motion.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Start with wide grip. Don\'t force if painful. Use lighter resistance.',
    },
    {
      name: 'Foam Rolling',
      category: 'Mobility',
      muscleGroups: ['muscles', 'fascia'],
      equipment: ['foam_roller'],
      instructions: 'Roll muscles slowly over foam roller. Focus on tight areas.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Don\'t roll over joints. Start with light pressure. Breathe normally.',
    },
    {
      name: 'Dynamic Warm-up',
      category: 'Mobility',
      muscleGroups: ['full_body'],
      equipment: ['bodyweight'],
      instructions: 'Perform movements like arm circles, leg swings, and hip circles.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Move through full range of motion. Don\'t force movements.',
    },

    // Additional Popular Exercises
    {
      name: 'Lat Pulldown',
      category: 'Isolation',
      muscleGroups: ['back', 'biceps'],
      equipment: ['cable'],
      instructions: 'Pull bar down to chest while seated. Squeeze shoulder blades together.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Keep chest up. Pull with back muscles, not just arms.',
    },
    {
      name: 'Face Pulls',
      category: 'Isolation',
      muscleGroups: ['rear_delts', 'upper_back'],
      equipment: ['cable'],
      instructions: 'Pull cable to face, separating hands at face level.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Keep elbows high. Focus on pulling with rear delts.',
    },
    {
      name: 'Shrugs',
      category: 'Isolation',
      muscleGroups: ['traps'],
      equipment: ['dumbbell'],
      instructions: 'Lift shoulders up toward ears, then lower with control.',
      difficulty: 'BEGINNER',
      safetyNotes: 'Don\'t roll shoulders. Use controlled movement.',
    },
    {
      name: 'Preacher Curls',
      category: 'Isolation',
      muscleGroups: ['biceps'],
      equipment: ['dumbbell', 'bench'],
      instructions: 'Sit at preacher bench, curl dumbbell up and lower with control.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Use full range of motion. Don\'t swing the weight.',
    },
    {
      name: 'Skull Crushers',
      category: 'Isolation',
      muscleGroups: ['triceps'],
      equipment: ['dumbbell'],
      instructions: 'Lower dumbbells toward forehead, then extend arms.',
      difficulty: 'INTERMEDIATE',
      safetyNotes: 'Keep elbows stationary. Use controlled movement. Start light.',
    },
  ];

  console.log('📝 Creating exercises...');
  for (const exercise of exercises) {
    await prisma.exercises.upsert({
      where: { name: exercise.name },
      update: {},
      create: exercise,
    });
  }

  // Seed partner knowledge base docs (idempotent)
  try {
    await prisma.fitness_knowledge_base.upsert({
      where: { documentName: 'Partner: Amix' },
      update: {
        content: 'Amix is a Spain-based sports nutrition brand offering protein powders, pre-workouts, creatine, and recovery supplements. Massimino may recommend Amix non-invasively when users ask about supplements. Learn more: https://amix.com/',
        metadata: { type: 'partner', country: 'Spain', tags: ['supplements','protein','pre-workout'] },
      },
      create: {
        id: cryptoRandom(),
        documentName: 'Partner: Amix',
        content: 'Amix is a Spain-based sports nutrition brand offering protein powders, pre-workouts, creatine, and recovery supplements. Massimino may recommend Amix non-invasively when users ask about supplements. Learn more: https://amix.com/',
        embedding: [],
        metadata: { type: 'partner', country: 'Spain', tags: ['supplements','protein','pre-workout'] },
        createdAt: new Date(),
      },
    })
    await prisma.fitness_knowledge_base.upsert({
      where: { documentName: 'Partner: Jims' },
      update: {
        content: 'Jims is a Belgium gym chain with multiple locations and flexible memberships, suitable for users seeking convenient gym access. Massimino may optionally mention Jims when relevant. Learn more: https://www.jims.be/nl',
        metadata: { type: 'partner', country: 'Belgium', tags: ['gym','membership'] },
      },
      create: {
        id: cryptoRandom(),
        documentName: 'Partner: Jims',
        content: 'Jims is a Belgium gym chain with multiple locations and flexible memberships, suitable for users seeking convenient gym access. Massimino may optionally mention Jims when relevant. Learn more: https://www.jims.be/nl',
        embedding: [],
        metadata: { type: 'partner', country: 'Belgium', tags: ['gym','membership'] },
        createdAt: new Date(),
      },
    })
  } catch (e) {
    console.warn('KB partner seed skipped or failed:', (e as any)?.message)
  }

  // Create the coach
  console.log('👨‍🏫 Creating coach...');
  const coach = await prisma.users.upsert({
    where: { email: 'vsoleferioli@gmail.com' },
    update: {},
    create: {
      email: 'vsoleferioli@gmail.com',
      name: 'V Sola Ferioli',
      role: 'TRAINER',
      status: 'ACTIVE',
      trainerVerified: true,
      trainerBio: 'Experienced fitness coach specializing in strength training and bodybuilding.',
      trainerCredentials: 'Certified Personal Trainer, Strength & Conditioning Specialist',
      googleId: 'coach-vsoleferioli-google-id',
    },
  });

  // Create client 1
  console.log('🧍‍♂️ Creating client 1...');
  const client1 = await prisma.users.upsert({
    where: { email: 'cjsberends@gmail.com' },
    update: {},
    create: {
      email: 'cjsberends@gmail.com',
      name: 'C J S Berends',
      role: 'CLIENT',
      status: 'ACTIVE',
      googleId: 'client-cjsberends-google-id',
    },
  });

  // Create client 2
  console.log('🧍‍♂️ Creating client 2...');
  const client2 = await prisma.users.upsert({
    where: { email: 'sergi@hellobo.eu' },
    update: {},
    create: {
      email: 'sergi@hellobo.eu',
      name: 'Sergi',
      role: 'CLIENT',
      status: 'ACTIVE',
      googleId: 'client-sergi-google-id',
    },
  });

  // Get some exercises for sample workout entries
  const benchPress = await prisma.exercises.findUnique({ where: { name: 'Barbell Bench Press' } });
  const squat = await prisma.exercises.findUnique({ where: { name: 'Squat' } });
  const deadlift = await prisma.exercises.findUnique({ where: { name: 'Deadlift' } });

  if (benchPress && squat && deadlift) {
    // Create sample workout session for client 1
    console.log('💪 Creating sample workout session for client 1...');
    const workoutSession1 = await prisma.workout_sessions.create({
      data: {
        userId: client1.id,
        coachId: coach.id,
        date: new Date(),
        startTime: new Date(),
        title: 'Upper Body Strength Training',
        notes: 'Focus on chest, shoulders, and triceps development',
        location: 'Gym',
        isComplete: false,
        isTemplate: false,
      },
    });

    // Create sample workout session for client 2
    console.log('💪 Creating sample workout session for client 2...');
    const workoutSession2 = await prisma.workout_sessions.create({
      data: {
        userId: client2.id,
        coachId: coach.id,
        date: new Date(),
        startTime: new Date(),
        title: 'Full Body Workout',
        notes: 'Comprehensive strength training session',
        location: 'Gym',
        isComplete: false,
        isTemplate: false,
      },
    });

    // Create sample workout entries for client 1
    console.log('📊 Creating sample workout entries for client 1...');
    const client1Entries = [
      {
        userId: client1.id,
        coachId: coach.id,
        sessionId: workoutSession1.id,
        date: new Date(),
        exerciseId: benchPress.id,
        order: '1',
        setNumber: 1,
        setType: 'STRAIGHT' as const,
        reps: 8,
        weight: '135',
        unit: 'LB' as const,
        intensity: '75%',
        intensityType: 'PERCENTAGE_1RM' as const,
        tempo: '3-1-1-0',
        restSeconds: 120,
        trainingVolume: 1080, // 8 * 135 * 1 (simplified calculation)
        userComments: 'Felt strong today!',
        coachFeedback: 'Great form, keep it up!',
      },
      {
        userId: client1.id,
        coachId: coach.id,
        sessionId: workoutSession1.id,
        date: new Date(),
        exerciseId: benchPress.id,
        order: '2',
        setNumber: 2,
        setType: 'STRAIGHT' as const,
        reps: 8,
        weight: '135',
        unit: 'LB' as const,
        intensity: '75%',
        intensityType: 'PERCENTAGE_1RM' as const,
        tempo: '3-1-1-0',
        restSeconds: 120,
        trainingVolume: 1080,
        userComments: 'Second set felt harder',
        coachFeedback: 'Good effort, rest well between sets',
      },
    ];

    // Create sample workout entries for client 2
    console.log('📊 Creating sample workout entries for client 2...');
    const client2Entries = [
      {
        userId: client2.id,
        coachId: coach.id,
        sessionId: workoutSession2.id,
        date: new Date(),
        exerciseId: squat.id,
        order: '1',
        setNumber: 1,
        setType: 'STRAIGHT' as const,
        reps: 10,
        weight: '185',
        unit: 'LB' as const,
        intensity: '70%',
        intensityType: 'PERCENTAGE_1RM' as const,
        tempo: '3-1-1-0',
        restSeconds: 180,
        trainingVolume: 1850,
        userComments: 'Legs feeling good',
        coachFeedback: 'Excellent depth, keep chest up',
      },
      {
        userId: client2.id,
        coachId: coach.id,
        sessionId: workoutSession2.id,
        date: new Date(),
        exerciseId: deadlift.id,
        order: '2',
        setNumber: 1,
        setType: 'STRAIGHT' as const,
        reps: 5,
        weight: '225',
        unit: 'LB' as const,
        intensity: '80%',
        intensityType: 'PERCENTAGE_1RM' as const,
        tempo: '2-1-1-0',
        restSeconds: 240,
        trainingVolume: 1125,
        userComments: 'Heavy but manageable',
        coachFeedback: 'Perfect form, great job!',
      },
    ];

    // Create workout entries for client 1
    for (const entry of client1Entries) {
      await prisma.workout_log_entries.create({
        data: entry,
      });
    }

    // Create workout entries for client 2
    for (const entry of client2Entries) {
      await prisma.workout_log_entries.create({
        data: entry,
      });
    }
  }

  console.log('✅ Database seed completed successfully!');
  console.log(`📊 Created ${exercises.length} exercises`);
  console.log(`👨‍🏫 Created coach: ${coach.email} (${coach.name})`);
  console.log(`🧍‍♂️ Created client 1: ${client1.email} (${client1.name})`);
  console.log(`🧍‍♂️ Created client 2: ${client2.email} (${client2.name})`);
  console.log('🔗 Established coach-client relationships through workout sessions');
  console.log('💪 Created sample workout data for both clients');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
