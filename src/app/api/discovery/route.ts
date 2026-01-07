// src/app/api/discovery/route.ts
/**
 * Discovery API - Location-based user search
 * Returns nearby users based on lat/lng and filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core/auth/config'
import { prisma } from '@/core/database/client'

// Mark as dynamic since getServerSession uses headers()
export const dynamic = 'force-dynamic';

// ===== API ROUTE =====

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'ALL'
    const experienceLevel = searchParams.get('experienceLevel') || 'ALL'
    const goalsParam = searchParams.get('goals') || ''
    const goals = goalsParam ? goalsParam.split(',') : []

    // 3. Build where clause - show all active users
    // Users can opt-out by setting profileVisibility to PRIVATE
    const where: any = {
      status: 'ACTIVE'
      // Removed enableDiscovery requirement - show all active users by default
      // Privacy is controlled by profileVisibility filter in step 5
    }

    // Role filter
    if (role !== 'ALL') {
      where.role = role
    }

    // Experience level filter
    if (experienceLevel !== 'ALL') {
      where.experienceLevel = experienceLevel
    }

    // Fitness goals filter (at least one match)
    if (goals.length > 0) {
      where.fitnessGoals = {
        hasSome: goals
      }
    }

    // 4. Query database
    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        name: true,
        surname: true,
        nickname: true,
        image: true,
        role: true,
        trainerVerified: true,
        city: true,
        state: true,
        country: true,
        experienceLevel: true,
        fitnessGoals: true,
        preferredWorkoutTypes: true,
        availableWorkoutDays: true,
        instagramUrl: true,
        spotifyUrl: true,
        tiktokUrl: true,
        youtubeUrl: true,
        facebookUrl: true,
        linkedinUrl: true,
        showSocialMedia: true,
        locationVisibility: true,
        profileVisibility: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc' // Show newest users first
      },
      take: 100 // Limit results
    })

    // 5. Filter and format results
    const filteredUsers = users
      .filter(user => {
        // Check profile visibility
        if (user.profileVisibility === 'PRIVATE') return false
        if (user.profileVisibility === 'CONNECTIONS_ONLY') return false
        return true
      })
      .map(user => {
        // Respect location visibility
        const showLocation = user.locationVisibility !== 'HIDDEN'

        // Display name logic: nickname > name + surname > name > Anonymous
        let displayName = 'Anonymous'
        if (user.nickname) {
          displayName = user.nickname
        } else if (user.name && user.surname) {
          displayName = `${user.name} ${user.surname}`
        } else if (user.name) {
          displayName = user.name
        }

        return {
          id: user.id,
          name: displayName,
          image: user.image,
          role: user.role,
          trainerVerified: user.trainerVerified,
          city: showLocation ? user.city : null,
          state: showLocation ? user.state : null,
          experienceLevel: user.experienceLevel,
          fitnessGoals: user.fitnessGoals,
          preferredWorkoutTypes: user.preferredWorkoutTypes,
          availableWorkoutDays: user.availableWorkoutDays,
          instagramUrl: user.showSocialMedia ? user.instagramUrl : null,
          spotifyUrl: user.showSocialMedia ? user.spotifyUrl : null,
          tiktokUrl: user.showSocialMedia ? user.tiktokUrl : null,
          youtubeUrl: user.showSocialMedia ? user.youtubeUrl : null,
          facebookUrl: user.showSocialMedia ? user.facebookUrl : null,
          linkedinUrl: user.showSocialMedia ? user.linkedinUrl : null
        }
      })

    // 6. Return results
    return NextResponse.json({
      success: true,
      users: filteredUsers,
      count: filteredUsers.length,
      filters: {
        role,
        experienceLevel,
        goals
      }
    })

  } catch (error) {
    console.error('Discovery API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('Error message:', error instanceof Error ? error.message : 'No message')
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}