/**
 * Moderation Middleware for Massimino
 * Real-time content filtering for all text inputs with fitness-specific rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { moderateContent } from './openai';
import { applyCustomRules } from '@/lib/moderation/rules';
import { logModerationAction } from '@/lib/moderation/loggers';
import { getEnforcementAction } from '@/lib/moderation/enforcement';
import type { 
  ModerationResult, 
  ModerationContext,
  ContentType 
} from '@/types/moderation';
import { ModerationAction, ModerationSource } from '@prisma/client';

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

const MIDDLEWARE_CONFIG = {
  enabled: process.env.MODERATION_ENABLED !== 'false',
  realTime: process.env.REAL_TIME_MODERATION !== 'false',
  skipForAdmins: true,
  skipForTrustedUsers: true, // Users with reputation > 95
  cacheResults: true,
  cacheTTL: 300000, // 5 minutes
} as const;

// Content type mappings for different endpoints
const ENDPOINT_CONTENT_MAP: Record<string, ContentType> = {
  '/api/posts': 'POST',
  '/api/comments': 'COMMENT',
  '/api/messages': 'MESSAGE',
  '/api/communities': 'COMMUNITY',
  '/api/profiles': 'PROFILE',
} as const;

// Results cache for avoiding duplicate API calls
const moderationCache = new Map<string, { result: ModerationResult; timestamp: number }>();

// ============================================================================
// MAIN MIDDLEWARE FUNCTION
// ============================================================================

/**
 * Main moderation middleware for API routes
 */
export async function moderationMiddleware(
  request: NextRequest,
  _context: { params?: Record<string, any> }
): Promise<NextResponse | void> {
  // Skip if moderation is disabled
  if (!MIDDLEWARE_CONFIG.enabled) {
    return;
  }

  // Only process POST, PUT, PATCH requests with content
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
    return;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const contentFields = extractContentFields(body);
    
    if (contentFields.length === 0) {
      return; // No content to moderate
    }

    // Get user context for moderation
    const userContext = await getUserContext(request);
    
    // Skip moderation for exempt users
    if (shouldSkipModeration(userContext)) {
      return;
    }

    // Moderate all content fields
    const moderationResults = await moderateAllContent(contentFields, request, userContext);
    
    // Check if any content was blocked
    const blockedContent = moderationResults.filter(r => r.result.blocked);
    
    if (blockedContent.length > 0) {
      // Log the blocked attempt
      if (blockedContent[0]) {
        const logEntry: any = {
          action: ModerationAction.BLOCKED,
          contentType: getContentType(request.url),
          content: blockedContent[0].content,
          result: blockedContent[0].result,
          metadata: {
            ipAddress: getClientIP(request),
          },
        };
        if (userContext?.userId) {
          logEntry.userId = userContext.userId;
        }
        if (request.headers.get('user-agent')) {
          logEntry.metadata.userAgent = request.headers.get('user-agent');
        }
        await logModerationAction(logEntry);
      }

      // Apply enforcement action
      if (userContext?.userId && blockedContent[0]) {
        await getEnforcementAction(userContext.userId, blockedContent[0].result);
      }

      return createBlockedResponse(blockedContent[0]?.result || { 
        action: ModerationAction.BLOCKED,
        blocked: true, 
        flagged: false, 
        categories: [], 
        confidence: 0, 
        reason: 'Content blocked', 
        moderatedAt: new Date(), 
        appealable: false,
        source: ModerationSource.CUSTOM_RULES,
        requiresHumanReview: false,
        reviewPriority: 'LOW'
      });
    }

    // Log flagged content for review
    const flaggedContent = moderationResults.filter(r => r.result.flagged);
    
    for (const flagged of flaggedContent) {
      const logEntry: any = {
        action: ModerationAction.FLAGGED,
        contentType: getContentType(request.url),
        content: flagged.content,
        result: flagged.result,
        metadata: {
          ipAddress: getClientIP(request),
        },
      };
      if (userContext?.userId) {
        logEntry.userId = userContext.userId;
      }
      if (request.headers.get('user-agent')) {
        logEntry.metadata.userAgent = request.headers.get('user-agent');
      }
      await logModerationAction(logEntry);
    }

    // Continue processing if content is approved or just flagged
    return;

  } catch (error) {
    console.error('Moderation middleware error:', error);
    
    // In strict mode, block content on moderation errors
    if (MIDDLEWARE_CONFIG.realTime) {
      return NextResponse.json(
        { 
          error: 'Content moderation failed',
          code: 'MODERATION_ERROR',
          message: 'Unable to process content due to safety checks. Please try again later.'
        },
        { status: 500 }
      );
    }
    
    // Otherwise, allow content through but log the error
    return;
  }
}

