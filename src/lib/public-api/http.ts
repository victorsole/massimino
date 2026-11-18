// src/lib/public-api/http.ts
// Shared plumbing for the public API (/api/v1). Everything a consumer can observe that
// is not a resource lives here: the error format, pagination, keys, rate limits, CORS
// and the guard that stops private data leaving through a public response.
//
// The public API is a separate surface from the app's internal routes: it never reads
// the session cookie, and it never returns a database row. Resources are built field by
// field in ./resources.

import { createHash, randomBytes } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/core/database';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';

export const API_VERSION = 'v1';
export const SITE_URL = 'https://massimino.fitness';

// ── Errors (AIP-193) ─────────────────────────────────────────────────────────────────
// `status` and `details[].reason` are the contract. `message` is for a person and may be
// reworded.

export type ErrorStatus =
  | 'INVALID_ARGUMENT' // 400
  | 'UNAUTHENTICATED' // 401
  | 'PERMISSION_DENIED' // 403
  | 'NOT_FOUND' // 404
  | 'RESOURCE_EXHAUSTED' // 429
  | 'INTERNAL'; // 500

const HTTP_CODE: Record<ErrorStatus, number> = {
  INVALID_ARGUMENT: 400,
  UNAUTHENTICATED: 401,
  PERMISSION_DENIED: 403,
  NOT_FOUND: 404,
  RESOURCE_EXHAUSTED: 429,
  INTERNAL: 500,
};

export class ApiError extends Error {
  constructor(
    public status: ErrorStatus,
    public reason: string,
    message: string,
    public metadata: Record<string, string> = {},
    public headers: Record<string, string> = {}
  ) {
    super(message);
  }
}

const CORS_HEADERS: Record<string, string> = {
  // Public, read-only data: any origin may call it. No credentials are ever accepted
  // from a cookie, so there is nothing for a hostile page to ride on.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-API-Key, Content-Type',
  'Access-Control-Expose-Headers': 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After',
  'Access-Control-Max-Age': '86400',
};

function errorResponse(error: ApiError, extra: Record<string, string> = {}) {
  const code = HTTP_CODE[error.status];
  return NextResponse.json(
    {
      error: {
        code,
        status: error.status,
        message: error.message,
        details: [{ reason: error.reason, metadata: error.metadata }],
      },
    },
    { status: code, headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store', ...extra, ...error.headers } }
  );
}

// ── Leak guard ───────────────────────────────────────────────────────────────────────
// Defence in depth. Resources are built from allow-lists, so this should never fire; if a
// future change lets a private field through, the request fails instead of leaking it.

const FORBIDDEN_KEY = /^(password|passwordhash|hash|keyhash|apikeyhash|secret|token|access_?token|refresh_?token|session|email|phone|user_?id|trainer_?id|coach_?id|created_?by|ip|ip_?address|stripe.*|mollie.*)$/i;
const SECRET_VALUE = /(sk_live_|sk_test_|msk_live_[A-Za-z0-9]{8,}|eyJhbGciOi|-----BEGIN [A-Z ]*PRIVATE KEY-----|postgres(ql)?:\/\/[^\s"]+:[^\s"]+@)/;
const EMAIL_VALUE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

export function findLeak(value: unknown, path = '$'): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    if (SECRET_VALUE.test(value)) return `${path}: looks like a credential`;
    if (EMAIL_VALUE.test(value)) return `${path}: contains an email address`;
    return null;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = findLeak(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEY.test(key)) return `${path}.${key}: forbidden field name`;
      const hit = findLeak(child, `${path}.${key}`);
      if (hit) return hit;
    }
  }
  return null;
}

// ── Keys ─────────────────────────────────────────────────────────────────────────────
// A key is optional: without one the API still answers, at a lower rate limit. Only the
// SHA-256 hash is stored, so a database leak does not expose usable keys.

export const KEY_PREFIX = 'msk_live_';

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function generateKey(): { key: string; prefix: string; hash: string } {
  const key = KEY_PREFIX + randomBytes(24).toString('base64url');
  return { key, prefix: key.slice(0, KEY_PREFIX.length + 6), hash: hashKey(key) };
}

