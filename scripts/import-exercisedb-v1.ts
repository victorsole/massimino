/**
 * ExerciseDB v1 Importer
 * - Fetches exercises from exercisedb.dev (v1) or reads a local JSON file
 * - Upserts into `exercises` with taxonomy mapped to our schema
 * - Optionally creates GIF media entries in `exercise_media` as public and approved
 *
 * Usage:
 *  - From network (default):
 *      EXERCISEDB_BASE_URL=https://www.exercisedb.dev \
 *      npx ts-node scripts/import-exercisedb-v1.ts --fetch --limit 25 --curated
 *
 *  - From local file (array of exercises with v1 shape):
 *      npx ts-node scripts/import-exercisedb-v1.ts ./path/to/exercisedb-v1.json --curated
 *
 * Environment:
 *  - EXERCISEDB_BASE_URL (default: https://www.exercisedb.dev)
 *  - EXERCISE_MEDIA_SYSTEM_USER_ID (optional; if absent, script will try to auto-pick an admin user)
 */

import { prisma } from '../src/core/database/client'

type V1Exercise = {
  exerciseId: string
  name: string
  gifUrl: string
  targetMuscles: string[]
  secondaryMuscles?: string[]
  bodyParts: string[]
  equipments: string[]
  instructions?: string[]
}

type FetchOptions = {
  offset?: number
  limit?: number
  search?: string
}

async function fetchPage(baseUrl: string, opts: FetchOptions): Promise<V1Exercise[]> {
  const params = new URLSearchParams()
  params.set('offset', String(opts.offset ?? 0))
  params.set('limit', String(opts.limit ?? 25))
  if (opts.search) params.set('search', opts.search)
  const url = `${baseUrl.replace(/\/$/, '')}/api/v1/exercises?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`)
  const json = await res.json()
  if (!json?.data || !Array.isArray(json.data)) return []
  return json.data as V1Exercise[]
}

function normalize(str?: string | null): string | undefined {
  if (!str) return undefined
  const s = String(str).trim()
  return s.length ? s : undefined
}

async function getSystemUserId(): Promise<string | null> {
  if (process.env.EXERCISE_MEDIA_SYSTEM_USER_ID) return process.env.EXERCISE_MEDIA_SYSTEM_USER_ID
  // Try find an admin, then any user
  const admin = await prisma.users.findFirst({ where: { role: 'ADMIN' } })
  if (admin) return admin.id
  const any = await prisma.users.findFirst()
  return any ? any.id : null
}

async function upsertExerciseFromV1(x: V1Exercise, curated: boolean) {
  const primaryBodyPart = x.bodyParts?.[0]
  const muscleGroups = Array.from(new Set([...(x.targetMuscles || []), ...(x.secondaryMuscles || [])]))
  const equipment = x.equipments || []
  const tags = Array.from(new Set([...
    (x.targetMuscles || []), ...(x.secondaryMuscles || []), ...(x.bodyParts || []), ...(x.equipments || []), 'ExerciseDB'
  ].map(t => t.toLowerCase())))
  const instructions = (x.instructions || []).join('\n')

  const existing = await prisma.exercises.findFirst({ where: { source: 'EXERCISEDB_V1', sourceId: x.exerciseId } })
  if (existing) {
    return prisma.exercises.update({
      where: { id: existing.id },
      data: {
        name: x.name,
        // Keep category stable; fallback to 'GENERAL'
        category: existing.category || 'GENERAL',
        muscleGroups,
        equipment,
        instructions: normalize(instructions) ?? null,
        imageUrl: normalize(x.gifUrl) ?? null,
        bodyPart: normalize(primaryBodyPart) ?? null,
        tags,
        curated: curated ?? existing.curated,
        source: 'EXERCISEDB_V1',
        sourceId: x.exerciseId,
        updatedAt: new Date(),
      },
    })
  }
  // If an exercise with the same name already exists (unique constraint), update it instead
  const byName = await prisma.exercises.findFirst({ where: { name: x.name } })
  if (byName) {
    return prisma.exercises.update({
      where: { id: byName.id },
      data: {
        category: byName.category || 'GENERAL',
        muscleGroups,
        equipment,
        instructions: normalize(instructions) ?? byName.instructions ?? null,
        imageUrl: byName.imageUrl ?? normalize(x.gifUrl) ?? null,
        bodyPart: byName.bodyPart ?? normalize(primaryBodyPart) ?? null,
        // merge tags
        tags: Array.from(new Set([...(byName.tags || []), ...tags])),
        curated: curated || byName.curated,
        source: byName.source || 'EXERCISEDB_V1',
        sourceId: byName.sourceId || x.exerciseId,
        updatedAt: new Date(),
      },
    })
  }

  return prisma.exercises.create({
    data: {
      id: crypto.randomUUID(),
      name: x.name,
      category: 'GENERAL',
      muscleGroups,
      equipment,
      instructions: normalize(instructions) ?? null,
      imageUrl: normalize(x.gifUrl) ?? null,
      difficulty: 'BEGINNER',
      safetyNotes: null,
      formCues: [],
      commonMistakes: [],
      isCustom: false,
      bodyPart: normalize(primaryBodyPart) ?? null,
      movementPattern: null,
      type: null,
      tags,
      aliasNames: [],
      curated: curated ?? false,
      source: 'EXERCISEDB_V1',
      sourceId: x.exerciseId,
      updatedAt: new Date(),
    },
  })
}

