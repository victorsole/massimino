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
    await prisma.users.update({ where: { id: userId }, data: { email: emailRaw } })
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
    if (buffer.byteLength > 100 * 1024 * 1024) return
    let provider = null as null | { id: string; name: string; country: string; qualifications: string[] }
    if (providerId) {
      provider = await prisma.accredited_providers.findFirst({ where: { id: providerId, isActive: true }, select: { id: true, name: true, country: true, qualifications: true } })
    } else if (providerQuery) {
      provider = await prisma.accredited_providers.findFirst({ where: { name: { contains: providerQuery, mode: 'insensitive' }, isActive: true }, select: { id: true, name: true, country: true, qualifications: true } })
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
    const current = await prisma.users.findUnique({ where: { id: userId }, select: { trainerCredentials: true } })
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
    await prisma.users.update({
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
    if (buffer.byteLength > 100 * 1024 * 1024) return

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'credentials')
    await fs.mkdir(uploadsDir, { recursive: true })
    const safeBase = path.basename((file as any).name || 'certificate')
    const ts = Date.now()
    const ext = safeBase.includes('.') ? safeBase.slice(safeBase.lastIndexOf('.')) : ''
    const fileName = `${userId}-${ts}${ext}`
    const destPath = path.join(uploadsDir, fileName)
    await fs.writeFile(destPath, buffer)
    const publicUrl = `/uploads/credentials/${fileName}`

    const current = await prisma.users.findUnique({ where: { id: userId }, select: { trainerCredentials: true } })
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

    await prisma.users.update({
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

    // Always update basic fields first
    await prisma.users.update({
      where: { id: userId },
      data: {
        name: firstName || null,
        surname: lastName || null,
        nickname: nickname || null,
        trainerBio: bio || null
      }
    })
    // Determine desired public username
    // Priority:
    // 1) Nickname (user explicit choice)
    // 2) name+surname (default), only if username not set yet
    const current = await prisma.users.findUnique({ where: { id: userId }, select: { massiminoUsername: true } })
    const nicknameCandidate = normalizeUsernameFromNickname(nickname)
    const fullNameCandidate = normalizeUsernameFromFullName(firstName, lastName)

    if (nicknameCandidate) {
      // User explicitly wants a nickname-based username; try set/overwrite
      try {
        await prisma.users.update({ where: { id: userId }, data: { massiminoUsername: nicknameCandidate } })
      } catch (e) {
        console.warn('Skipping username update (taken/invalid):', nicknameCandidate)
      }
    } else if (!current?.massiminoUsername && fullNameCandidate) {
      // No username yet; set default from name+surname
      try {
        await prisma.users.update({ where: { id: userId }, data: { massiminoUsername: fullNameCandidate } })
      } catch (e) {
        console.warn('Skipping default username set (taken/invalid):', fullNameCandidate)
      }
    }
    revalidatePath('/profile')
  } catch (e) {
    console.error('updateProfileBasicsAction error', e)
  }
}

// Username normalization using nickname
function normalizeUsernameFromNickname(nickname: string): string | null {
  if (!nickname) return null
  // Convert to lowercase, replace spaces with underscores, remove invalid chars
  let u = nickname.trim().toLowerCase()
  u = u.replace(/\s+/g, '_')
  u = u.replace(/[^a-z0-9_]/g, '')

  // Must start with a letter and be 3-20 chars
  if (!/^[a-z]/.test(u)) return null
  if (u.length < 3 || u.length > 20) return null
  // No consecutive underscores
  if (/__/.test(u)) return null
  // Disallow reserved words
  const reserved = new Set(['admin','api','app','about','help','support','contact','terms','privacy','login','signup','register','massimino','massiminos','massitree','trainer','client','user'])
  if (reserved.has(u)) return null
  return u
}

function normalizeUsernameFromFullName(firstName: string, lastName: string): string | null {
  const f = (firstName || '').trim().toLowerCase()
  const l = (lastName || '').trim().toLowerCase()
  if (!f && !l) return null
  let base = `${f}${l}`
  base = base.replace(/\s+/g, '')
  base = base.replace(/[^a-z0-9_]/g, '')
  if (!/^[a-z]/.test(base)) return null
  if (base.length < 3 || base.length > 20) return null
  if (/__/.test(base)) return null
  const reserved = new Set(['admin','api','app','about','help','support','contact','terms','privacy','login','signup','register','massimino','massiminos','massitree','trainer','client','user'])
  if (reserved.has(base)) return null
  return base
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
    await prisma.users.update({ where: { id: userId }, data: { image: publicUrl } })
    revalidatePath('/profile')
  } catch (e) {
    console.error('uploadAvatarAction error', e)
  }
}

// Social Media URL validation and normalization helper
function normalizeAndValidateSocialMediaUrl(url: string, platform: string): string | null {
  if (!url || url.trim() === '') return null // Allow empty URLs

  let normalizedUrl = url.trim()

  // Auto-add https:// if no protocol is present
  if (!normalizedUrl.match(/^https?:\/\//i)) {
    normalizedUrl = `https://${normalizedUrl}`
  }

  try {
    const urlObj = new URL(normalizedUrl)
    const hostname = urlObj.hostname.toLowerCase()

    // Check if domain matches the platform (less strict - just check if domain contains platform name)
    const domainChecks: Record<string, boolean> = {
      'instagram': hostname.includes('instagram'),
      'spotify': hostname.includes('spotify'),
      'tiktok': hostname.includes('tiktok'),
      'youtube': hostname.includes('youtube') || hostname.includes('youtu.be'),
      'facebook': hostname.includes('facebook') || hostname.includes('fb'),
      'linkedin': hostname.includes('linkedin')
    }

    if (domainChecks[platform]) {
      return normalizedUrl
    }

    // If domain doesn't match, return null (invalid)
    console.warn(`Invalid ${platform} URL domain: ${hostname}`)
    return null
  } catch (error) {
    console.warn(`Failed to parse ${platform} URL: ${url}`, error)
    return null
  }
}

export async function updateSocialMediaAction(formData: FormData): Promise<void> {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return
    const userId = String(formData.get('userId') || '')
    if (!userId || userId !== session!.user!.id) return

    // Get social media URLs from form
    const instagramUrlRaw = String(formData.get('instagramUrl') || '').trim()
    const spotifyUrlRaw = String(formData.get('spotifyUrl') || '').trim()
    const tiktokUrlRaw = String(formData.get('tiktokUrl') || '').trim()
    const youtubeUrlRaw = String(formData.get('youtubeUrl') || '').trim()
    const facebookUrlRaw = String(formData.get('facebookUrl') || '').trim()
    const linkedinUrlRaw = String(formData.get('linkedinUrl') || '').trim()
    const showSocialMedia = formData.get('showSocialMedia') === 'on'

    console.log('Social Media Form Data:', {
      instagramUrlRaw,
      spotifyUrlRaw,
      tiktokUrlRaw,
      youtubeUrlRaw,
      facebookUrlRaw,
      linkedinUrlRaw
    })

    // Normalize and validate URLs (saves valid ones, skips invalid ones)
    const instagramUrl = normalizeAndValidateSocialMediaUrl(instagramUrlRaw, 'instagram')
    const spotifyUrl = normalizeAndValidateSocialMediaUrl(spotifyUrlRaw, 'spotify')
    const tiktokUrl = normalizeAndValidateSocialMediaUrl(tiktokUrlRaw, 'tiktok')
    const youtubeUrl = normalizeAndValidateSocialMediaUrl(youtubeUrlRaw, 'youtube')
    const facebookUrl = normalizeAndValidateSocialMediaUrl(facebookUrlRaw, 'facebook')
    const linkedinUrl = normalizeAndValidateSocialMediaUrl(linkedinUrlRaw, 'linkedin')

    console.log('Normalized URLs:', {
      instagramUrl,
      spotifyUrl,
      tiktokUrl,
      youtubeUrl,
      facebookUrl,
      linkedinUrl
    })

    // Update user with social media data (saves all valid URLs)
    await prisma.users.update({
      where: { id: userId },
      data: {
        instagramUrl,
        spotifyUrl,
        tiktokUrl,
        youtubeUrl,
        facebookUrl,
        linkedinUrl,
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
    await prisma.users.update({
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
    await prisma.users.update({
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

    const provider = await prisma.accredited_providers.findFirst({ where: { id: providerId, isActive: true }, select: { id: true, name: true, country: true, qualifications: true } })
    if (!provider) return

    const current = await prisma.users.findUnique({ where: { id: userId }, select: { trainerCredentials: true } })
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

    await prisma.users.update({ where: { id: userId }, data: { trainerCredentials: JSON.stringify(creds) } })
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

    const current = await prisma.users.findUnique({ where: { id: userId }, select: { trainerCredentials: true } })
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

    await prisma.users.update({ where: { id: userId }, data: { trainerCredentials: JSON.stringify(creds) } })
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
    let moderationResult: any = null
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
    const current = await prisma.users.findUnique({ where: { id: userId }, select: { trainerCredentials: true } })
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

    await prisma.users.update({
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

export async function updateWorkoutSharingAction(formData: FormData): Promise<void> {
  try {
    const session = await getServerSession(authOptions)
    if (!isSignedIn(session)) return
    const userId = String(formData.get('userId') || '')
    if (!userId || userId !== session!.user!.id) return

    const allowWorkoutSharing = formData.get('allowWorkoutSharing') === 'on'
    const shareWeightsPublicly = formData.get('shareWeightsPublicly') === 'on'

    await prisma.users.update({
      where: { id: userId },
      data: {
        allowWorkoutSharing,
        shareWeightsPublicly,
      }
    })

    revalidatePath('/profile')
  } catch (e) {
    console.error('updateWorkoutSharingAction error', e)
  }
}