function presentedKey(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth) {
    const match = auth.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      throw new ApiError('UNAUTHENTICATED', 'API_KEY_MALFORMED', 'The Authorization header must be "Bearer <key>".', {}, {
        'WWW-Authenticate': 'Bearer realm="Massimino API"',
      });
    }
    return match[1].trim();
  }
  const header = req.headers.get('x-api-key');
  return header ? header.trim() : null;
}

interface Caller {
  /** Identifier used for rate limiting */
  id: string;
  /** True when a valid key was presented */
  keyed: boolean;
}

async function identifyCaller(req: NextRequest): Promise<Caller> {
  const key = presentedKey(req);
  if (!key) return { id: `ip:${getClientIdentifier(req)}`, keyed: false };

  const unauthenticated = new ApiError('UNAUTHENTICATED', 'API_KEY_INVALID', 'This API key is not recognised.', {}, {
    'WWW-Authenticate': 'Bearer realm="Massimino API", error="invalid_token"',
  });
  if (!key.startsWith(KEY_PREFIX)) throw unauthenticated;

  const record = await prisma.api_keys.findUnique({
    where: { keyHash: hashKey(key) },
    select: { id: true, revokedAt: true, lastUsedAt: true },
  });
  if (!record) throw unauthenticated;
  if (record.revokedAt) {
    throw new ApiError('PERMISSION_DENIED', 'API_KEY_REVOKED', 'This API key has been revoked. Create a new one at massimino.fitness/developers.');
  }

  // Touch "last used" at most once an hour, without holding up the response
  const hourAgo = Date.now() - 60 * 60 * 1000;
  if (!record.lastUsedAt || record.lastUsedAt.getTime() < hourAgo) {
    prisma.api_keys.update({ where: { id: record.id }, data: { lastUsedAt: new Date() }, select: { id: true } }).catch(() => {});
  }
  return { id: `key:${record.id}`, keyed: true };
}

// ── Rate limits ──────────────────────────────────────────────────────────────────────
// Counted in memory per server instance, so the real ceiling is somewhat higher than the
// number below when several instances are running. Documented as "about", not as a hard cap.

export const RATE_LIMIT = {
  anonymous: { maxRequests: 60, windowMs: 60_000, identifier: 'v1-anon' },
  keyed: { maxRequests: 600, windowMs: 60_000, identifier: 'v1-key' },
};

// ── Pagination (AIP-158) ─────────────────────────────────────────────────────────────

export const PAGE_SIZE_DEFAULT = 25;
export const PAGE_SIZE_MAX = 100;

export interface Page {
  size: number;
  offset: number;
}

/** A token is only valid for the query it was issued for; the fingerprint enforces that. */
function fingerprint(params: URLSearchParams): string {
  const stable = [...params.entries()]
    .filter(([k]) => k !== 'page_token' && k !== 'page_size')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return createHash('sha256').update(stable).digest('base64url').slice(0, 12);
}

export function readPage(req: NextRequest): Page {
  const params = req.nextUrl.searchParams;
  const rawSize = params.get('page_size');
  let size = PAGE_SIZE_DEFAULT;
  if (rawSize !== null && rawSize !== '' && rawSize !== '0') {
    const parsed = /^\d{1,9}$/.test(rawSize) ? Number(rawSize) : NaN;
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new ApiError('INVALID_ARGUMENT', 'PAGE_SIZE_INVALID', 'page_size must be a whole number of 0 or more.', { page_size: rawSize });
    }
    size = Math.min(parsed, PAGE_SIZE_MAX);
  }

  const token = params.get('page_token');
  if (!token) return { size, offset: 0 };
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as { o?: unknown; f?: unknown };
    if (typeof decoded.o !== 'number' || !Number.isInteger(decoded.o) || decoded.o < 0) throw new Error('offset');
    if (decoded.f !== fingerprint(params)) {
      throw new ApiError('INVALID_ARGUMENT', 'PAGE_TOKEN_MISMATCH', 'This page_token belongs to a different query. Keep the same filters while paging.');
    }
    return { size, offset: decoded.o };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('INVALID_ARGUMENT', 'PAGE_TOKEN_INVALID', 'page_token is not valid. Use the next_page_token from the previous response unchanged.');
  }
}

