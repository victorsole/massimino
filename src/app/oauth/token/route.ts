// POST /oauth/token: the assistant app swaps an authorisation code (or a refresh token)
// for an access token. Public clients only, so PKCE is what proves the app is the one
// the person approved.
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { CORS_HEADERS } from '@/lib/public-api/http';
import { TokenError, exchangeCode, refresh } from '@/lib/mcp/oauth';

export const dynamic = 'force-dynamic';

const HEADERS = { ...CORS_HEADERS, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Cache-Control': 'no-store', Pragma: 'no-cache' };
const problem = (error: string, description: string, status = 400) => NextResponse.json({ error, error_description: description }, { status, headers: HEADERS });

export async function POST(req: NextRequest) {
  if (!checkRateLimit(getClientIdentifier(req), { maxRequests: 60, windowMs: 60_000, identifier: 'oauth-token' }).success) {
    return problem('temporarily_unavailable', 'Too many requests. Wait a moment and try again.', 429);
  }
  let fields: Record<string, unknown> = {};
  try {
    if ((req.headers.get('content-type') || '').includes('application/json')) fields = (await req.json()) ?? {};
    else fields = Object.fromEntries(new URLSearchParams(await req.text()));
  } catch {
    return problem('invalid_request', 'The request body could not be read.');
  }
  try {
    if (fields.grant_type === 'authorization_code') {
      return NextResponse.json(await exchangeCode({ code: fields.code, clientId: fields.client_id, redirectUri: fields.redirect_uri, codeVerifier: fields.code_verifier }), { headers: HEADERS });
    }
    if (fields.grant_type === 'refresh_token') {
      return NextResponse.json(await refresh({ refreshToken: fields.refresh_token, clientId: fields.client_id }), { headers: HEADERS });
    }
    return problem('unsupported_grant_type', 'Use authorization_code or refresh_token.');
  } catch (error) {
    if (error instanceof TokenError) return problem(error.code, error.message, error.code === 'invalid_client' ? 401 : 400);
    console.error('[oauth] token endpoint failed', error);
    return problem('server_error', 'Massimino could not complete the sign-in just now.', 500);
  }
}

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: HEADERS });