// ============================================================================
// CONTENT EXTRACTION AND PROCESSING
// ============================================================================

/**
 * Extract text content fields from request body
 */
function extractContentFields(body: any): Array<{ field: string; content: string }> {
  const contentFields: Array<{ field: string; content: string }> = [];
  
  // Common content field names
  const fieldNames = [
    'content', 'text', 'message', 'description', 'title', 
    'bio', 'comment', 'reply', 'post', 'caption'
  ];
  
  fieldNames.forEach(fieldName => {
    if (body[fieldName] && typeof body[fieldName] === 'string') {
      const content = body[fieldName].trim();
      if (content.length > 0) {
        contentFields.push({ field: fieldName, content });
      }
    }
  });
  
  // Check nested objects for content
  if (body.data && typeof body.data === 'object') {
    const nestedFields = extractContentFields(body.data);
    contentFields.push(...nestedFields.map(f => ({ 
      field: `data.${f.field}`, 
      content: f.content 
    })));
  }
  
  return contentFields;
}

/**
 * Moderate all extracted content fields
 */
async function moderateAllContent(
  contentFields: Array<{ field: string; content: string }>,
  request: NextRequest,
  userContext?: UserContext
): Promise<Array<{ field: string; content: string; result: ModerationResult }>> {
  const results: Array<{ field: string; content: string; result: ModerationResult }> = [];
  
  for (const { field, content } of contentFields) {
    // Check cache first
    const cacheKey = generateCacheKey(content, userContext?.userId);
    const cached = getCachedResult(cacheKey);
    
    let result: ModerationResult;
    
    if (cached) {
      result = cached;
    } else {
      // Build moderation context
      const context: ModerationContext = {
        isTrainerToClient: userContext?.isTrainer || false,
        isInPrivateMessage: getContentType(request.url) === 'MESSAGE',
        communityType: 'PUBLIC', // Default, could be enhanced
        authorReputation: userContext?.reputation || 0,
        authorWarnings: userContext?.warnings || 0,
        isFirstOffense: userContext?.violations === 0,
        isReply: field.includes('reply'),
        hasImages: false, // Could be enhanced to check for image URLs
        mentionsUsers: extractMentions(content),
        timeOfDay: new Date().getHours().toString(),
        dayOfWeek: new Date().getDay().toString(),
      };

      // Apply custom fitness-specific rules first
      result = await applyCustomRules(content, context);
      
      // If custom rules don't block, use OpenAI
      if (result.action === ModerationAction.APPROVED) {
        result = await moderateContent(content, context);
      }
      
      // Cache the result
      setCachedResult(cacheKey, result);
    }
    
    results.push({ field, content, result });
  }
  
  return results;
}

// ============================================================================
// USER CONTEXT AND PERMISSIONS
// ============================================================================

interface UserContext {
  userId: string;
  role: string;
  reputation: number;
  warnings: number;
  violations: number;
  isTrainer: boolean;
  isAdmin: boolean;
  isTrusted: boolean;
}

/**
 * Get user context from request
 */
async function getUserContext(_request: NextRequest): Promise<UserContext | undefined> {
  // This would typically extract user info from session/JWT
  // For now, return undefined - would be implemented with actual auth
  
  // Example implementation:
  // const session = await getSessionFromRequest(request);
  // if (!session?.user) return undefined;
  // 
  // return {
  //   userId: session.user.id,
  //   role: session.user.role,
  //   reputation: session.user.reputationScore,
  //   warnings: session.user.warningCount,
  //   violations: session.user.violations || 0,
  //   isTrainer: session.user.role === 'TRAINER',
  //   isAdmin: session.user.role === 'ADMIN',
  //   isTrusted: session.user.reputationScore > 95,
  // };
  
  return undefined;
}

/**
 * Determine if moderation should be skipped for this user
 */
