/**
 * Authentication Providers Setup for Massimino
 * Configures OAuth providers with safety-first approach
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './config';
import { UserRole, UserStatus } from '@prisma/client';

// Re-export auth configuration
export { authOptions };

/**
 * Get the current user session with type safety
 * Use this in server components and API routes
 */
export async function getAuthSession() {
  return await getServerSession(authOptions);
}

/**
 * Get current user with safety information
 * Returns null if user is not authenticated or unsafe
 */
export async function getCurrentUser() {
  const session = await getAuthSession();
  
  if (!session?.user) {
    return null;
  }

  // Additional safety check - ensure user is active
  if (session.user.status !== UserStatus.ACTIVE) {
    return null;
  }

  return session.user;
}

/**
 * Require authentication for a page or API route
 * Redirects to sign-in if not authenticated
 */
export async function requireAuth() {
  const session = await getAuthSession();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }
  
  return session;
}

/**
 * Require specific role for access control
 * Returns user if they have required role, redirects otherwise
 */
export async function requireRole(requiredRole: UserRole | UserRole[]) {
  const session = await requireAuth();
  
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/unauthorized');
  }
  
  return session;
}

/**
 * Require trainer role with verification
 * Ensures user is verified trainer
 */
export async function requireVerifiedTrainer() {
  const session = await requireRole(UserRole.TRAINER);
  
  if (!session.user.trainerVerified) {
    redirect('/trainer/verify');
  }
  
  return session;
}

/**
 * Check if user has admin privileges
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getAuthSession();
  return session?.user?.role === UserRole.ADMIN;
}

/**
 * Check if user is a verified trainer
 */
export async function isVerifiedTrainer(): Promise<boolean> {
  const session = await getAuthSession();
  return session?.user?.role === UserRole.TRAINER && 
         session.user.trainerVerified === true;
}

/**
 * Check if user has good reputation score
 * Used for safety features and permissions
 */
export function hasGoodReputation(user: any): boolean {
  return user.reputationScore >= 75 && user.warningCount <= 2;
}

/**
 * Check if user can send direct messages
 * Based on safety settings and reputation
 */
export function canSendDirectMessages(user: any): boolean {
  return (
    user.status === UserStatus.ACTIVE &&
    user.reputationScore >= 50 &&
    user.warningCount <= 5
  );
}

/**
 * Check if user can create communities
 * Only for verified trainers with good reputation
 */
export function canCreateCommunities(user: any): boolean {
  return (
    user.role === UserRole.TRAINER &&
    user.trainerVerified === true &&
    hasGoodReputation(user)
  );
}

/**
 * Safety check for user interactions
 * Prevents suspended or banned users from interacting
 */
export function canInteractSafely(user: any): boolean {
  if (!user) return false;
  
  // Check if user is active
  if (user.status !== UserStatus.ACTIVE) return false;
  
  // Check if suspension has expired
  if (user.suspendedUntil && user.suspendedUntil > new Date()) {
    return false;
  }
  
  // Check reputation threshold
  if (user.reputationScore < 25) return false;
  
  return true;
}

/**
 * Get user permission level for content moderation
 */
export function getUserPermissionLevel(user: any): 'read' | 'write' | 'moderate' | 'admin' {
  if (!user || !canInteractSafely(user)) {
    return 'read';
  }
  
  if (user.role === UserRole.ADMIN) {
    return 'admin';
  }
  
  if (user.role === UserRole.TRAINER && user.trainerVerified && hasGoodReputation(user)) {
    return 'moderate';
  }
  
  if (user.reputationScore >= 50) {
    return 'write';
  }
  
  return 'read';
}

/**
 * OAuth provider configurations
 * Each provider has safety-specific settings
 */
export const OAUTH_PROVIDERS = {
  google: {
    id: 'google',
    name: 'Google',
    type: 'oauth',
    // Safety-focused scope requests
    scope: 'openid email profile',
    // Additional safety parameters
    authorization: {
      params: {
        prompt: 'consent', // Always ask for consent
        access_type: 'offline',
        response_type: 'code',
      },
    },
    // Profile data validation
    profileValidation: {
      requiredFields: ['email', 'name'],
      emailVerifiedRequired: true,
    },
  },
  // Future providers can be added here
  // github: { ... },
  // discord: { ... },
} as const;

/**
 * Safety-focused sign-in options
 */
export const SIGNIN_OPTIONS = {
  // Redirect after sign-in
  callbackUrl: '/',
  
  // Safety prompts
  prompt: 'consent',
  
  // Additional OAuth parameters
  state: {
    // Include safety verification
    safetyCheck: true,
    timestamp: Date.now(),
  },
} as const;

/**
 * User onboarding flow configuration
 */
export const ONBOARDING_FLOW = {
  // Steps for new users
  steps: [
    'welcome',           // Welcome message and safety guidelines
    'safety-agreement',  // Accept community guidelines
    'profile-setup',     // Basic profile information
    'privacy-settings',  // Configure privacy and safety settings
    'role-selection',    // Choose between client/trainer
    'verification',      // Email verification (if needed)
  ],
  
  // Required steps that cannot be skipped
  requiredSteps: ['safety-agreement', 'privacy-settings'],
  
  // Trainer-specific additional steps
  trainerSteps: [
    'credentials',       // Upload certifications
    'bio-setup',        // Professional bio and experience
    'verification-request', // Request trainer verification
  ],
} as const;

/**
 * Session validation helpers
 */
export function validateSession(session: any) {
  if (!session?.user) {
    throw new Error('No valid session found');
  }
  
  if (session.user.status !== UserStatus.ACTIVE) {
    throw new Error('User account is not active');
  }
  
  if (session.user.suspendedUntil && session.user.suspendedUntil > new Date()) {
    throw new Error('User account is currently suspended');
  }
  
  return session;
}

/**
 * Export commonly used types
 */
export type SafeUser = {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  status: UserStatus;
  reputationScore: number;
  warningCount: number;
  trainerVerified: boolean;
  suspendedUntil?: Date | null;
  isSafe: boolean;
};

export type PermissionLevel = 'read' | 'write' | 'moderate' | 'admin';

export type AuthContextType = {
  user: SafeUser | null;
  isLoading: boolean;
  permissionLevel: PermissionLevel;
  canSendDMs: boolean;
  canCreateCommunities: boolean;
  isVerifiedTrainer: boolean;
};