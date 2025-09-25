/**
 * Social Media Integration Service for Massimino
 * Handles Instagram, TikTok, and other platform integrations
 */

export interface SocialMediaPost {
  caption: string
  mediaUrl: string
  mediaType: 'photo' | 'video'
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook'
  hashtags?: string[]
  workoutData?: {
    exercise: string
    sets: number
    reps: number
    weight: string
    duration?: string
  }
}

export interface SocialMediaAuthResponse {
  success: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
  error?: string
  authUrl?: string
}

export interface PlatformConfig {
  name: string
  clientId: string
  clientSecret: string
  scopes: string[]
  authUrl: string
  tokenUrl: string
  apiBaseUrl: string
}

// Platform configurations
const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  instagram: {
    name: 'Instagram',
    clientId: process.env.INSTAGRAM_CLIENT_ID || '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
    scopes: ['user_profile', 'user_media'],
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    apiBaseUrl: 'https://graph.instagram.com'
  },
  tiktok: {
    name: 'TikTok',
    clientId: process.env.TIKTOK_CLIENT_KEY || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    scopes: ['user.info.basic', 'video.upload'],
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    apiBaseUrl: 'https://open-api.tiktok.com'
  },
  youtube: {
    name: 'YouTube',
    clientId: process.env.YOUTUBE_CLIENT_ID || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    scopes: ['https://www.googleapis.com/auth/youtube.upload'],
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiBaseUrl: 'https://www.googleapis.com/youtube/v3'
  },
  facebook: {
    name: 'Facebook',
    clientId: process.env.FACEBOOK_APP_ID || '',
    clientSecret: process.env.FACEBOOK_APP_SECRET || '',
    scopes: ['pages_manage_posts', 'pages_read_engagement'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    apiBaseUrl: 'https://graph.facebook.com/v18.0'
  }
}

/**
 * Generate OAuth authorization URL for a platform
 */
export function generateAuthUrl(platform: string, redirectUri: string, state?: string): string {
  const config = PLATFORM_CONFIGS[platform]
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`)
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: config.scopes.join(' '),
    response_type: 'code',
    ...(state && { state })
  })

  return `${config.authUrl}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  platform: string,
  code: string,
  redirectUri: string
): Promise<SocialMediaAuthResponse> {
  const config = PLATFORM_CONFIGS[platform]
  if (!config) {
    return { success: false, error: `Unsupported platform: ${platform}` }
  }

  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error_description || data.error || 'Token exchange failed' }
    }

    const result: SocialMediaAuthResponse = {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
    if (data.expires_in) {
      (result as any).expiresAt = new Date(Date.now() + data.expires_in * 1000);
    }
    return result;
  } catch (error) {
    console.error(`Token exchange error for ${platform}:`, error)
    return { success: false, error: 'Token exchange failed' }
  }
}

/**
 * Format workout data into social media caption
 */
export function formatWorkoutCaption(post: SocialMediaPost): string {
  let caption = post.caption

  if (post.workoutData) {
    const { exercise, sets, reps, weight, duration } = post.workoutData

    caption += `\n\n💪 Workout Details:\n`
    caption += `🏋️ Exercise: ${exercise}\n`
    caption += `📊 Sets: ${sets} × ${reps} reps\n`
    caption += `⚖️ Weight: ${weight}\n`

    if (duration) {
      caption += `⏱️ Duration: ${duration}\n`
    }
  }

  if (post.hashtags && post.hashtags.length > 0) {
    caption += `\n\n${post.hashtags.map(tag => `#${tag}`).join(' ')}`
  }

  // Add platform-specific fitness hashtags
  const defaultHashtags = ['fitness', 'workout', 'gym', 'health', 'motivation', 'massimino']
  caption += `\n\n${defaultHashtags.map(tag => `#${tag}`).join(' ')}`

  return caption
}

/**
 * Share content to Instagram
 */
