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

  // 1. Arnold Schwarzenegger
  const arnold = await prisma.legendary_athletes.upsert({
    where: { slug: 'arnold-schwarzenegger' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Arnold Schwarzenegger',
      slug: 'arnold-schwarzenegger',
      eraLabel: 'Golden Era Bodybuilding',
      yearsActive: '1960s-1980s',
      achievements: [
        '7x Mr. Olympia (1970-1975, 1980)',
        '5x Mr. Universe',
        '1975 Mr. World',
        'Bodybuilding Hall of Fame'
      ],
      bio: `Arnold Schwarzenegger is arguably the most famous bodybuilder of all time. Born in Austria in 1947, he became the youngest Mr. Universe at age 20 and went on to win 7 Mr. Olympia titles. His approach to training emphasized high volume, intensity, and the "mind-muscle connection." Arnold popularized bodybuilding worldwide and brought it into mainstream culture.`,
      trainingPhilosophy: `Arnold's training philosophy centered on "shocking the muscle" with high volume, varied exercises, and training to failure. He believed in the importance of visualization and the mind-muscle connection. His famous quote "The last three or four reps is what makes the muscle grow" epitomizes his approach to intensity. He trained each body part 2-3 times per week with 15-20 sets per muscle group, using techniques like supersets, drop sets, and forced reps.`,
      nationality: 'Austrian',
      birthYear: 1947,
      discipline: 'BODYBUILDING',
      isPremium: false,
      displayOrder: 1,
      isActive: true,
    }
  });

  // 2. Ronnie Coleman
  const ronnie = await prisma.legendary_athletes.upsert({
    where: { slug: 'ronnie-coleman' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Ronnie Coleman',
      slug: 'ronnie-coleman',
      eraLabel: 'Modern Era Bodybuilding',
      yearsActive: '1990s-2000s',
      achievements: [
        '8x Mr. Olympia (1998-2005)',
        'Tied record holder with Lee Haney',
        'Known for legendary strength',
        '800lb squats and deadlifts for reps'
      ],
      bio: `Ronnie Coleman is an 8-time Mr. Olympia winner, tying Lee Haney's record. Known for his incredible strength and mass, Ronnie combined powerlifting-style training with bodybuilding volume. His famous catchphrases "Yeah buddy!" and "Lightweight baby!" became iconic in fitness culture. He worked as a police officer while competing professionally.`,
      trainingPhilosophy: `Ronnie's approach was unique in that he lifted extremely heavy weights typically associated with powerlifting, while maintaining high volume and intensity for muscle growth. He believed in going heavy on compound movements and training to absolute failure. His philosophy: "Everybody wants to be a bodybuilder, but nobody wants to lift no heavy-ass weights." He trained 6 days per week with 30-40+ sets per session, often training for 2+ hours.`,
      nationality: 'American',
      birthYear: 1964,
      discipline: 'BODYBUILDING',
      isPremium: false,
      displayOrder: 2,
      isActive: true,
    }
  });

  // 3. Mike Mentzer
  const mike = await prisma.legendary_athletes.upsert({
    where: { slug: 'mike-mentzer' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Mike Mentzer',
      slug: 'mike-mentzer',
      eraLabel: 'High Intensity Training Era',
      yearsActive: '1970s-1980s',
      achievements: [
        '1978 Mr. Universe (First Perfect Score)',
        '1979 Mr. Olympia Heavyweight Winner',
        'Pioneer of Heavy Duty Training',
        'Revolutionary training philosopher'
      ],
      bio: `Mike Mentzer revolutionized bodybuilding with his "Heavy Duty" high-intensity training approach. A student of philosophy and science, he applied logic and reason to training, arguing that less is more when it comes to muscle growth. His approach emphasized brief, infrequent, and intense workouts taken to absolute failure.`,
      trainingPhilosophy: `Mentzer's Heavy Duty philosophy was based on the principle that intensity, not volume, stimulates muscle growth. He advocated training each body part once every 7-14 days with only 1-2 all-out work sets per exercise, taken beyond failure using forced reps, negatives, and rest-pause techniques. His famous quote: "That last rep where you're shaking is what turns on the growth mechanism." He challenged the high-volume dogma of his era and proved results with science-based training.`,
      nationality: 'American',
      birthYear: 1951,
      discipline: 'BODYBUILDING',
      isPremium: false,
      displayOrder: 3,
      isActive: true,
    }
  });

  // 4. Dorian Yates
  const dorian = await prisma.legendary_athletes.upsert({
    where: { slug: 'dorian-yates' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Dorian Yates',
      slug: 'dorian-yates',
      eraLabel: 'Blood & Guts Era',
      yearsActive: '1980s-1990s',
      achievements: [
        '6x Mr. Olympia (1992-1997)',
        'Revolutionized conditioning standards',
        'Pioneer of high-intensity training',
        'Known for extreme dedication'
      ],
      bio: `Dorian Yates dominated the 1990s with his incredible size and conditioning. Known for his "Blood & Guts" training philosophy, Dorian brought a new level of intensity and mass to professional bodybuilding. He trained in relative obscurity in Birmingham, England, shocking the world when he debuted on the Olympia stage. His back development is considered legendary.`,
      trainingPhilosophy: `Inspired by Mike Mentzer's Heavy Duty principles, Dorian refined high-intensity training into his own system. He trained each muscle once per week with brief but brutally intense workouts lasting 45-60 minutes. Each exercise received 1-2 all-out work sets taken beyond failure using drop sets, forced reps, and negatives. His mantra: "Stimulate, don't annihilate - but when you stimulate, destroy it." He meticulously tracked every workout in journals and constantly sought to beat previous performances.`,
      nationality: 'British',
      birthYear: 1962,
      discipline: 'BODYBUILDING',
      isPremium: false,
      displayOrder: 4,
      isActive: true,
    }
  });

  // 5. Chris Bumstead (CBum)
  const cbum = await prisma.legendary_athletes.upsert({
    where: { slug: 'chris-bumstead' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Chris Bumstead',
      slug: 'chris-bumstead',
      eraLabel: 'Modern Classic Physique Era',
      yearsActive: '2010s-Present',
      achievements: [
        '5x Mr. Olympia Classic Physique (2019-2023)',
        'IFBB Professional League Pro Card',
        'Social Media Icon (10M+ followers)',
        'RAW Nutrition Co-Founder'
      ],
      bio: `Chris Bumstead, known as "CBum," is a 5-time Mr. Olympia Classic Physique champion and one of the most popular bodybuilders in the world. Born in Canada in 1995, he represents the modern era of aesthetic bodybuilding with his perfect proportions, conditioning, and charisma. CBum has revolutionized how athletes connect with fans through social media, making bodybuilding more accessible and relatable. His battle with IgA nephropathy and continued dominance has inspired millions worldwide.`,
      trainingPhilosophy: `CBum's approach balances old-school bodybuilding principles with modern science. He emphasizes the mind-muscle connection, progressive overload, and training longevity. His philosophy: "It's not about lifting the heaviest weight, it's about making the muscle work the hardest." He trains 5-6 days per week using a Push/Pull/Legs split with moderate volume (12-20 sets per muscle group). CBum focuses on controlled tempo, full range of motion, and perfecting exercise execution rather than ego-lifting. He believes in training sustainability and listening to your body to prevent injury.`,
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

  // Arnold's Golden Six (Beginner Program)
  await prisma.athlete_training_phases.upsert({
    where: { id: crypto.randomUUID() },
    update: {},
    create: {
      id: crypto.randomUUID(),
      athleteId: arnold.id,
      phaseName: 'Golden Six',
      era: '1960s Beginner Foundation',
      description: `Arnold's foundational routine from his early training days. This full-body program emphasizes compound movements and was designed to build overall mass and strength. Perfect for beginners looking to establish a solid base.`,
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

  // Arnold's Blueprint to Mass (Advanced)
  await prisma.athlete_training_phases.upsert({
    where: { id: crypto.randomUUID() },
    update: {},
    create: {
      id: crypto.randomUUID(),
      athleteId: arnold.id,
      phaseName: 'Blueprint to Mass',
      era: '1970s Competition Era',
      description: `Arnold's legendary high-volume program from his competitive years. This is the actual routine he used to win multiple Mr. Olympia titles. Features twice-per-day training and extreme volume with advanced techniques like supersets, drop sets, and forced reps.`,
      trainingPhilosophy: `Shock the muscles with high volume, varied exercises, and advanced intensity techniques. Train each body part 2x per week with AM/PM splits. Use mind-muscle connection and visualization to maximize each rep. "The last three or four reps is what makes the muscle grow."`,
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

  console.log('✅ Created Arnold training phases');

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
        famousUsers: ['Ronnie Coleman', 'Dorian Yates', 'Arnold Schwarzenegger'],
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
        famousUsers: ['Mike Mentzer', 'Dorian Yates'],
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
        famousUsers: ['Arnold Schwarzenegger', 'Ronnie Coleman'],
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
        famousUsers: ['Mike Mentzer', 'Dorian Yates'],
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
        famousUsers: ['Arnold Schwarzenegger', 'Ronnie Coleman'],
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
