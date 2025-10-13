import { prisma } from '@/core/database'

export interface UserContext {
  userProfile: string
  assessmentSummary: string
  workoutHistory: string
}

export async function buildUserContext(userId: string, opts?: { focusAssessmentIds?: string[] }): Promise<UserContext> {
  const focusIds = opts?.focusAssessmentIds?.filter(Boolean)
  const [user, assessments, recentWorkouts] = await Promise.all([
    prisma.users.findUnique({
      where: { id: userId },
      select: {
        name: true,
        role: true,
        // Preference fields present in current schema
        fitnessGoals: true,
        experienceLevel: true,
        preferredWorkoutTypes: true,
        availableWorkoutDays: true,
        preferredWorkoutDuration: true,
      },
    }),
    focusIds?.length
      ? prisma.assessments.findMany({
          where: { id: { in: focusIds }, clientId: userId, status: 'complete' },
          orderBy: { updatedAt: 'desc' },
          take: 3,
        })
      : prisma.assessments.findMany({
          where: { clientId: userId, status: 'complete' },
          orderBy: { updatedAt: 'desc' },
          take: 3,
        }),
    prisma.workout_log_entries.findMany({
      where: { userId },
      include: { exercises: true },
      orderBy: { date: 'desc' },
      take: 10,
    }),
  ])

  const userProfile = formatUserProfile(user as any)
  const assessmentSummary = summarizeAssessments(assessments as any[])
  const workoutHistory = summarizeWorkouts(recentWorkouts as any[])

  return { userProfile, assessmentSummary, workoutHistory }
}

function formatUserProfile(user: any): string {
  if (!user) return 'User profile not available.'
  const parts: string[] = []
  parts.push(`Name: ${user.name || 'N/A'}`)
  parts.push(`Role: ${user.role || 'CLIENT'}`)
  if (user.fitnessGoals?.length) parts.push(`Goals: ${user.fitnessGoals.join(', ')}`)
  if (user.experienceLevel) parts.push(`Experience: ${user.experienceLevel}`)
  if (user.preferredWorkoutTypes?.length) parts.push(`Prefers: ${user.preferredWorkoutTypes.join(', ')}`)
  if (user.availableWorkoutDays?.length) parts.push(`Days: ${user.availableWorkoutDays.join(', ')}`)
  if (user.preferredWorkoutDuration) parts.push(`Duration: ${user.preferredWorkoutDuration}`)
  if (user.age) parts.push(`Age: ${user.age}`)
  if (user.height) parts.push(`Height: ${user.height}`)
  if (user.weight) parts.push(`Weight: ${user.weight}`)
  if (user.injuries?.length) parts.push(`Injuries: ${user.injuries.join(', ')}`)
  return parts.join('\n')
}

function summarizeAssessments(assessments: any[]): string {
  if (!assessments?.length) return 'No recent assessments.'
  const lines: string[] = ['Recent Assessments:']
  for (const a of assessments) {
    const when = new Date(a.updatedAt || a.createdAt).toISOString().split('T')[0]
    lines.push(`- ${a.type} (${when})`)
    if (a.data?.overactive_muscles) lines.push(`  Overactive: ${a.data.overactive_muscles}`)
    if (a.data?.underactive_muscles) lines.push(`  Underactive: ${a.data.underactive_muscles}`)
    if (a.data?.bmi) lines.push(`  BMI: ${a.data.bmi}`)
    if (a.data?.vo2_max) lines.push(`  VO2 Max: ${a.data.vo2_max}`)
  }
  return lines.join('\n')
}

function summarizeWorkouts(entries: any[]): string {
  if (!entries?.length) return 'No recent workouts.'
  const lines: string[] = ['Recent Workouts (last 10 entries):']
  for (const e of entries) {
    const when = new Date(e.date).toISOString().split('T')[0]
    lines.push(`- ${when} • ${e.exercises?.name || 'Exercise'} • sets#${e.setNumber} • reps ${e.reps}`)
  }
  return lines.join('\n')
}
