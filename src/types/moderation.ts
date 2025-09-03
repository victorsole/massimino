/**
 * Safety and Moderation Type Definitions for Massimino
 * Comprehensive type system for content moderation and user safety
 */

import { ModerationAction, ModerationSource, ViolationType } from '@prisma/client';

// ============================================================================
// MODERATION CORE TYPES
// ============================================================================

/**
 * Result from content moderation check
 */
export interface ModerationResult {
  // Decision
  action: ModerationAction;
  flagged: boolean;
  blocked: boolean;
  
  // Confidence and reasoning
  confidence: number; // 0-1 scale
  reason?: string;
  categories: ModerationCategory[];
  
  // Source information
  source: ModerationSource;
  moderatedAt: Date;
  
  // Optional human review
  requiresHumanReview: boolean;
  reviewPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  // Suggested actions
  suggestedAction?: UserAction;
  appealable: boolean;
}

/**
 * Categories of content violations
 */
export interface ModerationCategory {
  category: string;
  subcategory?: string;
  severity: number; // 1-5 scale
  confidence: number; // 0-1 scale
  description: string;
}

/**
 * Actions that can be taken on users/content
 */
export type UserAction = 
  | 'WARN'
  | 'MUTE_1H'
  | 'MUTE_24H'
  | 'SUSPEND_3D'
  | 'SUSPEND_7D'
  | 'SUSPEND_30D'
  | 'BAN'
  | 'DELETE_CONTENT'
  | 'EDIT_CONTENT';

/**
 * Content that needs to be moderated
 */
export interface ModerationTarget {
  id: string;
  type: ContentType;
  content: string;
  authorId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  context?: ModerationContext;
}

export type ContentType = 
  | 'POST'
  | 'COMMENT' 
  | 'MESSAGE'
  | 'PROFILE'
  | 'COMMUNITY'
  | 'IMAGE'
  | 'VIDEO';

/**
 * Context for better moderation decisions
 */
export interface ModerationContext {
  // Relationship context
  isTrainerToClient: boolean;
  isInPrivateMessage: boolean;
  communityType: 'PUBLIC' | 'PRIVATE' | 'TRAINER';
  
  // User context
  authorReputation: number;
  authorWarnings: number;
  isFirstOffense: boolean;
  
  // Content context
  isReply: boolean;
  hasImages: boolean;
  mentionsUsers: string[];
  
  // Timing context
  timeOfDay: string;
  dayOfWeek: string;
}

// ============================================================================
// OPENAI MODERATION TYPES
// ============================================================================

/**
 * OpenAI Moderation API request
 */
export interface OpenAIModerationRequest {
  input: string | string[];
  model?: 'text-moderation-latest' | 'text-moderation-stable';
}

/**
 * OpenAI Moderation API response
 */
export interface OpenAIModerationResponse {
  id: string;
  model: string;
  results: OpenAIModerationResult[];
}

export interface OpenAIModerationResult {
  flagged: boolean;
  categories: {
    sexual: boolean;
    hate: boolean;
    harassment: boolean;
    'self-harm': boolean;
    'sexual/minors': boolean;
    'hate/threatening': boolean;
    'violence/graphic': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    'harassment/threatening': boolean;
    violence: boolean;
  };
  category_scores: {
    sexual: number;
    hate: number;
    harassment: number;
    'self-harm': number;
    'sexual/minors': number;
    'hate/threatening': number;
    'violence/graphic': number;
    'self-harm/intent': number;
    'self-harm/instructions': number;
    'harassment/threatening': number;
    violence: number;
  };
}

// ============================================================================
// CUSTOM MODERATION RULES
// ============================================================================

/**
 * Custom fitness-specific moderation rules
 */
export interface CustomModerationRule {
  id: string;
  name: string;
  description: string;
  category: ViolationType;
  
  // Rule configuration
  enabled: boolean;
  severity: number; // 1-5
  confidence: number; // 0-1
  
  // Pattern matching
  patterns: string[];
  keywords: string[];
  regexPatterns?: string[];
  
  // Context filters
  contexts: ContentType[];
  userRoles: string[];
  communityTypes: string[];
  
  // Actions
  action: ModerationAction;
  autoBlock: boolean;
  requireHumanReview: boolean;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  usageCount: number;
}

/**
 * Fitness-specific violation categories
 */
export type FitnessViolationType = 
  | 'INAPPROPRIATE_PERSONAL_COMMENTS'  // Comments on appearance vs. performance
  | 'UNSOLICITED_PERSONAL_ATTENTION'   // Creepy behavior
  | 'FAKE_TRAINER_CREDENTIALS'         // Impersonation
  | 'UNSAFE_EXERCISE_ADVICE'           // Dangerous recommendations
  | 'SUPPLEMENT_SPAM'                  // Unauthorized promotions
  | 'BODY_SHAMING'                     // Negative body comments
  | 'NUTRITION_MISINFORMATION'         // False diet claims
  | 'PREDATORY_TRAINING_OFFERS'        // Exploitative business practices
  | 'OFF_TOPIC_CONTENT'               // Non-fitness related
  | 'PRIVACY_INVASION';               // Sharing personal info

// ============================================================================
// VIOLATION TRACKING
// ============================================================================

/**
 * User violation record
 */
export interface UserViolation {
  id: string;
  userId: string;
  violationType: ViolationType | FitnessViolationType;
  severity: number;
  description: string;
  
  // Evidence
  contentId?: string;
  contentType?: ContentType;
  evidence: ViolationEvidence;
  
