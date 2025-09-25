/**
 * Tiered Enforcement System for Massimino
 * Implements graduated responses to violations with reputation-based adjustments
 */

import { prisma } from '@/core/database';
import { logModerationAction } from './loggers';
import type { 
  ModerationResult,
  EnforcementConfig,
  EnforcementResult,
  UserAction
} from '@/types/moderation';
import { UserStatus, ViolationType } from '@prisma/client';

// ============================================================================
// ENFORCEMENT CONFIGURATION
// ============================================================================

const DEFAULT_ENFORCEMENT_CONFIG: EnforcementConfig = {
  // Violation count thresholds
  warningThreshold: 3,      // Warnings before suspension
  suspensionThreshold: 5,   // Total violations before suspension
  banThreshold: 10,         // Total violations before permanent ban

  // Penalty calculations
  firstOffensePenalty: 5,   // Base reputation penalty
  repeatOffenseMultiplier: 1.5, // Multiply penalty for repeat offenses
  severityMultipliers: {
    1: 0.5,  // Minor violations (50% penalty)
    2: 1.0,  // Normal violations (100% penalty)
    3: 1.5,  // Serious violations (150% penalty)
    4: 2.0,  // Severe violations (200% penalty)
    5: 3.0,  // Critical violations (300% penalty)
  },

  // Suspension durations (in hours)
  suspensionDurations: {
    first: 24,      // First suspension: 24 hours
    second: 72,     // Second suspension: 3 days
    third: 168,     // Third suspension: 1 week
    subsequent: 720, // Subsequent: 1 month
  },

  // Reputation penalties by violation type
  reputationPenalties: {
    [ViolationType.INAPPROPRIATE_CONTENT]: 15,
    [ViolationType.HARASSMENT]: 20,
    [ViolationType.SPAM]: 10,
    [ViolationType.IMPERSONATION]: 25,
    [ViolationType.OFF_TOPIC]: 5,
    [ViolationType.PRIVACY_VIOLATION]: 30,
    [ViolationType.HATE_SPEECH]: 40,
    [ViolationType.THREAT]: 50,
  },

  // Auto-action thresholds
  autoSuspendSeverity: 4,   // Auto-suspend for severity >= 4
  autoBanSeverity: 5,       // Auto-ban for severity >= 5
  autoDeleteSeverity: 3,    // Auto-delete content for severity >= 3
};

// Load config from environment or use defaults
const ENFORCEMENT_CONFIG: EnforcementConfig = {
  ...DEFAULT_ENFORCEMENT_CONFIG,
  // Override with environment variables if present
  warningThreshold: parseInt(process.env.WARNING_THRESHOLD || '3'),
  suspensionThreshold: parseInt(process.env.SUSPENSION_THRESHOLD || '5'),
  banThreshold: parseInt(process.env.BAN_THRESHOLD || '10'),
  firstOffensePenalty: parseInt(process.env.REPUTATION_PENALTY || '5'),
};

// ============================================================================
// MAIN ENFORCEMENT FUNCTION
// ============================================================================

/**
 * Apply enforcement action based on moderation result
 */
