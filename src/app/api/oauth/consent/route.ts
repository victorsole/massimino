// POST /api/oauth/consent: the signed-in person's answer on the consent screen at
// /oauth/authorize. Allow records the grant and returns where to send the browser, with
// the authorisation code; Cancel returns the same address with an error for the app.
import type { NextRequest } from 'next/server';
import { withAuth, ok, fail } from '@/lib/api';
import { checkAuthorizeRequest, grantFor, issueCode, redirectWith } from '@/lib/mcp/oauth';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async ({ session }, req: NextRequest) => {
  const body = (await req.json().catch(() => null)) as { params?: Record<string, string>; allow?: boolean } | null;
  if (!body?.params || typeof body.params !== 'object') return fail('VALIDATION_ERROR', 'The sign-in request is missing.', 400);

  // Checked again here: what the page showed is not trusted
  const check = checkAuthorizeRequest(body.params);
  if (!check.ok) return fail('VALIDATION_ERROR', check.message, 400);

  const { request, client } = check;
  if (body.allow !== true) {
    return ok({ redirect: redirectWith(request.redirectUri, { error: 'access_denied', error_description: 'The person declined.', state: request.state }) });
  }
  const grantId = await grantFor(session.user.id, client);
  return ok({ redirect: redirectWith(request.redirectUri, { code: issueCode(grantId, request), state: request.state }) });
});
