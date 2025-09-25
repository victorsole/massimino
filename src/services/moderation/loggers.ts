/**
 * Comprehensive Moderation Action Logging for Massimino
 * Tracks all moderation activities for audit trails and analytics
 */

import { prisma } from '@/core/database';
import type { 
  ModerationResult,
  EnforcementResult,
  ContentType 
} from '@/types/moderation';
import { ModerationAction, ModerationSource } from '@prisma/client';

// ============================================================================
// LOGGING CONFIGURATION
// ============================================================================

const LOGGING_CONFIG = {
  enabled: process.env.MODERATION_LOGGING !== 'false',
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '90'), // Keep logs for 90 days
  batchSize: 100, // Batch database inserts for performance
  flushInterval: 5000, // Flush batch every 5 seconds
} as const;

// ============================================================================
// LOG ENTRY TYPES
// ============================================================================

interface ModerationLogEntry {
  userId?: string;
  action: ModerationAction;
  contentType: ContentType | string;
  content: string;
  result: ModerationResult;
  enforcement?: EnforcementResult;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    timestamp?: Date;
    requestId?: string;
  };
}

interface LogMetrics {
  timestamp: Date;
  action: string;
  duration: number;
  success: boolean;
  error?: string;
  userId?: string;
  contentLength: number;
  confidence: number;
  severity: number;
}

// ============================================================================
// BATCH LOGGING SYSTEM
// ============================================================================

class ModerationLogger {
  private logQueue: Array<{
    entry: ModerationLogEntry;
    timestamp: Date;
    id: string;
  }> = [];
  
  private metricsQueue: LogMetrics[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    if (LOGGING_CONFIG.enabled) {
      this.startBatchProcessor();
    }
  }

  /**
   * Log a moderation action
   */
  async logAction(entry: ModerationLogEntry): Promise<string> {
    if (!LOGGING_CONFIG.enabled) return '';

    const logId = this.generateLogId();
    const timestamp = new Date();

    // Add to queue for batch processing
    this.logQueue.push({
      entry,
      timestamp,
      id: logId,
    });

    // Extract metrics
    this.extractMetrics(entry, timestamp);

    // Console logging for immediate visibility
    this.logToConsole(entry, timestamp, logId);

    // Force flush if queue is getting large
    if (this.logQueue.length >= LOGGING_CONFIG.batchSize) {
      await this.flushLogs();
    }

    return logId;
  }