export async function getEnforcementAction(
  userId: string,
  moderationResult: ModerationResult,
  contentId?: string,
  contentType?: string
): Promise<EnforcementResult> {
  try {
    // Get user's current safety status
    const user = await getUserSafetyInfo(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate violation severity
    const severity = calculateViolationSeverity(moderationResult);
    
    // Determine appropriate action
    const action = await determineEnforcementAction(user, severity);
    
    // Calculate penalties
    const reputationChange = calculateReputationPenalty(user, severity, moderationResult);
    
    // Apply the enforcement action
    const result = await applyEnforcementAction(
      userId,
      action,
      severity,
      reputationChange,
      moderationResult,
      contentId,
      contentType
    );

    return result;

  } catch (error) {
    console.error('Enforcement action failed:', error);
    
    // Return a safe default action
    return {
      action: 'WARN',
      reason: 'Enforcement system error - defaulting to warning',
      severity: 2,
      reputationChange: -5,
      newReputationScore: 0,
      newWarningCount: 0,
      newStatus: UserStatus.ACTIVE,
      notifyUser: true,
      notifyReporter: false,
      escalateToAdmin: true,
      canAppeal: true,
    };
  }
}

// ============================================================================
// USER SAFETY INFORMATION
// ============================================================================

interface UserSafetyInfo {
  id: string;
  reputationScore: number;
  warningCount: number;
  status: UserStatus;
  suspendedUntil?: Date | null;
  violationHistory: {
    total: number;
    recent: number; // Last 30 days
    bySeverity: Record<number, number>;
    byType: Record<string, number>;
    lastViolation?: Date;
  };
  suspensionHistory: number;
}

/**
 * Get comprehensive user safety information
 */
async function getUserSafetyInfo(userId: string): Promise<UserSafetyInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      reputationScore: true,
      warningCount: true,
      status: true,
      suspendedUntil: true,
    },
  });

  if (!user) return null;

  // Get violation history
  const violations = await prisma.userViolation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentViolations = violations.filter(v => v.createdAt > thirtyDaysAgo);

  // Group violations by severity and type
  const bySeverity: Record<number, number> = {};
  const byType: Record<string, number> = {};

  violations.forEach(violation => {
    bySeverity[violation.severity] = (bySeverity[violation.severity] || 0) + 1;
    byType[violation.violationType] = (byType[violation.violationType] || 0) + 1;
  });

  // Count suspension history
  const suspensionHistory = violations.filter(v => v.suspensionHours && v.suspensionHours > 0).length;

  return {
    ...user,
    violationHistory: {
      total: violations.length,
      recent: recentViolations.length,
      bySeverity,
      byType,
      ...(violations[0]?.createdAt && { lastViolation: violations[0].createdAt }),
    },
    suspensionHistory,
  };
}

// ============================================================================
// ACTION DETERMINATION
// ============================================================================

/**
 * Calculate severity score from moderation result
 */
function calculateViolationSeverity(result: ModerationResult): number {
  if (result.categories.length === 0) return 1;
  
  // Use highest severity from categories
  const maxSeverity = Math.max(...result.categories.map(c => c.severity));
  
  // Adjust based on confidence
  const confidenceMultiplier = result.confidence > 0.9 ? 1.2 : 
                               result.confidence > 0.7 ? 1.0 : 0.8;
  
  return Math.min(Math.round(maxSeverity * confidenceMultiplier), 5);
}

/**
 * Determine appropriate enforcement action
 */
async function determineEnforcementAction(
  user: UserSafetyInfo,
  severity: number
): Promise<UserAction> {
  const config = ENFORCEMENT_CONFIG;
  
  // Check for auto-ban conditions
  if (severity >= config.autoBanSeverity || user.violationHistory.total >= config.banThreshold) {
    return 'BAN';
  }

  // Check for auto-suspend conditions
  if (severity >= config.autoSuspendSeverity || 
      user.warningCount >= config.warningThreshold ||
      user.violationHistory.recent >= 3) {
    
    // Determine suspension length based on history
    if (user.suspensionHistory === 0) return 'SUSPEND_3D';
    if (user.suspensionHistory === 1) return 'SUSPEND_7D';
    return 'SUSPEND_30D';
  }

  // Check for muting (less severe than suspension)
  if (severity >= 3 || user.violationHistory.recent >= 2) {
    return user.warningCount >= 2 ? 'MUTE_24H' : 'MUTE_1H';
  }

  // Check for content deletion
  if (severity >= config.autoDeleteSeverity) {
    return user.warningCount >= 1 ? 'DELETE_CONTENT' : 'WARN';
  }

  // Default to warning for first-time or minor offenses
  return 'WARN';
}

/**
 * Calculate reputation penalty
 */
