"use server"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { getUserRepository } from '@/services/repository'
import { revalidatePath } from 'next/cache'
import { publishUserSummary } from '@/core/integrations/firebase'
import { getFirestoreUserByEmail } from '@/core/integrations/firebase'

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
