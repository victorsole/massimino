/**
 * Add Exercise Aliases for Better Matching
 *
 * This script adds aliases to exercises so the enrichment API can match
 * program exercise names to database exercises with media.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

// Canonical exercise names and their aliases
const CANONICAL_ALIASES: Record<string, string[]> = {
  // Plural/singular variations
  'Barbell Back Squat': ['Barbell Back Squats', 'Back Squats', 'Back Squat'],
  'Barbell Curl': ['Barbell Curls'],
  'Bodyweight Squat': ['Bodyweight Squats'],
  'Close Grip Bench Press': ['Close-Grip Bench Press'],
  'Dead Bug': ['Dead Bugs'],
  'Dumbbell Biceps Curl': ['Dumbbell Biceps Curls'],
  'Dumbbell Pullover': ['Dumbbell Pullovers'],
  'Lateral Raise': ['Lateral Raises', 'Dumbbell Lateral Raise', 'Dumbbell Lateral Raises', 'Standing Dumbbell Lateral Raise'],
  'Leg Extension': ['Leg Extensions'],
  'Lying Leg Curl': ['Lying Leg Curls', 'Leg Curls', 'Lying Hamstring Curls'],
  'Pull Up': ['Pull-up', 'Pull-ups', 'Pull Ups', 'Pullup', 'Pullups'],
  'Push Up': ['Push-up', 'Push-ups', 'Push Ups', 'Pushup', 'Pushups'],
  'Romanian Deadlift': ['Romanian Deadlifts', 'RDL', 'Dumbbell Romanian Deadlifts'],
  'Seated Calf Raise': ['Seated Calf Raises'],
  'Single Leg Romanian Deadlift': ['Single-Leg Romanian Deadlifts', 'Single-leg Romanian Deadlift', 'Single Leg RDL'],
  'Standing Calf Raise': ['Standing Calf Raises', 'Calf Raises', 'Calf Raise'],
  'Stiff Leg Deadlift': ['Stiff-Leg Deadlift', 'Straight Leg Deadlift'],
  'T Bar Row': ['T-Bar Row', 'T-Bar Rows'],
  'Wrist Curl': ['Wrist Curls'],

  // Common variations
  'Barbell Bench Press': ['Bench Press', 'Flat Barbell Bench Press', 'Flat Bench Press'],
  'Incline Barbell Bench Press': ['Incline Bench Press', 'Incline Barbell Press'],
  'Incline Dumbbell Press': ['Incline Dumbbell Bench Press', 'Incline Dumbbell Chest Press'],
  'Decline Dumbbell Press': ['Decline Dumbbell Chest Press', 'Decline Dumbbell Bench Press'],
  'Dumbbell Flye': ['Dumbbell Fly', 'Dumbbell Chest Fly', 'Flat Dumbbell Flyes', 'Flat Dumbbell Fly'],
  'Incline Dumbbell Flye': ['Incline Dumbbell Flyes', 'Incline Dumbbell Fly'],
  'Tricep Pushdown': ['Triceps Pushdown', 'Cable Pushdown', 'Rope Pushdowns', 'Tricep Pushdowns'],
  'Face Pull': ['Face Pulls'],
  'Hammer Curl': ['Hammer Curls'],
  'Preacher Curl': ['Preacher Curls'],
  'Skull Crusher': ['Skull Crushers', 'EZ Bar Skull Crushers', 'Skullcrushers'],
  'Cable Curl': ['Cable Curls', 'Standing Cable Curls'],
  'Good Morning': ['Good Mornings', 'Bodyweight Good Mornings'],
  'Hyperextension': ['Hyperextensions', '45-Degree Hyperextension'],
  'Goblet Squat': ['Goblet Squats', 'Kettlebell Goblet Squat', 'Goblet Squat (light weight)'],
  'Front Squat': ['Front Squats'],
  'Hack Squat': ['Hack Squats'],
  'Bulgarian Split Squat': ['Bulgarian Split Squats'],
  'Lunge': ['Lunges', 'Walking Lunges', 'Barbell Lunge'],
  'Step Up': ['Step Ups', 'Step-up to Balance', 'Box Step-ups with Knee Drive'],
  'Dip': ['Dips', 'Dip (Weighted if possible)', 'Bodyweight Bar Dips / Machine Dips'],
  'Overhead Tricep Extension': ['Overhead Triceps Extensions', 'Dumbbell Overhead Triceps Extension', 'Overhead Cable Triceps Extensions'],
  'Shrug': ['Shrugs', 'Barbell Shrugs', 'Dumbbell Shrugs'],
  'Rear Delt Fly': ['Rear Delt Flye', 'Bent Over Dumbbell Reverse Fly', 'Rear Delt Lateral Raise'],
  'Front Raise': ['Front Raises', 'Cable Front Raises', 'Front Lateral Dumbbell Raises'],
  'Deadlift': ['Barbell Deadlift', 'Barbell Deadlifts', 'Barbell Deadlifts (Optional)'],
  'Glute Bridge': ['Glute Bridges', 'Floor Bridge', 'Single-Leg Glute Bridges'],
  'Crunch': ['Crunches', 'Floor Crunch'],
  'Plank': ['Planks', 'Front Plank'],
  'Sit Up': ['Sit-Ups', 'Situps'],
  'Lat Pulldown': ['Lat Pulldowns', 'Wide Grip Lat Pulldowns', 'Machine Lat Pulldown', 'Seated Lat Pulldown'],
  'Seated Cable Row': ['Seated Rows', 'Seated Pulley Row', 'Low Pulley Rows (Seated Cable Rows)'],
  'Barbell Row': ['Barbell Rows', 'Bent Over Barbell Row', 'Barbell Bent Over Row'],
  'Spider Curl': ['Spider Curls'],
  'Cable Lateral Raise': ['Single Arm Cable Lateral Raises', 'Dumbbell/Cable Lateral Raises'],
  'Pec Deck': ['Pec Deck Flyes', 'Pec Deck Fly'],
  'Donkey Calf Raise': ['Donkey Calf Raises'],
  'Wall Sit': ['Wall Sits', 'Isometric Wall Sits'],
  'Farmers Walk': ['Farmer\'s Carry', 'Farmer\'s Walks', 'Farmers Carry'],
};

async function main() {
  console.log('Adding exercise aliases...\n');

  let updated = 0;
  let notFound = 0;

  for (const [canonical, aliases] of Object.entries(CANONICAL_ALIASES)) {
    // Find exercise by canonical name or any alias
    const exercise = await prisma.exercises.findFirst({
      where: {
        OR: [
          { name: { equals: canonical, mode: 'insensitive' } },
          ...aliases.map(alias => ({ name: { equals: alias, mode: 'insensitive' as const } })),
        ],
      },
    });

    if (exercise) {
      // Merge existing aliases with new ones
      const existingAliases = new Set((exercise.aliasNames || []).map((a: string) => a.toLowerCase()));
      const allAliases = [...aliases, canonical].map(a => a.toLowerCase());
      const newAliases = allAliases.filter(a => !existingAliases.has(a) && a.toLowerCase() !== exercise.name.toLowerCase());

      if (newAliases.length > 0) {
        const mergedAliases = [...new Set([...(exercise.aliasNames || []), ...newAliases])];
        await prisma.exercises.update({
          where: { id: exercise.id },
          data: {
            aliasNames: mergedAliases,
            updatedAt: new Date(),
          },
        });
        console.log(`✓ ${exercise.name}: added ${newAliases.length} aliases`);
        updated++;
      }
    } else {
      console.log(`✗ Not found: ${canonical}`);
      notFound++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
