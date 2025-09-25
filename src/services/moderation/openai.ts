/**
 * OpenAI Moderation API Integration for Massimino
 * Core content moderation using OpenAI's moderation API with fitness-specific enhancements
 */

import OpenAI from 'openai';
import type { 
  ModerationResult, 
  ModerationContext,
  OpenAIModerationRequest,
  OpenAIModerationResponse,
  ModerationCategory 
} from '@/types/moderation';
import { ModerationAction, ModerationSource } from '@prisma/client';

// ============================================================================
// OPENAI CLIENT SETUP
// ============================================================================

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID, // Optional
});

// Configuration
const MODERATION_CONFIG = {
  model: 'text-moderation-latest' as const,
  timeout: 10000, // 10 second timeout
  retries: 3,
  threshold: parseFloat(process.env.MODERATION_THRESHOLD || '0.7'),
  strictMode: process.env.MODERATION_STRICT_MODE === 'true',
  autoBlock: process.env.MODERATION_AUTO_BLOCK === 'true',
} as const;

// Category severity mapping (OpenAI categories to our severity scale 1-5)
const CATEGORY_SEVERITY_MAP = {
  'sexual': 4,
  'sexual/minors': 5, // Highest severity
  'hate': 4,
  'hate/threatening': 5,
  'harassment': 3,
  'harassment/threatening': 4,
  'self-harm': 3,
  'self-harm/intent': 4,
  'self-harm/instructions': 5,
  'violence': 3,
  'violence/graphic': 4,
} as const;

// ============================================================================
// CORE MODERATION FUNCTIONS
// ============================================================================

/**
 * Moderate content using OpenAI API
 */
export async function moderateContent(
  content: string,
  context?: ModerationContext
): Promise<ModerationResult> {
  try {
    // Pre-processing checks
    if (!content || content.trim().length === 0) {
      return createSafeResult('Empty content provided');
    }

    if (content.length > 10000) {
      return createBlockedResult('Content too long for moderation', 'CONTENT_TOO_LONG');
    }

    // Call OpenAI Moderation API
    const startTime = Date.now();
    const response = await callOpenAIModerationAPI(content);
    const responseTime = Date.now() - startTime;

    // Process the response
    const result = await processOpenAIResponse(response, content, context);
    
    // Log performance metrics
    console.log(`Moderation completed in ${responseTime}ms`, {
      contentLength: content.length,
      flagged: result.flagged,
      confidence: result.confidence,
    });

    return result;

  } catch (error) {
    console.error('Moderation error:', error);
    
    // Fallback to blocking content on API errors for safety
    return createBlockedResult(
      'Moderation service error - content blocked for safety',
      'API_ERROR'
    );
  }
}

/**
 * Batch moderate multiple content items
 */
