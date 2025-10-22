// src/app/api/users/[userId]/public/route.ts
/**
 * Public User Profile API Endpoint
 * Returns privacy-filtered user data for public display
 * Used by UserPublicProfile component (massitree, massiminos, embed variants)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core/auth/config'
import { prisma } from '@/core/database/client'

// ===== PRIVACY FUNCTIONS =====

/**
 * Check if viewer can see this profile based on profileVisibility setting
 */
function canViewProfile(
  user: any,
  viewerId: string | null,
  viewerRole: string | null
): boolean {
  // Admins can view all profiles
  if (viewerRole === 'ADMIN') return true

  // Check profileVisibility setting
  switch (user.profileVisibility) {
    case 'PUBLIC':
      return true
    case 'TRAINERS_ONLY':
      return viewerRole === 'TRAINER'
    case 'CONNECTIONS_ONLY':
      // If viewer is authenticated, allow (connection check would be more complex)
      return viewerId !== null
    case 'PRIVATE':
      return viewerId === user.id // Only self can view
    default:
      return false
  }
}

/**
 * Check if user1 has blocked user2 or vice versa
 * TODO: Implement when BlockedUser model is added to Prisma schema
 */
async function isBlocked(
  _userId1: string,
  _userId2: string | null
): Promise<boolean> {
  // Temporarily disabled - BlockedUser table doesn't exist yet
  return false

  // Future implementation:
  // if (!userId2) return false
  // const block = await prisma.blockedUser.findFirst({
  //   where: {
  //     OR: [
  //       { blockerId: userId1, blockedId: userId2 },
  //       { blockerId: userId2, blockedId: userId1 }
  //     ]
  //   }
  // })
  // return block !== null
}

/**
 * Filter user data based on privacy settings
 */
function filterUserData(user: any, _viewerId: string | null) {
  // Compute display name: nickname > name + surname > name > Anonymous
  let displayName = 'Anonymous'
  if (user.nickname) {
    displayName = user.nickname
  } else if (user.name && user.surname) {
    displayName = `${user.name} ${user.surname}`
  } else if (user.name) {
    displayName = user.name
  }

  // Base public data (always visible)
  const publicProfile: any = {
    id: user.id,
    name: displayName,
    image: user.image,
    role: user.role,
    trainerVerified: user.trainerVerified,
    experienceLevel: user.experienceLevel,
    fitnessGoals: user.fitnessGoals,
    preferredWorkoutTypes: user.preferredWorkoutTypes,
    availableWorkoutDays: user.availableWorkoutDays,
    createdAt: user.createdAt
  }

  // Location (based on locationVisibility)
  switch (user.locationVisibility) {
    case 'EXACT':
      publicProfile.city = user.city
      publicProfile.state = user.state
      publicProfile.country = user.country
      publicProfile.locationVisibility = 'EXACT'
      break
    case 'CITY':
      publicProfile.city = user.city
      publicProfile.state = user.state
      publicProfile.locationVisibility = 'CITY'
      break
    case 'HIDDEN':
    default:
      publicProfile.city = null
      publicProfile.state = null
      publicProfile.country = null
      publicProfile.locationVisibility = 'HIDDEN'
      break
  }

  // Social Media (only if showSocialMedia is true)
  if (user.showSocialMedia) {
    publicProfile.instagramUrl = user.instagramUrl
    publicProfile.tiktokUrl = user.tiktokUrl
    publicProfile.facebookUrl = user.facebookUrl
    publicProfile.youtubeUrl = user.youtubeUrl
    publicProfile.linkedinUrl = user.linkedinUrl
    publicProfile.showSocialMedia = true
  } else {
    publicProfile.instagramUrl = null
    publicProfile.tiktokUrl = null
    publicProfile.facebookUrl = null
    publicProfile.youtubeUrl = null
    publicProfile.linkedinUrl = null
    publicProfile.showSocialMedia = false
  }

  // Trainer Info (only for trainers)
  if (user.role === 'TRAINER') {
    publicProfile.trainerBio = user.trainerBio
    publicProfile.trainerCredentials = user.trainerCredentials
    publicProfile.trainerRating = user.trainerRating
  } else {
    publicProfile.trainerBio = null
    publicProfile.trainerCredentials = null
    publicProfile.trainerRating = null
  }

  // DM Settings
  publicProfile.acceptDMs = user.acceptDMs
  publicProfile.onlyTrainerDMs = user.onlyTrainerDMs

  return publicProfile
}

