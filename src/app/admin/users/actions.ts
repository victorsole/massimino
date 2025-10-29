"use server"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { getUserRepository } from '@/services/repository'
import { revalidatePath } from 'next/cache'
import { publishUserSummary } from '@/core/integrations/firebase'
import { getFirestoreUserByEmail } from '@/core/integrations/firebase'
import { prisma } from '@/core/database'
import crypto from 'crypto'

// Points system constants
const INVITATION_POINTS = {
  CLIENT_ACCEPTED: 10,
  TRAINER_ACCEPTED: 50,
  BONUS_FIRST_WORKOUT: 25,
  BONUS_RETENTION: 100,
  BONUS_TRAINER_VERIFICATION: 75,
} as const

const ACHIEVEMENT_REQUIREMENTS = {
  ROOKIE_RECRUITER: 5,        // 5 successful invitations
  TALENT_SCOUT: 15,          // 15 successful invitations
  COMMUNITY_BUILDER: 50,     // 50 successful invitations
  GROWTH_CHAMPION: 100,      // 100 successful invitations
  TRAINER_MAGNET: 10,        // 10 trainer invitations accepted
  CLIENT_CONNECTOR: 25,      // 25 client invitations accepted
} as const

// Helper function to award points to a trainer
async function awardPoints(trainerId: string, pointType: string, points: number, description: string, sourceId?: string) {
  try {
    await prisma.trainer_points.create({
      data: {
        trainerId,
        pointType: pointType as any,
        points,
        description,
        sourceId: sourceId || null,
      }
    })
  } catch (error) {
    console.error('Error awarding points:', error)
  }
}

// Helper function to check and unlock achievements
async function checkAndUnlockAchievements(trainerId: string) {
  try {
    // Get trainer's invitation statistics
    const invitationStats = await prisma.invitations.groupBy({
      by: ['role'],
      where: {
        senderId: trainerId,
        status: 'ACCEPTED'
      },
      _count: {
        id: true
      }
    })

    const trainerInvites = invitationStats.find(stat => stat.role === 'TRAINER')?._count.id || 0
    const clientInvites = invitationStats.find(stat => stat.role === 'CLIENT')?._count.id || 0
    const totalInvites = trainerInvites + clientInvites

    // Get existing achievements to avoid duplicates
    const existingAchievements = await prisma.trainer_achievements.findMany({
      where: { trainerId },
      select: { achievementType: true }
    })
    const existingTypes = new Set(existingAchievements.map((a: any) => a.achievementType))

    // Check for new achievements
    const newAchievements: Array<{ type: string; points: number }> = []

    // General invitation achievements
    if (totalInvites >= ACHIEVEMENT_REQUIREMENTS.ROOKIE_RECRUITER && !existingTypes.has('ROOKIE_RECRUITER')) {
      newAchievements.push({ type: 'ROOKIE_RECRUITER', points: 50 })
    }
    if (totalInvites >= ACHIEVEMENT_REQUIREMENTS.TALENT_SCOUT && !existingTypes.has('TALENT_SCOUT')) {
      newAchievements.push({ type: 'TALENT_SCOUT', points: 150 })
    }
    if (totalInvites >= ACHIEVEMENT_REQUIREMENTS.COMMUNITY_BUILDER && !existingTypes.has('COMMUNITY_BUILDER')) {
      newAchievements.push({ type: 'COMMUNITY_BUILDER', points: 500 })
    }
    if (totalInvites >= ACHIEVEMENT_REQUIREMENTS.GROWTH_CHAMPION && !existingTypes.has('GROWTH_CHAMPION')) {
      newAchievements.push({ type: 'GROWTH_CHAMPION', points: 1000 })
    }

    // Specific role achievements
    if (trainerInvites >= ACHIEVEMENT_REQUIREMENTS.TRAINER_MAGNET && !existingTypes.has('TRAINER_MAGNET')) {
      newAchievements.push({ type: 'TRAINER_MAGNET', points: 200 })
    }
    if (clientInvites >= ACHIEVEMENT_REQUIREMENTS.CLIENT_CONNECTOR && !existingTypes.has('CLIENT_CONNECTOR')) {
      newAchievements.push({ type: 'CLIENT_CONNECTOR', points: 300 })
    }

    // Create new achievements and award points
    for (const achievement of newAchievements) {
      await prisma.trainer_achievements.create({
        data: {
          trainerId,
          achievementType: achievement.type as any,
          pointsAwarded: achievement.points
        }
      })

      // Award achievement points
      await awardPoints(
        trainerId,
        'ACHIEVEMENT_UNLOCK',
        achievement.points,
        `Achievement unlocked: ${achievement.type.replace(/_/g, ' ')}`
      )
    }

  } catch (error) {
    console.error('Error checking achievements:', error)
  }
}

