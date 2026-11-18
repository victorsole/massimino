// src/lib/mcp/oauth.ts
// The sign-in flow (OAuth 2.1 with PKCE) that lets an assistant app read a person's own
// workout log through /api/mcp/me, without a key pasted into a URL.
//
// How it fits together:
//   1. The app calls /api/mcp/me, gets 401 with a pointer to the protected-resource metadata.
//   2. It registers itself (POST /oauth/register) and sends the person to /oauth/authorize.
//   3. The person, signed in to Massimino in the normal way, clicks Allow.
//   4. The app swaps the code for a token at /oauth/token and calls /api/mcp/me with it.
//
// Nothing here needs its own table:
// - A client id, an authorisation code and the tokens are signed, self-describing strings.
// - A grant is a row in api_keys (label "Assistant sign-in: <app>"), so the person sees it
//   on /developers and revokes it there like any key. Every token points at that row and
//   stops working the moment the row is revoked.
//
// The issuer is <origin>/oauth, so its metadata lives at
// /.well-known/oauth-authorization-server/oauth. Nothing is served from the bare
// /.well-known/oauth-* paths: the open endpoint /api/mcp must never look like it wants a sign-in.

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';
import { prisma } from '@/core/database';
import { SCOPES, generateKey, type Caller } from '@/lib/public-api/http';

export const OAUTH_SCOPE = SCOPES.workoutLogRead;
export const GRANT_LABEL_PREFIX = 'Assistant sign-in: ';
export const GRANT_PREFIX = 'sign-in';

const CODE_SECONDS = 120;
const ACCESS_SECONDS = 60 * 60;
const REFRESH_SECONDS = 60 * 60 * 24 * 60;

const PREFIX = { client: 'mcpc_', code: 'mcpa_', access: 'mcpt_', refresh: 'mcpr_' } as const;
type Kind = keyof typeof PREFIX;

// ── Signed strings ───────────────────────────────────────────────────────────────────

function signingKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is not set; the assistant sign-in cannot issue tokens.');
  // A key of its own, derived from the app secret, so these strings are useless anywhere else
  return createHmac('sha256', secret).update('massimino-mcp-oauth-v1').digest();
}

function seal(kind: Kind, payload: Record<string, unknown>, lifetimeSeconds?: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, ...(lifetimeSeconds ? { exp: Math.floor(Date.now() / 1000) + lifetimeSeconds } : {}) })).toString('base64url');
  const signature = createHmac('sha256', signingKey()).update(`${kind}.${body}`).digest('base64url');
  return `${PREFIX[kind]}${body}.${signature}`;
}

function open<T extends Record<string, unknown>>(kind: Kind, value: unknown): T | null {
  if (typeof value !== 'string' || value.length > 4096 || !value.startsWith(PREFIX[kind])) return null;
  const [body, signature, extra] = value.slice(PREFIX[kind].length).split('.');
  if (!body || !signature || extra !== undefined) return null;
  const expected = createHmac('sha256', signingKey()).update(`${kind}.${body}`).digest();
  const given = Buffer.from(signature, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T & { exp?: number };
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

const digest = (value: string) => createHash('sha256').update(value).digest('base64url');

// ── Where things live ────────────────────────────────────────────────────────────────

export function endpoints(req: NextRequest | { origin: string }) {
  const origin = 'origin' in req ? req.origin : req.nextUrl.origin;
  return {
    origin,
    issuer: `${origin}/oauth`,
    resource: `${origin}/api/mcp/me`,
    resourceMetadata: `${origin}/.well-known/oauth-protected-resource/api/mcp/me`,
    authorize: `${origin}/oauth/authorize`,
    token: `${origin}/oauth/token`,
    register: `${origin}/oauth/register`,
  };
}

// ── Clients (the assistant apps) ─────────────────────────────────────────────────────

export interface Client {
  name: string;
  redirectUris: string[];
}

/** https anywhere, or plain http on the person's own machine (desktop apps and command-line tools) */
export function validRedirectUri(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 500) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.hash || url.username || url.password) return false;
  if (url.protocol === 'https:') return true;
  return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
}

