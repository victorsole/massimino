import { prisma } from '@/core/database'
import crypto from 'crypto'

type SeedDef = {
  code: string
  name: string
  description: string
  category: string
  tier: string
  experiencePoints: number
  criteria: any
  iconColour: string
}

const MEDIA_ACHIEVEMENTS: SeedDef[] = [
  {
    code: 'MEDIA_PIONEER',
    name: 'Media Pioneer',
    description: 'Add first media to any exercise',
    category: 'MEDIA',
    tier: 'BRONZE',
    experiencePoints: 50,
    criteria: { type: 'MEDIA_COUNT', threshold: 1 },
    iconColour: '#6B7280',
  },
  {
    code: 'VIDEO_CURATOR_10',
    name: 'Video Curator',
    description: 'Add 10 media contributions',
    category: 'MEDIA',
    tier: 'SILVER',
    experiencePoints: 100,
    criteria: { type: 'MEDIA_COUNT', threshold: 10 },
    iconColour: '#64748B',
  },
  {
    code: 'EXERCISE_DOCUMENTARIAN_50',
    name: 'Exercise Documentarian',
    description: 'Add 50 media contributions',
    category: 'MEDIA',
    tier: 'GOLD',
    experiencePoints: 250,
    criteria: { type: 'MEDIA_COUNT', threshold: 50 },
    iconColour: '#D97706',
  },
  {
    code: 'GYM_ARCHITECT_200',
    name: 'Gym Architect',
    description: 'Add 200 media contributions',
    category: 'MEDIA',
    tier: 'DIAMOND',
    experiencePoints: 500,
    criteria: { type: 'MEDIA_COUNT', threshold: 200 },
    iconColour: '#2563EB',
  },
  {
    code: 'PLATFORM_SPECIALIST_5_EACH',
    name: 'Platform Specialist',
    description: 'Add 5 media from each platform (YT, IG, TT)',
    category: 'MEDIA',
    tier: 'GOLD',
    experiencePoints: 150,
    criteria: { type: 'MEDIA_PROVIDER_COUNTS', providers: ['youtube','instagram','tiktok'], thresholdEach: 5 },
    iconColour: '#10B981',
  },
  {
    code: 'QUALITY_CONTRIBUTOR_10_FEATURED',
    name: 'Quality Contributor',
    description: 'Have 10 media approved as featured',
    category: 'MEDIA',
    tier: 'GOLD',
    experiencePoints: 200,
    criteria: { type: 'FEATURED_COUNT', threshold: 10 },
    iconColour: '#F59E0B',
  },
]

export async function ensureMediaAchievementsSeeded() {
  const existing = await prisma.achievements.findMany({ where: { code: { in: MEDIA_ACHIEVEMENTS.map(a => a.code) } }, select: { code: true } })
  const existingSet = new Set(existing.map(e => e.code))
  for (const a of MEDIA_ACHIEVEMENTS) {
    if (existingSet.has(a.code)) continue
    await prisma.achievements.create({
      data: {
        id: crypto.randomUUID(),
        code: a.code,
        name: a.name,
        description: a.description,
        category: a.category,
        tier: a.tier,
        experiencePoints: a.experiencePoints,
        criteria: a.criteria as any,
        iconColour: a.iconColour,
      }
    })
  }
}

export async function checkAndAwardMediaAchievements(userId: string) {
  // Load achievements definitions
  const defs = await prisma.achievements.findMany({ where: { category: 'MEDIA', code: { in: MEDIA_ACHIEVEMENTS.map(a => a.code) } } })
  if (!defs.length) return [] as string[]

  // Get user's existing media achievements
  const existing = await prisma.user_achievements.findMany({ where: { userId, achievements: { category: 'MEDIA' } }, select: { achievementId: true } })
  const existingIds = new Set(existing.map(e => e.achievementId))

  // Compute user media stats
  const [approvedCount, featuredCount, providerCounts] = await Promise.all([
    prisma.exercise_media.count({ where: { userId, status: 'approved', visibility: 'public' } }),
    prisma.exercise_media.count({ where: { userId, status: 'approved', visibility: 'public', featured: true } }),
    (async () => {
      const rows = await prisma.exercise_media.groupBy({
        by: ['provider'],
        where: { userId, status: 'approved', visibility: 'public' },
        _count: { provider: true },
      })
      const map = new Map<string, number>()
      rows.forEach(r => map.set(r.provider, r._count.provider))
      return map
    })(),
  ])

  const newlyAwarded: string[] = []
  for (const a of defs) {
    if (existingIds.has(a.id)) continue
    const c: any = a.criteria
    let qualifies = false
    if (c?.type === 'MEDIA_COUNT') {
      qualifies = approvedCount >= (c.threshold || 0)
    } else if (c?.type === 'FEATURED_COUNT') {
      qualifies = featuredCount >= (c.threshold || 0)
    } else if (c?.type === 'MEDIA_PROVIDER_COUNTS') {
      const providers: string[] = c.providers || []
      const th = c.thresholdEach || 0
      qualifies = providers.every(p => (providerCounts.get(p) || 0) >= th)
    }
    if (qualifies) {
      await prisma.user_achievements.create({ data: { id: crypto.randomUUID(), userId, achievementId: a.id } })
      newlyAwarded.push(a.id)
      // Award XP for achievement
      const xp = a.experiencePoints || 0
      if (xp > 0) {
        await prisma.user_points.create({ data: { id: crypto.randomUUID(), userId, source: 'achievement_media', points: xp, description: `achievement:${a.code}` } })
      }
    }
  }
  return newlyAwarded
}