export async function updateUserAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Missing user id')

  const role = (formData.get('role') as string | null) ?? undefined
  const status = (formData.get('status') as string | null) ?? undefined
  const trainerVerified = formData.get('trainerVerified') === 'on'
  const massiminoUsernameRaw = (formData.get('massiminoUsername') as string | null) || null
  const reputationScoreRaw = formData.get('reputationScore') as string | null
  const warningCountRaw = formData.get('warningCount') as string | null

  const reputationScore = reputationScoreRaw != null ? Number(reputationScoreRaw) : undefined
  const warningCount = warningCountRaw != null ? Number(warningCountRaw) : undefined

  const data: any = {}
  if (role) data.role = role
  if (status) data.status = status
  if (typeof trainerVerified === 'boolean') data.trainerVerified = trainerVerified
  if (!Number.isNaN(reputationScore as any) && reputationScore != null) data.reputationScore = reputationScore
  if (!Number.isNaN(warningCount as any) && warningCount != null) data.warningCount = warningCount

  const repo = getUserRepository()
  const updated = await repo.updateUser(id, data)

  // Optional: update public username if provided
  if (massiminoUsernameRaw != null) {
    const normalized = normalizeUsername(massiminoUsernameRaw)
    if (normalized) {
      try {
        await prisma.users.update({ where: { id }, data: { massiminoUsername: normalized } })
      } catch (e) {
        console.warn('Admin username update skipped (likely taken or invalid):', normalized)
      }
    }
  }

  // Optionally mirror to Firestore if configured
  try {
    await publishUserSummary({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      status: updated.status,
      reputationScore: updated.reputationScore,
      warningCount: updated.warningCount,
      trainerVerified: updated.trainerVerified,
    })
  } catch (e) {
    console.warn('Failed to publish user summary to Firebase (optional):', e)
  }

  revalidatePath('/admin/users')
}

function normalizeUsername(input: string): string | null {
  const raw = (input || '').trim().toLowerCase()
  if (!raw) return null
  let u = raw.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  if (!/^[a-z]/.test(u)) return null
  if (u.length < 3 || u.length > 20) return null
  if (/__/.test(u)) return null
  const reserved = new Set(['admin','api','app','about','help','support','contact','terms','privacy','login','signup','register','massimino','massiminos','massitree','trainer','client','user'])
  if (reserved.has(u)) return null
  return u
}

export async function syncUserFromFirestoreAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')

  const id = String(formData.get('id') || '')
  const email = String(formData.get('email') || '')
  if (!id || !email) throw new Error('Missing user id/email')

  const fsUser = await getFirestoreUserByEmail(email)
  if (!fsUser.exists) return

  const repo = getUserRepository()
  const updates: any = {}
  // Map Firestore fields to DB fields
  if (typeof fsUser.trainer_verified === 'boolean') {
    updates.trainerVerified = fsUser.trainer_verified
  }
  if (typeof fsUser.admin === 'boolean' && fsUser.admin) {
    updates.role = 'ADMIN'
  } else if (typeof fsUser.trainer === 'boolean') {
    updates.role = fsUser.trainer ? 'TRAINER' : 'CLIENT'
  }
  if (fsUser.name && typeof fsUser.name === 'string') {
    updates.name = fsUser.name
  }

  if (Object.keys(updates).length > 0) {
    const updated = await repo.updateUser(id, updates)
    try {
      await publishUserSummary(updated)
    } catch {}
  }

  revalidatePath('/admin/users')
}

