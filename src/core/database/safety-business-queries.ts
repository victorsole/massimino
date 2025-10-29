// src/lib/database/queries.ts

/**
 * Safety-Related Database Queries for Massimino
 * Optimized queries for user safety, moderation, and security operations
 */

import { prisma } from './client';
import { Prisma } from '@prisma/client';

// Define types locally since Prisma client may not be available
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

export const ViolationType = {
  HARASSMENT: 'HARASSMENT',
  HATE_SPEECH: 'HATE_SPEECH',
  THREAT: 'THREAT',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  SPAM: 'SPAM',
  PRIVACY_VIOLATION: 'PRIVACY_VIOLATION',
} as const;

export const ModerationAction = {
  APPROVED: 'APPROVED',
  FLAGGED: 'FLAGGED',
  BLOCKED: 'BLOCKED',
  DELETED: 'DELETED',
} as const;

export const ModerationSource = {
  OPENAI: 'OPENAI',
  CUSTOM_RULES: 'CUSTOM_RULES',
  MANUAL: 'MANUAL',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];
export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];
export type ViolationTypeType = typeof ViolationType[keyof typeof ViolationType];
export type ModerationActionType = typeof ModerationAction[keyof typeof ModerationAction];
export type ModerationSourceType = typeof ModerationSource[keyof typeof ModerationSource];

// Define interfaces locally
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

// Define missing Prisma-like types locally
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRoleType;
  status: UserStatusType;
  reputationScore: number;
  warningCount: number;
  trainerVerified: boolean;
  suspendedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export interface ModerationLog {
  id: string;
  userId: string | null;
  contentType: string;
  contentId: string;
  content: string;
  action: ModerationActionType;
  source: ModerationSourceType;
  flaggedReason: string | null;
  confidence: number | null;
  openaiResponse: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafetyReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedContentId: string | null;
  violationType: ViolationTypeType;
  description: string;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserViolation {
  id: string;
  userId: string;
  violationType: ViolationTypeType;
  description: string;
  severity: string;
  actionTaken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafetySettings {
  id: string;
  userId: string;
  autoModerationEnabled: boolean;
  reportingEnabled: boolean;
  restrictedMode: boolean;
  blockedUsers: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// USER SAFETY QUERIES
// ============================================================================

/**
 * Get comprehensive user safety information
 */
export async function getUserSafetyProfile(userId: string): Promise<{
  user: SafeUser | null;
  violationCount: number;
  recentViolations: number;
  suspensionHistory: number;
  lastViolation?: Date;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  restrictions: string[];
}> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      status: true,
      reputationScore: true,
      warningCount: true,
      trainerVerified: true,
      suspendedUntil: true,
      createdAt: true,
      lastLoginAt: true,
    },
  }) as any;

  if (!user) {
    return {
      user: null,
      violationCount: 0,
      recentViolations: 0,
      suspensionHistory: 0,
      riskLevel: 'LOW',
      restrictions: [],
    };
  }

  // Get violation statistics
  const [violationCount, recentViolations, suspensionHistory, lastViolationResult] = await Promise.all([
    prisma.user_violations.count({ where: { userId } }),
    prisma.user_violations.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
    }),
    prisma.user_violations.count({
      where: {
        userId,
        suspensionHours: { gt: 0 },
      },
    }),
    prisma.user_violations.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  // Calculate risk level
  const riskLevel = calculateUserRiskLevel(
    user.reputationScore,
    violationCount,
    recentViolations,
    user.warningCount
  );

  // Determine active restrictions
  const restrictions = determineUserRestrictions(user, violationCount, recentViolations);

  return {
    user: user ? {
      id: user.id,
      email: user.email,
      name: user.name || 'Unknown',
      ...(user.image && { image: user.image }),
      role: user.role as UserRoleType,
      status: user.status as UserStatusType,
      reputationScore: user.reputationScore,
      warningCount: user.warningCount,
      trainerVerified: user.trainerVerified,
      suspendedUntil: user.suspendedUntil || null,
      isSafe: riskLevel === 'LOW' && user.status === UserStatus.ACTIVE,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt || null,
    } as SafeUser : null,
    violationCount,
    recentViolations,
    suspensionHistory,
    ...(lastViolationResult?.createdAt && { lastViolation: lastViolationResult.createdAt }),
    riskLevel,
    restrictions,
  };
}

/**
 * Get users flagged for potential safety concerns
 */
