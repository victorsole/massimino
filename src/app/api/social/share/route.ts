/**
 * Social Media Sharing API
 * Handles posting content to connected social media platforms
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import {
  shareToInstagram,
  shareToTikTok,
  shareToYouTube,
  shareToFacebook,
  getPlatformCapabilities,
  SocialMediaPost
} from '@/core/integrations/social_media'
import { prisma } from '@/core/database'
import { moderateContent } from '@/services/moderation/openai'
import { logModerationAction } from '@/services/moderation/loggers'

// POST /api/social/share - Share content to social media platforms
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      platforms,
      caption,
      mediaUrl,
      mediaType,
      hashtags,
      workoutData
    }: {
      platforms: string[]
      caption: string
      mediaUrl: string
      mediaType: 'photo' | 'video'
      hashtags?: string[]
      workoutData?: {
        exercise: string
        sets: number
        reps: number
        weight: string
        duration?: string
      }
    } = body

    // Validate input
    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform must be specified' },
        { status: 400 }
      )
    }

    if (!caption || !mediaUrl || !mediaType) {
      return NextResponse.json(
        { error: 'Caption, media URL, and media type are required' },
        { status: 400 }
      )
    }

    // Moderate content before sharing
    const moderationResult = await moderateContent(caption)

    if (moderationResult.blocked) {
      await logModerationAction({
        userId: session.user.id,
        contentType: 'SOCIAL_MEDIA_POST',
        content: caption,
        action: 'BLOCKED' as any,
        result: moderationResult,
      })

      return NextResponse.json(
        { error: 'Content violates community guidelines and cannot be shared' },
        { status: 400 }
      )
    }

    // Get user's social connections
    const userWithConnections = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { trainerCredentials: true }
    })

    let socialConnections = {}
    try {
      if (userWithConnections?.trainerCredentials) {
        const data = JSON.parse(userWithConnections.trainerCredentials)
        socialConnections = data.socialConnections || {}
      }
    } catch {
      socialConnections = {}
    }

    // Prepare post data
    const post: SocialMediaPost = {
      caption,
      mediaUrl,
      mediaType,
      platform: 'instagram', // default and will be updated for each platform
      hashtags: hashtags ?? [],
      ...(workoutData ? { workoutData } : {})
    }

    const results = []

    // Share to each platform
    for (const platform of platforms) {
      try {
        const connection = (socialConnections as any)[platform]

        if (!connection?.accessToken) {
          results.push({
            platform,
            success: false,
            error: `Not connected to ${platform}`
          })
          continue
        }

        // Check platform capabilities
        const capabilities = getPlatformCapabilities(platform)

        if (mediaType === 'photo' && !capabilities.supportsPhoto) {
          results.push({
            platform,
            success: false,
            error: `${platform} does not support photo sharing`
          })
          continue
        }

        if (mediaType === 'video' && !capabilities.supportsVideo) {
          results.push({
            platform,
            success: false,
            error: `${platform} does not support video sharing`
          })
          continue
        }

        // Update post platform
        post.platform = platform as any

        // Share to platform
        let shareResult
        switch (platform) {
          case 'instagram':
            shareResult = await shareToInstagram(post, connection.accessToken)
            break
          case 'tiktok':
            shareResult = await shareToTikTok(post, connection.accessToken)
            break
          case 'youtube':
            shareResult = await shareToYouTube(post, connection.accessToken)
            break
          case 'facebook':
            // Facebook requires page ID - should be stored in connection
            shareResult = await shareToFacebook(post, connection.accessToken, connection.pageId || '')
            break
          default:
            shareResult = { success: false, error: `Unsupported platform: ${platform}` }
        }

        results.push({
          platform,
          ...shareResult
        })

      } catch (error) {
        console.error(`Sharing error for ${platform}:`, error)
        results.push({
          platform,
          success: false,
          error: `Sharing to ${platform} failed`
        })
      }
    }

    // Log moderation action if content was flagged but not blocked
    if (moderationResult.flagged && !moderationResult.blocked) {
      await logModerationAction({
        userId: session.user.id,
        contentType: 'SOCIAL_MEDIA_POST',
        content: caption,
        action: 'FLAGGED' as any,
        result: moderationResult,
      })
    }

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    return NextResponse.json({
      success: successCount > 0,
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      },
      moderation: {
        flagged: moderationResult.flagged,
        needsReview: moderationResult.requiresHumanReview
      }
    })

  } catch (error) {
    console.error('Social sharing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/social/share - Get available platforms and sharing status
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's social connections
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { trainerCredentials: true }
    })

    let socialConnections = {}
    try {
      if (user?.trainerCredentials) {
        const data = JSON.parse(user.trainerCredentials)
        socialConnections = data.socialConnections || {}
      }
    } catch {
      socialConnections = {}
    }

    const platforms = ['instagram', 'tiktok', 'youtube', 'facebook']
    const platformStatus = platforms.map(platform => {
      const connection = (socialConnections as any)[platform]
      const capabilities = getPlatformCapabilities(platform)

      return {
        platform,
        connected: !!connection?.accessToken,
        capabilities,
        ...(connection && {
          connectedAt: connection.connectedAt,
          expiresAt: connection.expiresAt
        })
      }
    })

    return NextResponse.json({
      platforms: platformStatus,
      connectedCount: platformStatus.filter(p => p.connected).length
    })

  } catch (error) {
    console.error('Social sharing status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