export async function shareToInstagram(post: SocialMediaPost, accessToken: string): Promise<{ success: boolean; error?: string; postId?: string }> {
  try {
    const config = PLATFORM_CONFIGS.instagram!
    const caption = formatWorkoutCaption(post)

    // Step 1: Create media container
    const containerResponse = await fetch(`${config.apiBaseUrl}/me/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: post.mediaType === 'photo' ? post.mediaUrl : undefined,
        video_url: post.mediaType === 'video' ? post.mediaUrl : undefined,
        caption,
        media_type: post.mediaType === 'photo' ? 'IMAGE' : 'VIDEO',
      }),
    })

    const containerData = await containerResponse.json()

    if (!containerResponse.ok) {
      return { success: false, error: containerData.error?.message || 'Failed to create media container' }
    }

    // Step 2: Publish the media
    const publishResponse = await fetch(`${config.apiBaseUrl}/me/media_publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: containerData.id,
      }),
    })

    const publishData = await publishResponse.json()

    if (!publishResponse.ok) {
      return { success: false, error: publishData.error?.message || 'Failed to publish media' }
    }

    return { success: true, postId: publishData.id }
  } catch (error) {
    console.error('Instagram sharing error:', error)
    return { success: false, error: 'Instagram sharing failed' }
  }
}

/**
 * Share content to TikTok
 */
export async function shareToTikTok(post: SocialMediaPost, accessToken: string): Promise<{ success: boolean; error?: string; postId?: string }> {
  try {
    const config = PLATFORM_CONFIGS.tiktok!

    if (post.mediaType !== 'video') {
      return { success: false, error: 'TikTok only supports video content' }
    }

    const caption = formatWorkoutCaption(post)

    const response = await fetch(`${config.apiBaseUrl}/v2/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: caption.substring(0, 150), // TikTok title limit
          privacy_level: 'SELF_ONLY', // Start with private, user can change
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_url: post.mediaUrl,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'TikTok upload failed' }
    }

    return { success: true, postId: data.data?.publish_id }
  } catch (error) {
    console.error('TikTok sharing error:', error)
    return { success: false, error: 'TikTok sharing failed' }
  }
}

/**
 * Share content to YouTube Shorts
 */
export async function shareToYouTube(post: SocialMediaPost, accessToken: string): Promise<{ success: boolean; error?: string; postId?: string }> {
  try {
    const config = PLATFORM_CONFIGS.youtube!

    if (post.mediaType !== 'video') {
      return { success: false, error: 'YouTube only supports video content' }
    }

    const caption = formatWorkoutCaption(post)

    const response = await fetch(`${config.apiBaseUrl}/videos?part=snippet,status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          title: `${post.workoutData?.exercise || 'Workout'} - Massimino Fitness`,
          description: caption,
          tags: post.hashtags || ['fitness', 'workout', 'shorts'],
          categoryId: '17', // Sports category
        },
        status: {
          privacyStatus: 'private', // Start private, user can change
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'YouTube upload failed' }
    }

    return { success: true, postId: data.id }
  } catch (error) {
    console.error('YouTube sharing error:', error)
    return { success: false, error: 'YouTube sharing failed' }
  }
}

/**
 * Share content to Facebook
 */
export async function shareToFacebook(post: SocialMediaPost, accessToken: string, pageId: string): Promise<{ success: boolean; error?: string; postId?: string }> {
  try {
    const config = PLATFORM_CONFIGS.facebook!
    const caption = formatWorkoutCaption(post)

    const response = await fetch(`${config.apiBaseUrl}/${pageId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: post.mediaUrl,
        caption,
        published: true,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'Facebook sharing failed' }
    }

    return { success: true, postId: data.id }
  } catch (error) {
    console.error('Facebook sharing error:', error)
    return { success: false, error: 'Facebook sharing failed' }
  }
}

/**
 * Get platform sharing capabilities
 */
export function getPlatformCapabilities(platform: string): { supportsPhoto: boolean; supportsVideo: boolean; requiresAuth: boolean } {
  const capabilities = {
    instagram: { supportsPhoto: true, supportsVideo: true, requiresAuth: true },
    tiktok: { supportsPhoto: false, supportsVideo: true, requiresAuth: true },
    youtube: { supportsPhoto: false, supportsVideo: true, requiresAuth: true },
    facebook: { supportsPhoto: true, supportsVideo: true, requiresAuth: true },
  }

  return capabilities[platform as keyof typeof capabilities] || { supportsPhoto: false, supportsVideo: false, requiresAuth: true }
}

/**
 * Validate platform configuration
 */
export function isPlatformConfigured(platform: string): boolean {
  const config = PLATFORM_CONFIGS[platform]
  if (!config) return false

  return !!(config.clientId && config.clientSecret)
}

/**
 * Get available platforms
 */
export function getAvailablePlatforms(): string[] {
  return Object.keys(PLATFORM_CONFIGS).filter(isPlatformConfigured)
}
