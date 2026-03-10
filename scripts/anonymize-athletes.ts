/**
 * Anonymize legendary athletes in database
 * Removes real bodybuilder names and replaces with generic titles
 * Run with: npx tsx scripts/anonymize-athletes.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const ATHLETE_RENAMES: Record<string, { name: string; bio: string; achievements: string[]; trainingPhilosophy: string }> = {
  'arnold-schwarzenegger': {
    name: 'Golden Era Champion',
    bio: 'A legendary figure from the golden era of bodybuilding, known for high-volume training and sculpting one of the most iconic physiques in fitness history.',
    achievements: ['Multiple championship titles', 'Defined golden era aesthetics', 'Popularised bodybuilding worldwide'],
    trainingPhilosophy: 'High-volume, high-frequency training with an emphasis on mind-muscle connection and pushing past perceived limits.',
  },
  'ronnie-coleman': {
    name: 'Mass Building Legend',
    bio: 'One of the most dominant champions in bodybuilding history, known for extraordinary mass and strength that redefined what was possible in the sport.',
    achievements: ['Record-tying championship reign', 'Legendary strength feats', 'Pioneered ultra-heavy training'],
    trainingPhilosophy: 'Ultra-heavy compound movements with high volume. Train with maximum intensity on every set.',
  },
  'mike-mentzer': {
    name: 'HIT Training Pioneer',
    bio: 'A revolutionary thinker who challenged conventional training wisdom and proved that less can be more when intensity is maximised.',
    achievements: ['Perfect competition score', 'Pioneered High Intensity Training', 'Transformed training methodology'],
    trainingPhilosophy: 'High Intensity Training (HIT): brief, infrequent, and intense workouts taken to absolute muscular failure.',
  },
  'dorian-yates': {
    name: 'Shadow Champion',
    bio: 'A reclusive champion who trained in near-isolation and emerged as one of the most dominant forces in bodybuilding history.',
    achievements: ['Multiple consecutive titles', 'Pioneered Blood & Guts training', 'Transformed competitive bodybuilding standards'],
    trainingPhilosophy: 'Blood & Guts: low volume, maximum intensity training with one working set taken beyond failure.',
  },
  'cbum': {
    name: 'Classic Physique Champion',
    bio: 'A modern icon of classic physique bodybuilding, known for bringing back the aesthetics and proportions of the golden era.',
    achievements: ['Multiple classic physique titles', 'Revived golden era aesthetics', 'Most popular modern physique athlete'],
    trainingPhilosophy: 'Balanced training combining heavy compounds with targeted isolation work, emphasising symmetry and proportion.',
  },
};

async function anonymizeAthletes() {
  console.log('Anonymizing legendary athletes...\n');

  const athletes = await prisma.legendary_athletes.findMany();
  console.log(`Found ${athletes.length} athletes in database.\n`);

  for (const athlete of athletes) {
    const rename = ATHLETE_RENAMES[athlete.slug];
    if (rename) {
      console.log(`  ${athlete.name} → ${rename.name} (slug: ${athlete.slug})`);
      await prisma.legendary_athletes.update({
        where: { id: athlete.id },
        data: {
          name: rename.name,
          bio: rename.bio,
          achievements: rename.achievements,
          trainingPhilosophy: rename.trainingPhilosophy,
        },
      });
    } else {
      console.log(`  ${athlete.name} — no rename needed (slug: ${athlete.slug})`);
    }
  }

  // Also update program_templates display names that reference athletes
  const programRenames: Record<string, string> = {
    "CBum's Classic Physique": 'Classic Physique Blueprint',
    "Chris Bumstead's Classic Physique": 'Classic Physique Blueprint',
    "Arnold's Golden Six": 'Golden Six Foundation',
    "Arnold Golden Six": 'Golden Six Foundation',
    "Arnold Volume Workout": 'Classic Volume Training',
    "Arnold Schwarzenegger Volume Workout": 'Classic Volume Training',
    "Ronnie Coleman's Mass Builder": 'Mass Builder Program',
    "Ronnie Coleman Mass Builder": 'Mass Builder Program',
    "Mike Mentzer's Heavy Duty": 'Heavy Duty HIT Program',
    "Mike Mentzer Heavy Duty": 'Heavy Duty HIT Program',
  };

  const templates = await prisma.program_templates.findMany({
    select: { id: true, name: true, description: true },
  });

  for (const template of templates) {
    const newName = programRenames[template.name];
    if (newName) {
      console.log(`\n  Program: "${template.name}" → "${newName}"`);
      // Also clean description
      let newDescription = template.description || '';
      for (const realName of ['Chris Bumstead', 'Arnold Schwarzenegger', 'Arnold', 'Ronnie Coleman', 'Mike Mentzer', 'Dorian Yates']) {
        newDescription = newDescription.replace(new RegExp(realName, 'gi'), 'the champion');
      }
      await prisma.program_templates.update({
        where: { id: template.id },
        data: { name: newName, description: newDescription },
      });
    }
  }

  console.log('\nDone! All athlete names anonymized.');
}

anonymizeAthletes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
