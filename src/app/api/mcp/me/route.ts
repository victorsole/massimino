// src/app/api/mcp/me/route.ts
// The personal MCP endpoint: the open tools plus the signed-in person's own workout log.
// It needs a sign-in (an access token from /oauth/token) or an API key in a header. A
// request without either gets 401 and a pointer to the sign-in service, which is what
// makes ChatGPT, Claude and others open the "Sign in to Massimino" window.

import { NextResponse, type NextRequest } from 'next/server';
import { identifyCaller, type Caller } from '@/lib/public-api/http';
import { callerFromAccessToken, endpoints, isAccessToken } from '@/lib/mcp/oauth';
import { MCP_HEADERS, describe, noSession, preflight, respond, rpcError } from '@/lib/mcp/server';

export const dynamic = 'force-dynamic';

function signInRequired(req: NextRequest, problem: 'missing' | 'invalid') {
  const challenge = [`Bearer resource_metadata="${endpoints(req).resourceMetadata}"`, ...(problem === 'invalid' ? ['error="invalid_token"'] : [])].join(', ');
  return NextResponse.json(rpcError(null, -32001, 'Sign in to Massimino to use this server. The open server at /api/mcp needs no sign-in.'), {
    status: 401,
    headers: { ...MCP_HEADERS, 'WWW-Authenticate': challenge, 'Access-Control-Expose-Headers': 'WWW-Authenticate' },
  });
}

export async function POST(req: NextRequest) {
  const header = req.headers.get('authorization');
  const bearer = header && /^Bearer\s+/i.test(header) ? header.replace(/^Bearer\s+/i, '').trim() : null;
  if (!bearer && !req.headers.get('x-api-key')) return signInRequired(req, 'missing');

  let caller: Caller | null = null;
  if (bearer && isAccessToken(bearer)) {
    caller = await callerFromAccessToken(bearer);
  } else {
    // An API key in a header works here too, for clients that are configured by file
    caller = await identifyCaller(req).catch(() => null);
  }
  if (!caller) return signInRequired(req, 'invalid');
  return respond(req, caller);
}

export const GET = (req: NextRequest) => describe(req, 'Sign in with your Massimino account (OAuth 2.1), or send an API key that has the workout log permission.');
export const OPTIONS = preflight;
export const DELETE = noSession;