export async function moderateContentBatch(
  items: Array<{ id: string; content: string; context?: ModerationContext }>
): Promise<Map<string, ModerationResult>> {
  const results = new Map<string, ModerationResult>();
  
  // Process in chunks to avoid rate limits
  const CHUNK_SIZE = 10;
  const chunks = chunkArray(items, CHUNK_SIZE);
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (item) => {
      const result = await moderateContent(item.content, item.context);
      return { id: item.id, result };
    });
    
    const chunkResults = await Promise.allSettled(promises);
    
    chunkResults.forEach((promiseResult, index) => {
      const itemId = chunk[index]?.id;
      
      if (itemId) {
        if (promiseResult.status === 'fulfilled') {
          results.set(itemId, promiseResult.value.result);
        } else {
          console.error(`Batch moderation failed for item ${itemId}:`, promiseResult.reason);
          results.set(itemId, createBlockedResult('Batch moderation failed', 'BATCH_ERROR'));
        }
      }
    });
    
    // Rate limiting - wait between chunks
    if (chunks.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

// ============================================================================
// OPENAI API INTERACTION
// ============================================================================

/**
 * Call OpenAI Moderation API with retry logic
 */
async function callOpenAIModerationAPI(content: string): Promise<OpenAIModerationResponse> {
  const request: OpenAIModerationRequest = {
    input: content,
    model: MODERATION_CONFIG.model,
  };

  let lastError: Error;
  
  for (let attempt = 1; attempt <= MODERATION_CONFIG.retries; attempt++) {
    try {
      const response = await Promise.race([
        openai.moderations.create(request),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Moderation timeout')), MODERATION_CONFIG.timeout)
        ),
      ]);

      return response as OpenAIModerationResponse;

    } catch (error) {
      lastError = error as Error;
      
      console.warn(`Moderation attempt ${attempt} failed:`, error);
      
      // Wait before retry (exponential backoff)
      if (attempt < MODERATION_CONFIG.retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Process OpenAI response into our ModerationResult format
 */
async function processOpenAIResponse(
  response: OpenAIModerationResponse,
  _originalContent: string,
  context?: ModerationContext
): Promise<ModerationResult> {
  const result = response.results[0];
  
  if (!result) {
    return createSafeResult('No moderation result received');
  }
  const categories = extractModerationCategories(result);
  
  // Calculate overall confidence and severity
  const confidence = calculateConfidence(result);
  const maxSeverity = Math.max(...categories.map(c => c.severity), 1);
  
  // Determine action based on OpenAI flagging and our rules
  const action = determineAction(result, confidence, maxSeverity, context);
  
  // Create result object
  const moderationResult: ModerationResult = {
    action,
    flagged: result.flagged || action === ModerationAction.BLOCKED,
    blocked: action === ModerationAction.BLOCKED,
    confidence,
    reason: generateReason(categories, action),
    categories,
    source: ModerationSource.OPENAI_API,
    moderatedAt: new Date(),
    requiresHumanReview: shouldRequireHumanReview(result, confidence, maxSeverity),
    reviewPriority: determineReviewPriority(categories, confidence),
    suggestedAction: suggestUserAction(categories, maxSeverity),
    appealable: action !== ModerationAction.APPROVED,
  };

  return moderationResult;
}

// ============================================================================
// RESULT PROCESSING UTILITIES
// ============================================================================

/**
 * Extract and categorize violations from OpenAI response
 */
function extractModerationCategories(result: any): ModerationCategory[] {
  const categories: ModerationCategory[] = [];
  
  Object.entries(result.categories).forEach(([category, flagged]) => {
    if (flagged) {
      const score = result.category_scores[category] || 0;
      const severity = CATEGORY_SEVERITY_MAP[category as keyof typeof CATEGORY_SEVERITY_MAP] || 2;
      
      categories.push({
        category: category.replace(/[/_]/g, ' ').toUpperCase(),
        severity,
        confidence: score,
        description: getCategoryDescription(category),
      });
    }
  });
  
  return categories;
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(result: any): number {
  if (!result.flagged) return 0;
  
  const scores = Object.values(result.category_scores) as number[];
  const maxScore = Math.max(...scores);
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  // Weight max score more heavily but consider average
  return Math.min((maxScore * 0.7 + avgScore * 0.3), 1);
}

/**
 * Determine the appropriate action based on moderation results
 */
function determineAction(
  result: any, 
  confidence: number, 
  maxSeverity: number,
  context?: ModerationContext
): ModerationAction {
  // Always block high-severity violations
  if (maxSeverity >= 5) {
    return ModerationAction.BLOCKED;
  }
  
  // Block if flagged by OpenAI and above threshold
  if (result.flagged && confidence >= MODERATION_CONFIG.threshold) {
    if (MODERATION_CONFIG.autoBlock) {
      return ModerationAction.BLOCKED;
    } else {
      return ModerationAction.FLAGGED;
    }
  }
  
  // Consider context for borderline cases
  if (result.flagged && context) {
    // More strict in public contexts
    if (!context.isInPrivateMessage && confidence >= 0.5) {
      return ModerationAction.FLAGGED;
    }
    
    // More strict for low-reputation users
    if (context.authorReputation < 50 && confidence >= 0.4) {
      return ModerationAction.FLAGGED;
    }
  }
  
  return ModerationAction.APPROVED;
}

/**
 * Determine if human review is required
 */
function shouldRequireHumanReview(
  result: any,
  confidence: number,
  maxSeverity: number
): boolean {
  // Always require review for high severity
  if (maxSeverity >= 4) return true;
  
  // Require review for borderline cases
  if (result.flagged && confidence < MODERATION_CONFIG.threshold) return true;
  
  // Require review for complex cases
  const flaggedCategories = Object.values(result.categories).filter(Boolean).length;
  if (flaggedCategories > 2) return true;
  
  return false;
}

/**
 * Determine review priority
 */
function determineReviewPriority(
  categories: ModerationCategory[],
  confidence: number
): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  const maxSeverity = Math.max(...categories.map(c => c.severity), 1);
  
  if (maxSeverity >= 5 || confidence >= 0.95) return 'URGENT';
  if (maxSeverity >= 4 || confidence >= 0.85) return 'HIGH';
  if (maxSeverity >= 3 || confidence >= 0.7) return 'MEDIUM';
  return 'LOW';
}

/**
 * Suggest appropriate user action
 */
function suggestUserAction(_categories: ModerationCategory[], maxSeverity: number): any {
  if (maxSeverity >= 5) return 'BAN';
  if (maxSeverity >= 4) return 'SUSPEND_7D';
  if (maxSeverity >= 3) return 'SUSPEND_3D';
  if (maxSeverity >= 2) return 'WARN';
  return 'DELETE_CONTENT';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a safe (approved) moderation result
 */
function createSafeResult(reason: string): ModerationResult {
  return {
    action: ModerationAction.APPROVED,
    flagged: false,
    blocked: false,
    confidence: 0,
    reason,
    categories: [],
    source: ModerationSource.OPENAI_API,
    moderatedAt: new Date(),
    requiresHumanReview: false,
    reviewPriority: 'LOW',
    appealable: false,
  };
}

/**
 * Create a blocked moderation result
 */
function createBlockedResult(reason: string, category: string): ModerationResult {
  return {
    action: ModerationAction.BLOCKED,
    flagged: true,
    blocked: true,
    confidence: 1,
    reason,
    categories: [{
      category,
      severity: 3,
      confidence: 1,
      description: reason,
    }],
    source: ModerationSource.OPENAI_API,
    moderatedAt: new Date(),
    requiresHumanReview: false,
    reviewPriority: 'HIGH',
    appealable: true,
  };
}

/**
 * Get human-readable description for violation category
 */
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'sexual': 'Sexual content or suggestive material',
    'sexual/minors': 'Sexual content involving minors',
    'hate': 'Hateful or discriminatory language',
    'hate/threatening': 'Threatening hate speech',
    'harassment': 'Harassment or bullying behavior',
    'harassment/threatening': 'Threatening harassment',
    'self-harm': 'Self-harm related content',
    'self-harm/intent': 'Intent to self-harm',
    'self-harm/instructions': 'Instructions for self-harm',
    'violence': 'Violent content or language',
    'violence/graphic': 'Graphic violent content',
  };
  
  return descriptions[category] || `Violation: ${category}`;
}

/**
 * Generate human-readable reason for moderation action
 */
function generateReason(categories: ModerationCategory[], action: ModerationAction): string {
  if (categories.length === 0) {
    return action === ModerationAction.APPROVED ? 'Content approved' : 'Content flagged';
  }
  
  const primaryCategory = categories.reduce((max, cat) => 
    cat.severity > max.severity ? cat : max
  );
  
  const actionText = {
    [ModerationAction.APPROVED]: 'approved',
    [ModerationAction.FLAGGED]: 'flagged for review',
    [ModerationAction.BLOCKED]: 'blocked',
    [ModerationAction.EDITED]: 'edited',
  }[action];
  
  return `Content ${actionText} due to: ${primaryCategory.description}`;
}

/**
 * Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================================
// EXPORT API
// ============================================================================

export {
  MODERATION_CONFIG,
  CATEGORY_SEVERITY_MAP,
};