  // Actions taken
  actionTaken: UserAction;
  warningIssued: boolean;
  suspensionHours?: number;
  reputationPenalty: number;
  
  // Status
  status: 'PENDING' | 'CONFIRMED' | 'APPEALED' | 'RESOLVED';
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  
  // Context
  moderationLogId: string;
  reportId?: string;
  createdAt: Date;
}

export interface ViolationEvidence {
  originalContent: string;
  screenshots?: string[];
  context: string;
  witnessIds?: string[];
  relatedViolations?: string[];
}

/**
 * Violation statistics for users
 */
export interface ViolationStats {
  totalViolations: number;
  violationsByType: Record<string, number>;
  violationsBySeverity: Record<number, number>;
  recentViolations: number; // Last 30 days
  warningsReceived: number;
  suspensionHistory: SuspensionRecord[];
  lastViolation?: Date;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
}

export interface SuspensionRecord {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  violationId: string;
  active: boolean;
}

// ============================================================================
// SAFETY REPORTING SYSTEM
// ============================================================================

/**
 * User safety report
 */
export interface SafetyReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  
  // Report details
  category: ViolationType | FitnessViolationType;
  priority: ReportPriority;
  description: string;
  evidence: ReportEvidence;
  
  // Context
  incidentDate: Date;
  contentId?: string;
  contentType?: ContentType;
  location: 'APP' | 'DM' | 'COMMUNITY' | 'PROFILE';
  
  // Processing
  status: ReportStatus;
  assignedTo?: string;
  investigationNotes?: string;
  resolution?: string;
  actionTaken?: UserAction;
  
  // Timestamps
  submittedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  
  // Follow-up
  followUpRequired: boolean;
  reporterNotified: boolean;
  reportedUserNotified: boolean;
}

export type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ReportStatus = 'SUBMITTED' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export interface ReportEvidence {
  description: string;
  screenshots: string[];
  messageIds: string[];
  timestamps: Date[];
  additionalContext?: string;
}

// ============================================================================
// SAFETY ENFORCEMENT
// ============================================================================

/**
 * Enforcement configuration
 */
export interface EnforcementConfig {
  // Thresholds
  warningThreshold: number;
  suspensionThreshold: number;
  banThreshold: number;
  
  // Penalties
  firstOffensePenalty: number;
  repeatOffenseMultiplier: number;
  severityMultipliers: Record<number, number>;
  
  // Suspension durations (hours)
  suspensionDurations: {
    first: number;
    second: number;
    third: number;
    subsequent: number;
  };
  
  // Reputation penalties
  reputationPenalties: Record<ViolationType, number>;
  
  // Auto-actions
  autoSuspendSeverity: number;
  autoBanSeverity: number;
  autoDeleteSeverity: number;
}

/**
 * Enforcement action result
 */
export interface EnforcementResult {
  action: UserAction;
  duration?: number; // For timed actions
  reason: string;
  severity: number;
  reputationChange: number;
  
  // User impact
  newReputationScore: number;
  newWarningCount: number;
  newStatus: string;
  
  // Notifications
  notifyUser: boolean;
  notifyReporter: boolean;
  escalateToAdmin: boolean;
  
  // Appeals
  canAppeal: boolean;
  appealDeadline?: Date;
}

// ============================================================================
// MODERATION DASHBOARD TYPES
// ============================================================================

/**
 * Moderation queue item
 */
export interface ModerationQueueItem {
  id: string;
  priority: ReportPriority;
  type: ContentType;
  status: 'PENDING' | 'IN_REVIEW' | 'ESCALATED';
  
  // Content info
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  
  // Moderation info
  flaggedAt: Date;
  flaggedFor: string[];
  confidence: number;
  aiSuggestion: UserAction;
  
  // Assignment
  assignedTo?: string;
  assignedAt?: Date;
  
  // Context
  reportCount: number;
  similarCases: number;
  urgencyScore: number;
}

/**
 * Moderation statistics
 */
export interface ModerationStats {
  // Queue stats
  pendingReviews: number;
  avgResponseTime: number; // minutes
  queueBacklog: number;
  
  // Action stats
  actionsLast24h: number;
  actionsLast7d: number;
  actionsByType: Record<UserAction, number>;
  
  // Accuracy stats
  aiAccuracy: number; // %
  humanOverrideRate: number; // %
  appealSuccessRate: number; // %
  
  // User stats
  activeUsers: number;
  flaggedUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  
  // Content stats
  totalContentModerated: number;
  contentByCategory: Record<string, number>;
  falsePositiveRate: number; // %
}

/**
 * Safety trends and analytics
 */
export interface SafetyTrends {
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  
  // Violation trends
  violationTrend: TrendData[];
  categoryTrends: Record<string, TrendData[]>;
  severityTrends: TrendData[];
  
  // User safety trends
  userSafetyScore: number; // Platform average
  newUserViolations: TrendData[];
  trainerViolations: TrendData[];
  
  // Response trends
  responseTimeTrend: TrendData[];
  resolutionTrend: TrendData[];
  
  // Predictive analytics
  riskPredictions: RiskPrediction[];
  recommendedActions: string[];
}

export interface TrendData {
  date: Date;
  value: number;
  change: number; // % change from previous period
}

export interface RiskPrediction {
  userId: string;
  riskScore: number; // 0-100
  riskFactors: string[];
  recommendedMonitoring: string;
  confidenceLevel: number; // 0-1
}