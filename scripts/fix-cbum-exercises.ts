/**
 * Fix CBum program exercises - add aliases for better matching
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

// Map CBum exercise names to likely database matches
const CBUM_ALIASES: Record<string, string[]> = {
  // Triceps
  'Overhead Triceps Extensions (Cable or Dumbbell)': ['Overhead Tricep Extension', 'Cable Overhead Tricep Extension', 'Dumbbell Tricep Extension'],
  // Biceps
  'Preacher Curls (EZ Bar or Dumbbell)': ['Preacher Curl', 'EZ Bar Preacher Curl', 'Dumbbell Preacher Curl'],
  'Incline Dumbbell Curls / Spider Curls': ['Incline Dumbbell Curl', 'Spider Curl'],
  'Cable Curls / Reverse Grip EZ Bar Curls': ['Cable Curl', 'Cable Bicep Curl', 'Reverse Curl'],
  // Back
  'Lat Pulldown (Light)': ['Lat Pulldown', 'Cable Lat Pulldown'],
  'Lat Pulldown (Medium/Wide Grip)': ['Wide Grip Lat Pulldown', 'Lat Pulldown'],
  'Bent Over Barbell Row (Underhand Grip)': ['Barbell Row', 'Bent Over Row', 'Underhand Barbell Row'],
  'Chest-Supported Dumbbell Row (Single Arm)': ['Dumbbell Row', 'Single Arm Dumbbell Row', 'Chest Supported Row'],
  'One Arm Seated Cable Row': ['Seated Cable Row', 'Cable Row', 'Single Arm Cable Row'],
  // Chest
  'Incline Dumbbell Bench Press': ['Incline Dumbbell Press', 'Incline Press'],
  'Cable Crossovers (High to Low)': ['Cable Crossover', 'High Cable Crossover'],
  'Cable Crossovers (Low to High)': ['Low Cable Crossover', 'Cable Fly'],
  // Legs
  'Light Leg Curls': ['Leg Curl', 'Lying Leg Curl', 'Seated Leg Curl'],
  // Rest
  'Complete Rest or Light Activity': ['Rest', 'Active Recovery']
};

async function main() {
  console.log('=== Fixing CBum Exercise Aliases ===\n');

  let fixed = 0;
  let notFound = 0;

  for (const [cbumName, searchTerms] of Object.entries(CBUM_ALIASES)) {
    // Find an exercise with media that matches one of the search terms
    let matchedEx: { id: string; name: string; aliasNames: string[]; imageUrl: string | null } | null = null;

    for (const term of searchTerms) {
      const ex = await prisma.exercises.findFirst({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { aliasNames: { has: term } }
          ],
          imageUrl: { not: null }
        },
        select: { id: true, name: true, aliasNames: true, imageUrl: true }
      });

      if (ex) {
        matchedEx = ex;
        break;
      }
    }

    if (matchedEx) {
      // Add the CBum name as an alias if not already present
      if (!matchedEx.aliasNames?.includes(cbumName)) {
        await prisma.exercises.update({
          where: { id: matchedEx.id },
          data: {
            aliasNames: [...(matchedEx.aliasNames || []), cbumName],
            updatedAt: new Date()
          }
        });
        console.log(`Added "${cbumName}" -> "${matchedEx.name}"`);
        fixed++;
      } else {
        console.log(`"${cbumName}" already aliased to "${matchedEx.name}"`);
      }
    } else {
      console.log(`No match found for: ${cbumName}`);
      notFound++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Not found: ${notFound}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
