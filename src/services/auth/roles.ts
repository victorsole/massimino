// src/lib/auth/roles.ts

/**
 * Role Definitions and Permissions for Massimino
 * Implements comprehensive role-based access control (RBAC) with safety-first approach
 */

// Define enums as const values since Prisma client may not be available
export const UserRole = {
  CLIENT: 'CLIENT',
  TRAINER: 'TRAINER',
  ADMIN: 'ADMIN',
} as const;

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];
export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

// Define types locally to avoid circular imports
export interface RolePermissions {
  canCreatePosts: boolean;
  canComment: boolean;
  canDirectMessage: boolean;
  canCreateCommunities: boolean;
  canModerateContent: boolean;
  canReportUsers: boolean;
  canViewModerationLogs: boolean;
  canBanUsers: boolean;
  canVerifyTrainers: boolean;
  canUploadMedia: boolean;
  canGoLive: boolean;
  canCreateCourses: boolean;
  canReceivePayments: boolean;
}

export interface SafeUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRoleType;
  image?: string | null;
  status: UserStatusType;
  reputationScore: number;
  warningCount: number;
  trainerVerified: boolean;
  suspendedUntil?: Date | null;
  isSafe?: boolean;
  createdAt: Date;
  lastLoginAt?: Date | null;
}

export type PermissionLevel = 'read' | 'write' | 'moderate' | 'admin';

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

/**
 * Role hierarchy and basic information
 */
export const ROLES = {
  [UserRole.CLIENT]: {
    name: 'Client',
    description: 'Regular fitness enthusiasts and gym-goers',
    level: 0,
    color: '#64748b',
    icon: '👤',
    canUpgrade: true,
    upgradeTarget: UserRole.TRAINER,
  },
  [UserRole.TRAINER]: {
    name: 'Personal Trainer',
    description: 'Certified fitness professionals',
    level: 1,
    color: '#2563eb',
    icon: '💪',
    canUpgrade: false,
    requiresVerification: true,
  },
  [UserRole.ADMIN]: {
    name: 'Administrator',
    description: 'Platform administrators and moderators',
    level: 2,
    color: '#7c3aed',
    icon: '🛡️',
    canUpgrade: false,
    requiresInvite: true,
  },
} as const;

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

/**
 * Base permissions for each role
 * Permissions are additive - higher roles inherit lower role permissions
 */
export const BASE_PERMISSIONS: Record<UserRoleType, RolePermissions> = {
  [UserRole.CLIENT]: {
    // Content permissions
    canCreatePosts: true,
    canComment: true,
    canDirectMessage: false, // Disabled by default for safety
    canCreateCommunities: false,
    canModerateContent: false,
    
    // Safety permissions
    canReportUsers: true,
    canViewModerationLogs: false,
    canBanUsers: false,
    canVerifyTrainers: false,
    
    // Feature access
    canUploadMedia: true,
    canGoLive: false,
    canCreateCourses: false,
    canReceivePayments: false,
  },

  [UserRole.TRAINER]: {
    // Content permissions
    canCreatePosts: true,
    canComment: true,
    canDirectMessage: true, // Trainers can DM for client communication
    canCreateCommunities: true, // Can create private client groups
    canModerateContent: true,   // Can moderate their own communities
    
    // Safety permissions
    canReportUsers: true,
    canViewModerationLogs: true, // Can see their community's moderation logs
    canBanUsers: false, // Can only remove from their communities
    canVerifyTrainers: false,
    
    // Feature access
    canUploadMedia: true,
    canGoLive: true, // Can host live training sessions
    canCreateCourses: true, // Can create and sell courses
    canReceivePayments: true, // Can receive payments for services
  },

  [UserRole.ADMIN]: {
    // Content permissions - full access
    canCreatePosts: true,
    canComment: true,
    canDirectMessage: true,
    canCreateCommunities: true,
    canModerateContent: true,
    
    // Safety permissions - full access
    canReportUsers: true,
    canViewModerationLogs: true,
    canBanUsers: true,
    canVerifyTrainers: true,
    
    // Feature access - full access
    canUploadMedia: true,
    canGoLive: true,
    canCreateCourses: true,
    canReceivePayments: true,
  },
};

// ============================================================================
// REPUTATION-BASED PERMISSIONS
// ============================================================================

/**
 * Reputation thresholds for unlocking features
 * Higher reputation = more privileges and trust
 */
export const REPUTATION_THRESHOLDS = {
  // Basic interaction thresholds
  SEND_DM: 50,              // Can send direct messages
  CREATE_COMMUNITIES: 75,   // Can create public communities (clients)
  UPLOAD_VIDEOS: 60,        // Can upload video content
  GO_LIVE: 80,             // Can host live sessions (clients)
  
  // Trust-based features
  VERIFIED_BADGE: 90,       // Gets verified badge
  MENTOR_OTHERS: 85,        // Can mentor new users
  BETA_FEATURES: 95,        // Access to beta features
  
  // Safety thresholds
  AUTO_APPROVE_CONTENT: 90, // Content auto-approved
  IMMUNE_TO_REPORTS: 95,    // Reports require higher evidence
  TRUSTED_REPORTER: 85,     // Reports carry more weight
} as const;