export async function createUserAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')

  const email = String(formData.get('email') || '').trim().toLowerCase()
  const name = (formData.get('name') as string | null) || null
  const role = (formData.get('role') as string | null) || 'CLIENT'
  const status = (formData.get('status') as string | null) || 'ACTIVE'
  const trainerVerified = formData.get('trainerVerified') === 'on'
  const reputationScoreRaw = formData.get('reputationScore') as string | null
  const warningCountRaw = formData.get('warningCount') as string | null

  if (!email) throw new Error('Email is required')

  const reputationScore = reputationScoreRaw ? Number(reputationScoreRaw) : undefined
  const warningCount = warningCountRaw ? Number(warningCountRaw) : undefined

  const repo = getUserRepository()
  const created = await repo.createUser({
    email,
    name,
    role,
    status,
    ...(typeof trainerVerified === 'boolean' ? { trainerVerified } : {}),
    ...(reputationScore != null && !Number.isNaN(reputationScore) ? { reputationScore } : {}),
    ...(warningCount != null && !Number.isNaN(warningCount) ? { warningCount } : {}),
  })

  try {
    await publishUserSummary(created)
  } catch (e) {
    console.warn('Failed to mirror new user to Firestore (optional):', e)
  }

  revalidatePath('/admin/users')
}

// Invitation Management Actions
export async function createInvitationAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const emailsText = String(formData.get('emails') || '').trim()
  const role = (formData.get('role') as string) || 'CLIENT'
  const message = (formData.get('message') as string) || null
  const expiresInDays = parseInt(String(formData.get('expiresInDays') || '7'))

  if (!emailsText) throw new Error('Email addresses are required')

  // Parse emails from textarea (one per line)
  const emails = emailsText
    .split('\n')
    .map(line => line.trim().toLowerCase())
    .filter(line => line.length > 0)
    .filter(line => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line))

  if (emails.length === 0) throw new Error('No valid email addresses found')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + Math.max(1, Math.min(90, expiresInDays)))

  // Check for existing users and invitations
  let existingUsers: { email: string }[] = []
  let existingInvitations: { email: string }[] = []

  try {
    const [users, invitations] = await Promise.all([
      prisma.users.findMany({
        where: { email: { in: emails } },
        select: { email: true }
      }),
      prisma.invitations.findMany({
        where: {
          email: { in: emails },
          status: 'PENDING',
          expiresAt: { gt: new Date() }
        },
        select: { email: true }
      })
    ])
    existingUsers = users
    existingInvitations = invitations
  } catch (error) {
    console.error('Error checking existing users/invitations:', error)
    existingUsers = await prisma.users.findMany({
      where: { email: { in: emails } },
      select: { email: true }
    })
  }

  const existingUserEmails = new Set(existingUsers.map((u: { email: string }) => u.email))
  const existingInvitationEmails = new Set(existingInvitations.map((i: { email: string }) => i.email))

  // Categorize input emails
  const newInviteEmails = emails.filter(email => !existingUserEmails.has(email) && !existingInvitationEmails.has(email))
  const registeredOnlyEmails = emails.filter(email => existingUserEmails.has(email) && !existingInvitationEmails.has(email))
  // Emails with pending invitations are intentionally skipped to avoid duplicates

  // Create invitations
  const createdInvites = await Promise.all(
    newInviteEmails.map(email =>
      prisma.invitations.create({
        data: {
          id: crypto.randomUUID(),
          code: crypto.randomUUID(),
          email,
          role: role as any,
          message,
          expiresAt,
          senderId: session.user.id,
          status: 'PENDING',
          updatedAt: new Date()
        }
      })
    )
  )

  // Send invitation emails if email service is configured
  try {
    const { isEmailServiceConfigured, sendEmail } = await import('@/services/email/email_service')
    if (isEmailServiceConfigured()) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      await Promise.all([
        // Emails for newly created invitations (non-registered addresses)
        ...createdInvites.map(async (inv) => {
          const subject = `You're invited to join Massimino${inv.role ? ` as ${String(inv.role).toLowerCase()}` : ''}`
          const lines: string[] = []
          lines.push('Hello,')
          lines.push('')
          lines.push(`You've been invited to join Massimino${inv.role ? ` as a ${String(inv.role).toLowerCase()}` : ''}.`)
          if (inv.message) {
            lines.push('')
            lines.push('Message from the inviter:')
            lines.push(`"${inv.message}"`)
          }
          lines.push('')
          lines.push(`This invitation is valid until ${inv.expiresAt.toDateString()}.`)
          lines.push('')
          lines.push(`Get started here: ${appUrl}/login`)
          lines.push('')
          lines.push('If you already have an account, sign in with the invited email address.')

          await sendEmail({
            to: inv.email,
            subject,
            text: lines.join('\n')
          })
        }),
        // Emails to existing registered users (no DB invitation is created)
        ...registeredOnlyEmails.map(async (emailAddr) => {
          const subject = `You're invited to join Massimino${role ? ` as ${String(role).toLowerCase()}` : ''}`
          const lines: string[] = []
          lines.push('Hello,')
          lines.push('')
          lines.push(`You've been invited to join Massimino${role ? ` as a ${String(role).toLowerCase()}` : ''}.`)
          if (message) {
            lines.push('')
            lines.push('Message from the inviter:')
            lines.push(`"${message}"`)
          }
          lines.push('')
          lines.push('It looks like you already have an account with this email.')
          lines.push(`Sign in to get started: ${appUrl}/login`)

          await sendEmail({
            to: emailAddr,
            subject,
            text: lines.join('\n')
          })
        })
      ])
    }
  } catch (e) {
    console.warn('[Admin Invitations] Email sending skipped or failed:', e)
  }

  revalidatePath('/admin/users')
}

