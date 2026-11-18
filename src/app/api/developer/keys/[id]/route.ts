// DELETE /api/developer/keys/{id}  revoke one of the caller's keys

import type { NextRequest } from 'next/server';
import { prisma } from '@/core/database';
import { withAuth, ok, fail } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const DELETE = withAuth<{ id: string }>(async ({ session }, _req: NextRequest, { params }) => {
  // Scoped to the caller: someone else's key id answers exactly like a missing one
  const key = await prisma.api_keys.findFirst({ where: { id: params.id, userId: session.user.id }, select: { id: true, revokedAt: true } });
  if (!key) return fail('NOT_FOUND', 'Key not found.', 404);
  if (!key.revokedAt) {
    await prisma.api_keys.update({ where: { id: key.id }, data: { revokedAt: new Date() }, select: { id: true } });
  }
  return ok({ id: key.id, revoked: true });
});
