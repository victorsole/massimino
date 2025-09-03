/**
 * Safety-Related Database Queries for Massimino
 * Optimized queries for user safety, moderation, and security operations
 */

import { prisma, safeTransaction, withRetry } from './client';
import type { 
  User, 
  UserViolation, 
  ModerationLog, 
  SafetyReport,
  SafetySettings,
  UserRole,
  UserStatus,
  ViolationType,
  ModerationAction 
} from '@prisma/client';
import type { SafeUser } from '@/types/auth';

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
  const user = await prisma.user.findUnique({
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
  });

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
    prisma.userViolation.count({ where: { userId } }),
    prisma.userViolation.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
    }),
    prisma.userViolation.count({
      where: {
        userId,
        suspensionHours: { gt: 0 },
      },
    }),
    prisma.userViolation.findFirst({
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
    user: {
      ...user,
      isSafe: riskLevel === 'LOW' && user.status === UserStatus.ACTIVE,
    },
    violationCount,
    recentViolations,
    suspensionHistory,
    lastViolation: lastViolationResult?.createdAt,
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
  role: UserRole;
  reputationScore: number;
  warningCount: number;
  violationCount: number;
  recentViolations: number;
  lastViolation?: Date;
  riskLevel: string;
}>> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Get users with safety concerns
  const users = await prisma.user.findMany({
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
      violations: {
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

  return users.map(user => {
    const violationCount = user.violations.length;
    const recentViolations = user.violations.filter(v => v.createdAt >= thirtyDaysAgo).length;
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
      lastViolation,
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
    status?: UserStatus;
    suspendedUntil?: Date | null;
  }
): Promise<User> {
  return safeTransaction(async (tx) => {
    const currentUser = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { reputationScore: true },
    });

    const newReputationScore = updates.reputationChange
      ? Math.max(0, currentUser.reputationScore + updates.reputationChange)
      : undefined;

    return tx.user.update({
      where: { id: userId },
      data: {
        ...(newReputationScore !== undefined && { reputationScore: newReputationScore }),
        ...(updates.warningCount !== undefined && { warningCount: updates.warningCount }),
        ...(updates.status && { status: updates.status }),
        ...(updates.suspendedUntil !== undefined && { suspendedUntil: updates.suspendedUntil }),
      },
    });
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
  contentId?: string;
  content: string;
  action: ModerationAction;
  source: string;
  flaggedReason?: string;
  confidence?: number;
  openaiResponse?: any;
}): Promise<ModerationLog> {
  return prisma.moderationLog.create({
    data: {
      ...data,
      processedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Get moderation logs with advanced filtering
 */
export async function getModerationLogs(params: {
  userId?: string;
  action?: ModerationAction;
  contentType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  includeUser?: boolean;
}): Promise<Array<ModerationLog & { user?: { name: string; role: UserRole } }>> {
  return prisma.moderationLog.findMany({
    where: {
      ...(params.userId && { userId: params.userId }),
      ...(params.action && { action: params.action }),
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
        user: {
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
  });
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
    prisma.moderationLog.findMany({
      where: { createdAt: { gte: since } },
      select: {
        action: true,
        contentType: true,
        confidence: true,
        userId: true,
        flaggedReason: true,
        user: {
          select: { name: true },
        },
      },
    }),
    prisma.moderationLog.groupBy({
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
        userActivity[log.userId] = { count: 0, name: log.user?.name };
      }
      userActivity[log.userId].count++;
    }
    
    // Confidence calculation
    if (log.confidence !== null) {
      totalConfidence += log.confidence;
      confidenceCount++;
    }
  });

  const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
  
  const topViolationReasons = reasonCounts.map(r => ({
    reason: r.flaggedReason || 'Unknown',
    count: r._count.flaggedReason,
  }));

  const userActivityArray = Object.entries(userActivity)
    .map(([userId, data]) => ({
      userId,
      actionCount: data.count,
      userName: data.name,
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
  category: ViolationType;
  description: string;
  evidence?: any;
  contentId?: string;
  contentType?: string;
}): Promise<SafetyReport> {
  return prisma.safetyReport.create({
    data: {
      ...data,
      status: 'PENDING',
      priority: determinePriority(data.category, data.description),
      createdAt: new Date(),
    },
  });
}

/**
 * Get pending safety reports for review
 */
export async function getPendingSafetyReports(params: {
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  limit?: number;
  offset?: number;
}): Promise<Array<SafetyReport & {
  reporter: { name: string; role: UserRole };
  reportedUser: { name: string; role: UserRole; reputationScore: number };
}>> {
  return prisma.safetyReport.findMany({
    where: {
      status: { in: ['PENDING', 'INVESTIGATING'] },
      ...(params.priority && { priority: params.priority }),
    },
    include: {
      reporter: {
        select: { name: true, role: true },
      },
      reportedUser: {
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
  return prisma.safetyReport.update({
    where: { id: reportId },
    data: {
      ...updates,
      ...(updates.status === 'RESOLVED' && { resolvedAt: new Date() }),
      ...(updates.assignedTo && { 
        status: updates.status || 'INVESTIGATING',
      }),
    },
  });
}

// ============================================================================
// USER VIOLATIONS QUERIES
// ============================================================================

/**
 * Create user violation record
 */
export async function createUserViolation(data: {
  userId: string;
  violationType: ViolationType;
  severity: number;
  description: string;
  contentId?: string;
  contentType?: string;
  actionTaken: string;
  warningIssued: boolean;
  suspensionHours?: number;
  reputationPenalty: number;
  moderationLogId: string;
}): Promise<UserViolation> {
  return safeTransaction(async (tx) => {
    // Create violation record
    const violation = await tx.userViolation.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
    });

    // Update user statistics
    if (data.warningIssued) {
      await tx.user.update({
        where: { id: data.userId },
        data: {
          warningCount: { increment: 1 },
          reputationScore: { decrement: data.reputationPenalty },
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
): Promise<Array<UserViolation & { moderationLog?: ModerationLog }>> {
  return prisma.userViolation.findMany({
    where: {
      userId,
      ...(params?.includeResolved === false && { resolved: false }),
    },
    include: {
      moderationLog: true,
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
  return prisma.safetySettings.findUnique({
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
  return prisma.safetySettings.upsert({
    where: { userId },
    create: {
      userId,
      ...settings,
    },
    update: settings,
  });
}

// ============================================================================
// ANALYTICS AND REPORTING QUERIES
// ============================================================================

/**
 * Get safety analytics for admin dashboard
 */
export async function getSafetyAnalytics(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<{
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
    prisma.user.count(),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
    prisma.user.count({ where: { status: UserStatus.BANNED } }),
    prisma.userViolation.count({
      where: {
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    }),
    prisma.safetyReport.count({
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
function determinePriority(category: ViolationType, description: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  // High priority categories
  if ([ViolationType.THREAT, ViolationType.HATE_SPEECH, ViolationType.PRIVACY_VIOLATION].includes(category)) {
    return 'URGENT';
  }
  
  if ([ViolationType.HARASSMENT, ViolationType.INAPPROPRIATE_CONTENT].includes(category)) {
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
// EXPORT ALL FUNCTIONS
// ============================================================================

export {
  // User safety
  getUserSafetyProfile,
  getFlaggedUsers,
  updateUserSafetyStatus,
  
  // Moderation logs
  createModerationLog,
  getModerationLogs,
  getModerationStatistics,
  
  // Safety reports
  createSafetyReport,
  getPendingSafetyReports,
  updateSafetyReport,
  
  // User violations
  createUserViolation,
  getUserViolationHistory,
  
  // Safety settings
  getUserSafetySettings,
  updateUserSafetySettings,
  
  // Analytics
  getSafetyAnalytics,
  generateSafetyReport,
  
  // Utilities
  calculateUserRiskLevel,
  determineUserRestrictions,
  determinePriority,
};