export async function updateInvitationAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const id = String(formData.get('id') || '')
  const action = String(formData.get('action') || '')

  if (!id) throw new Error('Invitation ID is required')
  // invitations model exists; proceed

  const invitation = await prisma.invitations.findUnique({ where: { id } })
  if (!invitation) throw new Error('Invitation not found')

  let updateData: any = {}

  switch (action) {
    case 'revoke':
      updateData.status = 'REVOKED'
      break
    case 'extend':
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)
      updateData.expiresAt = expiresAt
      updateData.status = 'PENDING'
      break
    case 'resend':
      const resendExpiresAt = new Date()
      resendExpiresAt.setDate(resendExpiresAt.getDate() + 7)
      updateData.expiresAt = resendExpiresAt
      updateData.status = 'PENDING'
      break
    default:
      throw new Error('Invalid action')
  }

  await prisma.invitations.update({
    where: { id },
    data: updateData
  })

  // If action was resend, attempt to send the email again
  if (action === 'resend') {
    try {
      const { isEmailServiceConfigured, sendEmail } = await import('@/services/email/email_service')
      if (isEmailServiceConfigured()) {
        const refreshed = await prisma.invitations.findUnique({ where: { id } })
        if (refreshed) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const subject = 'Reminder: Your Massimino invitation'
          const lines: string[] = []
          lines.push('Hello,')
          lines.push('')
          lines.push(`This is a reminder about your invitation to join Massimino${refreshed.role ? ` as a ${String(refreshed.role).toLowerCase()}` : ''}.`)
          if (refreshed.message) {
            lines.push('')
            lines.push('Message from the inviter:')
            lines.push(`"${refreshed.message}"`)
          }
          if (refreshed.expiresAt) {
            lines.push('')
            lines.push(`This invitation is valid until ${new Date(refreshed.expiresAt).toDateString()}.`)
          }
          lines.push('')
          lines.push(`Get started here: ${appUrl}/login`)

          await sendEmail({
            to: refreshed.email,
            subject,
            text: lines.join('\n')
          })
        }
      }
    } catch (e) {
      console.warn('[Admin Invitations] Resend email failed:', e)
    }
  }

  revalidatePath('/admin/users')
}

export async function deleteInvitationAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Invitation ID is required')
  // invitations model exists; proceed

  await prisma.invitations.delete({ where: { id } })
  revalidatePath('/admin/users')
}

