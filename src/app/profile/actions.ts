"use server"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { prisma } from '@/core/database'
import { revalidatePath } from 'next/cache'
import { promises as fs } from 'fs'
import path from 'path'
import { moderateContent } from '@/services/moderation/openai'
import { logModerationAction } from '@/services/moderation/loggers'
import { ModerationAction } from '@prisma/client'

function isSignedIn(session: any) {
  return Boolean(session?.user?.id)
}

export async function updateEmailAction(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return
    const userId = String(formData.get('userId') || '')
    const emailRaw = String(formData.get('email') || '').trim().toLowerCase()
    if (!userId || !emailRaw) return
    if (userId !== session!.user!.id) return
    await prisma.user.update({ where: { id: userId }, data: { email: emailRaw } })
    revalidatePath('/profile')
  } catch (e) {
    console.error('updateEmailAction error', e)
  }
}

export async function submitTrainerAccreditationAction(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return
    const userId = String(formData.get('userId') || '')
    const providerId = (formData.get('providerId') as string | null) || null
    const providerQuery = String(formData.get('providerQuery') || '').trim()
    const file = formData.get('credentialFile') as unknown as File | null
    if (!userId || userId !== session!.user!.id) return
    if (!providerId && !providerQuery) return
    if (!file) return
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes((file as any).type)) return
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    if (buffer.byteLength > 10 * 1024 * 1024) return
    let provider = null as null | { id: string; name: string; country: string; qualifications: string[] }
    if (providerId) {
      provider = await prisma.accreditedProvider.findFirst({ where: { id: providerId, isActive: true }, select: { id: true, name: true, country: true, qualifications: true } })
    } else if (providerQuery) {
      provider = await prisma.accreditedProvider.findFirst({ where: { name: { contains: providerQuery, mode: 'insensitive' }, isActive: true }, select: { id: true, name: true, country: true, qualifications: true } })
    }
    if (!provider) return
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'credentials')
    await fs.mkdir(uploadsDir, { recursive: true })
    const safeBase = path.basename((file as any).name || 'credential')
    const ts = Date.now()
    const ext = safeBase.includes('.') ? safeBase.slice(safeBase.lastIndexOf('.')) : ''
    const fileName = `${userId}-${ts}${ext}`
    const destPath = path.join(uploadsDir, fileName)
    await fs.writeFile(destPath, buffer)
    const publicUrl = `/uploads/credentials/${fileName}`
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { trainerCredentials: true } })
    let creds: any[] = []
    try { if (current?.trainerCredentials) creds = JSON.parse(current.trainerCredentials); if (!Array.isArray(creds)) creds = [] } catch { creds = [] }
    creds.push({
      providerId: provider.id,
      providerName: provider.name,
      country: provider.country,
      qualifications: provider.qualifications,
      credentialPath: publicUrl,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      verifiedAt: null,
      verifiedBy: null,
      verificationNotes: null
    })
    // Don't auto-verify - set to pending for admin review
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'TRAINER',
        trainerVerified: false, // Changed: Require admin approval
        trainerCredentials: JSON.stringify(creds),
        status: 'ACTIVE'
      }
    })
    revalidatePath('/profile')
  } catch (e) {
    console.error('submitTrainerAccreditationAction error', e)
  }
}

export async function uploadTrainerCertificateAction(formData: FormData): Promise<void> {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return
    const userId = String(formData.get('userId') || '')
    if (!userId || userId !== session!.user!.id) return

    const issuer = String(formData.get('issuer') || '').trim()
    const file = formData.get('certificateFile') as unknown as File | null
    if (!file) return

    // Accept DOC, PDF, PNG, JPG
    const validTypes = [
      'application/pdf',
      'application/msword',
      // Common image types
      'image/png',
      'image/jpeg',
      'image/jpg',
    ]

    const fileType = (file as any).type
    if (!validTypes.includes(fileType)) return

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    if (buffer.byteLength > 10 * 1024 * 1024) return

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'credentials')
    await fs.mkdir(uploadsDir, { recursive: true })
    const safeBase = path.basename((file as any).name || 'certificate')
    const ts = Date.now()
    const ext = safeBase.includes('.') ? safeBase.slice(safeBase.lastIndexOf('.')) : ''
    const fileName = `${userId}-${ts}${ext}`
    const destPath = path.join(uploadsDir, fileName)
    await fs.writeFile(destPath, buffer)
    const publicUrl = `/uploads/credentials/${fileName}`

    const current = await prisma.user.findUnique({ where: { id: userId }, select: { trainerCredentials: true } })
    let creds: any[] = []
    try {
      if (current?.trainerCredentials) creds = JSON.parse(current.trainerCredentials)
      if (!Array.isArray(creds)) creds = []
    } catch {
      creds = []
    }

    creds.push({
      providerId: null,
      providerName: issuer || null,
      country: null,
      qualifications: [],
      credentialPath: publicUrl,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      verifiedAt: null,
      verifiedBy: null,
      verificationNotes: null,
    })

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'TRAINER',
        trainerVerified: false,
        trainerCredentials: JSON.stringify(creds),
        status: 'ACTIVE',
      }
    })

    revalidatePath('/profile')
  } catch (e) {
    console.error('uploadTrainerCertificateAction error', e)
  }
}