/**
 * Calculate dynamic permissions based on reputation
 */
export function getReputationPermissions(reputationScore: number): Partial<RolePermissions> {
  const permissions: Partial<RolePermissions> = {};
  
  // Direct messaging privilege
  if (reputationScore >= REPUTATION_THRESHOLDS.SEND_DM) {
    permissions.canDirectMessage = true;
  }
  
  return permissions;
}

// ============================================================================
// SAFETY-BASED PERMISSION MODIFIERS
// ============================================================================

/**
 * Safety checks that can restrict permissions
 */
export interface SafetyChecks {
  hasActiveWarnings: boolean;
  recentViolations: number;
  suspensionHistory: number;
  isSuspended: boolean;
  daysSinceLastViolation: number;
}

/**
 * Apply safety restrictions to permissions
 */
export function applySafetyRestrictions(
  basePermissions: RolePermissions,
  user: SafeUser,
  safetyChecks: SafetyChecks
): RolePermissions {
  const restrictedPermissions = { ...basePermissions };
  
  // Suspend all permissions for suspended users
  if (user.status === UserStatus.SUSPENDED || safetyChecks.isSuspended) {
    return Object.keys(restrictedPermissions).reduce((acc, key) => {
      acc[key as keyof RolePermissions] = false;
      return acc;
    }, {} as RolePermissions);
  }
  
  // Apply graduated restrictions based on warnings and violations
  if (user.warningCount >= 3 || safetyChecks.recentViolations >= 2) {
    restrictedPermissions.canDirectMessage = false;
    restrictedPermissions.canCreateCommunities = false;
    restrictedPermissions.canGoLive = false;
  }
  
  if (user.warningCount >= 5 || safetyChecks.recentViolations >= 3) {
    restrictedPermissions.canCreatePosts = false;
    restrictedPermissions.canUploadMedia = false;
  }
  
  // Reputation-based restrictions
  if (user.reputationScore < 25) {
    restrictedPermissions.canDirectMessage = false;
    restrictedPermissions.canCreateCommunities = false;
  }
  
  if (user.reputationScore < 10) {
    restrictedPermissions.canComment = false;
    restrictedPermissions.canCreatePosts = false;
  }
  
  return restrictedPermissions;
}

// ============================================================================
// TRAINER-SPECIFIC PERMISSIONS
// ============================================================================

/**
 * Enhanced permissions for verified trainers
 */
export const VERIFIED_TRAINER_BONUSES: Partial<RolePermissions> = {
  canModerateContent: true,  // Can moderate any fitness content
  canVerifyTrainers: false,  // Still admin-only
};

/**
 * Check if trainer is verified and eligible for bonuses
 */
export function getTrainerPermissions(user: SafeUser): RolePermissions {
  const basePermissions = BASE_PERMISSIONS[user.role];
  
  if (user.role === UserRole.TRAINER && user.trainerVerified) {
    return {
      ...basePermissions,
      ...VERIFIED_TRAINER_BONUSES,
    } as RolePermissions;
  }
  
  return basePermissions;
}

// ============================================================================
// PERMISSION CHECKING UTILITIES
// ============================================================================

/**
 * Get complete permissions for a user considering all factors
 */
export function getUserPermissions(
  user: SafeUser,
  safetyChecks?: SafetyChecks
): RolePermissions {
  // Start with base role permissions
  let permissions: RolePermissions = BASE_PERMISSIONS[user.role];
  
  // Add trainer-specific bonuses if applicable
  if (user.role === UserRole.TRAINER) {
    permissions = getTrainerPermissions(user);
  }
  
  // Add reputation-based permissions
  const reputationBonus = getReputationPermissions(user.reputationScore);
  permissions = { ...permissions, ...reputationBonus } as RolePermissions;
  
  // Apply safety restrictions if provided
  if (safetyChecks) {
    permissions = applySafetyRestrictions(permissions, user, safetyChecks);
  }
  
  return permissions;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: SafeUser,
  permission: keyof RolePermissions,
  safetyChecks?: SafetyChecks
): boolean {
  const permissions = getUserPermissions(user, safetyChecks);
  return permissions[permission] || false;
}

/**
 * Get user's permission level for moderation purposes
 */
export function getPermissionLevel(user: SafeUser): PermissionLevel {
  if (user.role === UserRole.ADMIN) return 'admin';
  if (user.role === UserRole.TRAINER && user.trainerVerified && user.reputationScore >= 80) {
    return 'moderate';
  }
  if (user.reputationScore >= REPUTATION_THRESHOLDS.SEND_DM) {
    return 'write';
  }
  return 'read';
}

// ============================================================================
// ROLE UPGRADE SYSTEM
// ============================================================================

/**
 * Requirements to upgrade from CLIENT to TRAINER
 */
