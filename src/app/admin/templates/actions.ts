'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/core/auth/config'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/core/database'

export async function createWorkoutTemplateAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')

  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim() || null
  const category = String(formData.get('category') || '').trim() || null
  const difficulty = String(formData.get('difficulty') || 'BEGINNER')
  const duration = String(formData.get('duration') || '').trim() || null
  const equipment = String(formData.get('equipment') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  const isPublic = formData.get('isPublic') === 'on'
  const price = formData.get('price') ? parseFloat(String(formData.get('price'))) : null

  if (!name) throw new Error('Name is required')

  await prisma.workout_templates.create({
    data: {
      name,
      description,
      category,
      difficulty,
      duration,
      equipment,
      isPublic,
      price,
      createdBy: session.user.id,
    }
  })

  revalidatePath('/admin/templates')
}

export async function updateWorkoutTemplateAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')

  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim() || null
  const category = String(formData.get('category') || '').trim() || null
  const difficulty = String(formData.get('difficulty') || 'BEGINNER')
  const duration = String(formData.get('duration') || '').trim() || null
  const equipment = String(formData.get('equipment') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  const isPublic = formData.get('isPublic') === 'on'
  const isActive = formData.get('isActive') === 'on'
  const price = formData.get('price') ? parseFloat(String(formData.get('price'))) : null

  if (!id || !name) throw new Error('ID and name are required')

  await prisma.workout_templates.update({
    where: { id },
    data: {
      name,
      description,
      category,
      difficulty,
      duration,
      equipment,
      isPublic,
      isActive,
      price,
    }
  })

  revalidatePath('/admin/templates')
}

export async function deleteWorkoutTemplateAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')

  const id = String(formData.get('id') || '')
  if (!id) throw new Error('ID is required')

  await prisma.workout_templates.update({
    where: { id },
    data: { isActive: false }
  })

  revalidatePath('/admin/templates')
}

export async function createProgramTemplateAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')

  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim() || null
  const category = String(formData.get('category') || '').trim() || null
  const difficulty = String(formData.get('difficulty') || 'BEGINNER')
  const duration = String(formData.get('duration') || '').trim()
  const isPublic = formData.get('isPublic') === 'on'
  const price = formData.get('price') ? parseFloat(String(formData.get('price'))) : null

  if (!name || !duration) throw new Error('Name and duration are required')

  await prisma.program_templates.create({
    data: {
      name,
      description,
      category,
      difficulty,
      duration,
      isPublic,
      price,
      createdBy: session.user.id,
    }
  })

  revalidatePath('/admin/templates')
}

export async function updateProgramTemplateAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')

  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim() || null
  const category = String(formData.get('category') || '').trim() || null
  const difficulty = String(formData.get('difficulty') || 'BEGINNER')
  const duration = String(formData.get('duration') || '').trim()
  const isPublic = formData.get('isPublic') === 'on'
  const isActive = formData.get('isActive') === 'on'
  const price = formData.get('price') ? parseFloat(String(formData.get('price'))) : null

  if (!id || !name || !duration) throw new Error('ID, name and duration are required')

  await prisma.program_templates.update({
    where: { id },
    data: {
      name,
      description,
      category,
      difficulty,
      duration,
      isPublic,
      isActive,
      price,
    }
  })

  revalidatePath('/admin/templates')
}

export async function deleteProgramTemplateAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')

  const id = String(formData.get('id') || '')
  if (!id) throw new Error('ID is required')

  await prisma.program_templates.update({
    where: { id },
    data: { isActive: false }
  })

  revalidatePath('/admin/templates')
}