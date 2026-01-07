/**
 * Find missing exercises and add aliases
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';

const MISSING_EXERCISES = [
  'Romanian Deadlift',
  'Glute Bridge',
  'Wide Grip Barbell Bench Press',
  'Chin-Ups',
  'Barbell Pullover',
  'Overhead Barbell Press',
  'Military Press'
];

// Mappings for exercises that might be named differently
const ALIAS_MAPPINGS: Record<string, string[]> = {
  'Romanian Deadlift': ['Romanian Deadlifts', 'RDL', 'Stiff Leg Deadlift'],
  'Glute Bridge': ['Glute Bridges', 'Hip Bridge', 'Barbell Hip Thrust', 'Hip Thrust'],
  'Wide Grip Barbell Bench Press': ['Wide Grip Bench Press', 'Barbell Bench Press'],
  'Chin-Ups (or Barbell Pullover)': ['Chin-Up', 'Chin Ups', 'Chinup', 'Pull-Up', 'Pullup'],
  'Overhead Barbell Press (Military Press)': ['Military Press', 'Overhead Press', 'Standing Barbell Press', 'Barbell Shoulder Press', 'Shoulder Press'],
};

async function main() {
  console.log('=== Finding Missing Exercises ===\n');

  for (const name of MISSING_EXERCISES) {
    // Try to find the exercise with different search patterns
    const found = await prisma.exercises.findFirst({
      where: {
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          { aliasNames: { hasSome: [name] } }
        ]
      },
      select: { id: true, name: true, imageUrl: true, aliasNames: true }
    });

    if (found) {
      console.log(`${name}: ${found.imageUrl ? 'HAS MEDIA' : 'NO MEDIA'} - "${found.name}"`);

      // If found but missing alias, add it
      if (!found.aliasNames?.includes(name) && found.name !== name) {
        await prisma.exercises.update({
          where: { id: found.id },
          data: {
            aliasNames: [...(found.aliasNames || []), name],
            updatedAt: new Date()
          }
        });
        console.log(`  -> Added alias "${name}"`);
      }
    } else {
      console.log(`${name}: NOT FOUND - searching broader...`);

      // Try broader search
      const broader = await prisma.exercises.findFirst({
        where: {
          name: { contains: name.split(' ')[0], mode: 'insensitive' }
        },
        select: { id: true, name: true, imageUrl: true }
      });

      if (broader) {
        console.log(`  -> Possible match: "${broader.name}" (${broader.imageUrl ? 'has media' : 'no media'})`);
      }
    }
  }

  // Add alias mappings
  console.log('\n=== Adding Alias Mappings ===\n');

  for (const [targetName, aliases] of Object.entries(ALIAS_MAPPINGS)) {
    // Find exercise that matches any alias
    for (const alias of aliases) {
      const ex = await prisma.exercises.findFirst({
        where: {
          OR: [
            { name: { equals: alias, mode: 'insensitive' } },
            { name: { contains: alias, mode: 'insensitive' } }
          ],
          imageUrl: { not: null }
        },
        select: { id: true, name: true, aliasNames: true, imageUrl: true }
      });

      if (ex) {
        const newAliases = [targetName, ...aliases].filter(a =>
          !ex.aliasNames?.includes(a) && a.toLowerCase() !== ex.name.toLowerCase()
        );

        if (newAliases.length > 0) {
          await prisma.exercises.update({
            where: { id: ex.id },
            data: {
              aliasNames: [...new Set([...(ex.aliasNames || []), ...newAliases])],
              updatedAt: new Date()
            }
          });
          console.log(`${ex.name}: Added aliases ${newAliases.join(', ')}`);
        } else {
          console.log(`${ex.name}: Already has all aliases`);
        }
        break;
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