export async function updateProfileBasicsAction(formData: FormData): Promise<void> {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return
    const userId = String(formData.get('userId') || '')
    if (!userId || userId !== session!.user!.id) return
    const firstName = String(formData.get('firstName') || '').trim()
    const lastName = String(formData.get('lastName') || '').trim()
    const nickname = String(formData.get('nickname') || '').trim()
    const bio = String(formData.get('bio') || '').trim()
    const displayName = nickname || [firstName, lastName].filter(Boolean).join(' ') || session!.user!.name || ''
    await prisma.user.update({ where: { id: userId }, data: { name: displayName, ...(bio ? { trainerBio: bio } : { trainerBio: null }) } })
    revalidatePath('/profile')
  } catch (e) {
    console.error('updateProfileBasicsAction error', e)
  }
}

export async function uploadAvatarAction(formData: FormData): Promise<void> {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return
    const userId = String(formData.get('userId') || '')
    if (!userId || userId !== session!.user!.id) return
    const file = formData.get('avatar') as unknown as File | null
    if (!file) return
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes((file as any).type)) return
    const buf = Buffer.from(await file.arrayBuffer())
    if (buf.byteLength > 5 * 1024 * 1024) return
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    await fs.mkdir(uploadsDir, { recursive: true })
    const base = path.basename((file as any).name || 'avatar')
    const ext = base.includes('.') ? base.slice(base.lastIndexOf('.')) : ''
    const fileName = `${userId}-${Date.now()}${ext}`
    const dest = path.join(uploadsDir, fileName)
    await fs.writeFile(dest, buf)
    const publicUrl = `/uploads/avatars/${fileName}`
    await prisma.user.update({ where: { id: userId }, data: { image: publicUrl } })
    revalidatePath('/profile')
  } catch (e) {
    console.error('uploadAvatarAction error', e)
  }
}

// Social Media URL validation helper
function validateSocialMediaUrl(url: string, platform: string): boolean {
  if (!url || url.trim() === '') return true // Allow empty URLs

  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    switch (platform) {
      case 'instagram':
        return hostname.includes('instagram.com')
      case 'tiktok':
        return hostname.includes('tiktok.com')
      case 'youtube':
        return hostname.includes('youtube.com') || hostname.includes('youtu.be')
      case 'facebook':
        return hostname.includes('facebook.com') || hostname.includes('fb.com')
      case 'linkedin':
        return hostname.includes('linkedin.com')
      default:
        return false
    }
  } catch {
    return false
  }
}

export async function updateSocialMediaAction(formData: FormData): Promise<void> {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return
    const userId = String(formData.get('userId') || '')
    if (!userId || userId !== session!.user!.id) return

    // Get social media URLs from form
    const instagramUrl = String(formData.get('instagramUrl') || '').trim()
    const tiktokUrl = String(formData.get('tiktokUrl') || '').trim()
    const youtubeUrl = String(formData.get('youtubeUrl') || '').trim()
    const facebookUrl = String(formData.get('facebookUrl') || '').trim()
    const linkedinUrl = String(formData.get('linkedinUrl') || '').trim()
    const showSocialMedia = formData.get('showSocialMedia') === 'on'

    // Validate URLs
    const validations = [
      { url: instagramUrl, platform: 'instagram' },
      { url: tiktokUrl, platform: 'tiktok' },
      { url: youtubeUrl, platform: 'youtube' },
      { url: facebookUrl, platform: 'facebook' },
      { url: linkedinUrl, platform: 'linkedin' }
    ]

    for (const { url, platform } of validations) {
      if (!validateSocialMediaUrl(url, platform)) {
        console.error(`Invalid ${platform} URL: ${url}`)
        return // Reject if any URL is invalid
      }
    }

    // Update user with social media data
    await prisma.user.update({
      where: { id: userId },
      data: {
        instagramUrl: instagramUrl || null,
        tiktokUrl: tiktokUrl || null,
        youtubeUrl: youtubeUrl || null,
        facebookUrl: facebookUrl || null,
        linkedinUrl: linkedinUrl || null,
        showSocialMedia
      }
    })

    revalidatePath('/profile')
  } catch (e) {
    console.error('updateSocialMediaAction error', e)
  }
}

