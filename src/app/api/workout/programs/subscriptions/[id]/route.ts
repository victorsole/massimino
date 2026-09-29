// PATCH /api/workout/programs/subscriptions/{id}
// Body: { action: 'set-current' | 'pause' | 'resume' | 'leave' }
// Only the subscriber can change their own subscription.

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/core/database'
import { withAuth, ok, fail } from '@/lib/api'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({ action: z.enum(['set-current', 'pause', 'resume', 'leave']) })

export const PATCH = withAuth<{ id: string }>(async ({ session }, req: NextRequest, { params }) => {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Unknown action.', 400)

  const subscription = await prisma.program_subscriptions.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  })
  if (!subscription) return fail('NOT_FOUND', 'Programme not found.', 404)

  const now = new Date()
  switch (parsed.data.action) {
    case 'set-current':
      await prisma.$transaction([
        prisma.program_subscriptions.updateMany({
          where: { userId: session.user.id, isCurrentlyActive: true, NOT: { id: params.id } },
          data: { isCurrentlyActive: false, updatedAt: now },
        }),
        prisma.program_subscriptions.update({
          where: { id: params.id },
          data: { isCurrentlyActive: true, isActive: true, status: 'ACTIVE', updatedAt: now },
          select: { id: true },
        }),
      ])
      break
    case 'pause':
      await prisma.program_subscriptions.update({
        where: { id: params.id },
        data: { status: 'PAUSED', isCurrentlyActive: false, updatedAt: now },
        select: { id: true },
      })
      break
    case 'resume':
      await prisma.program_subscriptions.update({
        where: { id: params.id },
        data: { status: 'ACTIVE', isActive: true, updatedAt: now },
        select: { id: true },
      })
      break
    case 'leave':
      // Keep the record (and its history) but take it out of the user's programmes
      await prisma.program_subscriptions.update({
        where: { id: params.id },
        data: { status: 'ARCHIVED', isActive: false, isCurrentlyActive: false, endDate: now, updatedAt: now },
        select: { id: true },
      })
      break
  }

  return ok({ id: params.id, action: parsed.data.action })
})
