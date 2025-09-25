/**
 * Social Media OAuth Authentication Routes
 * Handles OAuth flow for Instagram, TikTok, YouTube, and Facebook
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { generateAuthUrl, exchangeCodeForToken, isPlatformConfigured } from '@/core/integrations/social_media'
import { prisma } from '@/core/database'

interface RouteContext {
  params: { platform: string }
}

// GET /api/social/auth/[platform] - Get OAuth authorization URL
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'auth'

    if (!isPlatformConfigured(platform)) {
      return NextResponse.json(
        { error: `${platform} integration is not configured` },
        { status: 400 }
      )
    }

    if (action === 'auth') {
      // Generate OAuth URL for authorization
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/auth/${platform}/callback`
      const state = `${session.user.id}-${Date.now()}` // Include user ID and timestamp

      try {
        const authUrl = generateAuthUrl(platform, redirectUri, state)
        return NextResponse.json({ authUrl, state })
      } catch (error) {
        console.error(`Auth URL generation error for ${platform}:`, error)
        return NextResponse.json(
          { error: 'Failed to generate authorization URL' },
          { status: 500 }
        )
      }
    }

    if (action === 'status') {
      // Check if user has connected this platform
      const connection = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { trainerCredentials: true }
      })

      let socialConnections = {}
      try {
        if (connection?.trainerCredentials) {
          const data = JSON.parse(connection.trainerCredentials)
          socialConnections = data.socialConnections || {}
        }
      } catch {
        socialConnections = {}
      }

      const isConnected = !!(socialConnections as any)[platform]?.accessToken

      return NextResponse.json({
        platform,
        connected: isConnected,
        ...(isConnected && {
          connectedAt: (socialConnections as any)[platform]?.connectedAt,
          expiresAt: (socialConnections as any)[platform]?.expiresAt
        })
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error(`Social auth error for ${params.platform}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/social/auth/[platform] - Handle OAuth callback or disconnect
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = params
    const body = await request.json()
    const { action, code, state, redirectUri } = body

    if (!isPlatformConfigured(platform)) {
      return NextResponse.json(
        { error: `${platform} integration is not configured` },
        { status: 400 }
      )
    }

    if (action === 'callback') {
      // Handle OAuth callback
      if (!code || !state) {
        return NextResponse.json(
          { error: 'Missing code or state parameter' },
          { status: 400 }
        )
      }

      // Verify state contains user ID
      const [stateUserId] = state.split('-')
      if (stateUserId !== session.user.id) {
        return NextResponse.json(
          { error: 'Invalid state parameter' },
          { status: 400 }
        )
      }

      // Exchange code for access token
      const tokenResult = await exchangeCodeForToken(platform, code, redirectUri)

      if (!tokenResult.success) {
        return NextResponse.json(
          { error: tokenResult.error || 'Token exchange failed' },
          { status: 400 }
        )
      }

      // Store tokens in user profile
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { trainerCredentials: true }
      })

      let userData = {}
      try {
        if (user?.trainerCredentials) {
          userData = JSON.parse(user.trainerCredentials)
        }
      } catch {
        userData = {}
      }

      // Update social connections
      const socialConnections = (userData as any).socialConnections || {}
      socialConnections[platform] = {
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
        expiresAt: tokenResult.expiresAt?.toISOString(),
        connectedAt: new Date().toISOString(),
        platform
      }

      ;(userData as any).socialConnections = socialConnections

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          trainerCredentials: JSON.stringify(userData)
        }
      })

      return NextResponse.json({
        success: true,
        platform,
        connectedAt: socialConnections[platform].connectedAt
      })
    }

    if (action === 'disconnect') {
      // Disconnect platform
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { trainerCredentials: true }
      })

      let userData = {}
      try {
        if (user?.trainerCredentials) {
          userData = JSON.parse(user.trainerCredentials)
        }
      } catch {
        userData = {}
      }

      // Remove social connection
      const socialConnections = (userData as any).socialConnections || {}
      delete socialConnections[platform]
      ;(userData as any).socialConnections = socialConnections

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          trainerCredentials: JSON.stringify(userData)
        }
      })

      return NextResponse.json({
        success: true,
        platform,
        disconnected: true
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error(`Social auth POST error for ${params.platform}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/social/auth/[platform] - Disconnect platform
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = params

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { trainerCredentials: true }
    })

    let userData = {}
    try {
      if (user?.trainerCredentials) {
        userData = JSON.parse(user.trainerCredentials)
      }
    } catch {
      userData = {}
    }

    // Remove social connection
    const socialConnections = (userData as any).socialConnections || {}
    const wasConnected = !!socialConnections[platform]
    delete socialConnections[platform]
    ;(userData as any).socialConnections = socialConnections

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        trainerCredentials: JSON.stringify(userData)
      }
    })

    return NextResponse.json({
      success: true,
      platform,
      disconnected: wasConnected
    })
  } catch (error) {
    console.error(`Social auth DELETE error for ${params.platform}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