export async function updateFitnessPreferencesAction(formData: FormData): Promise<void> {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return
    const userId = String(formData.get('userId') || '')
    if (!userId || userId !== session!.user!.id) return

    // Get fitness preferences from form
    const fitnessGoals = formData.getAll('fitnessGoals') as string[]
    const experienceLevel = String(formData.get('experienceLevel') || 'BEGINNER')
    const preferredWorkoutTypes = formData.getAll('preferredWorkoutTypes') as string[]
    const availableWorkoutDays = formData.getAll('availableWorkoutDays') as string[]
    const preferredWorkoutDuration = String(formData.get('preferredWorkoutDuration') || '30-60')

    // Validate experience level
    const validExperienceLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
    if (!validExperienceLevels.includes(experienceLevel)) {
      console.error('Invalid experience level:', experienceLevel)
      return
    }

    // Validate workout duration
    const validDurations = ['15-30', '30-60', '60+']
    if (!validDurations.includes(preferredWorkoutDuration)) {
      console.error('Invalid workout duration:', preferredWorkoutDuration)
      return
    }

    // Update user with fitness preferences
    await prisma.user.update({
      where: { id: userId },
      data: {
        fitnessGoals,
        experienceLevel,
        preferredWorkoutTypes,
        availableWorkoutDays,
        preferredWorkoutDuration
      }
    })

    revalidatePath('/profile')
  } catch (e) {
    console.error('updateFitnessPreferencesAction error', e)
  }
}

export async function updateLocationAction(formData: FormData): Promise<void> {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return
    const userId = String(formData.get('userId') || '')
    if (!userId || userId !== session!.user!.id) return

    // Get location data from form
    const city = String(formData.get('city') || '').trim()
    const state = String(formData.get('state') || '').trim()
    const country = String(formData.get('country') || '').trim()
    const showLocation = formData.get('showLocation') === 'on'
    const locationVisibility = String(formData.get('locationVisibility') || 'NONE')
    const enableDiscovery = formData.get('enableDiscovery') === 'on'

    // Validate location visibility
    const validVisibilities = ['NONE', 'TRAINERS_ONLY', 'ALL']
    if (!validVisibilities.includes(locationVisibility)) {
      console.error('Invalid location visibility:', locationVisibility)
      return
    }

    // Update user with location data
    await prisma.user.update({
      where: { id: userId },
      data: {
        city: city || null,
        state: state || null,
        country: country || null,
        showLocation,
        locationVisibility,
        enableDiscovery
      }
    })

    revalidatePath('/profile')
  } catch (e) {
    console.error('updateLocationAction error', e)
  }
}

export async function selectAccreditedProviderAction(formData: FormData): Promise<void> {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return
    const userId = String(formData.get('userId') || '')
    const providerId = String(formData.get('providerId') || '')
    if (!userId || userId !== session!.user!.id) return
    if (!providerId) return

    const provider = await prisma.accreditedProvider.findFirst({ where: { id: providerId, isActive: true }, select: { id: true, name: true, country: true, qualifications: true } })
    if (!provider) return

    const current = await prisma.user.findUnique({ where: { id: userId }, select: { trainerCredentials: true } })
    let creds: any[] = []
    try { if (current?.trainerCredentials) creds = JSON.parse(current.trainerCredentials); if (!Array.isArray(creds)) creds = [] } catch { creds = [] }

    // Store or update a pending selection without fileUrl
    creds.push({
      providerId: provider.id,
      providerName: provider.name,
      country: provider.country,
      qualifications: provider.qualifications,
      fileUrl: null,
      pending: true,
      selectedAt: new Date().toISOString(),
    })

    await prisma.user.update({ where: { id: userId }, data: { trainerCredentials: JSON.stringify(creds) } })
    revalidatePath('/profile')
  } catch (e) {
    console.error('selectAccreditedProviderAction error', e)
  }
}

