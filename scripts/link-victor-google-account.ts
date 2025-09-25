// scripts/link-victor-google-account.ts
/**
 * Script to link Victor's Google OAuth account
 * This creates the missing Account record for OAuth linking
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function linkVictorGoogleAccount() {
  try {
    console.log('🔗 Linking Victor\'s Google OAuth account...');

    // Find Victor's user record
    const user = await prisma.user.findUnique({
      where: { email: 'vsoleferioli@gmail.com' }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log('✅ Found user:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    // Check if account record already exists
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: 'google'
      }
    });

    if (existingAccount) {
      console.log('✅ OAuth account already linked:', {
        id: existingAccount.id,
        provider: existingAccount.provider,
        providerAccountId: existingAccount.providerAccountId
      });
      return;
    }

    // Create the OAuth account record
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: '116616534021350143793', // From OAuth logs
        access_token: 'dummy_token', // Will be updated on actual OAuth
        refresh_token: 'dummy_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        token_type: 'Bearer',
        scope: 'openid email profile',
        id_token: 'dummy_id_token',
      }
    });

    console.log('✅ OAuth account record created:', {
      id: account.id,
      userId: account.userId,
      provider: account.provider,
      providerAccountId: account.providerAccountId
    });

    // Update user with Google ID if not set
    if (!user.googleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: '116616534021350143793',
          image: 'https://lh3.googleusercontent.com/a/ACg8ocLarwTFwW9ZNE6UHalJLt39gewXv0-h7lbz-YKFYakxIgSRXgBCbA=s96-c'
        }
      });
      console.log('✅ Updated user with Google ID and image');
    }

  } catch (error) {
    console.error('❌ Error linking Google account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
linkVictorGoogleAccount();
