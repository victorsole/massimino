"use server"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/core/database'

export async function updateUserVerificationAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const userId = String(formData.get('userId') || '')
  const trainerVerified = formData.get('trainerVerified') === 'true'
  const notes = String(formData.get('notes') || '')

  if (!userId) {
    throw new Error('User ID is required')
  }

  try {
    // Update user verification status
    await prisma.users.update({
      where: { id: userId },
      data: { trainerVerified }
    })

    // Update credentials with verification notes
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { trainerCredentials: true }
    })

    if (user?.trainerCredentials) {
      let credentials: any[] = []
      try {
        credentials = JSON.parse(user.trainerCredentials)
        if (Array.isArray(credentials) && credentials.length > 0) {
          // Update the latest credential with verification info
          const latest = credentials[credentials.length - 1]
          latest.verifiedAt = new Date().toISOString()
          latest.verifiedBy = session.user.id
          latest.verificationNotes = notes
          latest.status = trainerVerified ? 'approved' : 'rejected'

          await prisma.users.update({
            where: { id: userId },
            data: { trainerCredentials: JSON.stringify(credentials) }
          })
        }
      } catch (e) {
        console.error('Error updating credentials:', e)
      }
    }

    revalidatePath('/admin/credentials')
  } catch (error) {
    console.error('Error updating verification:', error)
    throw new Error('Failed to update verification status')
  }
}

export async function bulkUpdateVerificationAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const userIds = String(formData.get('userIds') || '').split(',').filter(Boolean)
  const action = String(formData.get('action') || '')

  if (userIds.length === 0 || !['approve', 'reject'].includes(action)) {
    throw new Error('Invalid bulk action parameters')
  }

  const trainerVerified = action === 'approve'

  try {
    await prisma.users.updateMany({
      where: { id: { in: userIds } },
      data: { trainerVerified }
    })

    revalidatePath('/admin/credentials')
    return { success: true, count: userIds.length }
  } catch (error) {
    console.error('Error in bulk update:', error)
    throw new Error('Failed to perform bulk update')
  }
}
