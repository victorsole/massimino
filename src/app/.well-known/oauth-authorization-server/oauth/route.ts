// Describes Massimino's sign-in service for assistant apps (RFC 8414). The issuer is
// <origin>/oauth, which is why this sits under a path and not at the bare well-known address.
import { NextResponse, type NextRequest } from 'next/server';
import { CORS_HEADERS } from '@/lib/public-api/http';
import { OAUTH_SCOPE, endpoints } from '@/lib/mcp/oauth';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const at = endpoints(req);
  return NextResponse.json(
    {
      issuer: at.issuer,
      authorization_endpoint: at.authorize,
      token_endpoint: at.token,
      registration_endpoint: at.register,
      response_types_supported: ['code'],
      response_modes_supported: ['query'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: [OAUTH_SCOPE],
      service_documentation: `${at.origin}/mcp`,
    },
    { headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=300' } }
  );
}

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS_HEADERS });