export const TRAINER_UPGRADE_REQUIREMENTS = {
  minimumReputation: 75,
  minimumDaysActive: 30,
  minimumWarningCount: 2, // Maximum allowed warnings
  requiredDocuments: [
    'CERTIFICATION', // Fitness certification
    'IDENTITY',      // Government ID
    'BACKGROUND',    // Background check (optional but recommended)
  ],
  requiredFields: [
    'fullName',
    'certifications',
    'experience',
    'specializations',
    'bio',
  ],
} as const;

/**
 * Check if user is eligible for trainer upgrade
 */
export function canUpgradeToTrainer(user: SafeUser): {
  eligible: boolean;
  missingRequirements: string[];
} {
  const missing: string[] = [];
  
  if (user.role !== UserRole.CLIENT) {
    missing.push('Must be a CLIENT to upgrade to TRAINER');
  }
  
  if (user.reputationScore < TRAINER_UPGRADE_REQUIREMENTS.minimumReputation) {
    missing.push(`Reputation score must be at least ${TRAINER_UPGRADE_REQUIREMENTS.minimumReputation}`);
  }
  
  if (user.warningCount > TRAINER_UPGRADE_REQUIREMENTS.minimumWarningCount) {
    missing.push(`Too many warnings (${user.warningCount}/${TRAINER_UPGRADE_REQUIREMENTS.minimumWarningCount})`);
  }
  
  const daysSinceJoined = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceJoined < TRAINER_UPGRADE_REQUIREMENTS.minimumDaysActive) {
    missing.push(`Account age must be at least ${TRAINER_UPGRADE_REQUIREMENTS.minimumDaysActive} days`);
  }
  
  return {
    eligible: missing.length === 0,
    missingRequirements: missing,
  };
}

// ============================================================================
// COMMUNITY-SPECIFIC PERMISSIONS
// ============================================================================

/**
 * Permissions within communities
 */
export interface CommunityPermissions {
  canView: boolean;
  canJoin: boolean;
  canPost: boolean;
  canComment: boolean;
  canModerate: boolean;
  canInvite: boolean;
  canManageSettings: boolean;
  canRemoveMembers: boolean;
}

/**
 * Get user's permissions within a specific community
 */
export function getCommunityPermissions(
  user: SafeUser,
  community: {
    ownerId: string;
    type: 'PUBLIC' | 'PRIVATE' | 'TRAINER';
    memberRole?: 'MEMBER' | 'MODERATOR';
  }
): CommunityPermissions {
  const isOwner = community.ownerId === user.id;
  const isModerator = community.memberRole === 'MODERATOR';
  const isAdmin = user.role === UserRole.ADMIN;
  const canInteract = user.reputationScore >= 25 && user.status === UserStatus.ACTIVE;
  
  return {
    canView: true, // Most content is viewable
    canJoin: community.type !== 'PRIVATE' || isOwner || isAdmin,
    canPost: canInteract && (community.type !== 'TRAINER' || user.role === UserRole.TRAINER || isOwner),
    canComment: canInteract,
    canModerate: isOwner || isModerator || isAdmin,
    canInvite: isOwner || isModerator || isAdmin,
    canManageSettings: isOwner || isAdmin,
    canRemoveMembers: isOwner || isModerator || isAdmin,
  };
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Feature flags that can be controlled per role
 */
export const FEATURE_FLAGS = {
  DIRECT_MESSAGES: {
    [UserRole.CLIENT]: false,   // Disabled by default, enabled by reputation
    [UserRole.TRAINER]: true,   // Always enabled for trainers
    [UserRole.ADMIN]: true,     // Always enabled for admins
  },
  LIVE_STREAMING: {
    [UserRole.CLIENT]: false,   // Requires high reputation
    [UserRole.TRAINER]: true,   // Enabled for trainers
    [UserRole.ADMIN]: true,     // Always enabled
  },
  PAYMENT_PROCESSING: {
    [UserRole.CLIENT]: false,   // Not applicable
    [UserRole.TRAINER]: true,   // Core trainer feature
    [UserRole.ADMIN]: true,     // Administrative access
  },
  COMMUNITY_CREATION: {
    [UserRole.CLIENT]: false,   // Requires high reputation
    [UserRole.TRAINER]: true,   // Core trainer feature
    [UserRole.ADMIN]: true,     // Always enabled
  },
} as const;

/**
 * Check if feature is enabled for user
 */
export function isFeatureEnabled(
  feature: keyof typeof FEATURE_FLAGS,
  user: SafeUser
): boolean {
  const roleBasedAccess = FEATURE_FLAGS[feature][user.role];
  
  // Apply reputation overrides for clients
  if (user.role === UserRole.CLIENT) {
    switch (feature) {
      case 'DIRECT_MESSAGES':
        return user.reputationScore >= REPUTATION_THRESHOLDS.SEND_DM;
      case 'LIVE_STREAMING':
        return user.reputationScore >= REPUTATION_THRESHOLDS.GO_LIVE;
      case 'COMMUNITY_CREATION':
        return user.reputationScore >= REPUTATION_THRESHOLDS.CREATE_COMMUNITIES;
      default:
        return roleBasedAccess;
    }
  }
  
  return roleBasedAccess;
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================