  /**
   * Start the batch processor
   */
  private startBatchProcessor(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs().catch(error => {
        console.error('Failed to flush moderation logs:', error);
      });
    }, LOGGING_CONFIG.flushInterval);

    // Cleanup on process exit
    process.on('beforeExit', () => {
      this.flushLogs().catch(console.error);
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }
    });
  }

  /**
   * Flush queued logs to database
   */
  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const logsToFlush = this.logQueue.splice(0);
    
    try {
      // Batch insert to database
      await prisma.moderationLog.createMany({
        data: logsToFlush.map(({ entry, timestamp, id }) => {
          const contentId = this.extractContentId(entry.content);
          const data: any = {
            id,
            contentType: entry.contentType,
            content: this.truncateContent(entry.content),
            action: entry.action,
            source: entry.result.source,
            confidence: entry.result.confidence,
            openaiResponse: this.serializeOpenAIResponse(entry.result),
            processedAt: entry.result.moderatedAt,
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          if (entry.userId) {
            data.userId = entry.userId;
          }
          if (contentId) {
            data.contentId = contentId;
          }
          if (entry.result.reason) {
            data.flaggedReason = entry.result.reason;
          }

          return data;
        }),
        skipDuplicates: true,
      });

      console.log(`Flushed ${logsToFlush.length} moderation logs to database`);

    } catch (error) {
      console.error('Failed to flush logs to database:', error);
      // Put logs back in queue for retry
      this.logQueue.unshift(...logsToFlush);
    }
  }

  /**
   * Extract metrics for analytics
   */
  private extractMetrics(
    entry: ModerationLogEntry,
    timestamp: Date
  ): void {
    const maxSeverity = Math.max(
      ...entry.result.categories.map(c => c.severity),
      1
    );

    const metrics: LogMetrics = {
      timestamp,
      action: entry.action,
      duration: this.calculateProcessingDuration(entry.result),
      success: entry.result.action !== ModerationAction.BLOCKED,
      contentLength: entry.content.length,
      confidence: entry.result.confidence,
      severity: maxSeverity,
    };

    if (entry.userId) {
      metrics.userId = entry.userId;
    }

    this.metricsQueue.push(metrics);

    // Keep metrics queue manageable
    if (this.metricsQueue.length > 1000) {
      this.metricsQueue.splice(0, 500); // Remove oldest 500
    }
  }

  /**
   * Console logging with appropriate levels
   */
  private logToConsole(
    entry: ModerationLogEntry,
    timestamp: Date,
    logId: string
  ): void {
    const logLevel = this.determineLogLevel(entry.result.action, entry.result.confidence);
    
    if (!this.shouldLog(logLevel)) return;

    const logData = {
      id: logId,
      timestamp: timestamp.toISOString(),
      userId: entry.userId || 'anonymous',
      action: entry.action,
      contentType: entry.contentType,
      confidence: entry.result.confidence,
      flagged: entry.result.flagged,
      blocked: entry.result.blocked,
      categories: entry.result.categories.map(c => c.category),
      reason: entry.result.reason,
      enforcement: entry.enforcement?.action,
    };

    switch (logLevel) {
      case 'debug':
        console.debug('🔍 Moderation Debug:', logData);
        break;
      case 'info':
        console.info('ℹ️ Moderation Info:', logData);
        break;
      case 'warn':
        console.warn('⚠️ Moderation Warning:', logData);
        break;
      case 'error':
        console.error('🚨 Moderation Error:', logData);
        break;
    }
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine appropriate log level
   */
  private determineLogLevel(
    action: ModerationAction,
    confidence: number
  ): 'debug' | 'info' | 'warn' | 'error' {
    if (action === ModerationAction.BLOCKED) return 'error';
    if (action === ModerationAction.FLAGGED && confidence > 0.8) return 'warn';
    if (action === ModerationAction.FLAGGED) return 'info';
    return 'debug';
  }

  /**
   * Check if we should log at this level
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(LOGGING_CONFIG.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Calculate processing duration if available
   */
  private calculateProcessingDuration(result: ModerationResult): number {
    // This would be calculated from start time if tracked
    // For now, estimate based on complexity
    const baseTime = 100; // 100ms base
    const categoryTime = result.categories.length * 50; // 50ms per category
    return baseTime + categoryTime;
  }

  /**
   * Extract content ID if available
   */
  private extractContentId(_content: string): string | null {
    // Try to extract ID from content metadata
    // This would depend on how content is structured
    return null;
  }

  /**
   * Truncate content for storage
   */
  private truncateContent(content: string): string {
    const maxLength = 1000; // Store up to 1000 chars
    if (content.length <= maxLength) return content;
    
    return content.substring(0, maxLength - 3) + '...';
  }

  /**
   * Serialize OpenAI response for storage
   */
  private serializeOpenAIResponse(result: ModerationResult): any {
    if (result.source !== ModerationSource.OPENAI_API) return null;
    
    return {
      flagged: result.flagged,
      categories: result.categories,
      confidence: result.confidence,
      timestamp: result.moderatedAt,
    };
  }

  /**
   * Get recent metrics
   */
  getMetrics(timeWindow: number = 3600000): LogMetrics[] {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.metricsQueue.filter(m => m.timestamp >= cutoff);
  }
}

// ============================================================================
// SINGLETON LOGGER INSTANCE
// ============================================================================

const moderationLogger = new ModerationLogger();

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Log a moderation action
 */
export async function logModerationAction(entry: ModerationLogEntry): Promise<string> {
  return moderationLogger.logAction(entry);
}

/**
 * Get moderation logs for a specific user
 */
