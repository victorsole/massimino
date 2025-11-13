// Script to create castell training workouts for Mannekes team
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const TEAM_ID = '59a6b466-d856-4b3a-a0a6-a9fda688c618';
const USER_ID = '9462f027-9916-41db-8d39-294c7858b516';

// Map castell muscle groups to Massimino muscle groups
const MUSCLE_GROUP_MAP: Record<string, string[]> = {
  'Quadriceps': ['QUADRICEPS'],
  'Glutes': ['GLUTES'],
  'Hamstrings': ['HAMSTRINGS'],
  'Core': ['CORE'],
  'Abs': ['CORE'],
  'Obliques': ['CORE'],
  'Lower Back': ['LOWER_BACK'],
  'Erector Spinae': ['LOWER_BACK'],
  'Lats': ['LATS'],
  'Rhomboids': ['UPPER_BACK'],
  'Upper Back': ['UPPER_BACK'],
  'Trapezius': ['TRAPS'],
  'Traps': ['TRAPS'],
  'Deltoids': ['SHOULDERS'],
  'Anterior Deltoids': ['SHOULDERS'],
  'Lateral Deltoids': ['SHOULDERS'],
  'Rear Deltoids': ['SHOULDERS'],
  'Shoulders': ['SHOULDERS'],
  'Rotator Cuff': ['SHOULDERS'],
  'Pectorals': ['CHEST'],
  'Chest': ['CHEST'],
  'Upper Chest': ['CHEST'],
  'Triceps': ['TRICEPS'],
  'Biceps': ['BICEPS'],
  'Forearms': ['FOREARMS'],
  'Grip': ['FOREARMS'],
  'Wrists': ['FOREARMS'],
  'Calves': ['CALVES'],
  'Hip Flexors': ['HIP_FLEXORS'],
  'Balance': ['CORE'],
  'Stabilizers': ['CORE'],
  'Proprioception': ['CORE'],
  'Serratus Anterior': ['CORE'],
  'Posture': ['CORE'],
  'Rotation': ['CORE'],
  'Legs': ['QUADRICEPS', 'HAMSTRINGS']
};

// Map equipment to Massimino equipment
const EQUIPMENT_MAP: Record<string, string> = {
  'Barbell': 'BARBELL',
  'Squat Rack': 'SQUAT_RACK',
  'Dumbbells': 'DUMBBELLS',
  'Dumbbell or Kettlebell': 'DUMBBELLS',
  'Heavy Dumbbells or Kettlebells': 'DUMBBELLS',
  'Heavy Dumbbells': 'DUMBBELLS',
  'Kettlebells': 'KETTLEBELLS',
  'Dumbbells or Kettlebells': 'DUMBBELLS',
  'Pull-up Bar': 'PULL_UP_BAR',
  'Pull-up Bar (optional)': 'PULL_UP_BAR',
  'Mat': 'MAT',
  'Wall': 'NONE',
  'Weight Plates (optional)': 'WEIGHT_PLATES',
  'Cable Machine': 'CABLE_MACHINE',
  'Cable Machine with Rope': 'CABLE_MACHINE',
  'Bench': 'BENCH',
  'Box or Bench': 'BOX',
  'Box/Step': 'BOX',
  'Landmine attachment': 'BARBELL'
};

function mapMuscleGroups(muscles: string[]): string[] {
  const mapped = new Set<string>();
  for (const muscle of muscles) {
    const groups = MUSCLE_GROUP_MAP[muscle] || ['FULL_BODY'];
    groups.forEach(g => mapped.add(g));
  }
  return Array.from(mapped);
}

function mapEquipment(equipment: string[]): string[] {
  const mapped = new Set<string>();
  for (const eq of equipment) {
    const massEq = EQUIPMENT_MAP[eq] || 'NONE';
    mapped.add(massEq);
  }
  return Array.from(mapped).filter(e => e !== 'NONE' || mapped.size === 1);
}

