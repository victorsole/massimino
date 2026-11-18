// Key management for the public API. These are app routes (session cookie), not part of
// /api/v1: a key is created and revoked by its owner while signed in.
//
// GET  /api/developer/keys          the caller's keys (never the key itself)
// POST /api/developer/keys { label } create a key; the full key is returned once

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/core/database';
import { withAuth, ok, fail } from '@/lib/api';
import { ALL_SCOPES, generateKey } from '@/lib/public-api/http';

export const dynamic = 'force-dynamic';

const MAX_ACTIVE_KEYS = 5;

const keyView = { id: true, label: true, prefix: true, scopes: true, createdAt: true, lastUsedAt: true, revokedAt: true } as const;

export const GET = withAuth(async ({ session }) => {
  const keys = await prisma.api_keys.findMany({
    // Revoked keys are kept in the table for the record but are no use to their owner
    where: { userId: session.user.id, revokedAt: null },
    select: keyView,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return ok({ keys, maxActiveKeys: MAX_ACTIVE_KEYS });
});

const BodySchema = z.object({
  label: z.string().trim().min(1, 'Give the key a name.').max(60, 'Keep the name under 60 characters.'),
  // Permissions are opt-in: a key without any can only read open data
  scopes: z.array(z.enum(ALL_SCOPES as [string, ...string[]])).max(ALL_SCOPES.length).optional(),
});

export const POST = withAuth(async ({ session }, req: NextRequest) => {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail('VALIDATION_ERROR', 'The key needs a name, and any permissions must be ones the API knows.', 400, parsed.error.flatten().fieldErrors);

  const active = await prisma.api_keys.count({ where: { userId: session.user.id, revokedAt: null } });
  if (active >= MAX_ACTIVE_KEYS) {
    return fail('CONFLICT', `You already have ${MAX_ACTIVE_KEYS} active keys. Revoke one before creating another.`, 409);
  }

  const { key, prefix, hash } = generateKey();
  const record = await prisma.api_keys.create({
    data: { userId: session.user.id, label: parsed.data.label, prefix, keyHash: hash, scopes: [...new Set(parsed.data.scopes ?? [])] },
    select: keyView,
  });
  // The only time the key itself leaves the server
  return ok({ key, record }, { status: 201 });
});
