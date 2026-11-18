// POST /oauth/register: an assistant app introduces itself before asking a person to sign in
// (dynamic client registration, RFC 7591). Nothing is stored: the client id is a signed
// record of the app's name and return addresses.
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { CORS_HEADERS } from '@/lib/public-api/http';
import { OAUTH_SCOPE, registerClient } from '@/lib/mcp/oauth';

export const dynamic = 'force-dynamic';

const HEADERS = { ...CORS_HEADERS, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' };
const problem = (error: string, description: string, status = 400) => NextResponse.json({ error, error_description: description }, { status, headers: HEADERS });

export async function POST(req: NextRequest) {
  if (!checkRateLimit(getClientIdentifier(req), { maxRequests: 20, windowMs: 60_000, identifier: 'oauth-register' }).success) {
    return problem('temporarily_unavailable', 'Too many registrations. Wait a moment and try again.', 429);
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return problem('invalid_client_metadata', 'Send the client metadata as JSON.');
  const registered = registerClient({ name: (body as any).client_name, redirectUris: (body as any).redirect_uris });
  if (!registered) {
    return problem('invalid_redirect_uri', 'redirect_uris must hold 1 to 5 addresses, each https, or http on localhost.');
  }
  return NextResponse.json(
    {
      client_id: registered.clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: registered.client.name,
      redirect_uris: registered.client.redirectUris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: OAUTH_SCOPE,
    },
    { status: 201, headers: HEADERS }
  );
}

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: HEADERS });