export function registerClient(input: { name?: unknown; redirectUris: unknown }): { clientId: string; client: Client } | null {
  if (!Array.isArray(input.redirectUris) || input.redirectUris.length < 1 || input.redirectUris.length > 5) return null;
  if (!input.redirectUris.every(validRedirectUri)) return null;
  // The name is shown to a person on the consent screen: keep it short and plain
  const raw = typeof input.name === 'string' ? input.name : '';
  // eslint-disable-next-line no-control-regex
  const name = raw.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 40) || 'An assistant app';
  const client: Client = { name, redirectUris: input.redirectUris as string[] };
  return { clientId: seal('client', { n: client.name, r: client.redirectUris }), client };
}

export function readClient(clientId: unknown): Client | null {
  const payload = open<{ n: string; r: string[] }>('client', clientId);
  if (!payload || !Array.isArray(payload.r)) return null;
  return { name: String(payload.n), redirectUris: payload.r };
}

// ── The authorisation request ────────────────────────────────────────────────────────

export interface AuthorizeRequest {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string | null;
}

export type AuthorizeCheck =
  | { ok: true; request: AuthorizeRequest; client: Client }
  /** `redirect` is set when it is safe to send the error back to the app */
  | { ok: false; message: string; redirect: string | null };

export function redirectWith(redirectUri: string, params: Record<string, string | null>): string {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) if (value !== null) url.searchParams.set(key, value);
  return url.toString();
}

export function checkAuthorizeRequest(params: Record<string, string | undefined>): AuthorizeCheck {
  const client = readClient(params.client_id);
  // Until the app and its return address are known to be genuine, never redirect anywhere
  if (!client) return { ok: false, message: 'This sign-in link is not valid: the app is not registered with Massimino.', redirect: null };
  const redirectUri = params.redirect_uri ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : undefined);
  if (!redirectUri || !client.redirectUris.includes(redirectUri)) {
    return { ok: false, message: 'This sign-in link is not valid: its return address does not match the app.', redirect: null };
  }
  const state = params.state ?? null;
  const back = (error: string, description: string): AuthorizeCheck => ({
    ok: false,
    message: description,
    redirect: redirectWith(redirectUri, { error, error_description: description, state }),
  });
  if (params.response_type !== 'code') return back('unsupported_response_type', 'Only the authorisation code flow is supported.');
  if (!params.code_challenge || !/^[A-Za-z0-9_-]{43,128}$/.test(params.code_challenge) || params.code_challenge_method !== 'S256') {
    return back('invalid_request', 'A PKCE code challenge with method S256 is required.');
  }
  if (state && state.length > 1000) return back('invalid_request', 'The state value is too long.');
  return { ok: true, client, request: { clientId: params.client_id as string, redirectUri, codeChallenge: params.code_challenge, state } };
}

// ── Grants, codes and tokens ─────────────────────────────────────────────────────────

/** One grant per person and app: the api_keys row every token for it points at */
export async function grantFor(userId: string, client: Client): Promise<string> {
  const label = `${GRANT_LABEL_PREFIX}${client.name}`.slice(0, 60);
  // Rows made here carry the prefix 'sign-in', which a person cannot give a key of their own
  const existing = await prisma.api_keys.findFirst({ where: { userId, label, prefix: GRANT_PREFIX, revokedAt: null }, select: { id: true, scopes: true } });
  if (existing) {
    if (!existing.scopes.includes(OAUTH_SCOPE)) {
      await prisma.api_keys.update({ where: { id: existing.id }, data: { scopes: [...existing.scopes, OAUTH_SCOPE] }, select: { id: true } });
    }
    return existing.id;
  }
  // The row needs a key hash, but nobody is ever shown this key: only signed tokens reach the app
  const { hash } = generateKey();
  const created = await prisma.api_keys.create({
    data: { userId, label, prefix: GRANT_PREFIX, keyHash: hash, scopes: [OAUTH_SCOPE] },
    select: { id: true },
  });
  return created.id;
}

export function issueCode(grantId: string, request: AuthorizeRequest): string {
  return seal('code', { g: grantId, c: digest(request.clientId), r: request.redirectUri, p: request.codeChallenge, j: randomBytes(9).toString('base64url') }, CODE_SECONDS);
}

