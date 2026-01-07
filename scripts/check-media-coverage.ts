/**
 * Check Final Media Coverage for Program Exercises
 */

import * as fs from 'fs';

const exercises: string[] = JSON.parse(fs.readFileSync('/tmp/program_exercises.json', 'utf-8'));

// Split into batches of 50
const batches: string[][] = [];
for (let i = 0; i < exercises.length; i += 50) {
  batches.push(exercises.slice(i, i + 50));
}

async function checkCoverage() {
  let withMedia = 0;
  let withoutMedia = 0;
  const missing: string[] = [];

  for (const batch of batches) {
    const res = await fetch('http://localhost:3000/api/workout/exercises/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseNames: batch }),
    });

    const data = await res.json();
    for (const [name, info] of Object.entries(data.exercises)) {
      if (info && (info as any).hasMedia && (info as any).coverUrl) {
        withMedia++;
      } else {
        withoutMedia++;
        missing.push(name);
      }
    }
  }

  console.log('=== FINAL MEDIA COVERAGE ===\n');
  console.log(`Total exercises: ${exercises.length}`);
  console.log(`With media: ${withMedia} (${((withMedia / exercises.length) * 100).toFixed(1)}%)`);
  console.log(`Without media: ${withoutMedia} (${((withoutMedia / exercises.length) * 100).toFixed(1)}%)`);

  if (missing.length > 0 && missing.length <= 30) {
    console.log('\nExercises still missing media:');
    missing.forEach(m => console.log(`  - ${m}`));
  } else if (missing.length > 30) {
    console.log(`\nFirst 30 exercises still missing media:`);
    missing.slice(0, 30).forEach(m => console.log(`  - ${m}`));
    console.log(`  ... and ${missing.length - 30} more`);
  }
}

checkCoverage();
