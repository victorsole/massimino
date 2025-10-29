import { PrismaClient } from '@prisma/client';
import ronnieData from '../templates/ronnie_coleman_volume.json';

const prisma = new PrismaClient();

async function populateRonnieColeman() {
  console.log('Starting Ronnie Coleman program population...');

  // Get all exercises from the template
  const allExercises = ronnieData.training_days.flatMap(day => day.exercises);
  console.log(`Total exercise entries in template: ${allExercises.length}`);

  // Create a unique list of exercises based on exercise name (not ID, since some IDs differ but exercises are same)
  const uniqueExerciseNames = new Set<string>();
  const exerciseMapping: Record<string, string> = {}; // exercise_id from JSON -> database ID

  // Map JSON exercise names to search terms
  const exerciseSearchMap: Record<string, string[]> = {
    'deadlift': ['Barbell Deadlift', 'Deadlift'],
    'barbell-rows': ['Barbell Row', 'Bent Over Barbell Row', 'Bent Over Row'],
    'barbell-rows-day4': ['Barbell Row', 'Bent Over Barbell Row', 'Bent Over Row'],
    't-bar-rows': ['T-Bar Row', 'T Bar Row'],
    'barbell-curls': ['Barbell Curl', 'Standing Barbell Curl'],
    'preacher-curls': ['Preacher Curl', 'EZ Bar Preacher Curl', 'Barbell Preacher Curl'],
    'cable-curls': ['Cable Curl', 'Low Cable Curl', 'Standing Cable Curl'],
    'military-press': ['Military Press', 'Barbell Military Press', 'Barbell Shoulder Press', 'Standing Military Press'],
    'seated-dumbbell-press': ['Seated Dumbbell Shoulder Press', 'Dumbbell Shoulder Press', 'Seated Dumbbell Press'],
    'seated-dumbbell-press-day4': ['Seated Dumbbell Shoulder Press', 'Dumbbell Shoulder Press', 'Seated Dumbbell Press'],
    'front-dumbbell-press': ['Arnold Press', 'Dumbbell Front Raise', 'Front Dumbbell Raise'],
    'squats': ['Barbell Squat', 'Back Squat', 'Barbell Back Squat'],
    'leg-press': ['Leg Press'],
    'hamstring-curls': ['Lying Leg Curl', 'Lying Hamstring Curl'],
    'stiff-leg-deadlifts': ['Romanian Deadlift', 'Stiff Leg Deadlift', 'Stiff Legged Deadlift'],
    'lunges': ['Walking Lunge', 'Dumbbell Lunge', 'Barbell Lunge'],
    'bench-press': ['Barbell Bench Press', 'Bench Press', 'Flat Barbell Bench Press'],
    'incline-bench-press': ['Incline Barbell Bench Press', 'Incline Bench Press'],
    'close-grip-bench': ['Close Grip Bench Press', 'Close-Grip Bench Press'],
    'dumbbell-flyes': ['Dumbbell Fly', 'Dumbbell Flye', 'Flat Dumbbell Fly'],
    'dumbbell-press': ['Dumbbell Bench Press', 'Flat Dumbbell Press', 'Dumbbell Press'],
    'seated-dumbbell-extensions': ['Seated Dumbbell Tricep Extension', 'Dumbbell Overhead Tricep Extension', 'Overhead Dumbbell Extension'],
    'seated-cambered-bar-extensions': ['EZ Bar Overhead Extension', 'Seated EZ Bar Extension', 'EZ Bar Tricep Extension'],
    'low-pulley-rows': ['Seated Cable Row', 'Cable Row', 'Low Cable Row'],
    'spider-curls': ['Spider Curl', 'Incline Spider Curl'],
    'machine-curls': ['Machine Bicep Curl', 'Preacher Curl Machine', 'Bicep Curl Machine'],
    'lat-pulldowns': ['Lat Pulldown', 'Wide Grip Lat Pulldown', 'Lat Pull Down'],
    'front-lat-pulldowns': ['Close Grip Lat Pulldown', 'Close-Grip Pulldown', 'Narrow Grip Lat Pulldown'],
    'standing-cable-curls': ['Standing Cable Curl', 'Cable Curl'],
    'front-lateral-raises': ['Front Raise', 'Dumbbell Front Raise', 'Front Dumbbell Raise'],
    'machine-raises': ['Lateral Raise Machine', 'Machine Lateral Raise'],
    'front-squats': ['Front Squat', 'Barbell Front Squat'],
    'leg-extensions': ['Leg Extension', 'Machine Leg Extension'],
    'standing-leg-curls': ['Standing Leg Curl', 'Single Leg Curl'],
    'hack-squats': ['Hack Squat', 'Machine Hack Squat'],
    'lying-leg-curls': ['Lying Leg Curl', 'Lying Hamstring Curl'],
    'incline-dumbbell-press': ['Incline Dumbbell Press', 'Incline Dumbbell Bench Press'],
    'incline-dumbbell-flyes': ['Incline Dumbbell Fly', 'Incline Dumbbell Flye'],
    'skullcrushers': ['Skullcrusher', 'Lying Tricep Extension', 'EZ Bar Skullcrusher'],
    'machine-pressdown-dips': ['Dip', 'Machine Dip', 'Assisted Dip'],
    'decline-bench-press': ['Decline Barbell Bench Press', 'Decline Bench Press'],
    'decline-dumbbell-press': ['Decline Dumbbell Press', 'Decline Dumbbell Bench Press'],
    'seated-tricep-extension': ['Seated Dumbbell Tricep Extension', 'Dumbbell Overhead Tricep Extension'],
    'seated-calf-raises': ['Seated Calf Raise', 'Machine Seated Calf Raise'],
    'donkey-raises': ['Donkey Calf Raise', 'Standing Calf Raise'],
    'crunches': ['Crunch', 'Ab Crunch'],
  };

  // Search for each exercise in the database
  console.log('\n=== Searching for exercises in database ===');
  for (const [exerciseId, searchTerms] of Object.entries(exerciseSearchMap)) {
    let found = false;
    for (const searchTerm of searchTerms) {
      const exercise = await prisma.exercises.findFirst({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      });

      if (exercise) {
        exerciseMapping[exerciseId] = exercise.id;
        console.log(`✅ ${exerciseId} -> ${exercise.name} (${exercise.id})`);
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`❌ ${exerciseId} - NOT FOUND (searched: ${searchTerms.join(', ')})`);
    }
  }

  // Check how many exercises we found
  const foundCount = Object.keys(exerciseMapping).length;
  const totalCount = Object.keys(exerciseSearchMap).length;
  console.log(`\n=== Found ${foundCount}/${totalCount} exercises ===`);

  if (foundCount < totalCount) {
    console.log('\n⚠️  Some exercises were not found. You may need to:');
    console.log('1. Adjust search terms');
    console.log('2. Create missing exercises manually');
    console.log('3. Use similar exercises as substitutes');

    // Show which exercises are missing
    const missingExercises = Object.keys(exerciseSearchMap).filter(id => !exerciseMapping[id]);
    console.log('\nMissing exercises:', missingExercises);
  }

  // Now populate the workouts
  console.log('\n=== Populating workouts ===');

  // Get all workouts for this program
  const workouts = await prisma.program_workouts.findMany({
    where: {
      program_microcycles: {
        program_phases: {
          programId: 'ronnie-coleman-mass-builder',
        },
      },
    },
    include: {
      program_microcycles: true,
    },
    orderBy: [
      { dayNumber: 'asc' },
    ],
  });

  console.log(`Found ${workouts.length} workouts to populate`);

  // Populate each workout with exercises
  let totalExercisesCreated = 0;
  for (const workout of workouts) {
    const dayNumber = workout.dayNumber;

    // Find the corresponding day in the template (1-indexed)
    const trainingDay = ronnieData.training_days.find(d => d.day === dayNumber);

    if (!trainingDay) {
      console.log(`⚠️  No training data for day ${dayNumber}`);
      continue;
    }

    // Create exercises for this workout
    for (const exercise of trainingDay.exercises) {
      const dbExerciseId = exerciseMapping[exercise.exercise_id];

      if (!dbExerciseId) {
        console.log(`⚠️  Skipping ${exercise.exercise_name} (${exercise.exercise_id}) - not found in database`);
        continue;
      }

      // Parse sets and reps
      let sets = 3; // default
      if (typeof exercise.sets === 'number') {
        sets = exercise.sets;
      } else if (typeof exercise.sets === 'string') {
        const parsed = parseInt(exercise.sets, 10);
        if (!isNaN(parsed)) sets = parsed;
      }

      let repsMin = 8, repsMax = 12; // defaults
      if (typeof exercise.reps === 'string') {
        if (exercise.reps.toLowerCase().includes('amrap') || exercise.reps.toLowerCase().includes('failure')) {
          repsMin = 15;
          repsMax = 30;
        } else if (exercise.reps.includes('-')) {
          const parts = exercise.reps.split('-');
          repsMin = parseInt(parts[0], 10) || 8;
          repsMax = parseInt(parts[1], 10) || 12;
        } else {
          const parsed = parseInt(exercise.reps, 10);
          if (!isNaN(parsed)) {
            repsMin = parsed;
            repsMax = parsed;
          }
        }
      }

      // Create the workout exercise
      await prisma.program_workout_exercises.create({
        data: {
          workoutId: workout.id,
          fixedExerciseId: dbExerciseId,
          exerciseOrder: exercise.order,
          sets: sets,
          repsMin: repsMin,
          repsMax: repsMax,
          restSeconds: exercise.rest_seconds || 90,
          tempo: exercise.tempo || null,
          notes: exercise.notes || null,
        },
      });

      totalExercisesCreated++;
    }
  }

  console.log(`\n✅ Created ${totalExercisesCreated} workout exercises across ${workouts.length} workouts`);
  console.log('Ronnie Coleman program population complete!');
}

populateRonnieColeman()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
