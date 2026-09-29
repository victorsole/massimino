// PATCH  /api/health/metrics/{id}  { value: number }  -> correct a body metric
// DELETE /api/health/metrics/{id}                     -> remove it
// Only the owner can change their own metrics.

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/core/database'
import { withAuth, ok, fail } from '@/lib/api'

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({ value: z.number().positive().max(1000) })

async function findOwned(id: string, userId: string) {
  return prisma.health_data.findFirst({ where: { id, userId }, select: { id: true, dataType: true } })
}

export const PATCH = withAuth<{ id: string }>(async ({ session }, req: NextRequest, { params }) => {
  const parsed = PatchSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Enter a valid positive number.', 400)

  const metric = await findOwned(params.id, session.user.id)
  if (!metric) return fail('NOT_FOUND', 'Entry not found.', 404)
  if (metric.dataType === 'BODY_FAT' && parsed.data.value > 100) {
    return fail('VALIDATION_ERROR', 'Body fat must be a percentage between 0 and 100.', 400)
  }

  const updated = await prisma.health_data.update({
    where: { id: params.id },
    data: { value: parsed.data.value },
    select: { id: true, value: true, unit: true, recordedAt: true },
  })
  return ok(updated)
})

export const DELETE = withAuth<{ id: string }>(async ({ session }, _req: NextRequest, { params }) => {
  const metric = await findOwned(params.id, session.user.id)
  if (!metric) return fail('NOT_FOUND', 'Entry not found.', 404)
  await prisma.health_data.delete({ where: { id: params.id } })
  return ok({ id: params.id })
})
