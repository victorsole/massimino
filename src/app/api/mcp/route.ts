// src/app/api/mcp/route.ts
// The open MCP endpoint: Massimino's open fitness data as tools, no key needed.
// The server itself is in src/lib/mcp/server.ts.

import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, identifyCaller, type Caller } from '@/lib/public-api/http';
import { MCP_HEADERS, describe, noSession, preflight, respond, rpcError } from '@/lib/mcp/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let caller: Caller;
  try {
    // A key is optional. In the URL too, because some connector dialogs accept nothing else.
    caller = await identifyCaller(req, { allowQueryKey: true });
  } catch (error) {
    // Only a key that was presented and is wrong or revoked ends up here. No WWW-Authenticate
    // header: this route has no sign-in, and advertising a challenge sends clients looking for one.
    const status = error instanceof ApiError && error.status === 'PERMISSION_DENIED' ? 403 : 401;
    const message = error instanceof ApiError ? error.message : 'This API key is not recognised.';
    return NextResponse.json(rpcError(null, -32001, `${message} The server also works without a key.`), { status, headers: MCP_HEADERS });
  }
  return respond(req, caller);
}

export const GET = (req: NextRequest) => describe(req, 'None needed. An optional API key raises the rate limit.');
export const OPTIONS = preflight;
export const DELETE = noSession;