export async function getUserModerationLogs(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Array<{
  id: string;
  action: ModerationAction;
  contentType: string;
  reason: string | null;
  confidence: number | null;
  createdAt: Date;
}>> {
  return prisma.moderationLog.findMany({
    where: { userId },
    select: {
      id: true,
      action: true,
      contentType: true,
      flaggedReason: true,
      confidence: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  }).then(logs => logs.map(log => ({
    id: log.id,
    action: log.action,
    contentType: log.contentType,
    reason: log.flaggedReason,
    confidence: log.confidence,
    createdAt: log.createdAt,
  })));
}

/**
 * Get moderation statistics
 */
export async function getModerationStats(
  timeWindow: 'day' | 'week' | 'month' = 'day'
): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  averageConfidence: number;
  flaggedContent: number;
  blockedContent: number;
  topViolationCategories: Array<{ category: string; count: number }>;
}> {
  const windowHours = { day: 24, week: 168, month: 720 }[timeWindow];
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const logs = await prisma.moderationLog.findMany({
    where: {
      createdAt: { gte: since },
    },
    select: {
      action: true,
      confidence: true,
      flaggedReason: true,
    },
  });

  const actionsByType: Record<string, number> = {};
  let totalConfidence = 0;
  let confidenceCount = 0;
  let flaggedContent = 0;
  let blockedContent = 0;
  const categoryCount: Record<string, number> = {};

  logs.forEach(log => {
    actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
    
    if (log.confidence !== null) {
      totalConfidence += log.confidence;
      confidenceCount++;
    }
    
    if (log.action === ModerationAction.FLAGGED) flaggedContent++;
    if (log.action === ModerationAction.BLOCKED) blockedContent++;
    
    if (log.flaggedReason) {
      categoryCount[log.flaggedReason] = (categoryCount[log.flaggedReason] || 0) + 1;
    }
  });

  const topViolationCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalActions: logs.length,
    actionsByType,
    averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
    flaggedContent,
    blockedContent,
    topViolationCategories,
  };
}

/**
 * Get recent moderation activity
 */
export async function getRecentModerationActivity(limit: number = 20): Promise<Array<{
  id: string;
  userId: string | null;
  action: ModerationAction;
  contentType: string;
  confidence: number | null;
  createdAt: Date;
  user?: {
    name: string | null;
    role: string;
  };
}>> {
  const logs = await prisma.moderationLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });

  return logs.map(log => ({
    id: log.id,
    userId: log.userId,
    action: log.action,
    contentType: log.contentType,
    confidence: log.confidence,
    createdAt: log.createdAt,
    ...(log.user && { user: { name: log.user.name, role: log.user.role } }),
  }));
}

/**
 * Search moderation logs
 */
export async function searchModerationLogs(params: {
  userId?: string;
  action?: ModerationAction;
  contentType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}): Promise<Array<{
  id: string;
  userId: string | null;
  action: ModerationAction;
  contentType: string;
  content: string;
  flaggedReason: string | null;
  confidence: number | null;
  createdAt: Date;
}>> {
  const where: any = {};
  
  if (params.userId) where.userId = params.userId;
  if (params.action) where.action = params.action;
  if (params.contentType) where.contentType = params.contentType;
  if (params.dateFrom || params.dateTo) {
    where.createdAt = {};
    if (params.dateFrom) where.createdAt.gte = params.dateFrom;
    if (params.dateTo) where.createdAt.lte = params.dateTo;
  }

  return prisma.moderationLog.findMany({
    where,
    select: {
      id: true,
      userId: true,
      action: true,
      contentType: true,
      content: true,
      flaggedReason: true,
      confidence: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: params.limit || 50,
    skip: params.offset || 0,
  });
}

/**
 * Clean up old logs based on retention policy
 */
export async function cleanupOldLogs(): Promise<number> {
  const cutoffDate = new Date(Date.now() - LOGGING_CONFIG.retentionDays * 24 * 60 * 60 * 1000);
  
  const result = await prisma.moderationLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  console.log(`Cleaned up ${result.count} old moderation logs`);
  return result.count;
}

/**
 * Get real-time metrics
 */
export function getRealTimeMetrics(timeWindow: number = 3600000): {
  actionsPerMinute: number;
  averageProcessingTime: number;
  successRate: number;
  topUsers: Array<{ userId: string; actionCount: number }>;
} {
  const metrics = moderationLogger.getMetrics(timeWindow);
  
  const windowMinutes = timeWindow / 60000;
  const actionsPerMinute = metrics.length / windowMinutes;
  
  const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
  const averageProcessingTime = metrics.length > 0 ? totalDuration / metrics.length : 0;
  
  const successCount = metrics.filter(m => m.success).length;
  const successRate = metrics.length > 0 ? successCount / metrics.length : 0;
  
  const userCounts: Record<string, number> = {};
  metrics.forEach(m => {
    if (m.userId) {
      userCounts[m.userId] = (userCounts[m.userId] || 0) + 1;
    }
  });
  
  const topUsers = Object.entries(userCounts)
    .map(([userId, actionCount]) => ({ userId, actionCount }))
    .sort((a, b) => b.actionCount - a.actionCount)
    .slice(0, 10);

  return {
    actionsPerMinute,
    averageProcessingTime,
    successRate,
    topUsers,
  };
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export {
  LOGGING_CONFIG,
};

export type { ModerationLogEntry, LogMetrics };