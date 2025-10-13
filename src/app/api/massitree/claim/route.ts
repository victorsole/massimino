// src/app/api/massitree/claim/route.ts
/**
 * Username Claim API
 * POST: Claim a massiminoUsername
 * GET: Check username availability
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core/auth/config'
import { prisma } from '@/core/database/client'

// ===== INLINE VALIDATION =====

/**
 * Validate username format
 * Rules: 3-20 characters, alphanumeric + underscores, start with letter
 */
function isValidUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' }
  }

  if (username.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' }
  }

  // Must start with letter
  if (!/^[a-zA-Z]/.test(username)) {
    return { valid: false, error: 'Username must start with a letter' }
  }

  // Only alphanumeric and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' }
  }

  // No consecutive underscores
  if (/__/.test(username)) {
    return { valid: false, error: 'Username cannot contain consecutive underscores' }
  }

  // Reserved usernames
  const reserved = [
    'admin', 'api', 'app', 'about', 'help', 'support', 'contact',
    'terms', 'privacy', 'login', 'signup', 'register', 'massimino',
    'massiminos', 'massitree', 'trainer', 'client', 'user'
  ]

  if (reserved.includes(username.toLowerCase())) {
    return { valid: false, error: 'This username is reserved' }
  }

  return { valid: true }
}

/**
 * Check if username is available
 */
async function isUsernameAvailable(username: string): Promise<boolean> {
  const existing = await prisma.users.findUnique({
    where: { massiminoUsername: username.toLowerCase() },
    select: { id: true }
  })

  return existing === null
}

// ===== API ROUTES =====

/**
 * GET: Check username availability
 * Query: ?username=example
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Username is required' },
        { status: 400 }
      )
    }

    // Validate format
    const validation = isValidUsername(username)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, available: false, message: validation.error },
        { status: 400 }
      )
    }

    // Check availability
    const available = await isUsernameAvailable(username)

    return NextResponse.json({
      success: true,
      available,
      username: username.toLowerCase(),
      message: available ? 'Username is available' : 'Username is already taken'
    })

  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST: Claim username
 * Body: { username: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. Parse body
    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Username is required' },
        { status: 400 }
      )
    }

    // 3. Get user
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        trainerVerified: true,
        massiminoUsername: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // 4. Check if user already has a username
    if (user.massiminoUsername) {
      return NextResponse.json(
        {
          success: false,
          message: 'You already have a username claimed',
          currentUsername: user.massiminoUsername
        },
        { status: 400 }
      )
    }

    // 5. Trainer verification required
    if (user.role !== 'TRAINER' || !user.trainerVerified) {
      return NextResponse.json(
        { success: false, message: 'Only verified trainers can claim usernames' },
        { status: 403 }
      )
    }

    // 6. Validate username format
    const validation = isValidUsername(username)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      )
    }

    // 7. Check availability
    const available = await isUsernameAvailable(username)
    if (!available) {
      return NextResponse.json(
        { success: false, message: 'Username is already taken' },
        { status: 409 }
      )
    }

    // 8. Claim username
    const normalizedUsername = username.toLowerCase()

    await prisma.users.update({
      where: { id: user.id },
      data: { massiminoUsername: normalizedUsername }
    })

    // 9. Success
    return NextResponse.json({
      success: true,
      message: 'Username claimed successfully',
      username: normalizedUsername,
      profileUrl: `https://bio.massimino.fitness/${normalizedUsername}`
    })

  } catch (error) {
    console.error('Username claim error:', error)

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { success: false, message: 'Username is already taken' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}