/** Empty string means the collection has ended. */
export function nextPageToken(req: NextRequest, page: Page, returned: number, total: number): string {
  const next = page.offset + returned;
  if (returned === 0 || next >= total) return '';
  return Buffer.from(JSON.stringify({ o: next, f: fingerprint(req.nextUrl.searchParams) }), 'utf8').toString('base64url');
}

// ── Query parameters ─────────────────────────────────────────────────────────────────

export function allowParams(req: NextRequest, allowed: string[]): void {
  const known = new Set([...allowed, 'page_size', 'page_token']);
  for (const key of req.nextUrl.searchParams.keys()) {
    if (!known.has(key)) {
      throw new ApiError('INVALID_ARGUMENT', 'UNKNOWN_PARAMETER', `Unknown query parameter "${key}".`, {
        parameter: key,
        allowed: [...known].join(', '),
      });
    }
  }
}

const TEXT_PARAM_MAX = 100;

/**
 * Reads a free-text query parameter. Control characters (a null byte makes the database
 * reject the query) and over-long values are refused rather than passed on.
 */
export function textParam(req: NextRequest, name: string): string | null {
  const value = req.nextUrl.searchParams.get(name);
  if (value === null || value === '') return null;
  if (value.length > TEXT_PARAM_MAX) {
    throw new ApiError('INVALID_ARGUMENT', 'PARAMETER_TOO_LONG', `${name} can be at most ${TEXT_PARAM_MAX} characters.`, {
      parameter: name,
      max_length: String(TEXT_PARAM_MAX),
    });
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    throw new ApiError('INVALID_ARGUMENT', 'PARAMETER_INVALID', `${name} contains characters that are not allowed.`, { parameter: name });
  }
  return value;
}

// ── The route wrapper ────────────────────────────────────────────────────────────────

type Handler<P> = (req: NextRequest, ctx: { params: P }) => Promise<unknown> | unknown;

/**
 * Wraps a public GET handler: identifies the caller, applies the rate limit, runs the
 * handler, checks the result for private data and adds the common headers.
 */
export function publicRoute<P = Record<string, string>>(handler: Handler<P>) {
  return async (req: NextRequest, ctx: { params: P }) => {
    let rateHeaders: Record<string, string> = {};
    try {
      const caller = await identifyCaller(req);
      const result = checkRateLimit(caller.id, caller.keyed ? RATE_LIMIT.keyed : RATE_LIMIT.anonymous);
      rateHeaders = getRateLimitHeaders(result) as Record<string, string>;
      if (!result.success) {
        const retryAfter = String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)));
        throw new ApiError(
          'RESOURCE_EXHAUSTED',
          'RATE_LIMIT_EXCEEDED',
          caller.keyed
            ? 'Too many requests for this key. Wait and try again.'
            : 'Too many requests. Wait and try again, or use a free API key for a higher limit.',
          { limit: String(result.limit), retry_after_seconds: retryAfter },
          { 'Retry-After': retryAfter }
        );
      }

      const body = await handler(req, ctx);

      const leak = findLeak(body);
      if (leak) {
        console.error(`[public-api] response blocked, private data detected at ${leak} (${req.nextUrl.pathname})`);
        throw new ApiError('INTERNAL', 'RESPONSE_BLOCKED', 'This response was withheld by a safety check. The problem has been logged.');
      }

      return NextResponse.json(body, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          ...rateHeaders,
          // Reference data changes rarely; let browsers and the CDN hold it briefly.
          'Cache-Control': caller.keyed ? 'private, max-age=60' : 'public, max-age=60, s-maxage=300',
        },
      });
    } catch (error) {
      if (error instanceof ApiError) return errorResponse(error, rateHeaders);
      console.error('[public-api] unexpected error', req.nextUrl.pathname, error);
      return errorResponse(new ApiError('INTERNAL', 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.'), rateHeaders);
    }
  };
}

/** Preflight for browsers calling the API from another origin */
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function notFound(reason: string, message: string, metadata: Record<string, string> = {}): never {
  throw new ApiError('NOT_FOUND', reason, message, metadata);
}
