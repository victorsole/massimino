// src/lib/auth/config.ts
/**
 * Authentication Configuration for Massimino
 * Safety-first approach with strict validation and role-based access
 */

import { NextAuthOptions } from 'next-auth';
// import { PrismaAdapter } from '@next-auth/prisma-adapter'; // Standard adapter doesn't work with lowercase table names
import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/core/database';
import bcrypt from 'bcryptjs';
import { CustomPrismaAdapter } from './prisma-adapter-custom';

// Define enums as const values since Prisma client may not be available
const UserRole = {
  CLIENT: 'CLIENT',
  TRAINER: 'TRAINER',
  ADMIN: 'ADMIN',
} as const;

const UserStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
} as const;

// Extend NextAuth session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image?: string | null;
      role: import('@prisma/client').UserRole;
      status: import('@prisma/client').UserStatus;
      reputationScore: number;
      warningCount: number;
      trainerVerified: boolean;
      suspendedUntil?: Date | null;
      isSafe: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    role: import('@prisma/client').UserRole;
    status: import('@prisma/client').UserStatus;
    reputationScore: number;
    warningCount: number;
    trainerVerified: boolean;
    suspendedUntil?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: import('@prisma/client').UserRole;
  }
}

// Environment variable handling (be resilient in development)
const devDefaultNextAuthUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined;
// Ensure NEXTAUTH_URL is defined for local development builds
if (!process.env.NEXTAUTH_URL && devDefaultNextAuthUrl) {
  process.env.NEXTAUTH_URL = devDefaultNextAuthUrl;
}
// Ensure NEXTAUTH_SECRET exists; generate a dev fallback if missing
if (!process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV !== 'production') {
    process.env.NEXTAUTH_SECRET = 'dev-insecure-secret';
    // eslint-disable-next-line no-console
    console.warn('[auth] NEXTAUTH_SECRET not set. Using development fallback.');
  } else {
    // In production, do not crash the app on import; NextAuth will error on usage.
    console.error('[auth] NEXTAUTH_SECRET is missing. Authentication will fail until it is set.');
  }
}

// Google OAuth configuration (optional)
const googleConfig = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
} as const;

// LinkedIn OAuth configuration (optional)
const linkedinConfig = {
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
} as const;

// Facebook OAuth configuration (optional)
const facebookConfig = {
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
} as const;

// No hard throw on missing envs to keep non-auth pages working.

// Admin bootstrap via environment variable list (comma-separated emails)
const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Build providers array dynamically
const providers: any[] = [
  // Email/Password authentication
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      try {
        // Find user by email
        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            status: true,
            reputationScore: true,
            warningCount: true,
            trainerVerified: true,
            suspendedUntil: true,
          }
        });

        if (!user || !user.password) {
          return null;
        }

        // Check password
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        // Check if user is active
        if (user.status !== UserStatus.ACTIVE) {
          return null;
        }

        // Update last login
        await prisma.users.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name || '',
          image: null,
          role: user.role,
          status: user.status,
          reputationScore: user.reputationScore,
          warningCount: user.warningCount,
          trainerVerified: user.trainerVerified,
          suspendedUntil: user.suspendedUntil,
        };
      } catch (error) {
        console.error('Auth error:', error);
        return null;
      }
    }
  }),
];

// Add Google provider if configured
if (googleConfig.GOOGLE_CLIENT_ID && googleConfig.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: googleConfig.GOOGLE_CLIENT_ID,
      clientSecret: googleConfig.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
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
          role: UserRole.CLIENT,
          status: UserStatus.ACTIVE,
          emailVerified: profile.email_verified ? new Date() : null,
          googleId: profile.sub,
          reputationScore: 0,
          warningCount: 0,
          trainerVerified: false,
        };
      },
    })
  );
} else if (process.env.NODE_ENV !== 'production') {
  console.warn('Google OAuth not configured (GOOGLE_CLIENT_ID/SECRET missing).');
}

// Add LinkedIn provider if configured
if (linkedinConfig.LINKEDIN_CLIENT_ID && linkedinConfig.LINKEDIN_CLIENT_SECRET) {
  providers.push(
    LinkedInProvider({
      clientId: linkedinConfig.LINKEDIN_CLIENT_ID,
      clientSecret: linkedinConfig.LINKEDIN_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'r_liteprofile r_emailaddress',
          state: 'random_state_string',
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
          email: profile.emailAddress,
          image: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier || null,
          role: UserRole.CLIENT,
          status: UserStatus.ACTIVE,
          emailVerified: new Date(),
          linkedinId: profile.id,
          reputationScore: 0,
          warningCount: 0,
          trainerVerified: false,
        };
      },
    })
  );
} else if (process.env.NODE_ENV !== 'production') {
  console.warn('LinkedIn OAuth not configured (LINKEDIN_CLIENT_ID/SECRET missing).');
}

// Add Facebook provider if configured
if (facebookConfig.FACEBOOK_CLIENT_ID && facebookConfig.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: facebookConfig.FACEBOOK_CLIENT_ID,
      clientSecret: facebookConfig.FACEBOOK_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'email,public_profile',
        },
      },
    })
  );
} else if (process.env.NODE_ENV !== 'production') {
  console.warn('Facebook OAuth not configured (FACEBOOK_CLIENT_ID/SECRET missing).');
}

export const authOptions: NextAuthOptions = {
  // Use custom Prisma adapter for lowercase model names (accounts, sessions, verificationtokens)
  adapter: CustomPrismaAdapter(prisma),

  // Authentication providers
  providers,

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
    signIn: '/login',
    error: '/login', // Redirect errors back to login page
    newUser: '/dashboard', // Redirect new users to dashboard
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

        // Check if user exists
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

          // Update last login time for security tracking
          await prisma.users.update({
            where: { email: user.email },
            data: { lastLoginAt: new Date() },
          });

          // Promote to ADMIN if email is defined in ADMIN_EMAILS list
          if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            try {
              await prisma.users.update({
                where: { email: user.email },
                data: { role: UserRole.ADMIN, trainerVerified: true },
              });
            } catch (e) {
              console.warn('Admin promotion skipped:', e);
            }
          }
        } else {
          // Allow OAuth providers to create new users automatically
          if (account?.provider && account.provider !== 'credentials') {
            console.log('Allowing automatic user creation for OAuth provider:', account.provider);
            return true;
          } else {
            // Block credentials login for non-existing users
            console.warn('Credentials login attempted for non-existing user:', user.email);
            return false;
          }
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
        // Note: SafetySettings model needs to be added to Prisma schema
        // For now, skip this initialization
        console.log('Safety settings initialization skipped - model not yet defined');
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
