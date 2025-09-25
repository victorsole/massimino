/**
 * Authentication and User Role Type Definitions for Massimino
 * Safety-first type system with strict role-based access control
 */

import { UserRole, UserStatus } from '@prisma/client';
import { DefaultSession } from 'next-auth';

// ============================================================================
// NEXTAUTH EXTENSIONS
// ============================================================================

declare module 'next-auth' {
  /**
   * Extended User interface with safety and role information
   */
  interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    role: UserRole;
    status: UserStatus;
    reputationScore: number;
    warningCount: number;
    trainerVerified: boolean;
    suspendedUntil?: Date | null;
    googleId?: string;
  }

  /**
   * Extended Session interface with safety context
   */
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      image?: string | null;
      role: UserRole;
      status: UserStatus;
      reputationScore: number;
      warningCount: number;
      trainerVerified: boolean;
      suspendedUntil?: Date | null;
      isSafe: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT interface
   */
  interface JWT {
    userId: string;
    role: UserRole;
  }
}

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * Safe user type with only necessary information exposed
 * Used throughout the application for user context
 */
export interface SafeUser {
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
  createdAt: Date;
  lastLoginAt?: Date | null;
}

/**
 * Public user profile (limited information for privacy)
 * Used when displaying user information to other users
 */
export interface PublicUserProfile {
  id: string;
  name: string;
  image?: string;
  role: UserRole;
  trainerVerified: boolean;
  reputationScore: number; // Shown for trust/safety
  isOnline?: boolean;
  joinedAt: Date;
  // Trainer-specific public info
  trainerBio?: string;
  trainerRating?: number;
  trainerCredentials?: TrainerCredential[];
}

/**
 * User settings and preferences
 */
export interface UserSettings {
  // Privacy settings
  profileVisibility: 'PUBLIC' | 'PRIVATE' | 'TRAINERS_ONLY';
  showRealName: boolean;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  
  // Safety settings
  acceptDMs: boolean;
  onlyTrainerDMs: boolean;
  autoBlockFlaggedUsers: boolean;
  requireVerifiedTrainers: boolean;
  contentFilterStrength: 'LOW' | 'MEDIUM' | 'HIGH' | 'STRICT';
  
  // Notification preferences
  safetyAlerts: boolean;
  moderationNotifications: boolean;
  communityUpdates: boolean;
  directMessages: boolean;
}

/**
 * Trainer-specific information
 */
export interface TrainerCredential {
  id: string;
  name: string;
  organization: string;
  certificationDate: Date;
  expirationDate?: Date;
  verified: boolean;
  credentialUrl?: string;
}

export interface TrainerProfile {
  bio: string;
  specializations: string[];
  credentials: TrainerCredential[];
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  availability: {
    timezone: string;
    workingHours: {
      start: string;
      end: string;
    };
    availableDays: string[];
  };
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

/**
 * Authentication state for client components
 */
export interface AuthState {
  user: SafeUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissionLevel: PermissionLevel;
  canSendDMs: boolean;
  canCreateCommunities: boolean;
  isVerifiedTrainer: boolean;
  isAdmin: boolean;
}

/**
 * Permission levels for feature access
 */
export type PermissionLevel = 'read' | 'write' | 'moderate' | 'admin';

/**
 * Role-based permissions
 */
export interface RolePermissions {
  // Content permissions
  canCreatePosts: boolean;
  canComment: boolean;
  canDirectMessage: boolean;
  canCreateCommunities: boolean;
  canModerateContent: boolean;
  
  // Safety permissions
  canReportUsers: boolean;
  canViewModerationLogs: boolean;
  canBanUsers: boolean;
  canVerifyTrainers: boolean;
  
  // Feature access
  canUploadMedia: boolean;
  canGoLive: boolean;
  canCreateCourses: boolean;
  canReceivePayments: boolean;
}

/**
 * Authentication error types
 */
export type AuthError = 
  | 'SUSPENDED_ACCOUNT'
  | 'BANNED_ACCOUNT'
  | 'UNVERIFIED_EMAIL'
  | 'INVALID_CREDENTIALS'
  | 'REPUTATION_TOO_LOW'
  | 'UNKNOWN_ERROR';

/**
 * Sign-in result
 */
export interface SignInResult {
  success: boolean;
  user?: SafeUser;
  error?: AuthError;
  message?: string;
  redirectUrl?: string;
}

/**
 * Account verification status
 */
export interface VerificationStatus {
  email: boolean;
  phone?: boolean;
  identity?: boolean;
  trainer?: boolean;
  background?: boolean; // For trainers
}

// ============================================================================
// SESSION TYPES
// ============================================================================

/**
 * Extended session context for the application
 */
export interface AppSessionContext {
  user: SafeUser;
  permissions: RolePermissions;
  settings: UserSettings;
  verification: VerificationStatus;
  safetyStatus: SafetyStatus;
}

/**
 * Safety status for user account
 */
export interface SafetyStatus {
  isSafe: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  activeWarnings: number;
  recentViolations: number;
  suspensionHistory: number;
  lastViolation?: Date;
  restrictions: UserRestriction[];
}

/**
 * User restrictions based on violations
 */
export interface UserRestriction {
  type: 'NO_DM' | 'NO_POSTS' | 'NO_COMMENTS' | 'NO_COMMUNITIES' | 'READ_ONLY';
  reason: string;
  expiresAt?: Date;
  isPermanent: boolean;
}

// ============================================================================
// OAUTH & PROVIDER TYPES
// ============================================================================

/**
 * OAuth provider configuration
 */
export interface OAuthProvider {
  id: string;
  name: string;
  type: 'oauth';
  scope: string;
  authorization: {
    params: Record<string, string>;
  };
  profileValidation: {
    requiredFields: string[];
    emailVerifiedRequired: boolean;
  };
}

/**
 * OAuth profile data
 */
export interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  image?: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  locale?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Role hierarchy for permission checking
 */
export const ROLE_HIERARCHY = {
  [UserRole.CLIENT]: 0,
  [UserRole.TRAINER]: 1,
  [UserRole.ADMIN]: 2,
} as const;

/**
 * Status priority for account health
 */
export const STATUS_PRIORITY = {
  [UserStatus.BANNED]: 0,
  [UserStatus.SUSPENDED]: 1,
  [UserStatus.PENDING]: 2,
  [UserStatus.ACTIVE]: 3,
} as const;

/**
 * Type guards for role checking
 */
export const isClient = (user: SafeUser): boolean => user.role === UserRole.CLIENT;
export const isTrainer = (user: SafeUser): boolean => user.role === UserRole.TRAINER;
export const isAdmin = (user: SafeUser): boolean => user.role === UserRole.ADMIN;
export const isVerifiedTrainer = (user: SafeUser): boolean => 
  user.role === UserRole.TRAINER && user.trainerVerified;

/**
 * Type guards for status checking
 */
export const isActiveUser = (user: SafeUser): boolean => user.status === UserStatus.ACTIVE;
export const isSuspendedUser = (user: SafeUser): boolean => user.status === UserStatus.SUSPENDED;
export const isBannedUser = (user: SafeUser): boolean => user.status === UserStatus.BANNED;

/**
 * Type guard for safe user interaction
 */
export const canUserInteract = (user: SafeUser): boolean => {
  return (
    user.status === UserStatus.ACTIVE &&
    user.reputationScore >= 25 &&
    (!user.suspendedUntil || user.suspendedUntil <= new Date())
  );
};

/**
 * Helper type for form validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Onboarding step tracking
 */
export interface OnboardingProgress {
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  isComplete: boolean;
  nextStep?: string;
}