async function main() {
  try {
    console.log('🏰 Creating Castell Training Workouts for Team Mannekes');
    console.log('═══════════════════════════════════════════════════════\n');

    // Load the castellers JSON
    const jsonPath = path.join(__dirname, '../src/templates/castellers.json');
    const castellData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // Step 1: Create/find all exercises from the exercise library
    console.log('📚 Step 1: Processing Exercise Library');
    console.log('─────────────────────────────────────\n');

    const exerciseIdMap = new Map<string, string>();

    for (const ex of castellData.exercise_library) {
      // Try to find existing exercise
      let exercise = await prisma.exercises.findFirst({
        where: { name: ex.name }
      });

      if (!exercise) {
        const muscleGroups = mapMuscleGroups([
          ...ex.primary_muscles,
          ...(ex.secondary_muscles || [])
        ]);
        const equipment = mapEquipment(ex.equipment);

        const now = new Date();
        exercise = await prisma.exercises.create({
          data: {
            id: crypto.randomUUID(),
            name: ex.name,
            category: ex.category.includes('Lower') ? 'LEGS' :
                     ex.category.includes('Upper') ? 'PUSH' :
                     ex.category.includes('Core') ? 'CORE' : 'CARDIO',
            muscleGroups,
            equipment,
            instructions: ex.instructions?.join('\n') || ex.castell_relevance,
            difficulty: ex.difficulty === 'Beginner to Intermediate' ? 'BEGINNER' :
                       ex.difficulty === 'Intermediate to Advanced' ? 'ADVANCED' : 'INTERMEDIATE',
            curated: true,
            isActive: true,
            commonMistakes: ex.common_mistakes || [],
            tags: ['castells', 'team', 'mannekes'],
            source: 'Castellers Training Program',
            createdAt: now,
            updatedAt: now
          }
        });
        console.log(`  ✅ Created: ${ex.name}`);
      } else {
        console.log(`  ℹ️  Found: ${ex.name}`);
      }

      exerciseIdMap.set(ex.id, exercise.id);
    }

    console.log(`\n✅ Processed ${exerciseIdMap.size} exercises\n`);

    // Step 2: Create workout sessions for each program
    console.log('🏋️  Step 2: Creating Workout Sessions');
    console.log('────────────────────────────────────\n');

    let workoutCount = 0;
    let totalExercises = 0;

    for (const program of castellData.workout_programs) {
      console.log(`\n📋 Creating: ${program.name}`);
      console.log(`   Position: ${program.position}`);
      console.log(`   Duration: ${program.duration_minutes} minutes\n`);

      const sessionId = crypto.randomUUID();
      const today = new Date();

      // Add days based on program index so they don't all have same date
      today.setDate(today.getDate() + workoutCount);

      // Create workout session (as template for team)
      await prisma.workout_sessions.create({
        data: {
          id: sessionId,
          users_workout_sessions_userIdTousers: {
            connect: { id: USER_ID }
          },
          users_workout_sessions_coachIdTousers: {
            connect: { id: USER_ID }
          },
          title: program.name,
          notes: program.description,
          sessionNotes: `Position: ${program.position} | Training Type: ${program.training_type}`,
          date: today,
          startTime: today,
          duration: program.duration_minutes,
          status: 'ACTIVE',
          isComplete: false,
          isCurrentlyActive: false,
          isTemplate: true, // Mark as template
          createdAt: today,
          updatedAt: today
        }
      });

      // Create workout log entries
      let entryOrder = 1;
      const exercises = program.main_workout.exercises;

      for (const exercise of exercises) {
        // Find the exercise ID from our map
        const exerciseDbId = exerciseIdMap.get(exercise.exercise_id);

        if (!exerciseDbId) {
          // Try to find by name
          const foundEx = await prisma.exercises.findFirst({
            where: { name: exercise.name }
          });

          if (!foundEx) {
            console.log(`  ⚠️  Skipping: ${exercise.name} (not found)`);
            continue;
          }
          exerciseIdMap.set(exercise.exercise_id, foundEx.id);
        }

        const sets = exercise.sets || 3;
        // Convert reps to integer (parse range like "6-8" to get first value)
        const repsString = typeof exercise.reps === 'string' ? exercise.reps : `${exercise.reps}`;
        const repsMatch = repsString.match(/(\d+)/);
        const repsValue = repsMatch ? parseInt(repsMatch[1]) : 10;

        // Create entries for each set
        for (let setNum = 1; setNum <= sets; setNum++) {
          await prisma.workout_log_entries.create({
            data: {
              id: crypto.randomUUID(),
              workout_sessions: {
                connect: { id: sessionId }
              },
              exercises: {
                connect: { id: exerciseIdMap.get(exercise.exercise_id)! }
              },
              users_workout_log_entries_userIdTousers: {
                connect: { id: USER_ID }
              },
              order: entryOrder.toString(),
              setNumber: setNum,
              setType: 'STRAIGHT',
              reps: repsValue,
              weight: '0',
              unit: 'KG',
              restSeconds: exercise.rest_seconds || 60,
              targetRPE: 7,
              coachFeedback: exercise.notes,
              date: today,
              createdAt: today,
              updatedAt: today
            }
          });
          entryOrder++;
        }

        totalExercises++;
        console.log(`  ✅ ${exercise.name} (${sets} sets)`);
      }

      workoutCount++;
    }

    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 SUCCESS! Castell Workouts Created');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n📊 Summary:`);
    console.log(`   Team: Mannekes`);
    console.log(`   Team ID: ${TEAM_ID}`);
    console.log(`   Workout Programs: ${workoutCount}`);
    console.log(`   Total Exercises: ${totalExercises}`);
    console.log(`   Exercise Library: ${exerciseIdMap.size} exercises`);
    console.log('\n💪 Positions covered:');
    console.log('   • Baixos (Base) - 3 programs');
    console.log('   • Contrafort (Support) - 1 program');
    console.log('   • Primeres Mans (First Hands) - 1 program');
    console.log('   • Segons/Terços/Quarts (Climbers) - 1 program');
    console.log('   • Pom de Dalt (Upper Tower) - 1 program');
    console.log('\n✨ Team members can now access these workouts!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
