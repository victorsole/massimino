// src/app/admin/exercises/actions.ts
"use server"

import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { revalidatePath } from 'next/cache'
import { getExerciseRepository } from '@/services/repository/exercises'
import { publishExercise, deleteExerciseDoc, getFirestoreExercise } from '@/core/integrations/firebase'
import { prisma } from '@/core/database'

export async function createExerciseAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  const repo = getExerciseRepository()

  const name = String(formData.get('name') || '').trim()
  const category = String(formData.get('category') || '').trim()
  const difficulty = String(formData.get('difficulty') || 'BEGINNER')
  const muscleGroups = String(formData.get('muscleGroups') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const equipment = String(formData.get('equipment') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const instructions = (formData.get('instructions') as string | null) || null
  const safetyNotes = (formData.get('safetyNotes') as string | null) || null
  const imageUrl = (formData.get('imageUrl') as string | null) || null
  const videoUrl = (formData.get('videoUrl') as string | null) || null

  if (!name || !category) throw new Error('Name and category are required')

  const created = await repo.create({
    name,
    category,
    muscleGroups,
    equipment,
    instructions,
    safetyNotes,
    imageUrl,
    videoUrl,
    difficulty,
  })

  try { await publishExercise(created) } catch {}
  revalidatePath('/admin/exercises')
}

export async function updateExerciseAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  const repo = getExerciseRepository()
  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Missing id')
  const data: any = {}
  const mapFields = ['name','category','difficulty','instructions','safetyNotes','imageUrl','videoUrl'] as const
  mapFields.forEach((f) => {
    const v = formData.get(f)
    if (v !== null) data[f] = String(v)
  })
  const mg = formData.get('muscleGroups') as string | null
  if (mg != null) data.muscleGroups = mg.split(',').map(s=>s.trim()).filter(Boolean)
  const eq = formData.get('equipment') as string | null
  if (eq != null) data.equipment = eq.split(',').map(s=>s.trim()).filter(Boolean)
  const isActiveRaw = formData.get('isActive')
  if (isActiveRaw != null) data.isActive = isActiveRaw === 'on' || isActiveRaw === 'true'

  const updated = await repo.update(id, data)
  try { await publishExercise(updated) } catch {}
  revalidatePath('/admin/exercises')
}

export async function deleteExerciseAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  const repo = getExerciseRepository()
  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Missing id')
  await repo.softDelete(id)
  try { await deleteExerciseDoc(id) } catch {}
  revalidatePath('/admin/exercises')
}

export async function syncExerciseFromFirestoreAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Missing id')
  const fsDoc = await getFirestoreExercise(id)
  if (!fsDoc) return
  const repo = getExerciseRepository()
  const updates: any = {}
  ;['name','category','difficulty','instructions','safetyNotes','imageUrl','videoUrl'].forEach((k)=>{
    if (fsDoc[k] != null) updates[k] = fsDoc[k]
  })
  if (Array.isArray(fsDoc.muscleGroups)) updates.muscleGroups = fsDoc.muscleGroups
  if (Array.isArray(fsDoc.equipment)) updates.equipment = fsDoc.equipment
  if (typeof fsDoc.isActive === 'boolean') updates.isActive = fsDoc.isActive
  const updated = await repo.update(id, updates)
  try { await publishExercise(updated) } catch {}
  revalidatePath('/admin/exercises')
}

export async function bulkUpdateExercisesAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  const repo = getExerciseRepository()

  const ids = formData.getAll('ids') as string[]
  const action = String(formData.get('bulkAction') || '')
  if (!ids.length || !action) return

  if (action === 'deactivate') {
    await repo.bulkSoftDelete(ids)
    try { for (const id of ids) { await deleteExerciseDoc(id) } } catch {}
  } else if (action === 'setDifficulty') {
    const difficulty = String(formData.get('difficulty') || '')
    if (difficulty) await repo.bulkUpdate(ids, { difficulty })
  } else if (action === 'setActive') {
    await repo.bulkUpdate(ids, { isActive: true })
  }

  revalidatePath('/admin/exercises')
}

