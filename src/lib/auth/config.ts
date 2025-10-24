/**
 * ⚠️ DEPRECATED - DO NOT USE ⚠️
 *
 * This file is LEGACY and NOT USED by the application.
 *
 * The active NextAuth configuration is located at:
 * → src/core/auth/config.ts
 *
 * This file is kept for reference only and may be removed in the future.
 *
 * Last updated: 2025-01-24
 */

/**
 * Authentication Configuration for Massimino
 * Safety-first approach with strict validation and role-based access
 */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/database/client';
import { UserRole, UserStatus, Prisma } from '@prisma/client';

// Environment variable validation
const requiredEnvVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
} as const;

// Validate all required environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const authOptions: NextAuthOptions = {
  // Use Prisma adapter for database sessions
  adapter: PrismaAdapter(prisma),
  
  // Authentication providers
  providers: [
    GoogleProvider({
      clientId: requiredEnvVars.GOOGLE_CLIENT_ID!,
      clientSecret: requiredEnvVars.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request additional permissions for safety
          scope: 'openid email profile',
          // Ensure we always get fresh consent
          prompt: 'consent',
          // Request access to basic profile info
          access_type: 'offline',
          response_type: 'code',
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Default role assignment
          role: UserRole.CLIENT,
          status: UserStatus.ACTIVE,
          emailVerified: profile.email_verified ? new Date() : null,
          googleId: profile.sub,
          reputationScore: 0, // Default value
          warningCount: 0, // Default value
          trainerVerified: false, // Default value
        };
      },
    }),
  ],

  // Database session strategy for better security
  session: {
    strategy: 'database',
    // Session expires after 30 days of inactivity
    maxAge: 30 * 24 * 60 * 60, // 30 days
    // Update session activity every 24 hours
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // JWT configuration (for API routes)
  jwt: {
    // JWT expires after 1 hour for better security
    maxAge: 60 * 60, // 1 hour
  },

  // Custom pages for better UX and branding
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    newUser: '/auth/welcome', // Redirect new users to onboarding
  },

  // Security and safety callbacks
  callbacks: {
    // Control who can sign in
    async signIn({ user, account }) {
      try {
        // Safety check: ensure user has a valid email
        if (!user.email) {
          console.warn('Sign-in attempt without email:', { user, account });
          return false;
        }

        // Check if user is banned
        const existingUser = await prisma.users.findUnique({
          where: { email: user.email },
          select: { status: true, suspendedUntil: true },
        });

        if (existingUser) {
          // Block banned users
          if (existingUser.status === UserStatus.BANNED) {
            console.warn('Banned user attempted sign-in:', user.email);
            return false;
          }

          // Check if suspension has expired
          if (
            existingUser.status === UserStatus.SUSPENDED &&
            existingUser.suspendedUntil &&
            existingUser.suspendedUntil > new Date()
          ) {
            console.warn('Suspended user attempted sign-in:', user.email);
            return false;
          }

          // Auto-activate users whose suspension has expired
          if (
            existingUser.status === UserStatus.SUSPENDED &&
            existingUser.suspendedUntil &&
            existingUser.suspendedUntil <= new Date()
          ) {
            await prisma.users.update({
              where: { email: user.email },
              data: {
                status: UserStatus.ACTIVE,
                suspendedUntil: null,
              },
            });
          }
        }

        // Update last login time for security tracking
        if (existingUser) {
          await prisma.users.update({
            where: { email: user.email },
            data: { lastLoginAt: new Date() },
          });
        }

        return true;
      } catch (error) {
        console.error('Sign-in callback error:', error);
        return false;
      }
    },

    // Customize session data
    async session({ session, user }) {
      if (session.user && user) {
        // Add user role and safety info to session
        const dbUser = await prisma.users.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
            status: true,
            reputationScore: true,
            warningCount: true,
            trainerVerified: true,
            suspendedUntil: true,
          },
        });

        if (dbUser) {
          session.user.id = user.id;
          session.user.role = dbUser.role;
          session.user.status = dbUser.status;
          session.user.reputationScore = dbUser.reputationScore;
          session.user.warningCount = dbUser.warningCount;
          session.user.trainerVerified = dbUser.trainerVerified;
          session.user.suspendedUntil = dbUser.suspendedUntil;
          
          // Safety flag for UI
          session.user.isSafe = dbUser.status === UserStatus.ACTIVE && 
                               dbUser.reputationScore >= 50;
        }
      }
      
      return session;
    },

    // Handle JWT tokens for API routes
    async jwt({ token, user }) {
      // Store user ID in token on first sign in
      if (user) {
        token.userId = user.id;
        token.role = (user as any).role || UserRole.CLIENT;
      }
      
      return token;
    },

    // Handle redirects after authentication
    async redirect({ url, baseUrl }) {
      // Always redirect to app domain for security
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Only allow redirects to same domain
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      return baseUrl;
    },
  },

  // Event handlers for logging and safety
  events: {
    async signIn({ user, account: _account, isNewUser }) {
      console.log('User signed in:', {
        userId: user.id,
        email: user.email,
        isNewUser,
        provider: _account?.provider,
      });

      // Log new user registrations for safety monitoring
      if (isNewUser) {
        console.log('New user registered:', {
          userId: user.id,
          email: user.email,
          provider: _account?.provider,
          timestamp: new Date().toISOString(),
        });
      }
    },

    async signOut({ session, token }) {
      console.log('User signed out:', {
        userId: session?.user?.id || token?.userId,
        timestamp: new Date().toISOString(),
      });
    },

    async createUser({ user }) {
      console.log('User created in database:', {
        userId: user.id,
        email: user.email,
        role: (user as any).role,
        timestamp: new Date().toISOString(),
      });

      // Initialize safety settings for new users
      try {
        await prisma.safety_settings.create({
          data: {
            userId: user.id,
            // Default to safe settings
            allowDirectMessages: false,
            allowTrainerMessages: true,
            profileVisibility: 'PUBLIC',
            autoBlockFlaggedUsers: true,
            contentFilterStrength: 'MEDIUM',
            safetyAlerts: true,
            moderationNotifications: true,
          } as Prisma.safety_settingsUncheckedCreateInput,
        });
      } catch (error) {
        console.error('Failed to create safety settings for new user:', error);
      }
    },
  },

  // Security configuration
  debug: process.env.NODE_ENV === 'development',
  
  // Custom logger for better security monitoring
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', { code, metadata });
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('NextAuth Debug:', { code, metadata });
      }
    },
  },
};

// Export type-safe auth configuration
export default authOptions;