// Function to handle invitation acceptance and award points
export async function processInvitationAcceptance(invitationId: string, newUserId: string) {
  try {
    // invitations model exists

    // Get the invitation
  const invitation = await prisma.invitations.findUnique({
    where: { id: invitationId },
    include: {
        users_invitations_senderIdTousers: {
          select: { id: true, role: true }
        }
    }
  })

    if (!invitation || invitation.status !== 'PENDING') return

    // Update invitation status
    await prisma.invitations.update({
      where: { id: invitationId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        receiverId: newUserId
      }
    })

    // Award points to the inviting trainer (only if sender is a trainer)
    if (invitation.users_invitations_senderIdTousers?.role === 'TRAINER') {
      const pointsToAward = invitation.role === 'TRAINER'
        ? INVITATION_POINTS.TRAINER_ACCEPTED
        : INVITATION_POINTS.CLIENT_ACCEPTED

      await awardPoints(
        invitation.senderId,
        'INVITATION_ACCEPTED',
        pointsToAward,
        `Invitation accepted by ${invitation.email} (${invitation.role})`,
        invitationId
      )

      // Check for new achievements
      await checkAndUnlockAchievements(invitation.senderId)
    }

    console.log(`Successfully processed invitation acceptance: ${invitationId}`)
  } catch (error) {
    console.error('Error processing invitation acceptance:', error)
  }
}

