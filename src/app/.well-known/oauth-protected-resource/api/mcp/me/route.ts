// Tells an assistant app which sign-in service protects /api/mcp/me (RFC 9728).
import { NextResponse, type NextRequest } from 'next/server';
import { CORS_HEADERS } from '@/lib/public-api/http';
import { OAUTH_SCOPE, endpoints } from '@/lib/mcp/oauth';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const at = endpoints(req);
  return NextResponse.json(
    {
      resource: at.resource,
      authorization_servers: [at.issuer],
      scopes_supported: [OAUTH_SCOPE],
      bearer_methods_supported: ['header'],
      resource_name: 'Massimino',
      resource_documentation: `${at.origin}/mcp`,
    },
    { headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=300' } }
  );
}

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS_HEADERS });