function calculateReputationPenalty(
  user: UserSafetyInfo,
  severity: number,
  result: ModerationResult
): number {
  const config = ENFORCEMENT_CONFIG;
  
  // Base penalty
  let penalty = config.firstOffensePenalty;
  
  // Apply severity multiplier
  penalty *= config.severityMultipliers[severity] || 1;
  
  // Apply repeat offense multiplier
  if (user.violationHistory.total > 0) {
    penalty *= Math.pow(config.repeatOffenseMultiplier, Math.min(user.violationHistory.total, 5));
  }
  
  // Apply violation type penalty
  if (result.categories.length > 0) {
    const primaryCategory = result.categories[0];
    if (primaryCategory && primaryCategory.subcategory) {
      const typeKey = Object.keys(ViolationType).find(key => 
        ViolationType[key as keyof typeof ViolationType] === primaryCategory.subcategory
      );
      
      if (typeKey) {
        const typePenalty = config.reputationPenalties[primaryCategory.subcategory as ViolationType];
        penalty = Math.max(penalty, typePenalty);
      }
    }
  }
  
  // Apply recent violation multiplier (more penalties for rapid violations)
  if (user.violationHistory.recent > 1) {
    penalty *= 1 + (user.violationHistory.recent - 1) * 0.5;
  }
  
  // Cap the penalty (don't destroy someone's reputation in one go)
  const maxPenalty = Math.max(user.reputationScore * 0.3, 50); // Max 30% of current reputation or 50 points
  
  return Math.round(Math.min(penalty, maxPenalty));
}

// ============================================================================
// ACTION APPLICATION
// ============================================================================

/**
 * Apply the determined enforcement action
 */
async function applyEnforcementAction(
  userId: string,
  action: UserAction,
  severity: number,
  reputationPenalty: number,
  moderationResult: ModerationResult,
  contentId?: string,
  contentType?: string
): Promise<EnforcementResult> {
  const actionDetails = parseUserAction(action);
  
      // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
    // Get current user state
    const currentUser = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { reputationScore: true, warningCount: true, status: true },
    });

    // Calculate new values
    const newReputationScore = Math.max(0, currentUser.reputationScore - reputationPenalty);
    const newWarningCount = actionDetails.isWarning ? currentUser.warningCount + 1 : currentUser.warningCount;
    const newStatus = actionDetails.newStatus || currentUser.status;
    
    // Update user record
    await tx.user.update({
      where: { id: userId },
      data: {
        reputationScore: newReputationScore,
        warningCount: newWarningCount,
        status: newStatus,
        ...(actionDetails.suspendedUntil && { suspendedUntil: actionDetails.suspendedUntil }),
      },
    });

    // Create violation record
    await tx.userViolation.create({
      data: {
        userId,
        violationType: getViolationTypeFromResult(moderationResult),
        severity,
        description: moderationResult.reason || 'Content violation detected',
        ...(contentId && { contentId }),
        ...(contentType && { contentType }),
        warningIssued: actionDetails.isWarning,
        ...(actionDetails.duration && { suspensionHours: actionDetails.duration }),
        reputationHit: reputationPenalty,
        moderationLogId: 'temp', // Would be set by the logging system
      },
    });

    const result: EnforcementResult = {
      action,
      reason: generateEnforcementReason(action, severity, moderationResult),
      severity,
      reputationChange: -reputationPenalty,
      newReputationScore,
      newWarningCount,
      newStatus: newStatus,
      notifyUser: shouldNotifyUser(action),
      notifyReporter: shouldNotifyReporter(action),
      escalateToAdmin: shouldEscalateToAdmin(action, severity),
      canAppeal: canAppealAction(action),
    };

    if (actionDetails.duration) {
      result.duration = actionDetails.duration;
    }

    const appealDeadline = getAppealDeadline(action);
    if (appealDeadline) {
      result.appealDeadline = appealDeadline;
    }

    return result;
  });

  // Log the enforcement action
  await logModerationAction({
    userId,
    action: parseActionToModerationAction(action),
    contentType: contentType || 'UNKNOWN',
    content: 'Enforcement action applied',
    result: moderationResult,
    enforcement: result,
  });

  return result;
}

// ============================================================================
// ACTION PARSING AND UTILITIES
// ============================================================================

interface ActionDetails {
  isWarning: boolean;
  duration?: number;
  newStatus?: UserStatus;
  suspendedUntil?: Date;
}

/**
 * Parse user action into actionable details
 */
