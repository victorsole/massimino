import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/core/database/client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // === PART 1: Get program exercises without media ===
  const templatesDir = './src/templates';
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));

  const exercisesByProgram: Record<string, Set<string>> = {};
  const allExerciseNames = new Set<string>();

  for (const file of files) {
    let content;
    try {
      const fileContent = fs.readFileSync(path.join(templatesDir, file), 'utf8');
      if (!fileContent.trim()) continue;
      content = JSON.parse(fileContent);
    } catch (e) {
      continue;
    }
    const programName = file.replace('.json', '');
    exercisesByProgram[programName] = new Set<string>();

    const extractExercises = (obj: any) => {
      if (!obj) return;
      if (Array.isArray(obj)) {
        obj.forEach(extractExercises);
      } else if (typeof obj === 'object') {
        if (obj.exercise || obj.exerciseName || obj.name) {
          const name = obj.exercise || obj.exerciseName || obj.name;
          if (typeof name === 'string' && name.length > 0 && !name.includes('{') && name !== 'Rest') {
            exercisesByProgram[programName].add(name);
            allExerciseNames.add(name);
          }
        }
        if (obj.exercises && Array.isArray(obj.exercises)) {
          obj.exercises.forEach((ex: any) => {
            if (typeof ex === 'string') {
              exercisesByProgram[programName].add(ex);
              allExerciseNames.add(ex);
            } else if (ex.name || ex.exercise || ex.exerciseName) {
              const name = ex.name || ex.exercise || ex.exerciseName;
              if (typeof name === 'string' && name.length > 0) {
                exercisesByProgram[programName].add(name);
                allExerciseNames.add(name);
              }
            }
          });
        }
        Object.values(obj).forEach(extractExercises);
      }
    };

    extractExercises(content);
  }

  // === PART 2: Get ALL exercises without media ===
  const exercisesWithoutMedia = await prisma.exercises.findMany({
    where: {
      isActive: true,
      OR: [
        { hasMedia: false },
        { AND: [{ imageUrl: null }, { videoUrl: null }] }
      ]
    },
    select: {
      name: true,
      category: true,
      aliasNames: true
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  const noMediaSet = new Set<string>();
  const noMediaLower = new Map<string, string>();
  for (const ex of exercisesWithoutMedia) {
    noMediaSet.add(ex.name);
    noMediaLower.set(ex.name.toLowerCase(), ex.name);
    if (ex.aliasNames) {
      for (const alias of ex.aliasNames) {
        noMediaLower.set(alias.toLowerCase(), ex.name);
      }
    }
  }

  // Find program exercises without media
  const programExercisesWithoutMedia: Record<string, string[]> = {};
  for (const [program, exercises] of Object.entries(exercisesByProgram)) {
    const missing: string[] = [];
    for (const exName of exercises) {
      if (noMediaSet.has(exName) || noMediaLower.has(exName.toLowerCase())) {
        missing.push(exName);
      }
    }
    if (missing.length > 0) {
      programExercisesWithoutMedia[program] = missing.sort();
    }
  }

  const allMissingInPrograms = new Set<string>();
  for (const exercises of Object.values(programExercisesWithoutMedia)) {
    for (const ex of exercises) {
      allMissingInPrograms.add(ex);
    }
  }

  // Group all exercises by category
  const byCategory: Record<string, string[]> = {};
  for (const ex of exercisesWithoutMedia) {
    if (!byCategory[ex.category]) byCategory[ex.category] = [];
    byCategory[ex.category].push(ex.name);
  }

  // === BUILD OUTPUT ===
  let output = '# EXERCISES WITHOUT MEDIA\n';
  output += 'Generated: ' + new Date().toISOString() + '\n';
  output += '\n';
  output += 'Total exercises without media: ' + exercisesWithoutMedia.length + '\n';
  output += '\n';

  // Program exercises section
  output += '## PROGRAM EXERCISES WITHOUT MEDIA\n\n';
  output += '**Total programs with missing media:** ' + Object.keys(programExercisesWithoutMedia).length + '\n';
  output += '**Total unique exercises without media in programs:** ' + allMissingInPrograms.size + '\n\n';

  for (const [program, exercises] of Object.entries(programExercisesWithoutMedia).sort()) {
    output += '### ' + program.replace(/_/g, ' ').toUpperCase() + ' (' + exercises.length + ')\n\n';
    for (const ex of exercises) {
      output += '- ' + ex + '\n';
    }
    output += '\n';
  }

  // Full list section
  output += '---\n\n';
  output += '## ALL EXERCISES WITHOUT MEDIA BY CATEGORY\n\n';

  output += '### SUMMARY\n\n';
  for (const [cat, exercises] of Object.entries(byCategory).sort()) {
    output += '- ' + cat + ': ' + exercises.length + '\n';
  }

  output += '\n### FULL LIST\n';

  for (const [cat, exercises] of Object.entries(byCategory).sort()) {
    output += '\n#### ' + cat.toUpperCase() + ' (' + exercises.length + ')\n\n';
    for (const name of exercises) {
      output += '- ' + name + '\n';
    }
  }

  fs.writeFileSync('docs/exercises-without-media.md', output);
  console.log('Done! Saved to docs/exercises-without-media.md');
  console.log('Programs with missing media:', Object.keys(programExercisesWithoutMedia).length);
  console.log('Unique exercises without media in programs:', allMissingInPrograms.size);
  console.log('Total exercises without media:', exercisesWithoutMedia.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