export async function syncAllExercisesToFirestoreAction() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  const batchSize = 500
  let cursor: string | undefined
  // Stream in batches to avoid timeouts
  // Note: This will run within a single request; for very large datasets consider background jobs.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const items = await prisma.exercise.findMany({
      orderBy: { id: 'asc' },
      ...(cursor ? { where: { id: { gt: cursor } } } : {}),
      take: batchSize,
    })
    if (!items.length) break
    for (const ex of items) {
      try {
        await publishExercise({
          id: ex.id,
          name: ex.name,
          category: ex.category,
          muscleGroups: ex.muscleGroups,
          equipment: ex.equipment,
          difficulty: ex.difficulty,
          instructions: ex.instructions,
          safetyNotes: ex.safetyNotes,
          imageUrl: ex.imageUrl,
          videoUrl: ex.videoUrl,
          isActive: ex.isActive,
          usageCount: ex.usageCount,
          lastUsed: ex.lastUsed,
        })
      } catch (e) {
        // continue on error
      }
    }
    const last = items[items.length - 1]
    if (!last) break
    cursor = last.id
    if (items.length < batchSize) break
  }
  revalidatePath('/admin/exercises')
}

export async function importExercisesCsvAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  // const repo = getExerciseRepository() // not needed here; we use prisma directly

  // Prefer uploaded file over pasted text
  const file = formData.get('csvFile') as unknown as File | null
  let csvText = (formData.get('csvText') as string | null) || ''
  if (file) {
    const anyFile = file as any
    const hasArrayBuffer = anyFile && typeof anyFile.arrayBuffer === 'function'
    const buf = hasArrayBuffer ? Buffer.from(await anyFile.arrayBuffer()) : Buffer.from('')
    csvText = buf.toString('utf-8')
  }
  if (!csvText || csvText.trim().length === 0) {
    throw new Error('No CSV provided')
  }

  const { parse } = await import('csv-parse/sync')
  const rows = parse(csvText, { columns: true, skip_empty_lines: true }) as any[]

  const normalizeDifficulty = (d: string) => {
    const n = (d || '').trim().toUpperCase()
    return ['BEGINNER','INTERMEDIATE','ADVANCED'].includes(n) ? n : 'BEGINNER'
  }
  const parseList = (s?: string) => (s || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)

  let imported = 0, updated = 0, failed = 0
  for (const row of rows) {
    try {
      // Accept both our script schema and the public CSV
      const name = (row.name || row.Exercise || '').trim()
      if (!name) { failed++; continue }
      const category = (row.category || row['Primary Exercise Classification'] || 'Other').trim()
      const muscleGroups = parseList(
        row.muscleGroups || [
          row['Target Muscle Group '],
          row['Prime Mover Muscle'],
          row['Secondary Muscle'],
          row['Tertiary Muscle'],
        ].filter(Boolean).join(',')
      )
      const equipment = parseList(
        row.equipment || [
          row['Primary Equipment '],
          row['Secondary Equipment'],
        ].filter(Boolean).join(',')
      )
      const instructions = (row.instructions || row['In-Depth YouTube Explanation'] || '').trim() || null
      const videoUrl = (row.videoUrl || row['Short YouTube Demonstration'] || '').trim() || null
      const imageUrl = (row.imageUrl || '').trim() || null
      const difficulty = normalizeDifficulty(row.difficulty || row['Difficulty Level'] || 'BEGINNER')
      const safetyNotes = (row.safetyNotes || row['Posture'] || '').trim() || null

      const data: any = { name, category, muscleGroups, equipment, instructions, videoUrl, imageUrl, difficulty, safetyNotes, isActive: true }
      const upserted = await prisma.exercise.upsert({
        where: { name },
        create: data,
        update: data,
      })
      if (upserted.createdAt.getTime() === upserted.updatedAt.getTime()) imported++
      else updated++

      try {
        await publishExercise({
          id: upserted.id,
          name: upserted.name,
          category: upserted.category,
          muscleGroups: upserted.muscleGroups,
          equipment: upserted.equipment,
          difficulty: upserted.difficulty,
          instructions: upserted.instructions,
          safetyNotes: upserted.safetyNotes,
          imageUrl: upserted.imageUrl,
          videoUrl: upserted.videoUrl,
          isActive: upserted.isActive,
          usageCount: upserted.usageCount,
          lastUsed: upserted.lastUsed,
        })
      } catch {}
    } catch {
      failed++
    }
  }
  revalidatePath('/admin/exercises')
  return { imported, updated, failed }
}
