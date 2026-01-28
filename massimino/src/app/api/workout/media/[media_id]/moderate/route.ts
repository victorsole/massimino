import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { prisma } from '@/core/database'
import { z } from 'zod'
import crypto from 'crypto'
import { ensureMediaAchievementsSeeded, checkAndAwardMediaAchievements } from '@/services/gamification/media_achievements'

const bodySchema = z.object({
  action: z.enum(['approve', 'reject', 'feature', 'unfeature']),
  visibility: z.enum(['public', 'followers', 'team', 'private']).optional(),
  featured: z.boolean().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { media_id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const media = await prisma.exercise_media.findUnique({ where: { id: params.media_id } })
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates: any = { updatedAt: new Date() }
  let awarded: Array<{ source: string; points: number; description: string }> = []

  // Handle actions
  if (parsed.data.action === 'approve') {
    updates.status = 'approved'
    if (parsed.data.visibility) updates.visibility = parsed.data.visibility
    if (!updates.visibility) updates.visibility = 'public'

    // Award points only for global exercise media approvals
    if (media.globalExerciseId) {
      const exerciseId = media.globalExerciseId
      // Count approved public media BEFORE this approval
      const approvedBefore = await prisma.exercise_media.count({
        where: { globalExerciseId: exerciseId, status: 'approved', visibility: 'public' },
      })

      // Idempotency: do not re-award if we already approved this media before
      const already = await prisma.user_points.findFirst({
        where: { userId: media.userId, source: 'media_approved', description: `media_approved:${media.id}` },
      })

      if (!already) {
        let baseXP = 0
        if (approvedBefore === 0) baseXP = 50
        else if (approvedBefore >= 1 && approvedBefore <= 2) baseXP = 25

        if (baseXP > 0) {
          awarded.push({ source: 'media_approved', points: baseXP, description: `media_approved:${media.id}` })
        }

        // Provider diversity bonus (+10 if provider not used yet on this exercise among approved media)
        const providerUsed = await prisma.exercise_media.count({
          where: {
            globalExerciseId: exerciseId,
            status: 'approved',
            visibility: 'public',
            provider: media.provider,
          },
        })
        if (providerUsed === 0) {
          awarded.push({ source: 'media_bonus_provider', points: 10, description: `media_provider_bonus:${media.id}` })
        }

        // Optional featured +15 if flagged in same action
        if (parsed.data.featured === true) {
          updates.featured = true
          awarded.push({ source: 'media_featured', points: 15, description: `media_featured:${media.id}` })
        }
      }
    }
  } else if (parsed.data.action === 'reject') {
    updates.status = 'rejected'
    if (parsed.data.visibility) updates.visibility = parsed.data.visibility
  } else if (parsed.data.action === 'feature') {
    updates.featured = true
    // Award featured bonus if not already awarded
    const already = await prisma.user_points.findFirst({
      where: { userId: media.userId, source: 'media_featured', description: `media_featured:${media.id}` },
    })
    if (!already) {
      awarded.push({ source: 'media_featured', points: 15, description: `media_featured:${media.id}` })
    }
  } else if (parsed.data.action === 'unfeature') {
    updates.featured = false
  }

  const updated = await prisma.exercise_media.update({ where: { id: media.id }, data: updates })

  // Persist points awards (if any)
  if (awarded.length > 0) {
    await prisma.user_points.createMany({
      data: awarded.map(a => ({ id: crypto.randomUUID(), userId: media.userId, source: a.source, points: a.points, description: a.description } as any)),
    }).catch(() => null)
  }

  // Seed media achievements if missing, then check and award to contributor
  try {
    await ensureMediaAchievementsSeeded()
    await checkAndAwardMediaAchievements(media.userId)
  } catch {}

  return NextResponse.json({ success: true, media: updated, points_awarded: awarded })
}
