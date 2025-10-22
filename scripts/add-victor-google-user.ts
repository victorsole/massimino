// scripts/add-victor-google-user.ts
/**
 * Script to add Victor's Google account to the database
 * This allows OAuth linking to work properly
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function addVictorGoogleUser() {
  try {
    console.log('🚀 Adding Victor\'s Google account to Massimino...');

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: 'vsoleferioli@gmail.com' }
    });

    if (existingUser) {
      console.log('✅ User already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role
      });
      return;
    }

    // Create user account for Google OAuth
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: 'vsoleferioli@gmail.com',
        name: 'Victor Sole',
        image: 'https://lh3.googleusercontent.com/a/ACg8ocLarwTFwW9ZNE6UHalJLt39gewXv0-h7lbz-YKFYakxIgSRXgBCbA=s96-c',
        role: 'ADMIN', // Make Victor an admin for testing
        status: 'ACTIVE',
        emailVerified: new Date(),
        googleId: '116616534021350143793', // From the OAuth logs
        reputationScore: 100, // High reputation for admin
        warningCount: 0,
        trainerVerified: true, // Verified trainer
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log('✅ Victor\'s Google account created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      googleId: user.googleId
    });

    // Also create an account record for OAuth linking
    await prisma.accounts.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: '116616534021350143793',
        access_token: 'dummy_token', // Will be updated on actual OAuth
        refresh_token: 'dummy_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        token_type: 'Bearer',
        scope: 'openid email profile',
        id_token: 'dummy_id_token',
        updatedAt: new Date(),
      }
    });

    console.log('✅ OAuth account record created for linking');

  } catch (error) {
    console.error('❌ Error creating Victor\'s Google account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addVictorGoogleUser();
