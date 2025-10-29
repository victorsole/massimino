import { prisma } from '@/core/database'

export interface UserContext {
  userProfile: string
  assessmentSummary: string
  workoutHistory: string
  activeProgramsSummary?: string
}

export interface AthleteContext extends UserContext {
  athleteId: string
  athleteName: string
  trainerRelationship: string
}

export async function buildUserContext(userId: string, opts?: { focusAssessmentIds?: string[]; includePrograms?: boolean }): Promise<UserContext> {
  const focusIds = opts?.focusAssessmentIds?.filter(Boolean)
  const includePrograms = opts?.includePrograms ?? true

  const [user, assessments, recentWorkouts, activePrograms] = await Promise.all([
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
    includePrograms
      ? prisma.program_subscriptions.findMany({
          where: { userId, isActive: true },
          include: {
            program_templates: {
              select: {
                name: true,
                difficulty: true,
                category: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
        })
      : Promise.resolve([]),
  ])

  const userProfile = formatUserProfile(user as any)
  const assessmentSummary = summarizeAssessments(assessments as any[])
  const workoutHistory = summarizeWorkouts(recentWorkouts as any[])
  const activeProgramsSummary = includePrograms ? summarizePrograms(activePrograms as any[]) : undefined

  return { userProfile, assessmentSummary, workoutHistory, activeProgramsSummary }
}

/**
 * Build context for a specific athlete (for trainer use)
 * Verifies trainer has access to this athlete
 */
export async function buildAthleteContextForTrainer(
  trainerId: string,
  athleteId: string,
  opts?: { focusAssessmentIds?: string[] }
): Promise<AthleteContext | null> {
  // Verify trainer-athlete relationship
  const relationship = await prisma.trainer_clients.findFirst({
    where: {
      trainerId,
      clientId: athleteId,
      status: 'ACTIVE',
    },
    select: {
      startDate: true,
      users: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!relationship) {
    return null // Trainer doesn't have access to this athlete
  }

  // Build full context for athlete
  const baseContext = await buildUserContext(athleteId, { ...opts, includePrograms: true })

  const relationshipDuration = relationship.startDate
    ? Math.floor((Date.now() - new Date(relationship.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return {
    ...baseContext,
    athleteId,
    athleteName: relationship.users.name || relationship.users.email,
    trainerRelationship: `Training together for ${relationshipDuration} days`,
  }
}

/**
 * Get list of all athletes for a trainer
 */
export async function getTrainerAthletesList(trainerId: string): Promise<Array<{ id: string; name: string; email: string; startDate: Date }>> {
  const relationships = await prisma.trainer_clients.findMany({
    where: {
      trainerId,
      status: 'ACTIVE',
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { startDate: 'desc' },
  })

  return relationships.map(rel => ({
    id: rel.users.id,
    name: rel.users.name || rel.users.email,
    email: rel.users.email,
    startDate: rel.startDate,
  }))
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

function summarizePrograms(programs: any[]): string {
  if (!programs?.length) return 'No active programs.'
  const lines: string[] = ['Active Programs:']
  for (const p of programs) {
    const template = p.program_templates
    const progress = `Week ${p.currentWeek}, Day ${p.currentDay}`
    lines.push(`- ${template?.name || 'Program'} (${template?.difficulty || 'N/A'}) • ${progress}`)
    if (template?.category) lines.push(`  Category: ${template.category}`)
    if (p.startDate) {
      const daysActive = Math.floor((Date.now() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24))
      lines.push(`  Started ${daysActive} days ago`)
    }
  }
  return lines.join('\n')
}
