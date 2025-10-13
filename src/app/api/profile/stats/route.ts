import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { prisma } from '@/core/database'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  // Aggregate workout and engagement data for user
  const userId = session.user.id

  const [workouts, totalVolumeAgg, achievements, trainerPoints] = await Promise.all([
    prisma.workout_log_entries.count({ where: { userId } }),
    prisma.workout_log_entries.aggregate({
      where: { userId },
      _sum: { trainingVolume: true }
    }),
    prisma.trainer_achievements.count({ where: { trainerId: userId } }),
    prisma.trainer_points.aggregate({ where: { trainerId: userId }, _sum: { points: true } })
  ])

  const totalVolume = Number(totalVolumeAgg._sum.trainingVolume || 0)
  const positivePoints = Number(trainerPoints._sum.points || 0)

  // Simple XP model: workouts + volume + achievements + points
  const xpFromWorkouts = workouts * 10
  const xpFromVolume = Math.floor(totalVolume / 1000) * 5
  const xpFromAchievements = achievements * 50
  const total_xp = xpFromWorkouts + xpFromVolume + xpFromAchievements + positivePoints

  // Level curve: level n requires base 100 + 50*(n-1)
  const xpForLevel = (lvl: number) => 100 + 50 * (lvl - 1)
  let level = 1
  let rem = total_xp
  while (rem >= xpForLevel(level)) {
    rem -= xpForLevel(level)
    level++
  }
  const current_level_xp = total_xp - rem
  const xp_to_next_level = xpForLevel(level) - rem

  const stats = { total_xp, level, xp_to_next_level, current_level_xp }
  return NextResponse.json({ success: true, stats })
}
