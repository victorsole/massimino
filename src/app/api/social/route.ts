/**
 * Consolidated Social Features API
 * Handles social media authentication, sharing, and privacy settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { prisma } from '@/core/database';
import {
  generateAuthUrl,
  exchangeCodeForToken,
  isPlatformConfigured,
  shareToInstagram,
  shareToTikTok,
  shareToYouTube,
  shareToFacebook,
  getPlatformCapabilities,
  SocialMediaPost
} from '@/core/integrations/social_media';
import { moderateContent } from '@/services/moderation/openai';
import { logModerationAction } from '@/services/moderation/loggers';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schemas
const authActionSchema = z.object({
  action: z.literal('auth'),
  platform: z.string(),
});

const authCallbackSchema = z.object({
  action: z.literal('callback'),
  platform: z.string(),
  code: z.string(),
  state: z.string(),
  redirectUri: z.string().optional(),
});

const authDisconnectSchema = z.object({
  action: z.literal('disconnect'),
  platform: z.string(),
});

const shareSchema = z.object({
  action: z.literal('share'),
  platforms: z.array(z.string()),
  caption: z.string(),
  mediaUrl: z.string(),
  mediaType: z.enum(['photo', 'video']),
  hashtags: z.array(z.string()).optional(),
  workoutData: z.object({
    exercise: z.string(),
    sets: z.number(),
    reps: z.number(),
    weight: z.string(),
    duration: z.string().optional(),
  }).optional(),
});

const privacySettingsSchema = z.object({
  action: z.literal('privacy'),
  allowLeaderboards: z.boolean().optional(),
  allowPublicProfile: z.boolean().optional(),
  allowWorkoutSharing: z.boolean().optional(),
  allowChallengeParticipation: z.boolean().optional(),
  allowTeamVisibility: z.boolean().optional(),
  leaderboardVisibilityLevel: z.enum(['public', 'friends', 'private']).optional(),
  profileVisibilityLevel: z.enum(['public', 'friends', 'private']).optional(),
  workoutDataVisibility: z.enum(['detailed', 'summary', 'private']).optional(),
  showRealName: z.boolean().optional(),
  showProfileImage: z.boolean().optional(),
  showLocation: z.boolean().optional(),
  showPersonalRecords: z.boolean().optional(),
  allowDirectMessages: z.boolean().optional(),
});

// ============================================================================
// GET - Get social data based on type
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'status';
    const platform = searchParams.get('platform');

    switch (type) {
      case 'auth-status':
        if (!platform) {
          return NextResponse.json({ error: 'Platform parameter required' }, { status: 400 });
        }
        return handleGetAuthStatus(session.user.id, platform);

      case 'share-status':
        return handleGetShareStatus(session.user.id);

      case 'privacy':
        return handleGetPrivacySettings(session.user.id);

      case 'platforms':
        return handleGetPlatforms();

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Social GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST - Handle social actions
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'auth':
        return handleAuthAction(session.user.id, body);

      case 'callback':
        return handleAuthCallback(session.user.id, body);

      case 'disconnect':
        return handleAuthDisconnect(session.user.id, body);

      case 'share':
        return handleShare(session.user.id, body);

      case 'privacy':
        return handleUpdatePrivacy(session.user.id, body);

      case 'reset-privacy':
        return handleResetPrivacy(session.user.id);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: auth, callback, disconnect, share, privacy, reset-privacy' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Social POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Disconnect platform (alternative to POST disconnect)
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!platform) {
      return NextResponse.json({ error: 'Platform parameter required' }, { status: 400 });
    }

    return handleAuthDisconnect(session.user.id, { action: 'disconnect', platform });
  } catch (error) {
    console.error('Social DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

/**
 * Handle social authentication action
 */
