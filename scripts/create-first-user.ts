import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createFirstUser() {
  try {
    console.log('🚀 Creating first Massimino user...');

    // Check if any users already exist
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log('⚠️ Users already exist in the database');
      return;
    }

    // Create the first user (you!)
    const hashedPassword = await bcrypt.hash('massimino123', 12);

    const firstUser = await prisma.user.create({
      data: {
        email: 'victor@massimino.com',
        name: 'Victor Sole',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(),
        reputationScore: 100,
        warningCount: 0,
        trainerVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ First user created successfully!');
    console.log('📧 Email: victor@massimino.com');
    console.log('🔑 Password: massimino123');
    console.log('👤 Role: ADMIN');
    console.log('🆔 User ID:', firstUser.id);

    // Create some sample workout data
    console.log('📊 Creating sample workout data...');

    // Create a sample workout session
    const now = new Date();
    const workoutSession = await prisma.workoutSession.create({
      data: {
        userId: firstUser.id,
        date: now,
        startTime: now,
        endTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour later
        duration: 3600, // 60 minutes in seconds
        notes: 'Welcome to Massimino! This is your first workout session.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Get a sample exercise
    const sampleExercise = await prisma.exercise.findFirst();
    if (sampleExercise) {
      // Create a sample workout log entry
      await prisma.workoutLogEntry.create({
        data: {
          userId: firstUser.id,
          sessionId: workoutSession.id,
          exerciseId: sampleExercise.id,
          date: now,
          order: '1',
          setNumber: 1,
          setType: 'STRAIGHT',
          reps: 10,
          weight: '135',
          unit: 'LB',
          intensity: '75%',
          intensityType: 'PERCENTAGE_1RM',
          tempo: '3-1-1-0',
          restSeconds: 120,
          userComments: 'Great first workout with Massimino!',
          coachFeedback: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log('✅ Sample workout data created!');
    console.log('🎉 Massimino is ready for you!');
    console.log('');
    console.log('🔗 Login at: http://localhost:3000/login');
    console.log('📊 Dashboard: http://localhost:3000/dashboard');
    console.log('💪 Workout Log: http://localhost:3000/workout-log');
    console.log('🏋️ Exercises: http://localhost:3000/exercises');

  } catch (error) {
    console.error('❌ Error creating first user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFirstUser();
