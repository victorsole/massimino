// Script to create team workout logs for Mannekes castell training
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const TEAM_ID = '59a6b466-d856-4b3a-a0a6-a9fda688c618';
const USER_ID = '9462f027-9916-41db-8d39-294c7858b516';

async function main() {
  try {
    console.log('🏰 Creating Team Castell Workouts for Mannekes');
    console.log('═════════════════════════════════════════════\n');

    // Load the castellers JSON
    const jsonPath = path.join(__dirname, '../src/templates/castellers.json');
    const castellData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log('📋 Creating Team Workout Logs...\n');

    let workoutCount = 0;

    for (const program of castellData.workout_programs) {
      console.log(`\n🏋️  ${program.name}`);
      console.log(`   Position: ${program.position}`);
      console.log(`   Duration: ${program.duration_minutes} minutes`);

      const workoutLogId = crypto.randomUUID();
      const today = new Date();
      today.setDate(today.getDate() + workoutCount);

      // Create team workout log
      await prisma.team_workout_logs.create({
        data: {
          id: workoutLogId,
          teams: {
            connect: { id: TEAM_ID }
          },
          users: {
            connect: { id: USER_ID }
          },
          title: program.name,
          description: `${program.description}\n\nPosition: ${program.position} | Type: ${program.training_type} | Difficulty: ${program.difficulty}`,
          date: today,
          duration: program.duration_minutes,
          allowComments: true,
          isTemplate: true,
          createdAt: today,
          updatedAt: today
        }
      });

      console.log(`   ✅ Team workout log created`);

      // Create team_workout_exercises for each exercise
      let exerciseOrder = 1;
      const exercises = program.main_workout.exercises;

      for (const exercise of exercises) {
        // Find the exercise in the database (handle plural vs singular)
        let foundEx = await prisma.exercises.findFirst({
          where: { name: exercise.name }
        });

        // Try without trailing 's' if not found
        if (!foundEx && exercise.name.endsWith('s')) {
          foundEx = await prisma.exercises.findFirst({
            where: { name: exercise.name.slice(0, -1) }
          });
        }

        // Try partial match as last resort
        if (!foundEx) {
          const exercises = await prisma.exercises.findMany({
            where: {
              OR: [
                { name: { contains: exercise.name.split(' ')[0], mode: 'insensitive' } },
                { aliasNames: { has: exercise.name } }
              ]
            },
            take: 1
          });
          foundEx = exercises[0] || null;
        }

        if (!foundEx) {
          console.log(`   ⚠️  Skipping: ${exercise.name} (not found)`);
          continue;
        }

        // Parse reps
        const repsString = typeof exercise.reps === 'string' ? exercise.reps : `${exercise.reps}`;

        await prisma.team_workout_exercises.create({
          data: {
            id: crypto.randomUUID(),
            team_workout_logs: {
              connect: { id: workoutLogId }
            },
            exercises: {
              connect: { id: foundEx.id }
            },
            order: exerciseOrder,
            sets: exercise.sets || 3,
            reps: repsString,
            weight: exercise.weight || null,
            restSeconds: exercise.rest_seconds || 60,
            notes: exercise.notes || null,
            instructionalVideoUrl: null,
            instagramUrl: null,
            tiktokUrl: null
          }
        });

        console.log(`   ✅ Added: ${exercise.name} (${exercise.sets || 3} sets)`);
        exerciseOrder++;
      }

      workoutCount++;
    }

    console.log('\n\n');
    console.log('═════════════════════════════════════════════');
    console.log('🎉 SUCCESS! Team Workouts Created');
    console.log('═════════════════════════════════════════════');
    console.log(`\n📊 Summary:`);
    console.log(`   Team: Mannekes`);
    console.log(`   Team ID: ${TEAM_ID}`);
    console.log(`   Workout Programs: ${workoutCount}`);
    console.log('\n💪 Positions covered:');
    console.log('   • Baixos (Base) - 3 programs');
    console.log('   • Contrafort (Support) - 1 program');
    console.log('   • Primeres Mans (First Hands) - 1 program');
    console.log('   • Segons/Terços/Quarts (Climbers) - 1 program');
    console.log('   • Pom de Dalt (Upper Tower) - 1 program');
    console.log('\n✨ Team workouts now visible in Team Details!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