export async function getFlaggedUsers(params: {
  limit?: number;
  offset?: number;
  riskLevel?: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  includeRecent?: boolean;
}): Promise<Array<{
  id: string;
  name: string;
  email: string;
  role: UserRoleType;
  reputationScore: number;
  warningCount: number;
  violationCount: number;
  recentViolations: number;
  lastViolation?: Date;
  riskLevel: string;
}>> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Get users with safety concerns
  const users = await prisma.users.findMany({
    where: {
      OR: [
        { reputationScore: { lt: 50 } },
        { warningCount: { gte: 2 } },
        { status: { in: [UserStatus.SUSPENDED] } },
      ],
      ...(params.includeRecent && {
        violations: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      reputationScore: true,
      warningCount: true,
      user_violations: {
        select: {
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: [
      { reputationScore: 'asc' },
      { warningCount: 'desc' },
    ],
    take: params.limit || 50,
    skip: params.offset || 0,
  });

  return users.map((user: any) => {
    const violationCount = user.violations.length;
    const recentViolations = user.violations.filter((v: any) => v.createdAt >= thirtyDaysAgo).length;
    const lastViolation = user.violations[0]?.createdAt;
    
    const riskLevel = calculateUserRiskLevel(
      user.reputationScore,
      violationCount,
      recentViolations,
      user.warningCount
    );

    return {
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      role: user.role,
      reputationScore: user.reputationScore,
      warningCount: user.warningCount,
      violationCount,
      recentViolations,
      ...(lastViolation && { lastViolation }),
      riskLevel,
    };
  });
}

/**
 * Update user safety status after enforcement action
 */
export async function updateUserSafetyStatus(
  userId: string,
  updates: {
    reputationChange?: number;
    warningCount?: number;
    status?: UserStatusType;
    suspendedUntil?: Date | null;
  }
): Promise<User> {
  // Use regular prisma transaction instead of safeTransaction for now
  return prisma.$transaction(async (tx) => {
    const currentUser = await tx.users.findUniqueOrThrow({
      where: { id: userId },
      select: { reputationScore: true },
    });

    const newReputationScore = updates.reputationChange
      ? Math.max(0, currentUser.reputationScore + updates.reputationChange)
      : undefined;

    return tx.users.update({
      where: { id: userId },
      data: {
        ...(newReputationScore !== undefined && { reputationScore: newReputationScore }),
        ...(updates.warningCount !== undefined && { warningCount: updates.warningCount }),
        ...(updates.status && { status: updates.status }),
        ...(updates.suspendedUntil !== undefined && { suspendedUntil: updates.suspendedUntil }),
      },
    }) as Promise<User>;
  });
}

// ============================================================================
// MODERATION LOG QUERIES
// ============================================================================

/**
 * Create moderation log entry
 */
export async function createModerationLog(data: {
  userId?: string;
  contentType: string;
  contentId: string;
  content: string;
  action: ModerationActionType;
  source: ModerationSourceType;
  flaggedReason?: string;
  confidence?: number;
  openaiResponse?: any;
}): Promise<ModerationLog> {
  return prisma.moderation_logs.create({
    data: {
      ...data,
      processedAt: new Date(),
    } as any,
  }) as Promise<ModerationLog>;
}

/**
 * Get moderation logs with advanced filtering
 */
export async function getModerationLogs(params: {
  userId?: string;
  action?: ModerationActionType;
  contentType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  includeUser?: boolean;
}): Promise<Array<ModerationLog & { user?: { name: string; role: UserRoleType } }>> {
  return prisma.moderation_logs.findMany({
    where: {
      ...(params.userId && { userId: params.userId }),
      ...(params.action && { action: params.action as any }),
      ...(params.contentType && { contentType: params.contentType }),
      ...(params.dateFrom || params.dateTo) && {
        createdAt: {
          ...(params.dateFrom && { gte: params.dateFrom }),
          ...(params.dateTo && { lte: params.dateTo }),
        },
      },
    },
    ...(params.includeUser && {
      include: {
        users: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    }),
    orderBy: { createdAt: 'desc' },
    take: params.limit || 50,
    skip: params.offset || 0,
  }) as any;
}

/**
 * Get moderation statistics for dashboard
 */
export async function getModerationStatistics(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<{
  totalActions: number;
  actionBreakdown: Record<string, number>;
  contentTypeBreakdown: Record<string, number>;
  averageConfidence: number;
  topViolationReasons: Array<{ reason: string; count: number }>;
  userActivity: Array<{ userId: string; actionCount: number; userName?: string }>;
}> {
  const hoursMap = { day: 24, week: 168, month: 720 };
  const since = new Date(Date.now() - hoursMap[timeframe] * 60 * 60 * 1000);

  const [logs, reasonCounts] = await Promise.all([
    prisma.moderation_logs.findMany({
      where: { createdAt: { gte: since } },
      select: {
        action: true,
        contentType: true,
        confidence: true,
        userId: true,
        flaggedReason: true,
        users: {
          select: { name: true },
        },
      },
    }),
    prisma.moderation_logs.groupBy({
      by: ['flaggedReason'],
      where: {
        createdAt: { gte: since },
        flaggedReason: { not: null },
      },
      _count: { flaggedReason: true },
      orderBy: { _count: { flaggedReason: 'desc' } },
      take: 10,
    }),
  ]);

  // Calculate statistics
  const totalActions = logs.length;
  
  const actionBreakdown: Record<string, number> = {};
  const contentTypeBreakdown: Record<string, number> = {};
  const userActivity: Record<string, { count: number; name?: string }> = {};
  
  let totalConfidence = 0;
  let confidenceCount = 0;

  logs.forEach(log => {
    // Action breakdown
    actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
    
    // Content type breakdown
    contentTypeBreakdown[log.contentType] = (contentTypeBreakdown[log.contentType] || 0) + 1;
    
    // User activity
    if (log.userId) {
      if (!userActivity[log.userId]) {
        const userData: { count: number; name?: string } = { count: 0 };
        if (log.users?.name) {
          userData.name = log.users.name;
        }
        userActivity[log.userId] = userData;
      }
      if (userActivity[log.userId]) {
        userActivity[log.userId]!.count++;
      }
    }
    
    // Confidence calculation
    if (log.confidence !== null) {
      totalConfidence += log.confidence;
      confidenceCount++;
    }
  });

  const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
  
  const topViolationReasons = reasonCounts.map(r => ({
    reason: r.flaggedReason ?? 'Unknown',
    count: r._count.flaggedReason,
  }));

  const userActivityArray = Object.entries(userActivity)
    .map(([userId, data]) => ({
      userId,
      actionCount: data.count,
      ...(data.name && { userName: data.name }),
    }))
    .sort((a, b) => b.actionCount - a.actionCount)
    .slice(0, 10);

  return {
    totalActions,
    actionBreakdown,
    contentTypeBreakdown,
    averageConfidence,
    topViolationReasons,
    userActivity: userActivityArray,
  };
}

// ============================================================================
// SAFETY REPORTS QUERIES
// ============================================================================

/**
 * Create safety report
 */
export async function createSafetyReport(data: {
  reporterId: string;
  reportedUserId: string;
  violationType: ViolationTypeType;
  description: string;
  evidence?: any;
  contentId?: string;
  contentType?: string;
}): Promise<SafetyReport> {
  return prisma.safety_reports.create({
    data: {
      id: crypto.randomUUID(),
      ...data,
      status: 'PENDING',
      priority: determinePriority(data.violationType, data.description),
      createdAt: new Date(),
    },
  }) as any;
}

/**
 * Get pending safety reports for review
 */
export async function getPendingSafetyReports(params: {
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  limit?: number;
  offset?: number;
}): Promise<Array<SafetyReport & {
  reporter: { name: string | null; role: UserRoleType };
  reportedUser: { name: string | null; role: UserRoleType; reputationScore: number };
}>> {
  // @ts-expect-error Prisma type mismatch with local types
  return prisma.safety_reports.findMany({
    where: {
      status: { in: ['PENDING', 'INVESTIGATING'] },
      ...(params.priority && { priority: params.priority }),
    },
    include: {
      users_safety_reports_reporterIdTousers: {
        select: { name: true, role: true },
      },
      users_safety_reports_reportedUserIdTousers: {
        select: { name: true, role: true, reputationScore: true },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
    take: params.limit || 20,
    skip: params.offset || 0,
  });
}

/**
 * Update safety report status
 */
export async function updateSafetyReport(
  reportId: string,
  updates: {
    status?: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
    assignedTo?: string;
    resolution?: string;
    actionTaken?: string;
  }
): Promise<SafetyReport> {
  return prisma.safety_reports.update({
    where: { id: reportId },
    data: {
      ...updates,
      ...(updates.status === 'RESOLVED' && { resolvedAt: new Date() }),
      ...(updates.assignedTo && { 
        status: updates.status || 'INVESTIGATING',
      }),
    },
  }) as any;
}

// ============================================================================
// USER VIOLATIONS QUERIES
// ============================================================================

/**
 * Create user violation record
 */
export async function createUserViolation(data: {
  userId: string;
  violationType: ViolationTypeType;
  severity: number;
  description: string;
  contentId?: string;
  contentType?: string;
  warningIssued: boolean;
  suspensionHours?: number;
  reputationHit: number;
  moderationLogId?: string;
}): Promise<UserViolation> {
  // Use regular prisma transaction instead of safeTransaction for now
  // @ts-expect-error Prisma type mismatch with local types
  return prisma.$transaction(async (tx) => {
    // Create violation record
    const violation = await tx.user_violations.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date(),
      },
    });

    // Update user statistics
    if (data.warningIssued) {
      await tx.users.update({
        where: { id: data.userId },
        data: {
          warningCount: { increment: 1 },
          reputationScore: { decrement: data.reputationHit },
        },
      });
    }

    return violation;
  });
}

/**
 * Get user violation history
 */
export async function getUserViolationHistory(
  userId: string,
  params?: {
    limit?: number;
    offset?: number;
    includeResolved?: boolean;
  }
): Promise<UserViolation[]> {
  // @ts-expect-error Prisma type mismatch with local types
  return prisma.user_violations.findMany({
    where: {
      userId,
      ...(params?.includeResolved === false && { resolved: false }),
    },
    orderBy: { createdAt: 'desc' },
    take: params?.limit || 20,
    skip: params?.offset || 0,
  });
}

// ============================================================================
// SAFETY SETTINGS QUERIES
// ============================================================================

/**
 * Get user safety settings
 */
export async function getUserSafetySettings(userId: string): Promise<SafetySettings | null> {
  // @ts-expect-error Prisma type mismatch with local types
  return prisma.safety_settings.findUnique({
    where: { userId },
  });
}

/**
 * Update user safety settings
 */
export async function updateUserSafetySettings(
  userId: string,
  settings: Partial<{
    allowDirectMessages: boolean;
    allowTrainerMessages: boolean;
    allowGroupMessages: boolean;
    profileVisibility: string;
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    autoBlockFlaggedUsers: boolean;
    requireVerifiedTrainers: boolean;
    contentFilterStrength: string;
    safetyAlerts: boolean;
    moderationNotifications: boolean;
  }>
): Promise<SafetySettings> {
  return prisma.safety_settings.upsert({
    where: { userId },
    create: {
      userId,
      ...settings,
    } as Prisma.safety_settingsUncheckedCreateInput,
    update: settings,
  }) as any;
}

// ============================================================================
// ANALYTICS AND REPORTING QUERIES
// ============================================================================

/**
 * Get safety analytics for admin dashboard
 */
export async function getSafetyAnalytics(_timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<{
  userGrowth: Array<{ date: string; newUsers: number; activeUsers: number }>;
  violationTrends: Array<{ date: string; violations: number; severity: number }>;
  moderationEfficiency: {
    averageResponseTime: number;
    automationRate: number;
    appealRate: number;
  };
  riskDistribution: Record<string, number>;
  trainerSafety: {
    verifiedTrainers: number;
    flaggedTrainers: number;
    averageRating: number;
  };
}> {
  // This would be implemented with complex aggregation queries
  // For now, returning a structured response for the interface
  
  return {
    userGrowth: [],
    violationTrends: [],
    moderationEfficiency: {
      averageResponseTime: 0,
      automationRate: 0,
      appealRate: 0,
    },
    riskDistribution: {
      'LOW': 0,
      'MEDIUM': 0,
      'HIGH': 0,
      'CRITICAL': 0,
    },
    trainerSafety: {
      verifiedTrainers: 0,
      flaggedTrainers: 0,
      averageRating: 0,
    },
  };
}

/**
 * Generate safety report for export
 */
export async function generateSafetyReport(params: {
  startDate: Date;
  endDate: Date;
  includeUserData?: boolean;
  includeViolations?: boolean;
  includeModeration?: boolean;
}): Promise<{
  summary: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    bannedUsers: number;
    totalViolations: number;
    resolvedReports: number;
  };
  details: any[];
}> {
  const summary = await Promise.all([
    prisma.users.count(),
    prisma.users.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.users.count({ where: { status: UserStatus.SUSPENDED } }),
    prisma.users.count({ where: { status: UserStatus.BANNED } }),
    prisma.user_violations.count({
      where: {
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    }),
    prisma.safety_reports.count({
      where: {
        status: 'RESOLVED',
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    }),
  ]);

  return {
    summary: {
      totalUsers: summary[0],
      activeUsers: summary[1],
      suspendedUsers: summary[2],
      bannedUsers: summary[3],
      totalViolations: summary[4],
      resolvedReports: summary[5],
    },
    details: [], // Would include detailed data based on params
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate user risk level based on various factors
 */
function calculateUserRiskLevel(
  reputationScore: number,
  totalViolations: number,
  recentViolations: number,
  warningCount: number
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  // High risk indicators
  if (recentViolations >= 3 || totalViolations >= 10 || warningCount >= 5) {
    return 'CRITICAL';
  }
  
  if (recentViolations >= 2 || totalViolations >= 5 || warningCount >= 3 || reputationScore < 25) {
    return 'HIGH';
  }
  
  if (recentViolations >= 1 || totalViolations >= 2 || warningCount >= 1 || reputationScore < 50) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

/**
 * Determine user restrictions based on safety profile
 */
function determineUserRestrictions(
  user: any,
  totalViolations: number,
  recentViolations: number
): string[] {
  const restrictions: string[] = [];
  
  if (user.status === UserStatus.SUSPENDED) {
    restrictions.push('ACCOUNT_SUSPENDED');
  }
  
  if (user.status === UserStatus.BANNED) {
    restrictions.push('ACCOUNT_BANNED');
  }
  
  if (user.reputationScore < 25) {
    restrictions.push('NO_DIRECT_MESSAGES');
  }
  
  if (user.warningCount >= 3 || recentViolations >= 2) {
    restrictions.push('NO_POST_CREATION');
    restrictions.push('NO_COMMUNITY_CREATION');
  }
  
  if (totalViolations >= 5) {
    restrictions.push('LIMITED_INTERACTIONS');
  }
  
  return restrictions;
}

/**
 * Determine priority for safety reports
 */
function determinePriority(category: ViolationTypeType, description: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  // High priority categories
  if (category === ViolationType.THREAT || category === ViolationType.HATE_SPEECH || category === ViolationType.PRIVACY_VIOLATION) {
    return 'URGENT';
  }
  
  if (category === ViolationType.HARASSMENT || category === ViolationType.INAPPROPRIATE_CONTENT) {
    return 'HIGH';
  }
  
  if (category === ViolationType.SPAM) {
    return 'LOW';
  }
  
  // Check description for urgent keywords
  const urgentKeywords = ['threat', 'danger', 'harm', 'suicide', 'violence'];
  if (urgentKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
    return 'URGENT';
  }
  
  return 'MEDIUM';
}

// ============================================================================
// PHASE 5: TRAINER BUSINESS QUERIES
// ============================================================================

/**
 * Create or update trainer profile
 */
export async function createOrUpdateTrainerProfile(userId: string, data: {
  businessName?: string;
  businessDescription?: string;
  hourlyRate?: number;
  currency?: string;
  specializations?: string[];
  experienceYears?: number;
  availableHours?: any;
  timezone?: string;
}) {
  const existingProfile = await prisma.trainer_profiles.findUnique({
    where: { userId }
  });

  if (existingProfile) {
    return prisma.trainer_profiles.update({
      where: { userId },
      data
    });
  } else {
    return prisma.trainer_profiles.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        ...data
      } as Prisma.trainer_profilesUncheckedCreateInput
    });
  }
}

/**
 * Get trainer profile with business stats
 */
export async function getTrainerProfileWithStats(trainerId: string) {
  return prisma.trainer_profiles.findUnique({
    where: { id: trainerId },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true
        }
      },
      _count: {
        select: {
          trainer_clients: { where: { status: 'ACTIVE' } },
          appointments: true,
          trainer_reviews: true
        }
      }
    }
  });
}

/**
 * Get trainer clients with pagination and filters
 */
export async function getTrainerClients(
  trainerId: string,
  filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { status, search, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {
    trainerId,
    ...(status && { status }),
    ...(search && {
      client: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
    })
  };

  const [clients, total] = await Promise.all([
    prisma.trainer_clients.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            appointments: true,
            progress_reports: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.trainer_clients.count({ where })
  ]);

  return {
    clients,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Add client to trainer
 */
export async function addClientToTrainer(trainerId: string, clientId: string, data: {
  monthlyRate?: number;
  goals?: string[];
  notes?: string;
  medicalConditions?: string[];
  preferences?: any;
}) {
  // Check if relationship already exists
  const existing = await prisma.trainer_clients.findUnique({
    where: {
      trainerId_clientId: { trainerId, clientId }
    }
  });

  if (existing) {
    throw new Error('Client is already associated with this trainer');
  }

  const relationship = await prisma.trainer_clients.create({
    data: {
      id: crypto.randomUUID(),
      trainerId,
      clientId,
      status: 'ACTIVE',
      ...data
    } as Prisma.trainer_clientsUncheckedCreateInput
  });

  // Update trainer's client counts
  await prisma.trainer_profiles.update({
    where: { id: trainerId },
    data: {
      activeClients: { increment: 1 },
      totalClients: { increment: 1 }
    }
  });

  return relationship;
}

/**
 * Create appointment
 */
export async function createAppointment(data: {
  trainerId: string;
  clientId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration?: number;
  type?: string;
  location?: string;
  isVirtual?: boolean;
  price?: number;
  currency?: string;
}) {
  return prisma.appointments.create({
    data: {
      id: crypto.randomUUID(),
      trainerId: data.trainerId,
      clientId: data.clientId,
      title: data.title,
      description: data.description ?? null,
      scheduledAt: data.scheduledAt,
      duration: data.duration || 60,
      type: (data.type as any) || 'PERSONAL_TRAINING',
      location: data.location ?? null,
      isVirtual: data.isVirtual ?? false,
      price: data.price ?? null,
      currency: data.currency ?? 'USD',
      status: 'SCHEDULED'
    } as Prisma.appointmentsUncheckedCreateInput
  });
}

/**
 * Get trainer appointments with filters
 */
export async function getTrainerAppointments(
  trainerId: string,
  filters: {
    status?: string[];
    dateRange?: { start: Date; end: Date };
    clientId?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { status, dateRange, clientId, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {
    trainerId,
    ...(status && { status: { in: status } }),
    ...(dateRange && {
      scheduledAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    }),
    ...(clientId && { clientId })
  };

  const [appointments, total] = await Promise.all([
    prisma.appointments.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        workout_sessions: {
          select: {
            id: true,
            title: true,
            isComplete: true
          }
        }
      },
      orderBy: { scheduledAt: 'asc' },
      skip,
      take: limit
    }),
    prisma.appointments.count({ where })
  ]);

  return {
    appointments,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: string,
  updates: {
    trainerNotes?: string;
    clientNotes?: string;
    rating?: number;
    feedback?: string;
    cancellationReason?: string;
    cancelledBy?: string;
  } = {}
) {
  const updateData: any = { status, ...updates };

  if (status === 'CANCELLED') {
    updateData.cancelledAt = new Date();
  } else if (status === 'COMPLETED') {
    updateData.completedAt = new Date();
  }

  return prisma.appointments.update({
    where: { id: appointmentId },
    data: updateData
  });
}

/**
 * Create progress report
 */
export async function createProgressReport(data: {
  trainerId: string;
  clientId: string;
  trainerClientId: string;
  title: string;
  summary: string;
  period?: string;
  goals?: any[];
  achievements?: any[];
  metrics?: any;
  workoutStats?: any;
  recommendations?: string;
  nextGoals?: any[];
}) {
  return prisma.progress_reports.create({
    data: {
      id: crypto.randomUUID(),
      ...data,
      reportDate: new Date(),
      period: data.period || 'MONTHLY',
      updatedAt: new Date()
    } as Prisma.progress_reportsUncheckedCreateInput
  });
}

/**
 * Get trainer's progress reports
 */
export async function getTrainerProgressReports(
  trainerId: string,
  filters: {
    clientId?: string;
    period?: string;
    isShared?: boolean;
    page?: number;
    limit?: number;
  } = {}
) {
  const { clientId, period, isShared, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {
    trainerId,
    ...(clientId && { clientId }),
    ...(period && { period }),
    ...(isShared !== undefined && { isShared })
  };

  const [reports, total] = await Promise.all([
    prisma.progress_reports.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { reportDate: 'desc' },
      skip,
      take: limit
    }),
    prisma.progress_reports.count({ where })
  ]);

  return {
    reports,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Share progress report with client
 */
export async function shareProgressReport(reportId: string) {
  return prisma.progress_reports.update({
    where: { id: reportId },
    data: { isShared: true }
  });
}

/**
 * Get trainer earnings summary
 */
export async function getTrainerEarnings(
  trainerId: string,
  period: 'week' | 'month' | 'year' = 'month'
) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default: // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const earnings = await prisma.payments.aggregate({
    where: {
      trainerId,
      status: 'COMPLETED',
      paymentDate: { gte: startDate }
    },
    _sum: {
      amount: true,
      trainerEarnings: true,
      platformFee: true
    },
    _count: true
  });

  return {
    totalAmount: earnings._sum.amount || 0,
    trainerEarnings: earnings._sum.trainerEarnings || 0,
    platformFee: earnings._sum.platformFee || 0,
    transactionCount: earnings._count,
    period
  };
}

/**
 * Check for appointment scheduling conflicts
 */
export async function checkAppointmentConflict(
  trainerId: string,
  scheduledAt: Date,
  duration: number = 60,
  excludeAppointmentId?: string
) {
  const endTime = new Date(scheduledAt.getTime() + (duration * 60 * 1000));

  return prisma.appointments.findFirst({
    where: {
      trainerId,
      ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      OR: [
        // Appointment starts during new appointment
        {
          AND: [
            { scheduledAt: { lte: scheduledAt } },
            { scheduledAt: { gte: new Date(scheduledAt.getTime() - (60 * 60 * 1000)) } }
          ]
        },
        // Appointment ends during new appointment
        {
          AND: [
            { scheduledAt: { lte: endTime } },
            { scheduledAt: { gte: scheduledAt } }
          ]
        }
      ]
    }
  });
}

/**
 * Get trainer availability for date range
 */
export async function getTrainerAvailability(
  trainerId: string,
  startDate: Date,
  endDate: Date
) {
  // Get trainer's available hours
  const trainerProfile = await prisma.trainer_profiles.findUnique({
    where: { id: trainerId },
    select: { availableHours: true, timezone: true }
  });

  // Get existing appointments
  const appointments = await prisma.appointments.findMany({
    where: {
      trainerId,
      scheduledAt: { gte: startDate, lte: endDate },
      status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] }
    },
    select: {
      id: true,
      scheduledAt: true,
      duration: true,
      type: true,
      title: true
    }
  });

  return {
    trainerProfile,
    appointments,
    dateRange: { startDate, endDate }
  };
}

/**
 * Reschedule appointment
 */
export async function rescheduleAppointment(
  appointmentId: string,
  newScheduledAt: Date,
  reason?: string
) {
  const appointment = await prisma.appointments.findUnique({
    where: { id: appointmentId }
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Check for conflicts
  const conflict = await checkAppointmentConflict(
    appointment.trainerId,
    newScheduledAt,
    appointment.duration,
    appointmentId
  );

  if (conflict) {
    throw new Error('New time conflicts with existing appointment');
  }

  return prisma.appointments.update({
    where: { id: appointmentId },
    data: {
      scheduledAt: newScheduledAt,
      status: 'RESCHEDULED',
      trainerNotes: reason ? `Rescheduled: ${reason}` : 'Appointment rescheduled'
    }
  });
}

// ============================================================================
// PHASE 5: MOLLIE PAYMENT INTEGRATION
// ============================================================================

/**
 * Create payment record with Mollie integration
 */
export async function createMolliePayment(data: {
  trainerId: string;
  clientId: string;
  trainerClientId?: string;
  amount: number;
  currency: string;
  type: string;
  description: string;
  molliePaymentId: string;
  mollieCustomerId?: string;
  sessionDate?: Date;
  packageId?: string;
  metadata?: any;
}) {
  const payment = await prisma.payments.create({
    data: {
      id: crypto.randomUUID(),
      trainerId: data.trainerId,
      clientId: data.clientId,
      trainerClientId: data.trainerClientId ?? null,
      amount: data.amount,
      currency: data.currency,
      type: data.type as any,
      status: 'PENDING',
      method: 'MOLLIE',
      molliePaymentId: data.molliePaymentId,
      mollieCustomerId: data.mollieCustomerId ?? null,
      description: data.description,
      ...(data.sessionDate ? { sessionDate: data.sessionDate } : {}),
      packageId: data.packageId ?? null,
      metadata: data.metadata
    } as Prisma.paymentsUncheckedCreateInput
  });

  console.log('Payment record created:', {
    paymentId: payment.id,
    molliePaymentId: data.molliePaymentId,
    amount: data.amount,
    currency: data.currency
  });

  return payment;
}

/**
 * Update payment status from Mollie webhook
 */
export async function updatePaymentFromMollie(molliePaymentId: string, updates: {
  status: string;
  paymentDate?: Date;
  failureReason?: string;
  trainerEarnings?: number;
  platformFee?: number;
}) {
  const payment = await prisma.payments.findFirst({
    where: { molliePaymentId }
  });

  if (!payment) {
    throw new Error(`Payment not found for Mollie ID: ${molliePaymentId}`);
  }

  const updatedPayment = await prisma.payments.update({
    where: { id: payment.id },
    data: {
      status: updates.status as any,
      ...(updates.paymentDate ? { paymentDate: updates.paymentDate } : {}),
      ...(updates.failureReason ? { failureReason: updates.failureReason } : {}),
      ...(typeof updates.trainerEarnings === 'number' ? { trainerEarnings: updates.trainerEarnings } : {}),
      ...(typeof updates.platformFee === 'number' ? { platformFee: updates.platformFee } : {}),
    }
  });

  // Update trainer earnings if payment completed
  if (updates.status === 'COMPLETED' && updates.trainerEarnings) {
    await prisma.trainer_profiles.update({
      where: { id: payment.trainerId },
      data: {
        totalEarnings: { increment: updates.trainerEarnings },
        monthlyEarnings: { increment: updates.trainerEarnings }
      }
    });
  }

  console.log('Payment updated from Mollie:', {
    paymentId: payment.id,
    molliePaymentId,
    status: updates.status
  });

  return updatedPayment;
}

/**
 * Create Mollie customer record
 */
export async function createMollieCustomer(userId: string, mollieCustomerId: string) {
  // Update user record with Mollie customer ID
  const user = await prisma.users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Store Mollie customer ID in user metadata or separate field
  // For now, we'll use the payment records to track this
  console.log('Mollie customer created for user:', userId, mollieCustomerId);

  return { userId, mollieCustomerId };
}

/**
 * Get payment by Mollie payment ID
 */
export async function getPaymentByMollieId(molliePaymentId: string) {
  return prisma.payments.findFirst({
    where: { molliePaymentId },
    include: {
      trainer_profiles: {
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

/**
 * Process refund through Mollie
 */
export async function processRefund(paymentId: string, refundAmount: number, reason?: string) {
  const payment = await prisma.payments.findUnique({
    where: { id: paymentId }
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (!payment.molliePaymentId) {
    throw new Error('No Mollie payment ID found');
  }

  // Update payment record with refund
  const updatedPayment = await prisma.payments.update({
    where: { id: paymentId },
    data: {
      refundAmount,
      status: refundAmount >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      metadata: {
        ...payment.metadata as any,
        refundReason: reason,
        refundDate: new Date()
      }
    }
  });

  // Update trainer earnings
  if (payment.trainerEarnings && refundAmount > 0) {
    const refundFromEarnings = Math.min(refundAmount, payment.trainerEarnings);
    await prisma.trainer_profiles.update({
      where: { id: payment.trainerId },
      data: {
        totalEarnings: { decrement: refundFromEarnings },
        monthlyEarnings: { decrement: refundFromEarnings }
      }
    });
  }

  console.log('Refund processed:', {
    paymentId,
    refundAmount,
    reason
  });

  return updatedPayment;
}

/**
 * Get trainer payment analytics
 */
export async function getTrainerPaymentAnalytics(
  trainerId: string,
  period: 'week' | 'month' | 'year' = 'month'
) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default: // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [payments, paymentsByType, paymentsByStatus] = await Promise.all([
    // Total earnings
    prisma.payments.aggregate({
      where: {
        trainerId,
        paymentDate: { gte: startDate },
        status: 'COMPLETED'
      },
      _sum: {
        amount: true,
        trainerEarnings: true,
        platformFee: true
      },
      _count: true
    }),

    // Payments by type
    prisma.payments.groupBy({
      by: ['type'],
      where: {
        trainerId,
        paymentDate: { gte: startDate }
      },
      _sum: { amount: true },
      _count: true
    }),

    // Payments by status
    prisma.payments.groupBy({
      by: ['status'],
      where: {
        trainerId,
        paymentDate: { gte: startDate }
      },
      _count: true
    })
  ]);

  return {
    totalAmount: payments._sum.amount || 0,
    trainerEarnings: payments._sum.trainerEarnings || 0,
    platformFee: payments._sum.platformFee || 0,
    transactionCount: payments._count,
    paymentsByType,
    paymentsByStatus,
    period
  };
}

// ============================================================================
// PREMIUM TEAMS MANAGEMENT
// ============================================================================

/**
 * Create premium team with validation
 */
export async function createPremiumTeam(data: {
  name: string;
  description: string;
  ownerId: string;
  price: number;
  currency: string;
  billingCycle: string;
  maxMembers?: number;
  category: string;
  tags?: string[];
  features?: string[];
  rules?: string;
  isPublic?: boolean;
  requireApproval?: boolean;
  trialPeriodDays?: number;
  coverImage?: string;
}) {
  // Validate owner is a trainer
  const owner = await prisma.users.findUnique({
    where: { id: data.ownerId },
    select: { role: true }
  });

  if (!owner || owner.role !== 'TRAINER') {
    throw new Error('Only trainers can create premium teams');
  }

  const team = await prisma.premium_communities.create({
    data: {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
      price: data.price,
      currency: data.currency,
      billingCycle: data.billingCycle,
      maxMembers: data.maxMembers ?? null,
      category: data.category,
      tags: data.tags || [],
      features: data.features || [],
      rules: data.rules ?? null,
      isPublic: data.isPublic ?? false,
      requireApproval: data.requireApproval ?? true,
      trialPeriodDays: data.trialPeriodDays ?? 0,
      coverImage: data.coverImage ?? null,
      currentMembers: 0
    } as Prisma.premium_communitiesUncheckedCreateInput,
    include: {
      users: {
        select: {
          id: true,
          name: true,
          image: true,
          trainerVerified: true
        }
      }
    }
  });

  console.log('Premium team created:', {
    teamId: team.id,
    name: team.name,
    ownerId: data.ownerId
  });

  return team;
}

/**
 * Get teams with filtering and pagination
 */
export async function getTeams(params: {
  ownerId?: string;
  category?: string;
  isPublic?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  userId?: string; // For membership filtering
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
    ...(params.ownerId && { ownerId: params.ownerId }),
    ...(params.category && { category: params.category }),
    ...(params.isPublic !== undefined && { isPublic: params.isPublic }),
    ...(params.search && {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { tags: { has: params.search } }
      ]
    })
  };

  const [teams, total] = await Promise.all([
    prisma.premium_communities.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            image: true,
            trainerVerified: true
          }
        },
        _count: {
          select: {
            premium_memberships: {
              where: { status: 'ACTIVE' }
            }
          }
        },
        ...(params.userId && {
          premium_memberships: {
            where: { userId: params.userId },
            select: {
              status: true,
              startDate: true,
              endDate: true,
              isTrialActive: true
            }
          }
        })
      },
      orderBy: [
        { currentMembers: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    }),

    prisma.premium_communities.count({ where })
  ]);

  return {
    teams: teams.map(team => ({
      ...team,
      userMembership: team.premium_memberships?.[0] || null
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Join premium team
 */
export async function joinPremiumTeam(teamId: string, userId: string, paymentId?: string) {
  // Get team details
  const team = await prisma.premium_communities.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      maxMembers: true,
      currentMembers: true,
      isActive: true,
      requireApproval: true,
      trialPeriodDays: true,
      price: true
    }
  });

  if (!team) {
    throw new Error('Team not found');
  }

  if (!team.isActive) {
    throw new Error('Team is not active');
  }

  // Check member limits
  if (team.maxMembers && team.currentMembers >= team.maxMembers) {
    throw new Error('Team is full');
  }

  // Check existing membership
  const existingMembership = await prisma.premium_memberships.findUnique({
    where: {
      communityId_userId: {
        communityId: teamId,
        userId
      }
    }
  });

  if (existingMembership && existingMembership.status === 'ACTIVE') {
    throw new Error('Already a team member');
  }

  // Determine membership status and dates
  const now = new Date();
  let status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' = 'ACTIVE';
  let endDate: Date | undefined;
  let isTrialActive = false;
  let trialEndsAt: Date | undefined;

  if (team.price > 0 && !paymentId) {
    status = 'SUSPENDED';
  } else if (team.requireApproval) {
    status = 'SUSPENDED';
  } else if (team.trialPeriodDays > 0) {
    isTrialActive = true;
    trialEndsAt = new Date(now.getTime() + team.trialPeriodDays * 24 * 60 * 60 * 1000);
    endDate = trialEndsAt;
    status = 'TRIAL';
  }

  // Create or update membership
  const membership = await prisma.premium_memberships.upsert({
    where: {
      communityId_userId: {
        communityId: teamId,
        userId
      }
    },
    update: {
      status,
      startDate: now,
      endDate: endDate ?? null,
      isTrialActive,
      trialEndsAt: trialEndsAt ?? null,
      ...(paymentId ? { paymentId } : {}),
      cancelledAt: null,
      cancellationReason: null
    },
    create: {
      communityId: teamId,
      userId,
      status,
      startDate: now,
      endDate: endDate ?? null,
      isTrialActive,
      trialEndsAt: trialEndsAt ?? null,
      ...(paymentId ? { paymentId } : {})
    } as Prisma.premium_membershipsUncheckedCreateInput
  });

  // Update team member count if membership is active
  if (status === 'ACTIVE') {
    await prisma.premium_communities.update({
      where: { id: teamId },
      data: { currentMembers: { increment: 1 } }
    });
  }

  console.log('User joined premium team:', {
    teamId,
    userId,
    membershipId: membership.id,
    status
  });

  return membership;
}

/**
 * Leave premium team
 */
export async function leavePremiumTeam(teamId: string, userId: string, reason?: string) {
  const membership = await prisma.premium_memberships.findUnique({
    where: {
      communityId_userId: {
        communityId: teamId,
        userId
      }
    }
  });

  if (!membership) {
    throw new Error('Not a team member');
  }

  if (membership.status !== 'ACTIVE') {
    throw new Error('Membership not active');
  }

  // Cancel membership
  const updatedMembership = await prisma.premium_memberships.update({
    where: { id: membership.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason || 'User requested cancellation'
    }
  });

  // Update team member count
  await prisma.premium_communities.update({
    where: { id: teamId },
    data: { currentMembers: { decrement: 1 } }
  });

  console.log('User left premium team:', {
    teamId,
    userId,
    membershipId: membership.id
  });

  return updatedMembership;
}

/**
 * Get team membership details
 */
export async function getTeamMembership(teamId: string, userId: string) {
  return prisma.premium_memberships.findUnique({
    where: {
      communityId_userId: {
        communityId: teamId,
        userId
      }
    },
    include: {
      premium_communities: {
        select: {
          id: true,
          name: true,
          ownerId: true
        }
      },
      users: {
        select: {
          id: true,
          name: true,
          image: true
        }
      }
    }
  });
}

/**
 * Get team members with pagination
 */
export async function getTeamMembers(teamId: string, params: {
  status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'CANCELLED';
  page?: number;
  limit?: number;
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    communityId: teamId,
    ...(params.status && { status: params.status })
  };

  const [members, total] = await Promise.all([
    prisma.premium_memberships.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        }
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit
    }),

    prisma.premium_memberships.count({ where })
  ]);

  return {
    members,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Approve team membership
 */
export async function approveTeamMembership(membershipId: string, approverId: string) {
  const membership = await prisma.premium_memberships.findUnique({
    where: { id: membershipId },
    include: {
      premium_communities: {
        select: { ownerId: true, maxMembers: true, currentMembers: true }
      }
    }
  });

  if (!membership) {
    throw new Error('Membership not found');
  }

  if (membership.premium_communities.ownerId !== approverId) {
    throw new Error('Only team owner can approve memberships');
  }

  if (membership.status !== 'SUSPENDED') {
    throw new Error('Membership not pending approval');
  }

  // Check member limits
  if (membership.premium_communities.maxMembers &&
      membership.premium_communities.currentMembers >= membership.premium_communities.maxMembers) {
    throw new Error('Team is full');
  }

  // Approve membership
  const updatedMembership = await prisma.premium_memberships.update({
    where: { id: membershipId },
    data: {
      status: 'ACTIVE',
      startDate: new Date()
    }
  });

  // Update team member count
  await prisma.premium_communities.update({
    where: { id: membership.communityId },
    data: { currentMembers: { increment: 1 } }
  });

  console.log('Team membership approved:', {
    membershipId,
    teamId: membership.communityId,
    userId: membership.userId,
    approverId
  });

  return updatedMembership;
}

/**
 * Get team analytics for owner
 */
export async function getTeamAnalytics(teamId: string, ownerId: string) {
  // Verify ownership
  const team = await prisma.premium_communities.findUnique({
    where: { id: teamId },
    select: { ownerId: true }
  });

  if (!team || team.ownerId !== ownerId) {
    throw new Error('Access denied - team owner only');
  }

  const [
    memberStats,
    revenueStats,
    membershipTrends
  ] = await Promise.all([
    // Member statistics
    prisma.premium_memberships.groupBy({
      by: ['status'],
      where: { communityId: teamId },
      _count: true
    }),

    // Revenue statistics (simplified)
    prisma.payments.aggregate({
      where: {
        metadata: {
          path: ['teamId'],
          equals: teamId
        },
        status: 'COMPLETED'
      },
      _sum: { amount: true, trainerEarnings: true },
      _count: true
    }),

    // Membership trends (last 30 days)
    prisma.premium_memberships.findMany({
      where: {
        communityId: teamId,
        startDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        startDate: true,
        status: true
      },
      orderBy: { startDate: 'asc' }
    })
  ]);

  return {
    memberStats: memberStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>),
    revenue: {
      totalRevenue: revenueStats._sum.amount || 0,
      trainerEarnings: revenueStats._sum.trainerEarnings || 0,
      totalPayments: revenueStats._count
    },
    trends: {
      recentJoins: membershipTrends.length,
      dailyJoins: membershipTrends.reduce((acc, membership) => {
        const date = membership.startDate.toISOString().split('T')[0]!;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    }
  };
}

// ============================================================================
// CHALLENGES & COMPETITIONS
// ============================================================================

/**
 * Create challenge with validation
 */
export async function createChallenge(data: {
  title: string;
  description: string;
  creatorId: string;
  type: string;
  category: string;
  difficulty: string;
  startDate: Date;
  endDate: Date;
  isPublic?: boolean;
  maxParticipants?: number;
  entryFee?: number;
  currency?: string;
  prizePool?: number;
  rules: string;
  metrics?: any;
  rewards?: any[];
  coverImage?: string;
  tags?: string[];
}) {
  const challenge = await prisma.challenges.create({
    data: {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      creatorId: data.creatorId,
      type: data.type as any,
      category: data.category,
      difficulty: data.difficulty,
      startDate: data.startDate,
      endDate: data.endDate,
      isPublic: data.isPublic ?? true,
      maxParticipants: data.maxParticipants ?? null,
      entryFee: data.entryFee ?? 0,
      currency: data.currency ?? 'EUR',
      prizePool: data.prizePool ?? 0,
      rules: data.rules ?? null,
      metrics: data.metrics ?? {},
      rewards: data.rewards ?? [],
      coverImage: data.coverImage ?? null,
      tags: data.tags ?? [],
      status: 'UPCOMING',
      updatedAt: new Date()
    } as Prisma.challengesUncheckedCreateInput,
    include: {
      users: {
        select: {
          id: true,
          name: true,
          image: true,
          trainerVerified: true
        }
      }
    }
  });

  console.log('Challenge created:', {
    challengeId: challenge.id,
    title: challenge.title,
    creatorId: data.creatorId
  });

  return challenge;
}

/**
 * Get challenges with filtering
 */
export async function getChallenges(params: {
  creatorId?: string;
  category?: string;
  difficulty?: string;
  status?: string;
  type?: string;
  isPublic?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  userId?: string; // For participation filtering
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(params.creatorId && { creatorId: params.creatorId }),
    ...(params.category && { category: params.category }),
    ...(params.difficulty && { difficulty: params.difficulty }),
    ...(params.status && { status: params.status }),
    ...(params.type && { type: params.type }),
    ...(params.isPublic !== undefined && { isPublic: params.isPublic }),
    ...(params.search && {
      OR: [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { tags: { has: params.search } }
      ]
    })
  };

  const [challenges, total] = await Promise.all([
    prisma.challenges.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            image: true,
            trainerVerified: true
          }
        },
        _count: {
          select: {
            challenge_participants: {
              where: { status: 'REGISTERED' }
            }
          }
        },
        ...(params.userId && {
          challenge_participants: {
            where: { userId: params.userId },
            select: {
              status: true,
              joinedAt: true,
              rank: true
            }
          }
        })
      },
      orderBy: [
        { status: 'asc' },
        { startDate: 'asc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    }),

    prisma.challenges.count({ where })
  ]);

  return {
    challenges: challenges.map(challenge => ({
      ...challenge,
      userParticipation: challenge.challenge_participants?.[0] || null
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Join challenge
 */
export async function joinChallenge(challengeId: string, userId: string, paymentId?: string) {
  // Get challenge details
  const challenge = await prisma.challenges.findUnique({
    where: { id: challengeId },
    select: {
      id: true,
      status: true,
      maxParticipants: true,
      currentParticipants: true,
      entryFee: true
    }
  });

  if (!challenge) {
    throw new Error('Challenge not found');
  }

  if (challenge.status !== 'UPCOMING') {
    throw new Error('Challenge is not accepting new participants');
  }

  // Check participant limits
  if (challenge.maxParticipants && challenge.currentParticipants >= challenge.maxParticipants) {
    throw new Error('Challenge is full');
  }

  // Check existing participation
  const existingParticipation = await prisma.challenge_participants.findUnique({
    where: {
      challengeId_userId: {
        challengeId,
        userId
      }
    }
  });

  if (existingParticipation) {
    throw new Error('Already participating in this challenge');
  }

  // Determine status based on entry fee
  const status = (challenge.entryFee && challenge.entryFee > 0 && !paymentId)
    ? 'PENDING_PAYMENT'
    : 'REGISTERED';

  // Create participation
  const participation = await prisma.challenge_participants.create({
    data: {
      id: crypto.randomUUID(),
      challengeId,
      userId,
      status: status as any,
      paymentId: paymentId ?? null,
      currentProgress: {}
    } as Prisma.challenge_participantsUncheckedCreateInput
  });

  // Update challenge participant count if registered
  if (status === 'REGISTERED') {
    await prisma.challenges.update({
      where: { id: challengeId },
      data: { currentParticipants: { increment: 1 } }
    });
  }

  console.log('User joined challenge:', {
    challengeId,
    userId,
    participationId: participation.id,
    status
  });

  return participation;
}

/**
 * Leave challenge
 */
export async function leaveChallenge(challengeId: string, userId: string) {
  const participation = await prisma.challenge_participants.findUnique({
    where: {
      challengeId_userId: {
        challengeId,
        userId
      }
    },
    include: {
      challenges: {
        select: { status: true }
      }
    }
  });

  if (!participation) {
    throw new Error('Not participating in this challenge');
  }

  if (participation.challenges.status === 'ACTIVE') {
    throw new Error('Cannot leave active challenge');
  }

  if (participation.challenges.status === 'COMPLETED') {
    throw new Error('Cannot leave completed challenge');
  }

  // Remove participation
  await prisma.challenge_participants.delete({
    where: { id: participation.id }
  });

  // Update challenge participant count
  if (participation.status === 'REGISTERED') {
    await prisma.challenges.update({
      where: { id: challengeId },
      data: { currentParticipants: { decrement: 1 } }
    });
  }

  console.log('User left challenge:', {
    challengeId,
    userId,
    participationId: participation.id
  });

  return { success: true };
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  challengeId: string,
  userId: string,
  data: {
    date: Date;
    metrics: any;
    notes?: string;
    proofImages?: string[];
  }
) {
  // Get participation
  const participation = await prisma.challenge_participants.findUnique({
    where: {
      challengeId_userId: {
        challengeId,
        userId
      }
    }
  });

  if (!participation) {
    throw new Error('Not participating in this challenge');
  }

  if (participation.status !== 'REGISTERED') {
    throw new Error('Must be registered to update progress');
  }

  // Create progress entry
  const progressEntry = await prisma.challenge_progress.create({
    data: {
      id: crypto.randomUUID(),
      participantId: participation.id,
      date: data.date,
      metrics: data.metrics,
      notes: data.notes ?? null,
      proofImages: data.proofImages || [],
      isVerified: false
    }
  });

  // Update aggregated progress
  const allProgress = await prisma.challenge_progress.findMany({
    where: { participantId: participation.id },
    orderBy: { date: 'asc' }
  });

  const aggregatedProgress = calculateProgressAggregation(allProgress);

  await prisma.challenge_participants.update({
    where: { id: participation.id },
    data: {
      currentProgress: aggregatedProgress,
      updatedAt: new Date()
    }
  });

  console.log('Challenge progress updated:', {
    challengeId,
    userId,
    progressId: progressEntry.id
  });

  return { progressEntry, aggregatedProgress };
}

/**
 * Get challenge leaderboard
 */
export async function getChallengeLeaderboard(challengeId: string, params: {
  page?: number;
  limit?: number;
  userId?: string; // For privacy filtering
}) {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const skip = (page - 1) * limit;

  const [leaderboard, total] = await Promise.all([
    prisma.challenge_leaderboard.findMany({
      where: { challengeId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { rank: 'asc' },
      skip,
      take: limit
    }),

    prisma.challenge_leaderboard.count({
      where: { challengeId }
    })
  ]);

  return {
    leaderboard,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Calculate progress aggregation
 */
function calculateProgressAggregation(progressEntries: any[]) {
  const aggregated: any = {};

  progressEntries.forEach(entry => {
    if (entry.metrics && typeof entry.metrics === 'object') {
      Object.keys(entry.metrics).forEach(metric => {
        if (!aggregated[metric]) {
          aggregated[metric] = {
            total: 0,
            count: 0,
            latest: 0
          };
        }

        const value = parseFloat(entry.metrics[metric]) || 0;
        aggregated[metric].total += value;
        aggregated[metric].count += 1;
        aggregated[metric].latest = value;
      });
    }
  });

  // Calculate averages
  Object.keys(aggregated).forEach(metric => {
    if (aggregated[metric].count > 0) {
      aggregated[metric].average = aggregated[metric].total / aggregated[metric].count;
    }
  });

  return aggregated;
}

// ============================================================================
// PRIVACY-CONTROLLED LEADERBOARDS
// ============================================================================

/**
 * Get privacy-controlled leaderboard data
 */
export async function getPrivacyControlledLeaderboard(params: {
  type: 'workout' | 'challenge' | 'team' | 'global';
  category?: string;
  timeframe?: string;
  metric?: string;
  page?: number;
  limit?: number;
  userId?: string;
  includeAnonymous?: boolean;
}) {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 50, 100);
  const skip = (page - 1) * limit;

  // Calculate timeframe dates
  const timeframeDates = calculateTimeframeRange(params.timeframe || 'all_time');

  let leaderboardData: any[] = [];
  let total = 0;

  switch (params.type) {
    case 'workout':
      ({ leaderboardData, total } = await buildWorkoutLeaderboard({
        category: params.category,
        timeframe: timeframeDates,
        metric: params.metric || 'total_volume',
        skip,
        limit,
        userId: params.userId
      }));
      break;

    case 'challenge':
      ({ leaderboardData, total } = await buildChallengeLeaderboard({
        timeframe: timeframeDates,
        skip,
        limit,
        userId: params.userId
      }));
      break;

    case 'team':
      ({ leaderboardData, total } = await buildTeamLeaderboard({
        timeframe: timeframeDates,
        skip,
        limit,
        userId: params.userId
      }));
      break;

    default:
      // Default to workout leaderboard for global
      ({ leaderboardData, total } = await buildWorkoutLeaderboard({
        category: null,
        timeframe: timeframeDates,
        metric: params.metric || 'total_volume',
        skip,
        limit,
        userId: params.userId
      }));
  }

  // Apply privacy controls
  const processedLeaderboard = leaderboardData.map((entry, index) =>
    applyLeaderboardPrivacyControls(entry, params.userId, skip + index + 1, params.includeAnonymous)
  ).filter(entry => entry !== null);

  return {
    leaderboard: processedLeaderboard,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Update user privacy settings
 */
export async function updateUserPrivacySettings(userId: string, settings: any) {
  // Model no longer stores privacy settings on User. Simulate update by returning merged object.
  const updatedUser = await prisma.users.findUnique({ where: { id: userId }, select: { id: true } });
  const updatedSettings = {
    ...settings,
    lastUpdated: new Date().toISOString(),
  };
  return { id: updatedUser?.id || userId, privacySettings: updatedSettings } as any;
}

/**
 * Get user's privacy settings
 */
export async function getUserPrivacySettings(userId: string) {
  const user = await prisma.users.findUnique({ where: { id: userId }, select: { id: true } });

  if (!user) {
    throw new Error('User not found');
  }

  // Default privacy settings
  const defaultSettings = {
    allowLeaderboards: true,
    allowPublicProfile: true,
    allowWorkoutSharing: true,
    allowChallengeParticipation: true,
    allowTeamVisibility: true,
    leaderboardVisibilityLevel: 'public',
    profileVisibilityLevel: 'public',
    workoutDataVisibility: 'summary',
    showRealName: true,
    showProfileImage: true,
    showLocation: false,
    showPersonalRecords: true,
    allowDirectMessages: true
  };

  return defaultSettings;
}

/**
 * Build workout leaderboard
 */
async function buildWorkoutLeaderboard(params: any) {
  const { category, timeframe, metric, skip, limit } = params;

  const whereClause: any = {
    isComplete: true,
    ...(timeframe.start && {
      startTime: {
        gte: timeframe.start,
        lte: timeframe.end
      }
    }),
    ...(category && {
      entries: {
        some: {
          exercise: {
            category: category
          }
        }
      }
    })
  };

  const workoutStats = await prisma.workout_sessions.groupBy({
    by: ['userId'],
    where: whereClause,
    _sum: {
      totalVolume: true,
      duration: true
    },
    _count: {
      id: true
    },
    _avg: {
      totalVolume: true,
      duration: true
    }
  });

  // Sort by metric
  const sortedStats = workoutStats.sort((a, b) => {
    const valueA = getLeaderboardMetricValue(a, metric);
    const valueB = getLeaderboardMetricValue(b, metric);
    return valueB - valueA;
  });

  const total = sortedStats.length;
  const paginatedStats = sortedStats.slice(skip, skip + limit);

  // Get user details
  const userIds = paginatedStats.map(stat => stat.userId);
  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      image: true
    }
  });

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, any>);

  const leaderboardData = paginatedStats.map((stat, index) => ({
    userId: stat.userId,
    user: userMap[stat.userId],
    rank: skip + index + 1,
    score: getLeaderboardMetricValue(stat, metric),
    metrics: {
      totalVolume: stat._sum.totalVolume || 0,
      totalWorkouts: stat._count.id,
      avgVolume: stat._avg.totalVolume || 0,
      totalDuration: stat._sum.duration || 0,
      avgDuration: stat._avg.duration || 0
    },
    type: 'workout'
  }));

  return { leaderboardData, total };
}

/**
 * Build challenge leaderboard
 */
async function buildChallengeLeaderboard(params: any) {
  const { timeframe, skip, limit } = params;

  const whereClause: any = {
    ...(timeframe.start && {
      lastUpdated: {
        gte: timeframe.start,
        lte: timeframe.end
      }
    })
  };

  const challengeStats = await prisma.challenge_leaderboard.groupBy({
    by: ['userId'],
    where: whereClause,
    _sum: {
      score: true
    },
    _count: {
      id: true
    },
    _avg: {
      score: true,
      rank: true
    }
  });

  const sortedStats = challengeStats.sort((a, b) => (b._sum.score || 0) - (a._sum.score || 0));
  const total = sortedStats.length;
  const paginatedStats = sortedStats.slice(skip, skip + limit);

  const userIds = paginatedStats.map(stat => stat.userId);
  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      image: true
    }
  });

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, any>);

  const leaderboardData = paginatedStats.map((stat, index) => ({
    userId: stat.userId,
    user: userMap[stat.userId],
    rank: skip + index + 1,
    score: stat._sum.score || 0,
    metrics: {
      totalChallengeScore: stat._sum.score || 0,
      challengesParticipated: stat._count.id,
      avgScore: stat._avg.score || 0,
      avgRank: stat._avg.rank || 0
    },
    type: 'challenge'
  }));

  return { leaderboardData, total };
}

/**
 * Build team leaderboard
 */
async function buildTeamLeaderboard(params: any) {
  const { timeframe, skip, limit } = params;

  const teamStats = await prisma.premium_communities.findMany({
    where: {
      isActive: true,
      ...(timeframe.start && {
        createdAt: {
          gte: timeframe.start,
          lte: timeframe.end
        }
      })
    },
    select: {
      ownerId: true,
      currentMembers: true,
      name: true
    }
  });

  // Aggregate by owner
  const ownerStats = teamStats.reduce((acc, team) => {
    if (!acc[team.ownerId]) {
      acc[team.ownerId] = {
        userId: team.ownerId,
        totalMembers: 0,
        teamsCreated: 0
      };
    }
    acc[team.ownerId].totalMembers += team.currentMembers;
    acc[team.ownerId].teamsCreated += 1;
    return acc;
  }, {} as Record<string, any>);

  const sortedStats = Object.values(ownerStats).sort((a: any, b: any) => b.totalMembers - a.totalMembers);
  const total = sortedStats.length;
  const paginatedStats = sortedStats.slice(skip, skip + limit);

  const userIds = paginatedStats.map((stat: any) => stat.userId);
  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      image: true
    }
  });

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, any>);

  const leaderboardData = paginatedStats.map((stat: any, index) => ({
    userId: stat.userId,
    user: userMap[stat.userId],
    rank: skip + index + 1,
    score: stat.totalMembers,
    metrics: {
      totalMembers: stat.totalMembers,
      teamsCreated: stat.teamsCreated,
      avgMembersPerTeam: stat.totalMembers / stat.teamsCreated
    },
    type: 'team'
  }));

  return { leaderboardData, total };
}

/**
 * Apply privacy controls to leaderboard entry
 */
function applyLeaderboardPrivacyControls(entry: any, currentUserId?: string, position?: number, includeAnonymous?: boolean) {
  const isOwnEntry = entry.userId === currentUserId;
  const user = entry.user;

  if (!user) return null;

  // Check user privacy settings
  const privacySettings = user.privacySettings || {};
  const allowLeaderboards = privacySettings.allowLeaderboards !== false;
  const allowPublicProfile = privacySettings.allowPublicProfile !== false;

  // If user doesn't allow leaderboards and it's not their own entry, hide completely
  if (!allowLeaderboards && !isOwnEntry && !includeAnonymous) {
    return null;
  }

  // If user doesn't allow public profile, anonymize
  if (!allowPublicProfile && !isOwnEntry) {
    return {
      ...entry,
      user: {
        id: 'anonymous',
        name: `User #${position}`,
        image: null,
        isAnonymized: true
      },
      isAnonymized: true
    };
  }

  // Show normal entry
  return {
    ...entry,
    isCurrentUser: isOwnEntry,
    isAnonymized: false
  };
}

/**
 * Calculate timeframe range
 */
function calculateTimeframeRange(timeframe: string) {
  const now = new Date();

  switch (timeframe) {
    case 'daily':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      };
    case 'weekly':
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start: weekStart, end: now };
    case 'monthly':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: monthStart, end: now };
    case 'yearly':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return { start: yearStart, end: now };
    default: // all_time
      return { start: null, end: null };
  }
}

/**
 * Get metric value for leaderboard sorting
 */
function getLeaderboardMetricValue(stat: any, metric: string): number {
  switch (metric) {
    case 'total_volume':
      return stat._sum.totalVolume || 0;
    case 'total_workouts':
      return stat._count.id;
    case 'avg_volume':
      return stat._avg.totalVolume || 0;
    case 'total_duration':
      return stat._sum.duration || 0;
    default:
      return stat._sum.totalVolume || 0;
  }
}

// Note: named exports are declared inline above; avoid re-export block to prevent duplicate symbol errors
