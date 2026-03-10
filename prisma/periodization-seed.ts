/**
 * Periodization System Seed
 * Seeds legendary athletes and their training programs
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🏋️ Seeding Periodization System...');

  // Create a system user for created templates
  let systemUser = await prisma.users.findFirst({
    where: { email: 'system@massimino.fitness' }
  });

  if (!systemUser) {
    systemUser = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: 'system@massimino.fitness',
        name: 'Massimino System',
        role: 'ADMIN',
        status: 'ACTIVE',
        updatedAt: new Date(),
      }
    });
  }

  // ===========================
  // LEGENDARY ATHLETES
  // ===========================

  console.log('📝 Creating Legendary Athletes...');

  // 1. Golden Era Legend
  const arnold = await prisma.legendary_athletes.upsert({
    where: { slug: 'arnold-schwarzenegger' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Golden Era Legend',
      slug: 'arnold-schwarzenegger',
      eraLabel: 'Golden Era Bodybuilding',
      yearsActive: '1960s-1980s',
      achievements: [
        'Multiple top-tier bodybuilding titles',
        'Dominant competitor across multiple federations',
        'Pioneered mainstream bodybuilding culture',
        'Bodybuilding Hall of Fame'
      ],
      bio: `A legendary figure in golden era bodybuilding, widely regarded as one of the most influential bodybuilders of all time. Known for an approach to training that emphasized high volume, intensity, and the "mind-muscle connection," this athlete popularized bodybuilding worldwide and brought it into mainstream culture.`,
      trainingPhilosophy: `This training philosophy centered on "shocking the muscle" with high volume, varied exercises, and training to failure. A strong believer in the importance of visualization and the mind-muscle connection, the approach emphasized training each body part 2-3 times per week with 15-20 sets per muscle group, using techniques like supersets, drop sets, and forced reps.`,
      nationality: 'Austrian',
      birthYear: 1947,
      discipline: 'BODYBUILDING',
      isPremium: false,
      displayOrder: 1,
      isActive: true,
    }
  });

  // 2. Mass Building Legend
  const ronnie = await prisma.legendary_athletes.upsert({
    where: { slug: 'ronnie-coleman' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Mass Building Legend',
      slug: 'ronnie-coleman',
      eraLabel: 'Modern Era Bodybuilding',
      yearsActive: '1990s-2000s',
      achievements: [
        'Multiple consecutive top-tier bodybuilding titles',
        'Record-tying championship reign',
        'Known for legendary strength',
        'Elite-level squats and deadlifts for reps'
      ],
      bio: `A dominant force in modern era bodybuilding, known for incredible strength and mass. This athlete combined powerlifting-style training with bodybuilding volume, becoming one of the most decorated competitors in the sport's history. Also maintained a career in law enforcement while competing professionally.`,
      trainingPhilosophy: `This approach was unique in lifting extremely heavy weights typically associated with powerlifting, while maintaining high volume and intensity for muscle growth. The philosophy centered on going heavy on compound movements and training to absolute failure. Training 6 days per week with 30-40+ sets per session, often for 2+ hours.`,
      nationality: 'American',
      birthYear: 1964,
      discipline: 'BODYBUILDING',
      isPremium: false,
      displayOrder: 2,
      isActive: true,
    }
  });

  // 3. HIT Training Pioneer
  const mike = await prisma.legendary_athletes.upsert({
    where: { slug: 'mike-mentzer' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'HIT Training Pioneer',
      slug: 'mike-mentzer',
      eraLabel: 'High Intensity Training Era',
      yearsActive: '1970s-1980s',
      achievements: [
        'Top-tier physique competition titles',
        'Heavyweight champion competitor',
        'Pioneer of Heavy Duty Training',
        'Revolutionary training philosopher'
      ],
      bio: `A revolutionary figure who transformed bodybuilding with the "Heavy Duty" high-intensity training approach. A student of philosophy and science, this athlete applied logic and reason to training, arguing that less is more when it comes to muscle growth. The approach emphasized brief, infrequent, and intense workouts taken to absolute failure.`,
      trainingPhilosophy: `The Heavy Duty philosophy was based on the principle that intensity, not volume, stimulates muscle growth. This approach advocated training each body part once every 7-14 days with only 1-2 all-out work sets per exercise, taken beyond failure using forced reps, negatives, and rest-pause techniques. It challenged the high-volume dogma of its era and proved results with science-based training.`,
      nationality: 'American',
      birthYear: 1951,
      discipline: 'BODYBUILDING',
      isPremium: false,
      displayOrder: 3,
      isActive: true,
    }
  });

  // 4. Shadow Champion
  const dorian = await prisma.legendary_athletes.upsert({
    where: { slug: 'dorian-yates' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Shadow Champion',
      slug: 'dorian-yates',
      eraLabel: 'Blood & Guts Era',
      yearsActive: '1980s-1990s',
      achievements: [
        'Multiple consecutive top-tier bodybuilding titles',
        'Revolutionized conditioning standards',
        'Pioneer of high-intensity training',
        'Known for extreme dedication'
      ],
      bio: `A dominant champion of the 1990s known for incredible size and conditioning. Famous for a "Blood & Guts" training philosophy, this athlete brought a new level of intensity and mass to professional bodybuilding. Training in relative obscurity before shocking the world on the competition stage, with back development considered legendary.`,
      trainingPhilosophy: `Inspired by Heavy Duty principles, this approach refined high-intensity training into a distinct system. Training each muscle once per week with brief but brutally intense workouts lasting 45-60 minutes. Each exercise received 1-2 all-out work sets taken beyond failure using drop sets, forced reps, and negatives. The philosophy: "Stimulate, don't annihilate - but when you stimulate, destroy it." Meticulous workout tracking and constantly seeking to beat previous performances.`,
      nationality: 'British',
      birthYear: 1962,
      discipline: 'BODYBUILDING',
      isPremium: false,
      displayOrder: 4,
      isActive: true,
    }
  });

  // 5. Classic Physique Champion
  const cbum = await prisma.legendary_athletes.upsert({
    where: { slug: 'chris-bumstead' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Classic Physique Champion',
      slug: 'chris-bumstead',
      eraLabel: 'Modern Classic Physique Era',
      yearsActive: '2010s-Present',
      achievements: [
        'Multiple consecutive Classic Physique titles',
        'Professional League Pro Card',
        'Social Media Icon',
        'Supplement Brand Co-Founder'
      ],
      bio: `A multi-time Classic Physique champion and one of the most popular bodybuilders in the modern era. Representing the pinnacle of aesthetic bodybuilding with perfect proportions, conditioning, and charisma. This athlete has revolutionized how competitors connect with fans through social media, making bodybuilding more accessible and relatable. Overcoming health challenges while maintaining dominance has inspired millions worldwide.`,
      trainingPhilosophy: `This approach balances old-school bodybuilding principles with modern science, emphasizing the mind-muscle connection, progressive overload, and training longevity. The philosophy: "It's not about lifting the heaviest weight, it's about making the muscle work the hardest." Training 5-6 days per week using a Push/Pull/Legs split with moderate volume (12-20 sets per muscle group), focusing on controlled tempo, full range of motion, and perfecting exercise execution rather than ego-lifting. A strong belief in training sustainability and listening to your body to prevent injury.`,
      nationality: 'Canadian',
      birthYear: 1995,
      discipline: 'BODYBUILDING',
      isPremium: false,
      displayOrder: 5,
      isActive: true,
    }
  });

  console.log('✅ Created 5 legendary athletes');
  console.log(`   - ${arnold.name}`);
  console.log(`   - ${ronnie.name}`);
  console.log(`   - ${mike.name}`);
  console.log(`   - ${dorian.name}`);
  console.log(`   - ${cbum.name}`);

  // ===========================
  // ATHLETE TRAINING PHASES
  // ===========================

  console.log('📝 Creating Athlete Training Phases...');

  // Golden Era Legend's Golden Six (Beginner Program)
  await prisma.athlete_training_phases.upsert({
    where: { id: crypto.randomUUID() },
    update: {},
    create: {
      id: crypto.randomUUID(),
      athleteId: arnold.id,
      phaseName: 'Golden Six',
      era: '1960s Beginner Foundation',
      description: `A foundational routine from the golden era of bodybuilding. This full-body program emphasizes compound movements and was designed to build overall mass and strength. Perfect for beginners looking to establish a solid base.`,
      trainingPhilosophy: `Build foundational mass and strength with compound movements trained 3x per week. Focus on progressive overload and perfect form. Each exercise targets major muscle groups to develop balanced physique.`,
      durationWeeks: 12,
      frequency: 3,
      volumeLevel: 'MEDIUM',
      intensityLevel: 'MODERATE',
      nutrition: {
        calories: 3500,
        protein: 200,
        carbs: 400,
        fat: 100,
        meals: 5
      },
      keyPrinciples: [
        'Full body training 3x per week',
        'Focus on compound movements',
        'Progressive overload each workout',
        'Perfect form over heavy weight',
        'Rest 48-72 hours between sessions'
      ],
      famousQuotes: [
        '"The mind is the limit"',
        '"Train until you feel the pump"'
      ],
      displayOrder: 1,
    }
  });

  // Golden Era Legend's Blueprint to Mass (Advanced)
  await prisma.athlete_training_phases.upsert({
    where: { id: crypto.randomUUID() },
    update: {},
    create: {
      id: crypto.randomUUID(),
      athleteId: arnold.id,
      phaseName: 'Blueprint to Mass',
      era: '1970s Competition Era',
      description: `A legendary high-volume program from the golden era competition years. This routine was used to dominate multiple top-tier bodybuilding competitions. Features twice-per-day training and extreme volume with advanced techniques like supersets, drop sets, and forced reps.`,
      trainingPhilosophy: `Shock the muscles with high volume, varied exercises, and advanced intensity techniques. Train each body part 2x per week with AM/PM splits. Use mind-muscle connection and visualization to maximize each rep.`,
      durationWeeks: 16,
      frequency: 6,
      volumeLevel: 'VERY_HIGH',
      intensityLevel: 'EXTREME',
      nutrition: {
        calories: 5000,
        protein: 300,
        carbs: 500,
        fat: 150,
        meals: 6
      },
      keyPrinciples: [
        'Train each muscle group 2x per week',
        'Use supersets for antagonistic muscles',
        'Train to failure + forced reps',
        'High volume: 15-20 sets per muscle',
        'AM/PM split training',
        'Pyramid sets: 30,12,10,8,6 reps'
      ],
      famousQuotes: [
        '"The last three or four reps is what makes the muscle grow"',
        '"Shock the muscle, confuse it, make it grow"'
      ],
      displayOrder: 2,
    }
  });

  console.log('✅ Created Golden Era Legend training phases');

  // ===========================
  // INTENSITY TECHNIQUES LIBRARY
  // ===========================

  console.log('📝 Creating Intensity Techniques...');

  await prisma.intensity_techniques_library.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        code: 'DROP_SET',
        name: 'Drop Sets',
        description: 'Reduce weight immediately after reaching failure and continue for additional reps',
        instructions: `1. Perform set to failure with your working weight
2. Immediately reduce weight by 20-30%
3. Continue to failure again
4. Optional: Drop weight again for triple drop set
5. Rest normally before next set`,
        difficulty: 'INTERMEDIATE',
        muscleStimulus: 'HYPERTROPHY',
        famousUsers: ['Elite Bodybuilder', 'Pro Physique Athlete', 'Golden Era Legend'],
        safetyNotes: 'Use machine exercises or dumbbells for safety. Have spotter for barbell movements.',
      },
      {
        id: crypto.randomUUID(),
        code: 'REST_PAUSE',
        name: 'Rest-Pause',
        description: 'Brief rest periods within a single extended set',
        instructions: `1. Perform set to failure
2. Rest 10-15 seconds
3. Continue for 2-3 more reps
4. Rest another 10-15 seconds
5. Continue for 1-2 final reps`,
        difficulty: 'ADVANCED',
        muscleStimulus: 'STRENGTH',
        famousUsers: ['HIT Training Pioneer', 'Pro Physique Athlete'],
        safetyNotes: 'Only use on final work sets. Requires mental toughness and focus.',
      },
      {
        id: crypto.randomUUID(),
        code: 'FORCED_REPS',
        name: 'Forced Reps',
        description: 'Training partner assists to complete 2-3 reps past failure',
        instructions: `1. Perform set to failure with strict form
2. Partner provides minimal assistance on concentric
3. Continue for 2-3 additional reps
4. Partner assists only enough to keep bar moving
5. You control eccentric portion fully`,
        difficulty: 'ADVANCED',
        muscleStimulus: 'HYPERTROPHY',
        famousUsers: ['Golden Era Legend', 'Elite Bodybuilder'],
        safetyNotes: 'Requires trustworthy training partner. Not for every set.',
      },
      {
        id: crypto.randomUUID(),
        code: 'NEGATIVES',
        name: 'Negative Reps',
        description: 'Focus on slow eccentric (lowering) phase with assistance on concentric',
        instructions: `1. Partner assists you to top position
2. Lower weight very slowly (4-6 seconds)
3. Partner assists back to top
4. Repeat for 3-5 negatives
5. Use 110-120% of your 1RM`,
        difficulty: 'ADVANCED',
        muscleStimulus: 'STRENGTH',
        famousUsers: ['HIT Training Pioneer', 'Pro Physique Athlete'],
        safetyNotes: 'Causes extreme muscle damage. Use sparingly. Requires experienced spotter.',
      },
      {
        id: crypto.randomUUID(),
        code: 'SUPERSET',
        name: 'Supersets',
        description: 'Two exercises performed back-to-back with no rest',
        instructions: `1. Complete first exercise to target reps
2. Immediately move to second exercise
3. Complete second exercise
4. Rest normally before next superset
5. Can be same muscle (compound set) or opposing muscles (antagonistic)`,
        difficulty: 'BEGINNER',
        muscleStimulus: 'HYPERTROPHY',
        famousUsers: ['Golden Era Legend', 'Elite Bodybuilder'],
        safetyNotes: 'Great for time efficiency. Best with opposing muscle groups.',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created intensity techniques library');

  console.log('🎉 Periodization system seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding periodization system:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