// Function to find invitation by email (helper for auth integration)
export async function findPendingInvitationByEmail(email: string) {
  try {
    // invitations model exists

    return await prisma.invitations.findFirst({
      where: {
        email: email.toLowerCase(),
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    })
  } catch (error) {
    console.error('Error finding invitation by email:', error)
    return null
  }
}

// Function to check and award retention bonuses (should be called by a cron job)
export async function checkRetentionBonuses() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find invitations accepted exactly 30 days ago that haven't received retention bonus yet
    const eligibleInvitations = await prisma.invitations.findMany({
      where: {
        status: 'ACCEPTED',
        acceptedAt: {
          lte: thirtyDaysAgo,
          gte: new Date(thirtyDaysAgo.getTime() - 24 * 60 * 60 * 1000) // 24 hour window
        }
      },
      include: {
        users_invitations_senderIdTousers: { select: { id: true, role: true } },
        users_invitations_receiverIdTousers: { select: { id: true, status: true } }
      }
    });

    for (const invitation of eligibleInvitations) {
      // Check if retention bonus was already awarded
      const existingBonus = await prisma.trainer_points.findFirst({
        where: {
          trainerId: invitation.senderId,
          pointType: 'BONUS_RETENTION',
          sourceId: invitation.id
        }
      });

      // Skip if bonus already awarded or sender is not a trainer
      if (existingBonus || invitation.users_invitations_senderIdTousers?.role !== 'TRAINER') continue;

      // Check if the invited user is still active and has recent activity
      if (invitation.users_invitations_receiverIdTousers && invitation.users_invitations_receiverIdTousers.status === 'ACTIVE') {
        // Check for recent workout activity (within last 7 days)
        const recentActivity = await prisma.workout_log_entries.findFirst({
          where: {
            userId: invitation.users_invitations_receiverIdTousers.id,
            date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        });

        // Award retention bonus if user has recent activity
        if (recentActivity) {
          await awardPoints(
            invitation.senderId,
            'BONUS_RETENTION',
            INVITATION_POINTS.BONUS_RETENTION,
            `30-day retention bonus for ${invitation.email}`,
            invitation.id
          );

          console.log('Retention bonus awarded:', {
            trainerId: invitation.senderId,
            invitedUserId: invitation.users_invitations_receiverIdTousers.id,
            invitationId: invitation.id,
            points: INVITATION_POINTS.BONUS_RETENTION
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking retention bonuses:', error);
  }
}

// Function to award trainer verification bonus
export async function awardTrainerVerificationBonus(trainerId: string) {
  try {
    // Check if this trainer was invited by another trainer
    const invitation = await prisma.invitations.findFirst({
      where: {
        receiverId: trainerId,
        status: 'ACCEPTED',
        role: 'TRAINER'
      },
      include: {
        users_invitations_senderIdTousers: {
          select: { id: true, role: true }
        }
      }
    });

    if (invitation && invitation.users_invitations_senderIdTousers?.role === 'TRAINER') {
      // Check if bonus was already awarded
      const existingBonus = await prisma.trainer_points.findFirst({
        where: {
          trainerId: invitation.senderId,
          pointType: 'BONUS_TRAINER_VERIFICATION',
          sourceId: invitation.id
        }
      });

      if (!existingBonus) {
        await awardPoints(
          invitation.senderId,
          'BONUS_TRAINER_VERIFICATION',
          INVITATION_POINTS.BONUS_TRAINER_VERIFICATION,
          `Trainer verification bonus for ${invitation.email}`,
          invitation.id
        );

        console.log('Trainer verification bonus awarded:', {
          inviterTrainerId: invitation.senderId,
          verifiedTrainerId: trainerId,
          invitationId: invitation.id,
          points: INVITATION_POINTS.BONUS_TRAINER_VERIFICATION
        });
      }
    }
  } catch (error) {
    console.error('Error awarding trainer verification bonus:', error);
  }
}

// ============================================================================
// Redemption Management Actions
// ============================================================================

export async function updateRedemptionStatusAction(formData: FormData) {
  try {
    const redemptionId = formData.get('redemptionId') as string;
    const status = formData.get('status') as 'PENDING' | 'APPROVED' | 'FULFILLED' | 'REJECTED';

    if (!redemptionId || !status) {
      throw new Error('Missing redemption ID or status');
    }

    // Update redemption status
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // If fulfilling, set fulfilled timestamp
    if (status === 'FULFILLED') {
      updateData.fulfilledAt = new Date();
    }

    const updatedRedemption = await prisma.points_redemptions.update({
      where: { id: redemptionId },
      data: updateData,
      include: {
        users: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log('Redemption status updated:', {
      redemptionId,
      status,
      trainerEmail: updatedRedemption.users.email,
      rewardTitle: updatedRedemption.rewardTitle,
      pointsCost: updatedRedemption.pointsCost
    });

    // If rejecting, refund the points to the trainer
    if (status === 'REJECTED') {
      await awardPoints(
        updatedRedemption.trainerId,
        'REFUND',
        updatedRedemption.pointsCost,
        `Refund for rejected redemption: ${updatedRedemption.rewardTitle}`,
        redemptionId
      );

      console.log('Points refunded for rejected redemption:', {
        trainerId: updatedRedemption.trainerId,
        points: updatedRedemption.pointsCost,
        redemptionId
      });
    }

    revalidatePath('/admin/users');
  } catch (error) {
    console.error('Error updating redemption status:', error);
    throw error;
  }
}

// ============================================================================
// Points Adjustment Actions
// ============================================================================

export async function adjustUserPointsAction(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const pointsAmount = parseInt(formData.get('pointsAmount') as string || '0');
    const reason = formData.get('reason') as 'MANUAL_ADJUSTMENT' | 'BONUS_ACHIEVEMENT' | 'PENALTY' | 'CORRECTION';
    const description = formData.get('description') as string;

    if (!userId || pointsAmount === 0) {
      throw new Error('Invalid user ID or points amount');
    }

    if (!description?.trim()) {
      throw new Error('Description is required for points adjustment');
    }

    // Verify user is a trainer
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true }
    });

    if (!user || user.role !== 'TRAINER') {
      throw new Error('Points can only be adjusted for trainers');
    }

    // Map reason to appropriate PointType
    const pointTypeMap = {
      'MANUAL_ADJUSTMENT': 'MANUAL_ADJUSTMENT',
      'BONUS_ACHIEVEMENT': 'ACHIEVEMENT_UNLOCK',
      'PENALTY': 'PENALTY',
      'CORRECTION': 'MANUAL_ADJUSTMENT'
    } as const;

    const pointType = pointTypeMap[reason];

    // Create points adjustment record
    await prisma.trainer_points.create({
      data: {
        trainerId: userId,
        pointType,
        points: pointsAmount,
        description: `[ADMIN] ${description}`,
        createdAt: new Date()
      }
    });

    console.log('Points adjusted by admin:', {
      userId,
      userName: user.name,
      userEmail: user.email,
      pointsAmount,
      reason,
      description
    });

    // Check for new achievements after positive point adjustment
    if (pointsAmount > 0) {
      await checkAndUnlockAchievements(userId);
    }

    revalidatePath('/admin/users');
  } catch (error) {
    console.error('Error adjusting user points:', error);
    throw error;
  }
}

// ============================================================================
// Bulk Points Management Actions
// ============================================================================

export async function bulkAwardPointsAction(formData: FormData) {
  try {
    const pointsAmount = parseInt(formData.get('pointsAmount') as string || '0');
    const targetGroup = formData.get('targetGroup') as 'ALL_TRAINERS' | 'VERIFIED_TRAINERS' | 'TOP_PERFORMERS';
    const description = formData.get('description') as string;

    if (pointsAmount <= 0 || pointsAmount > 1000) {
      throw new Error('Points amount must be between 1 and 1000');
    }

    if (!description?.trim()) {
      throw new Error('Description is required for bulk points award');
    }

    // Build the query based on target group
    let whereClause: any = {
      role: 'TRAINER',
      status: 'ACTIVE'
    };

    if (targetGroup === 'VERIFIED_TRAINERS') {
      whereClause.trainerVerified = true;
    }

    let trainers;
    if (targetGroup === 'TOP_PERFORMERS') {
      // Get top 10 performers by points
      const topPerformers = await prisma.trainer_points.groupBy({
        by: ['trainerId'],
        where: { points: { gt: 0 } },
        _sum: { points: true },
        orderBy: { _sum: { points: 'desc' } },
        take: 10
      });

      trainers = await prisma.users.findMany({
        where: {
          id: { in: topPerformers.map((tp: any) => tp.trainerId) },
          status: 'ACTIVE'
        },
        select: { id: true, name: true, email: true }
      });
    } else {
      trainers = await prisma.users.findMany({
        where: whereClause,
        select: { id: true, name: true, email: true }
      });
    }

    if (trainers.length === 0) {
      throw new Error('No trainers found matching the criteria');
    }

    // Award points to all selected trainers
    const pointsRecords = trainers.map(trainer => ({
      trainerId: trainer.id,
      pointType: 'MANUAL_ADJUSTMENT' as const,
      points: pointsAmount,
      description: `[ADMIN BULK] ${description}`,
      createdAt: new Date()
    }));

    await prisma.trainer_points.createMany({
      data: pointsRecords
    });

    // Check for achievements for each trainer
    for (const trainer of trainers) {
      await checkAndUnlockAchievements(trainer.id);
    }

    console.log('Bulk points awarded:', {
      targetGroup,
      trainersCount: trainers.length,
      pointsAmount,
      totalPointsAwarded: pointsAmount * trainers.length,
      description
    });

    revalidatePath('/admin/users');
  } catch (error) {
    console.error('Error in bulk points award:', error);
    throw error;
  }
}

export async function quickPointsAwardAction(formData: FormData) {
  try {
    const trainerEmail = formData.get('trainerEmail') as string;
    const pointsAmount = parseInt(formData.get('pointsAmount') as string || '0');
    const description = formData.get('description') as string;

    if (!trainerEmail?.trim()) {
      throw new Error('Trainer email is required');
    }

    if (pointsAmount === 0 || Math.abs(pointsAmount) > 999) {
      throw new Error('Points amount must be between -999 and 999 (excluding 0)');
    }

    if (!description?.trim()) {
      throw new Error('Description is required for points adjustment');
    }

    // Find trainer by email
    const trainer = await prisma.users.findUnique({
      where: { email: trainerEmail.toLowerCase().trim() },
      select: { id: true, name: true, email: true, role: true, status: true }
    });

    if (!trainer) {
      throw new Error('Trainer not found with this email address');
    }

    if (trainer.role !== 'TRAINER') {
      throw new Error('User is not a trainer');
    }

    if (trainer.status !== 'ACTIVE') {
      throw new Error('Trainer is not active');
    }

    // Create points adjustment
    await prisma.trainer_points.create({
      data: {
        id: crypto.randomUUID(),
        trainerId: trainer.id,
        pointType: pointsAmount > 0 ? 'MANUAL_ADJUSTMENT' : 'PENALTY',
        points: pointsAmount,
        description: `[ADMIN QUICK] ${description}`,
        createdAt: new Date()
      }
    });

    // Check for achievements after positive point adjustment
    if (pointsAmount > 0) {
      await checkAndUnlockAchievements(trainer.id);
    }

    console.log('Quick points awarded:', {
      trainerId: trainer.id,
      trainerName: trainer.name,
      trainerEmail: trainer.email,
      pointsAmount,
      description
    });

    revalidatePath('/admin/users');
  } catch (error) {
    console.error('Error in quick points award:', error);
    throw error;
  }
}
