// src/services/account/account_data.ts
// GDPR: data export (Art. 20) and account erasure (Art. 17).
//
// Erasure anonymises instead of deleting the users row: about a hundred
// relations point at users, and anonymous training data (sets, sessions) is
// no longer personal data once nothing identifies its owner.

import crypto from 'crypto'
import { prisma } from '@/core/database'

export const DELETION_GRACE_DAYS = 30
const DELETION_PREFIX = 'account-deletion:'
// Exercise-library media imported under a user id; not that user's personal data
const LIBRARY_MEDIA_PROVIDERS = ['exercisedb', 'system']
const personalMedia = (userId: string) => ({ userId, provider: { notIn: LIBRARY_MEDIA_PROVIDERS } })

// Fields a user may see about themselves; excludes the password hash and
// provider ids, and onboardingCompleted (in the schema but not the database).
const PROFILE_FIELDS = {
  id: true, email: true, name: true, surname: true, nickname: true, image: true,
  massiminoUsername: true, emailVerified: true, createdAt: true, lastLoginAt: true,
  city: true, state: true, country: true, showLocation: true, locationVisibility: true,
  profileVisibility: true, showRealName: true, acceptDMs: true, onlyTrainerDMs: true,
  allowWorkoutSharing: true, shareWeightsPublicly: true, enableDiscovery: true,
  instagramUrl: true, tiktokUrl: true, facebookUrl: true, youtubeUrl: true, linkedinUrl: true,
  spotifyUrl: true, showSocialMedia: true, fitnessGoals: true, experienceLevel: true,
  preferredWorkoutTypes: true, availableWorkoutDays: true, preferredWorkoutDuration: true,
  trainerVerified: true, trainerBio: true, trainerCredentials: true,
} as const

export async function exportAccountData(userId: string) {
  const [profile, workoutSessions, workoutSets, nutritionLogs, nutritionPlans, bodyMetrics,
    habitLogs, programmes, aiChats, media] = await Promise.all([
    prisma.users.findUnique({ where: { id: userId }, select: PROFILE_FIELDS }),
    prisma.workout_sessions.findMany({ where: { userId } }),
    prisma.workout_log_entries.findMany({ where: { userId } }),
    prisma.nutrition_logs.findMany({ where: { userId } }),
    prisma.nutrition_plans.findMany({ where: { userId } }),
    prisma.health_data.findMany({ where: { userId } }),
    prisma.habit_logs.findMany({ where: { userId } }),
    prisma.program_subscriptions.findMany({ where: { userId } }),
    prisma.ai_chat_sessions.findMany({ where: { userId }, include: { ai_chat_messages: true } }),
    prisma.exercise_media.findMany({ where: personalMedia(userId) }),
  ])
  return {
    exportedAt: new Date().toISOString(),
    notice: 'Your personal data held by Massimino (Beresol BV). Questions: hello@beresol.eu',
    profile,
    workoutSessions,
    workoutSets,
    nutritionLogs,
    nutritionPlans,
    bodyMetrics,
    habitLogs,
    programmes,
    aiChats,
    media,
  }
}

/** Block sign-in now and schedule erasure after the grace period. Returns the erasure date. */
export async function requestAccountDeletion(userId: string): Promise<Date> {
  const eraseAt = new Date(Date.now() + DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000)
  const identifier = `${DELETION_PREFIX}${userId}`
  await prisma.$transaction([
    prisma.verificationtokens.deleteMany({ where: { identifier } }),
    prisma.verificationtokens.create({
      data: { identifier, token: crypto.randomBytes(32).toString('hex'), expires: eraseAt },
    }),
    // Suspended with an end date far in the future: blocks password and social sign-in
    prisma.users.update({
      where: { id: userId },
      data: { status: 'SUSPENDED', suspendedUntil: new Date('2100-01-01T00:00:00Z'), updatedAt: new Date() },
      select: { id: true },
    }),
    prisma.sessions.deleteMany({ where: { userId } }),
  ])
  return eraseAt
}

/** Irreversibly remove personal data and anonymise the account. */
export async function eraseAccount(userId: string): Promise<void> {
  const now = new Date()
  await prisma.$transaction([
    prisma.ai_chat_sessions.deleteMany({ where: { userId } }),
    prisma.health_data.deleteMany({ where: { userId } }),
    prisma.nutrition_logs.deleteMany({ where: { userId } }),
    prisma.nutrition_plans.deleteMany({ where: { userId } }),
    prisma.habit_logs.deleteMany({ where: { userId } }),
    prisma.exercise_media.deleteMany({ where: personalMedia(userId) }),
    prisma.push_notifications.deleteMany({ where: { userId } }),
    prisma.chat_messages.deleteMany({ where: { senderId: userId } }),
    prisma.email_verification_tokens.deleteMany({ where: { userId } }),
    prisma.accounts.deleteMany({ where: { userId } }),
    prisma.sessions.deleteMany({ where: { userId } }),
    prisma.verificationtokens.deleteMany({ where: { identifier: { endsWith: `:${userId}` } } }),
    prisma.users.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.invalid`,
        name: null, surname: null, nickname: null, image: null, password: null,
        googleId: null, linkedinId: null, facebookId: null, emailVerified: null,
        massiminoUsername: null, trainerBio: null, trainerCredentials: null,
        instagramUrl: null, tiktokUrl: null, facebookUrl: null, youtubeUrl: null, linkedinUrl: null,
        spotifyUrl: null, backgroundImage: null, customBackgroundUrl: null,
        city: null, state: null, country: null, latitude: null, longitude: null,
        fitnessGoals: [], preferredWorkoutTypes: [], availableWorkoutDays: [],
        profileVisibility: 'PRIVATE', showSocialMedia: false, showLocation: false,
        enableDiscovery: false, acceptDMs: false, allowWorkoutSharing: false,
        status: 'BANNED', suspendedUntil: null, updatedAt: now,
      },
      select: { id: true },
    }),
  ])
}

/** Erase every account whose grace period has ended. Returns how many were erased. */
export async function purgeDueAccountDeletions(): Promise<number> {
  const due = await prisma.verificationtokens.findMany({
    where: { identifier: { startsWith: DELETION_PREFIX }, expires: { lte: new Date() } },
    select: { identifier: true },
  })
  let erased = 0
  for (const { identifier } of due) {
    const userId = identifier.slice(DELETION_PREFIX.length)
    try {
      await eraseAccount(userId)
      erased++
    } catch (error) {
      console.error('Account erasure failed for', userId, error)
    }
  }
  return erased
}
