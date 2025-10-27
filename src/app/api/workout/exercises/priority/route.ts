import { NextResponse } from 'next/server'
import { prisma } from '@/core/database'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // Compute a simple priority score for exercises without media (approved public)
    // Score = usageCount*2 + difficultyModifier + recencyBonus
    // difficultyModifier: BEGINNER +10, INTERMEDIATE +5, ADVANCED +0
    // recencyBonus: +5 if created < 90d

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const [exercises, mediaCounts] = await Promise.all([
      prisma.exercises.findMany({ where: { isActive: true }, select: { id: true, name: true, category: true, muscleGroups: true, difficulty: true, createdAt: true } }),
      prisma.exercise_media.groupBy({ by: ['globalExerciseId'], where: { status: 'approved', visibility: 'public' }, _count: { id: true } })
    ])
    const countMap = new Map<string, number>(mediaCounts.map(m => [m.globalExerciseId!, m._count.id]))
    const items = exercises
      .filter(e => (countMap.get(e.id) || 0) === 0)
      .map(e => {
        const diff = (e.difficulty || 'BEGINNER').toUpperCase()
        const dMod = diff === 'BEGINNER' ? 10 : diff === 'INTERMEDIATE' ? 5 : 0
        const recent = e.createdAt > ninetyDaysAgo ? 5 : 0
        const score = (e as any).usageCount ? ((e as any).usageCount * 2 + dMod + recent) : (dMod + recent)
        return { id: e.id, name: e.name, category: e.category, muscleGroups: e.muscleGroups, difficulty: e.difficulty, priorityScore: score }
      })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, limit)

    return NextResponse.json({ success: true, items })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to compute priority' }, { status: 500 })
  }
}