function parseUserAction(action: UserAction): ActionDetails {
  const now = new Date();
  
  switch (action) {
    case 'WARN':
      return { isWarning: true };
      
    case 'MUTE_1H':
      return { 
        isWarning: false, 
        duration: 1,
        // Muting is handled at application level, not user status
      };
      
    case 'MUTE_24H':
      return { 
        isWarning: false, 
        duration: 24,
      };
      
    case 'SUSPEND_3D':
      return {
        isWarning: false,
        duration: 72,
        newStatus: UserStatus.SUSPENDED,
        suspendedUntil: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      };
      
    case 'SUSPEND_7D':
      return {
        isWarning: false,
        duration: 168,
        newStatus: UserStatus.SUSPENDED,
        suspendedUntil: new Date(now.getTime() + 168 * 60 * 60 * 1000),
      };
      
    case 'SUSPEND_30D':
      return {
        isWarning: false,
        duration: 720,
        newStatus: UserStatus.SUSPENDED,
        suspendedUntil: new Date(now.getTime() + 720 * 60 * 60 * 1000),
      };
      
    case 'BAN':
      return {
        isWarning: false,
        newStatus: UserStatus.BANNED,
      };
      
    case 'DELETE_CONTENT':
      return { isWarning: false };
      
    case 'EDIT_CONTENT':
      return { isWarning: false };
      
    default:
      return { isWarning: true };
  }
}

/**
 * Generate human-readable enforcement reason
 */
function generateEnforcementReason(
  action: UserAction,
  severity: number,
  result: ModerationResult
): string {
  const severityText = ['minor', 'minor', 'moderate', 'serious', 'severe', 'critical'][severity] || 'unknown';
  const actionText = {
    'WARN': 'warning issued',
    'MUTE_1H': 'muted for 1 hour',
    'MUTE_24H': 'muted for 24 hours',
    'SUSPEND_3D': 'suspended for 3 days',
    'SUSPEND_7D': 'suspended for 7 days',
    'SUSPEND_30D': 'suspended for 30 days',
    'BAN': 'permanently banned',
    'DELETE_CONTENT': 'content deleted',
    'EDIT_CONTENT': 'content edited',
  }[action] || 'action taken';

  return `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} due to ${severityText} violation: ${result.reason}`;
}

/**
 * Helper functions for enforcement decisions
 */
function shouldNotifyUser(action: UserAction): boolean {
  return !['DELETE_CONTENT', 'EDIT_CONTENT'].includes(action);
}

function shouldNotifyReporter(action: UserAction): boolean {
  return ['SUSPEND_3D', 'SUSPEND_7D', 'SUSPEND_30D', 'BAN'].includes(action);
}

function shouldEscalateToAdmin(action: UserAction, severity: number): boolean {
  return action === 'BAN' || severity >= 4;
}

function canAppealAction(action: UserAction): boolean {
  return !['WARN', 'MUTE_1H'].includes(action);
}

function getAppealDeadline(action: UserAction): Date | undefined {
  if (!canAppealAction(action)) return undefined;
  
  const days = action === 'BAN' ? 30 : 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function getViolationTypeFromResult(result: ModerationResult): ViolationType {
  if (result.categories.length === 0) return ViolationType.OFF_TOPIC;
  
  // Map category to violation type
  const firstCategory = result.categories[0];
  if (!firstCategory) return ViolationType.OFF_TOPIC;
  
  const category = firstCategory.category.toLowerCase();
  
  if (category.includes('sexual') || category.includes('inappropriate')) {
    return ViolationType.INAPPROPRIATE_CONTENT;
  }
  if (category.includes('harassment') || category.includes('hate')) {
    return ViolationType.HARASSMENT;
  }
  if (category.includes('spam')) {
    return ViolationType.SPAM;
  }
  if (category.includes('privacy')) {
    return ViolationType.PRIVACY_VIOLATION;
  }
  if (category.includes('threat') || category.includes('violence')) {
    return ViolationType.THREAT;
  }
  
  return ViolationType.OFF_TOPIC;
}

function parseActionToModerationAction(action: UserAction): any {
  // This would map to ModerationAction enum values
  // For now, returning a string
  return action.includes('SUSPEND') || action === 'BAN' ? 'BLOCKED' : 'FLAGGED';
}

// ============================================================================
// CONFIGURATION MANAGEMENT
// ============================================================================

/**
 * Update enforcement configuration
 */
export function updateEnforcementConfig(updates: Partial<EnforcementConfig>): void {
  Object.assign(ENFORCEMENT_CONFIG, updates);
}

/**
 * Get current enforcement configuration
 */
export function getEnforcementConfig(): EnforcementConfig {
  return { ...ENFORCEMENT_CONFIG };
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export {
  DEFAULT_ENFORCEMENT_CONFIG,
};

export type {
  EnforcementResult,
  EnforcementConfig,
  UserAction,
};