export async function deleteTrainerCredentialAction(formData: FormData): Promise<void> {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return

    const userId = String(formData.get('userId') || '')
    const indexRaw = String(formData.get('index') || '')
    if (!userId || userId !== session!.user!.id) return
    if (indexRaw === '') return

    const index = Number(indexRaw)
    if (!Number.isInteger(index) || index < 0) return

    const current = await prisma.user.findUnique({ where: { id: userId }, select: { trainerCredentials: true } })
    let creds: any[] = []
    try {
      if (current?.trainerCredentials) creds = JSON.parse(current.trainerCredentials)
      if (!Array.isArray(creds)) creds = []
    } catch { creds = [] }

    if (index >= creds.length) return

    // Try to delete stored file if it exists and is under uploads/credentials
    const cred = creds[index] || {}
    const fileUrl: string | null = cred.credentialPath || cred.fileUrl || null
    if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('/uploads/credentials/')) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public')
        const fullPath = path.join(uploadsDir, fileUrl.replace(/^\/+/, ''))
        await fs.unlink(fullPath).catch(() => {})
      } catch {}
    }

    // Remove the credential
    creds.splice(index, 1)

    await prisma.user.update({ where: { id: userId }, data: { trainerCredentials: JSON.stringify(creds) } })
    revalidatePath('/profile')
  } catch (e) {
    console.error('deleteTrainerCredentialAction error', e)
  }
}

export async function uploadMediaAction(formData: FormData): Promise<{ success: boolean; error?: string; mediaUrl?: string; needsReview?: boolean }> {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return { success: false, error: 'Not authenticated' }

    const userId = String(formData.get('userId') || '')
    if (!userId || userId !== session!.user!.id) return { success: false, error: 'Invalid user' }

    const file = formData.get('media') as unknown as File | null
    const mediaType = String(formData.get('mediaType') || 'photo') // 'photo' or 'video'
    const caption = String(formData.get('caption') || '').trim()

    if (!file) return { success: false, error: 'No file provided' }

    // Validate file type and size
    const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi']
    const validTypes = mediaType === 'video' ? validVideoTypes : validImageTypes

    if (!validTypes.includes((file as any).type)) {
      return { success: false, error: 'Invalid file type' }
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024 // 50MB for video, 10MB for images

    if (buf.byteLength > maxSize) {
      return { success: false, error: 'File too large' }
    }

    // Content moderation for caption if provided
    let moderationResult = null
    if (caption) {
      moderationResult = await moderateContent(caption)

      // Block upload if caption is inappropriate
      if (moderationResult.blocked) {
        await logModerationAction({
          userId,
          contentType: 'MEDIA_CAPTION',
          content: caption,
          action: ModerationAction.BLOCKED,
          result: moderationResult,
        })

        return { success: false, error: 'Caption violates community guidelines' }
      }
    }

    // Create upload directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'media')
    await fs.mkdir(uploadsDir, { recursive: true })

    // Generate filename
    const base = path.basename((file as any).name || `media.${mediaType === 'video' ? 'mp4' : 'jpg'}`)
    const ext = base.includes('.') ? base.slice(base.lastIndexOf('.')) : (mediaType === 'video' ? '.mp4' : '.jpg')
    const fileName = `${userId}-${Date.now()}${ext}`
    const dest = path.join(uploadsDir, fileName)

    // Save file
    await fs.writeFile(dest, buf)
    const publicUrl = `/uploads/media/${fileName}`

    // Log moderation action if caption was flagged
    if (moderationResult && moderationResult.flagged) {
      await logModerationAction({
        userId,
        contentType: 'MEDIA_CAPTION',
        content: caption,
        action: ModerationAction.FLAGGED,
        result: moderationResult,
      })
    }

    revalidatePath('/profile')
    return {
      success: true,
      mediaUrl: publicUrl,
      needsReview: moderationResult?.requiresHumanReview || false
    }
  } catch (e) {
    console.error('uploadMediaAction error', e)
    return { success: false, error: 'Upload failed' }
  }
}

export async function updateMediaSettingsAction(formData: FormData): Promise<void> {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return
    const userId = String(formData.get('userId') || '')
    if (!userId || userId !== session!.user!.id) return

    // Get media settings from form
    const showMediaOnProfile = formData.get('showMediaOnProfile') === 'on'
    const allowMediaComments = formData.get('allowMediaComments') === 'on'
    const enableSocialSharing = formData.get('enableSocialSharing') === 'on'

    // For now, store in user profile - in a real app you might want a separate media_settings table
    // We'll use JSON in an existing field or add new boolean fields to the user model
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { trainerCredentials: true } })
    let userData: any = {}

    try {
      if (current?.trainerCredentials) {
        userData = JSON.parse(current.trainerCredentials)
      }
    } catch {
      userData = {}
    }

    // Store media settings in the user data (temporary solution)
    userData.mediaSettings = {
      showMediaOnProfile,
      allowMediaComments,
      enableSocialSharing,
      updatedAt: new Date().toISOString()
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        trainerCredentials: JSON.stringify(userData)
      }
    })

    revalidatePath('/profile')
  } catch (e) {
    console.error('updateMediaSettingsAction error', e)
  }
}