function shouldSkipModeration(userContext?: UserContext): boolean {
  if (!userContext) return false;
  
  // Skip for admins if configured
  if (MIDDLEWARE_CONFIG.skipForAdmins && userContext.isAdmin) {
    return true;
  }
  
  // Skip for highly trusted users
  if (MIDDLEWARE_CONFIG.skipForTrustedUsers && userContext.isTrusted) {
    return true;
  }
  
  return false;
}

// ============================================================================
// RESPONSE CREATION
// ============================================================================

/**
 * Create response for blocked content
 */
function createBlockedResponse(result: ModerationResult): NextResponse {
  const response = {
    error: 'Content blocked',
    code: 'CONTENT_MODERATION_VIOLATION',
    message: result.reason || 'Your content violates our community guidelines',
    details: {
      categories: result.categories,
      confidence: result.confidence,
      appealable: result.appealable,
      timestamp: result.moderatedAt,
    },
    // Safety reminder for fitness platform
    reminder: 'Massimino is a fitness-focused platform. Please keep conversations respectful and related to health, training, and wellness.',
  };
  
  return NextResponse.json(response, { 
    status: 400,
    headers: {
      'X-Content-Blocked': 'true',
      'X-Block-Reason': result.categories[0]?.category || 'unknown',
    }
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get content type from request URL
 */
function getContentType(url?: string): ContentType {
  if (!url) return 'POST';
  
  for (const [endpoint, type] of Object.entries(ENDPOINT_CONTENT_MAP)) {
    if (url.includes(endpoint)) {
      return type;
    }
  }
  
  return 'POST';
}

/**
 * Extract mentions from content
 */
function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    if (match[1]) {
      mentions.push(match[1]);
    }
  }
  
  return mentions;
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Generate cache key for moderation result
 */
function generateCacheKey(content: string, userId?: string): string {
  const contentHash = hashString(content);
  return `mod:${contentHash}:${userId || 'anon'}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get cached moderation result
 */
function getCachedResult(key: string): ModerationResult | null {
  if (!MIDDLEWARE_CONFIG.cacheResults) return null;
  
  const cached = moderationCache.get(key);
  if (!cached) return null;
  
  // Check if cache entry has expired
  if (Date.now() - cached.timestamp > MIDDLEWARE_CONFIG.cacheTTL) {
    moderationCache.delete(key);
    return null;
  }
  
  return cached.result;
}

/**
 * Set cached moderation result
 */
function setCachedResult(key: string, result: ModerationResult): void {
  if (!MIDDLEWARE_CONFIG.cacheResults) return;
  
  moderationCache.set(key, {
    result,
    timestamp: Date.now(),
  });
  
  // Clean up old cache entries periodically
  if (moderationCache.size > 1000) {
    const cutoff = Date.now() - MIDDLEWARE_CONFIG.cacheTTL;
    for (const [k, v] of moderationCache.entries()) {
      if (v.timestamp < cutoff) {
        moderationCache.delete(k);
      }
    }
  }
}

// ============================================================================
// CLIENT-SIDE MODERATION HELPER
// ============================================================================

/**
 * Client-side content validation before submission
 * Returns validation result with user-friendly feedback
 */
export function validateContentClient(content: string): {
  valid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Basic content validation
  if (content.length === 0) {
    warnings.push('Content cannot be empty');
    return { valid: false, warnings, suggestions };
  }
  
  if (content.length > 5000) {
    warnings.push('Content is too long (maximum 5000 characters)');
    suggestions.push('Try breaking your content into smaller posts');
  }
  
  // Simple client-side checks for obvious violations
  const suspiciousPatterns = [
    /\b(meet me|hook up|sexy|hot pics)\b/i,
    /\b(scam|fake|free money|click here)\b/i,
    /\b(stupid|idiot|loser|hate you)\b/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      warnings.push('Content may violate community guidelines');
      suggestions.push('Please keep discussions respectful and fitness-focused');
      break;
    }
  }
  
  // Positive suggestions for fitness content
  if (content.length > 100 && !content.match(/\b(workout|exercise|fitness|training|health|nutrition)\b/i)) {
    suggestions.push('Consider relating your post to fitness, health, or training topics');
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
    suggestions,
  };
}

// ============================================================================
// EXPORT API
// ============================================================================

export type { UserContext };