// ===== API ROUTE =====

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 1. Get viewer session
    const session = await getServerSession(authOptions)
    const viewerId = session?.user?.id || null
    const viewerRole = session?.user?.role || null

    // 2. Validate userId
    const { userId } = await params
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // 3. Fetch user from database
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        // Basic Info
        id: true,
        email: true,
        name: true,
        surname: true,
        nickname: true,
        image: true,
        role: true,
        status: true,

        // Privacy Settings
        profileVisibility: true,
        showRealName: true,
        showSocialMedia: true,
        locationVisibility: true,
        acceptDMs: true,
        onlyTrainerDMs: true,
        allowWorkoutSharing: true,
        shareWeightsPublicly: true,

        // Social Media
        instagramUrl: true,
        tiktokUrl: true,
        facebookUrl: true,
        youtubeUrl: true,
        linkedinUrl: true,

        // Fitness Info
        fitnessGoals: true,
        experienceLevel: true,
        preferredWorkoutTypes: true,
        availableWorkoutDays: true,

        // Location
        city: true,
        state: true,
        country: true,

        // Trainer Info
        trainerVerified: true,
        trainerBio: true,
        trainerCredentials: true,
        trainerRating: true,

        // Timestamps
        createdAt: true
      }
    })

    // 4. Check if user exists
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // 5. Check if user is suspended
    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, message: 'This profile is not available' },
        { status: 403 }
      )
    }

    // 6. Privacy check: Can viewer see this profile?
    if (!canViewProfile(user, viewerId, viewerRole)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to view this profile' },
        { status: 403 }
      )
    }

    // 7. Privacy check: Are they blocked?
    if (viewerId && await isBlocked(user.id, viewerId)) {
      return NextResponse.json(
        { success: false, message: 'This profile is not available' },
        { status: 403 }
      )
    }

    // 8. Filter user data based on privacy settings
    const publicProfile = filterUserData(user, viewerId)

    // 9. Optionally include public sections
    const url = new URL(_request.url)
    const includeParam = url.searchParams.get('include') || ''
    const include = includeParam
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)

    const sections: any = {}

    // Helper to parse integer limits
    const parseLimit = (key: string, defaultValue: number) => {
      const raw = url.searchParams.get(key)
      const n = raw ? parseInt(raw, 10) : defaultValue
      return Number.isFinite(n) && n > 0 ? Math.min(n, 20) : defaultValue
    }

    // Workouts (sanitized)
    if (include.includes('workouts')) {
      const allowWorkoutSharing = (user as any).allowWorkoutSharing === true
      if (allowWorkoutSharing) {
        const workoutsLimit = parseLimit('workouts_limit', 5)
        const shareWeightsPublicly = (user as any).shareWeightsPublicly === true

        const sessions = await prisma.workout_sessions.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
          take: workoutsLimit,
          select: {
            id: true,
            date: true,
            title: true,
            workout_log_entries: {
              select: {
                exerciseId: true,
                setNumber: true,
                reps: true,
                weight: true,
                unit: true,
                personalRecord: true,
                exercises: { select: { id: true, name: true } }
              }
            }
          }
        })

        sections.workouts = sessions.map(s => {
          // Aggregate by exercise name
          const byExercise = new Map<string, { name: string; sets: number; reps: number[]; pr?: boolean }>()
          for (const e of s.workout_log_entries) {
            const name = e.exercises?.name || 'Exercise'
            const prev = byExercise.get(name) || { name, sets: 0, reps: [], pr: false }
            prev.sets += 1
            prev.reps.push(e.reps)
            prev.pr = prev.pr || !!e.personalRecord
            byExercise.set(name, prev)
          }
          const exercises = Array.from(byExercise.values()).map(x => ({
            name: x.name,
            sets: x.sets,
            reps: `${Math.min(...x.reps)}-${Math.max(...x.reps)}`
          }))

          const data: any = {
            sessionId: s.id,
            date: s.date,
            title: s.title || null,
            exercises
          }
          if (shareWeightsPublicly) {
            // Lightweight volume hint (count only)
            data.volumeHint = s.workout_log_entries.length
          }
          if (s.workout_log_entries.some(e => e.personalRecord)) {
            data.pr = true
          }
          return data
        })
      }
    }

    // Achievements
    if (include.includes('achievements')) {
      const limit = parseLimit('achievements_limit', 8)
      const items = await prisma.user_achievements.findMany({
        where: { userId: user.id },
        orderBy: { unlockedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          unlockedAt: true,
          achievements: { select: { code: true, name: true, category: true } }
        }
      })
      sections.achievements = items.map(i => ({
        id: i.id,
        code: i.achievements.code,
        name: i.achievements.name,
        category: i.achievements.category,
        earnedAt: i.unlockedAt
      }))
    }

    // Media (public)
    if (include.includes('media')) {
      const limit = parseLimit('media_limit', 6)
      const media = await prisma.exercise_media.findMany({
        where: { userId: user.id, visibility: 'public' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, url: true, thumbnailUrl: true, provider: true, title: true }
      })
      sections.media = media
    }

    // Teams (public)
    if (include.includes('teams')) {
      const limit = parseLimit('teams_limit', 4)
      const teams = await prisma.teams.findMany({
        where: { trainerId: user.id, isActive: true, visibility: 'PUBLIC' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          _count: { select: { team_members: true } }
        }
      })
      sections.teams = teams.map(t => ({ id: t.id, name: t.name, memberCount: t._count.team_members }))
    }

    // 10. Return filtered public profile with optional sections
    return NextResponse.json({
      success: true,
      data: {
        ...publicProfile,
        ...(Object.keys(sections).length > 0 ? { sections } : {})
      }
    })

  } catch (error) {
    console.error('Public profile API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
