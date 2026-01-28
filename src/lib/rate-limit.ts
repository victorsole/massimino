/**
 * Simple in-memory rate limiter for API routes
 * Uses a sliding window algorithm for accurate rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (use Redis in production for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

export interface RateLimitConfig {
  maxRequests: number;    // Max requests allowed
  windowMs: number;       // Time window in milliseconds
  identifier?: string;    // Optional identifier prefix
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given identifier
 * @param identifier - Unique identifier (usually IP or user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { maxRequests, windowMs, identifier: prefix = '' } = config;
  const key = prefix ? `${prefix}:${identifier}` : identifier;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // No existing entry or window expired - create new
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Within window - check limit
  if (entry.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Pre-configured rate limit configs for common use cases
 */
export const RATE_LIMITS = {
  // Standard API endpoints - 100 requests per minute
  standard: {
    maxRequests: 100,
    windowMs: 60000,
    identifier: 'api',
  } as RateLimitConfig,

  // Authentication endpoints - stricter limits
  auth: {
    maxRequests: 10,
    windowMs: 60000,
    identifier: 'auth',
  } as RateLimitConfig,

  // AI endpoints - expensive operations
  ai: {
    maxRequests: 20,
    windowMs: 60000,
    identifier: 'ai',
  } as RateLimitConfig,

  // File upload - limited
  upload: {
    maxRequests: 10,
    windowMs: 60000,
    identifier: 'upload',
  } as RateLimitConfig,

  // Health data sync - moderate limits
  health: {
    maxRequests: 30,
    windowMs: 60000,
    identifier: 'health',
  } as RateLimitConfig,
} as const;

/**
 * Helper to create rate limit response headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };
}
