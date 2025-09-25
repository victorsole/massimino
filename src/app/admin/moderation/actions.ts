"use server"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { revalidatePath } from 'next/cache'
import { updateSafetyReport } from '@/core/database'

export async function updateReportStatusAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')

  const reportId = String(formData.get('reportId') || '')
  const status = String(formData.get('status') || '') as 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'
  const resolution = (formData.get('resolution') as string | null) || null
  const assignedTo = session.user.id

  if (!reportId || !status) throw new Error('Missing fields')

  const updates: { status?: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'; assignedTo?: string; resolution?: string } = {
    status,
    assignedTo,
  }
  if (resolution !== null && resolution !== undefined && resolution !== '') {
    updates.resolution = resolution
  }
  await updateSafetyReport(reportId, updates)
  revalidatePath('/admin/moderation')
}