async function handleAuthAction(userId: string, body: any) {
  const { platform } = authActionSchema.parse(body);

  if (!isPlatformConfigured(platform)) {
    return NextResponse.json(
      { error: `${platform} integration is not configured` },
      { status: 400 }
    );
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/auth/${platform}/callback`;
  const state = `${userId}-${Date.now()}`;

  try {
    const authUrl = generateAuthUrl(platform, redirectUri, state);
    return NextResponse.json({ authUrl, state });
  } catch (error) {
    console.error(`Auth URL generation error for ${platform}:`, error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}

/**
 * Handle OAuth callback
 */
async function handleAuthCallback(userId: string, body: any) {
  const { platform, code, state, redirectUri } = authCallbackSchema.parse(body);

  if (!isPlatformConfigured(platform)) {
    return NextResponse.json(
      { error: `${platform} integration is not configured` },
      { status: 400 }
    );
  }

  // Verify state contains user ID
  const [stateUserId] = state.split('-');
  if (stateUserId !== userId) {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  // Exchange code for access token
  const finalRedirectUri = redirectUri || `${process.env.NEXTAUTH_URL}/api/social/auth/${platform}/callback`;
  const tokenResult = await exchangeCodeForToken(platform, code, finalRedirectUri);

  if (!tokenResult.success) {
    return NextResponse.json(
      { error: tokenResult.error || 'Token exchange failed' },
      { status: 400 }
    );
  }

  // Update user's social connections
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { trainerCredentials: true }
  });

  let userData = {};
  try {
    if (user?.trainerCredentials) {
      userData = JSON.parse(user.trainerCredentials);
    }
  } catch {
    userData = {};
  }

  const socialConnections = (userData as any).socialConnections || {};
  socialConnections[platform] = {
    accessToken: tokenResult.accessToken,
    refreshToken: tokenResult.refreshToken,
    expiresAt: tokenResult.expiresAt?.toISOString(),
    connectedAt: new Date().toISOString(),
    platform
  };

  (userData as any).socialConnections = socialConnections;

  await prisma.users.update({
    where: { id: userId },
    data: { trainerCredentials: JSON.stringify(userData) }
  });

  return NextResponse.json({
    success: true,
    platform,
    connectedAt: socialConnections[platform].connectedAt
  });
}

/**
 * Handle platform disconnect
 */
async function handleAuthDisconnect(userId: string, body: any) {
  const { platform } = authDisconnectSchema.parse(body);

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { trainerCredentials: true }
  });

  let userData = {};
  try {
    if (user?.trainerCredentials) {
      userData = JSON.parse(user.trainerCredentials);
    }
  } catch {
    userData = {};
  }

  const socialConnections = (userData as any).socialConnections || {};
  const wasConnected = !!socialConnections[platform];
  delete socialConnections[platform];
  (userData as any).socialConnections = socialConnections;

  await prisma.users.update({
    where: { id: userId },
    data: { trainerCredentials: JSON.stringify(userData) }
  });

  return NextResponse.json({
    success: true,
    platform,
    disconnected: wasConnected
  });
}

/**
 * Handle social media sharing
 */
async function handleShare(userId: string, body: any) {
  const { platforms, caption, mediaUrl, mediaType, hashtags, workoutData } = shareSchema.parse(body);

  // Moderate content before sharing
  const moderationResult = await moderateContent(caption);

  if (moderationResult.blocked) {
    await logModerationAction({
      userId,
      contentType: 'SOCIAL_MEDIA_POST',
      content: caption,
      action: 'BLOCKED' as any,
      result: moderationResult,
    });

    return NextResponse.json(
      { error: 'Content violates community guidelines and cannot be shared' },
      { status: 400 }
    );
  }

  // Get user's social connections
  const userWithConnections = await prisma.users.findUnique({
    where: { id: userId },
    select: { trainerCredentials: true }
  });

  let socialConnections = {};
  try {
    if (userWithConnections?.trainerCredentials) {
      const data = JSON.parse(userWithConnections.trainerCredentials);
      socialConnections = data.socialConnections || {};
    }
  } catch {
    socialConnections = {};
  }

  // Prepare post data
  const cleanedWorkoutData: SocialMediaPost['workoutData'] = workoutData ? {
    exercise: workoutData.exercise,
    sets: workoutData.sets,
    reps: workoutData.reps,
    weight: workoutData.weight,
    duration: workoutData.duration || ''
  } : undefined;

  const post: SocialMediaPost = {
    caption,
    mediaUrl,
    mediaType,
    platform: 'instagram',
    hashtags: hashtags ?? [],
    ...(cleanedWorkoutData ? { workoutData: cleanedWorkoutData } : {})
  };

  const results: any[] = [];

  // Share to each platform
  for (const platform of platforms) {
    try {
      const connection = (socialConnections as any)[platform];

      if (!connection?.accessToken) {
        results.push({
          platform,
          success: false,
          error: `Not connected to ${platform}`
        });
        continue;
      }

      // Check platform capabilities
      const capabilities = getPlatformCapabilities(platform);

      if (mediaType === 'photo' && !capabilities.supportsPhoto) {
        results.push({
          platform,
          success: false,
          error: `${platform} does not support photo sharing`
        });
        continue;
      }

      if (mediaType === 'video' && !capabilities.supportsVideo) {
        results.push({
          platform,
          success: false,
          error: `${platform} does not support video sharing`
        });
        continue;
      }

      // Update post platform
      post.platform = platform as any;

      // Share to platform
      let shareResult;
      switch (platform) {
        case 'instagram':
          shareResult = await shareToInstagram(post, connection.accessToken);
          break;
        case 'tiktok':
          shareResult = await shareToTikTok(post, connection.accessToken);
          break;
        case 'youtube':
          shareResult = await shareToYouTube(post, connection.accessToken);
          break;
        case 'facebook':
          shareResult = await shareToFacebook(post, connection.accessToken, connection.pageId || '');
          break;
        default:
          shareResult = { success: false, error: `Unsupported platform: ${platform}` };
      }

      results.push({ platform, ...shareResult });

    } catch (error) {
      console.error(`Sharing error for ${platform}:`, error);
      results.push({
        platform,
        success: false,
        error: `Sharing to ${platform} failed`
      });
    }
  }

  // Log moderation action if flagged
  if (moderationResult.flagged && !moderationResult.blocked) {
    await logModerationAction({
      userId,
      contentType: 'SOCIAL_MEDIA_POST',
      content: caption,
      action: 'FLAGGED' as any,
      result: moderationResult,
    });
  }

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

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
  });
}

/**
 * Handle privacy settings update
 */
async function handleUpdatePrivacy(userId: string, body: any) {
  const validatedData = privacySettingsSchema.parse(body);
  const { action, ...privacySettings } = validatedData;

  // Verify user exists
  await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  // Filter out undefined values for Prisma
  const cleanedPrivacySettings = Object.fromEntries(
    Object.entries(privacySettings).filter(([_, value]) => value !== undefined)
  );

  const updatedSettings = await prisma.safety_settings.upsert({
    where: { userId },
    update: cleanedPrivacySettings,
    create: {
      id: crypto.randomUUID(),
      userId,
      updatedAt: new Date(),
      ...cleanedPrivacySettings
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      userId,
      privacySettings: updatedSettings,
      message: 'Privacy settings updated successfully'
    }
  });
}

/**
 * Handle privacy settings reset
 */
async function handleResetPrivacy(userId: string) {
  const defaultSettings = {
    allowLeaderboards: true,
    allowPublicProfile: true,
    allowWorkoutSharing: true,
    allowChallengeParticipation: true,
    allowTeamVisibility: true,
    leaderboardVisibilityLevel: 'public',
    profileVisibilityLevel: 'public',
    workoutDataVisibility: 'summary',
    showRealName: true,
    showProfileImage: true,
    showLocation: false,
    showPersonalRecords: true,
    allowDirectMessages: true,
    lastUpdated: new Date().toISOString()
  };

  const resetSettings = await prisma.safety_settings.upsert({
    where: { userId },
    update: defaultSettings,
    create: {
      id: crypto.randomUUID(),
      userId,
      updatedAt: new Date(),
      ...defaultSettings
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      userId,
      privacySettings: resetSettings,
      message: 'Privacy settings reset to default'
    }
  });
}

/**
 * Get authentication status for a platform
 */
async function handleGetAuthStatus(userId: string, platform: string) {
  const connection = await prisma.users.findUnique({
    where: { id: userId },
    select: { trainerCredentials: true }
  });

  let socialConnections = {};
  try {
    if (connection?.trainerCredentials) {
      const data = JSON.parse(connection.trainerCredentials);
      socialConnections = data.socialConnections || {};
    }
  } catch {
    socialConnections = {};
  }

  const isConnected = !!(socialConnections as any)[platform]?.accessToken;

  return NextResponse.json({
    platform,
    connected: isConnected,
    ...(isConnected && {
      connectedAt: (socialConnections as any)[platform]?.connectedAt,
      expiresAt: (socialConnections as any)[platform]?.expiresAt
    })
  });
}

/**
 * Get sharing status for all platforms
 */
async function handleGetShareStatus(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { trainerCredentials: true }
  });

  let socialConnections = {};
  try {
    if (user?.trainerCredentials) {
      const data = JSON.parse(user.trainerCredentials);
      socialConnections = data.socialConnections || {};
    }
  } catch {
    socialConnections = {};
  }

  const platforms = ['instagram', 'tiktok', 'youtube', 'facebook'];
  const platformStatus = platforms.map(platform => {
    const connection = (socialConnections as any)[platform];
    const capabilities = getPlatformCapabilities(platform);

    return {
      platform,
      connected: !!connection?.accessToken,
      capabilities,
      ...(connection && {
        connectedAt: connection.connectedAt,
        expiresAt: connection.expiresAt
      })
    };
  });

  return NextResponse.json({
    platforms: platformStatus,
    connectedCount: platformStatus.filter(p => p.connected).length
  });
}

/**
 * Get privacy settings
 */
async function handleGetPrivacySettings(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, safety_settings: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Default privacy settings
  const defaultSettings = {
    allowLeaderboards: true,
    allowPublicProfile: true,
    allowWorkoutSharing: true,
    allowChallengeParticipation: true,
    allowTeamVisibility: true,
    leaderboardVisibilityLevel: 'public',
    profileVisibilityLevel: 'public',
    workoutDataVisibility: 'summary',
    showRealName: true,
    showProfileImage: true,
    showLocation: false,
    showPersonalRecords: true,
    allowDirectMessages: true
  };

  const privacySettings = {
    ...defaultSettings,
    ...(user.safety_settings || {})
  };

  return NextResponse.json({
    success: true,
    data: {
      userId: user.id,
      privacySettings,
      lastUpdated: new Date().toISOString()
    }
  });
}

/**
 * Get available platforms
 */
async function handleGetPlatforms() {
  const platforms = [
    {
      platform: 'instagram',
      name: 'Instagram',
      capabilities: getPlatformCapabilities('instagram'),
      configured: isPlatformConfigured('instagram')
    },
    {
      platform: 'tiktok',
      name: 'TikTok',
      capabilities: getPlatformCapabilities('tiktok'),
      configured: isPlatformConfigured('tiktok')
    },
    {
      platform: 'youtube',
      name: 'YouTube',
      capabilities: getPlatformCapabilities('youtube'),
      configured: isPlatformConfigured('youtube')
    },
    {
      platform: 'facebook',
      name: 'Facebook',
      capabilities: getPlatformCapabilities('facebook'),
      configured: isPlatformConfigured('facebook')
    }
  ];

  return NextResponse.json({
    platforms,
    totalPlatforms: platforms.length,
    configuredPlatforms: platforms.filter(p => p.configured).length
  });
}