async function ensureGifMedia(ex: { id: string }, gifUrl?: string | null, systemUserId?: string | null) {
  if (!gifUrl || !systemUserId) return
  const exists = await prisma.exercise_media.findFirst({ where: { globalExerciseId: ex.id, url: gifUrl } })
  if (exists) return
  await prisma.exercise_media.create({
    data: {
      id: crypto.randomUUID(),
      userId: systemUserId,
      globalExerciseId: ex.id,
      userExerciseId: null,
      provider: 'exercisedb',
      url: gifUrl,
      title: null,
      thumbnailUrl: null,
      visibility: 'public',
      status: 'approved',
      updatedAt: new Date(),
    },
  })
}

async function importFromNetwork(curated: boolean, pageLimit = 25) {
  const baseUrl = process.env.EXERCISEDB_BASE_URL || 'https://www.exercisedb.dev'
  const systemUserId = await getSystemUserId()
  let offset = 0
  let imported = 0
  // Loop until a page returns less than requested limit
  for (;;) {
    const page = await fetchPage(baseUrl, { offset, limit: pageLimit })
    if (!page.length) break
    for (const x of page) {
      const ex = await upsertExerciseFromV1(x, curated)
      await ensureGifMedia(ex, x.gifUrl, systemUserId)
      imported++
    }
    if (page.length < pageLimit) break
    offset += pageLimit
  }
  return imported
}

async function importFromFile(path: string, curated: boolean) {
  const fs = await import('fs/promises')
  const txt = await fs.readFile(path, 'utf-8')
  const arr = JSON.parse(txt) as V1Exercise[]
  const systemUserId = await getSystemUserId()
  let imported = 0
  for (const x of arr) {
    const ex = await upsertExerciseFromV1(x, curated)
    await ensureGifMedia(ex, x.gifUrl, systemUserId)
    imported++
  }
  return imported
}

async function main() {
  const args = process.argv.slice(2)
  const curated = args.includes('--curated')
  const fetchMode = args.includes('--fetch')
  const limitIdx = args.findIndex(a => a === '--limit')
  const pageLimit = limitIdx >= 0 ? Math.min(25, Math.max(1, Number(args[limitIdx + 1] || 25))) : 25

  let count = 0
  if (fetchMode) {
    console.log(`Importing from network (limit=${pageLimit}) ...`)
    count = await importFromNetwork(curated, pageLimit)
  } else {
    const file = args.find(a => !a.startsWith('--'))
    if (!file) {
      console.error('Provide a JSON file path or use --fetch')
      process.exit(1)
    }
    console.log(`Importing from file: ${file}`)
    count = await importFromFile(file, curated)
  }

  console.log(`Imported/updated ${count} exercises from ExerciseDB v1`)
}

// Node 18+ provides global fetch
declare const fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
declare const crypto: Crypto

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
