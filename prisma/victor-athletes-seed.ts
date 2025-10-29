/**
 * Victor's Athletes Setup Script
 * Adds all current client users as athletes to Victor's trainer account
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('👥 Setting up Victor\'s Athletes...');

  // Find Victor's account
  const victor = await prisma.users.findUnique({
    where: { email: 'vsoleferioli@gmail.com' }
  });

  if (!victor) {
    console.error('❌ Victor\'s account not found!');
    process.exit(1);
  }

  console.log(`✅ Found Victor: ${victor.name} (${victor.email})`);
  console.log(`   Role: ${victor.role}, Trainer Verified: ${victor.trainerVerified}`);

  // Check if Victor has a trainer profile, create if not
  let trainerProfile = await prisma.trainer_profiles.findFirst({
    where: { userId: victor.id }
  });

  if (!trainerProfile) {
    console.log('\n📝 Creating trainer profile for Victor...');
    trainerProfile = await prisma.trainer_profiles.create({
      data: {
        id: crypto.randomUUID(),
        userId: victor.id,
        businessName: 'Victor Solé Personal Training',
        businessDescription: 'Personal training and fitness coaching',
        specializations: ['Strength Training', 'Nutrition Coaching', 'Program Design'],
        certifications: {},
        experienceYears: 5,
        hourlyRate: 50,
        currency: 'EUR',
        availability: {},
        languages: ['English', 'Spanish', 'Catalan'],
        timezone: 'Europe/Madrid',
        trainerRating: 5.0,
        totalClients: 0,
        activeClients: 0,
        isVerified: true,
        verificationLevel: 'PREMIUM',
        updatedAt: new Date(),
      }
    });
    console.log(`✅ Created trainer profile ID: ${trainerProfile.id}`);
  } else {
    console.log(`✅ Using existing trainer profile ID: ${trainerProfile.id}`);
  }

  // Get all client users
  const clients = await prisma.users.findMany({
    where: {
      role: 'CLIENT',
      status: 'ACTIVE',
      email: {
        not: 'system@massimino.fitness'
      }
    }
  });

  console.log(`\n📋 Found ${clients.length} client users to add as athletes\n`);

  // Check existing relationships to avoid duplicates
  const existingRelationships = await prisma.trainer_clients.findMany({
    where: {
      trainerId: trainerProfile.id
    }
  });

  const existingClientIds = new Set(existingRelationships.map(r => r.clientId));

  // Create trainer-client relationships
  let added = 0;
  let skipped = 0;

  for (const client of clients) {
    if (existingClientIds.has(client.id)) {
      console.log(`⏭️  Skipped: ${client.name || 'No name'} (${client.email}) - Already an athlete`);
      skipped++;
      continue;
    }

    const now = new Date();
    const relationship = await prisma.trainer_clients.create({
      data: {
        id: crypto.randomUUID(),
        trainerId: trainerProfile.id,
        clientId: client.id,
        status: 'ACTIVE',
        startDate: now,
        source: 'MANUAL',
        notes: 'Added via setup script - Victor family/friends',
        goals: [],
        medicalConditions: [],
        preferences: {},
        updatedAt: now,
      }
    });

    console.log(`✅ Added: ${client.name || 'No name'} (${client.email})`);
    added++;
  }

  console.log(`\n🎉 Setup Complete!`);
  console.log(`   Added: ${added} new athletes`);
  console.log(`   Skipped: ${skipped} existing athletes`);
  console.log(`   Total athletes: ${added + skipped}`);
  console.log(`\n👉 Visit https://dev.massimino.fitness/my-athletes to see your athletes!\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error setting up athletes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