// A code is good for one exchange. Remembered per server instance, which together with the
// two-minute life and PKCE (the code is useless without the app's secret verifier) is enough.
const usedCodes = new Map<string, number>();

function tokens(grantId: string, clientId: string) {
  return {
    access_token: seal('access', { g: grantId }, ACCESS_SECONDS),
    token_type: 'Bearer',
    expires_in: ACCESS_SECONDS,
    refresh_token: seal('refresh', { g: grantId, c: digest(clientId) }, REFRESH_SECONDS),
    scope: OAUTH_SCOPE,
  };
}

async function activeGrant(grantId: unknown) {
  if (typeof grantId !== 'string') return null;
  const row = await prisma.api_keys.findUnique({ where: { id: grantId }, select: { id: true, userId: true, scopes: true, revokedAt: true, lastUsedAt: true } });
  return row && !row.revokedAt ? row : null;
}

export class TokenError extends Error {
  constructor(public code: 'invalid_request' | 'invalid_grant' | 'invalid_client' | 'unsupported_grant_type', message: string) {
    super(message);
  }
}

export async function exchangeCode(input: { code: unknown; clientId: unknown; redirectUri: unknown; codeVerifier: unknown }) {
  if (typeof input.clientId !== 'string' || !readClient(input.clientId)) throw new TokenError('invalid_client', 'The client is not registered.');
  const payload = open<{ g: string; c: string; r: string; p: string; j: string }>('code', input.code);
  if (!payload) throw new TokenError('invalid_grant', 'The authorisation code is not valid or has expired.');
  if (payload.c !== digest(input.clientId)) throw new TokenError('invalid_grant', 'The authorisation code was issued to another client.');
  if (input.redirectUri !== undefined && input.redirectUri !== payload.r) throw new TokenError('invalid_grant', 'The redirect address does not match.');
  if (typeof input.codeVerifier !== 'string' || !/^[A-Za-z0-9._~-]{43,128}$/.test(input.codeVerifier) || digest(input.codeVerifier) !== payload.p) {
    throw new TokenError('invalid_grant', 'The PKCE code verifier does not match.');
  }
  const now = Date.now();
  for (const [code, expires] of usedCodes) if (expires < now) usedCodes.delete(code);
  if (usedCodes.has(payload.j)) throw new TokenError('invalid_grant', 'The authorisation code has already been used.');
  usedCodes.set(payload.j, now + CODE_SECONDS * 1000);
  if (!(await activeGrant(payload.g))) throw new TokenError('invalid_grant', 'Access was revoked.');
  return tokens(payload.g, input.clientId);
}

export async function refresh(input: { refreshToken: unknown; clientId: unknown }) {
  const payload = open<{ g: string; c: string }>('refresh', input.refreshToken);
  if (!payload) throw new TokenError('invalid_grant', 'The refresh token is not valid or has expired.');
  if (typeof input.clientId === 'string' && payload.c !== digest(input.clientId)) throw new TokenError('invalid_grant', 'The refresh token was issued to another client.');
  if (!(await activeGrant(payload.g))) throw new TokenError('invalid_grant', 'Access was revoked.');
  return {
    access_token: seal('access', { g: payload.g }, ACCESS_SECONDS),
    token_type: 'Bearer',
    expires_in: ACCESS_SECONDS,
    // The same refresh token stays valid until it expires or the grant is revoked
    refresh_token: input.refreshToken as string,
    scope: OAUTH_SCOPE,
  };
}

/** The caller behind an access token, or null when the token is no good */
export async function callerFromAccessToken(token: string): Promise<Caller | null> {
  const payload = open<{ g: string }>('access', token);
  if (!payload) return null;
  const grant = await activeGrant(payload.g);
  if (!grant) return null;
  const hourAgo = Date.now() - 60 * 60 * 1000;
  if (!grant.lastUsedAt || grant.lastUsedAt.getTime() < hourAgo) {
    prisma.api_keys.update({ where: { id: grant.id }, data: { lastUsedAt: new Date() }, select: { id: true } }).catch(() => {});
  }
  return { id: `key:${grant.id}`, keyed: true, ownerId: grant.userId, scopes: grant.scopes };
}

export const isAccessToken = (value: string) => value.startsWith(PREFIX.access);
