/**
 * Exercise de-duplication and pruning script
 *
 * Goals:
 *  - Merge duplicates across sources into a single canonical per cluster
 *  - Prefer curated entries, then ExerciseDB entries with media, then highest usage
 *  - Add duplicate names into aliasNames of canonical
 *  - Soft-deactivate duplicates (isActive=false, curated=false)
 *  - Optionally prune canonicals to a target max (e.g., 3000) by soft-deactivating the tail
 *
 * Usage:
 *  npx ts-node scripts/dedupe-exercises.ts --dry
 *  npx ts-node scripts/dedupe-exercises.ts --apply --target 3000
 */

import { prisma } from '../src/core/database/client'

type Ex = awaited<ReturnType<typeof prisma.exercises.findMany>>[number]

function normalizeName(name: string): string {
  let s = name.toLowerCase()
  s = s.replace(/\([^)]*\)/g, ' ') // remove parentheticals
    .replace(/\[[^\]]*\]/g, ' ') // remove brackets
    .replace(/[^a-z0-9\s]/g, ' ') // non-alphanum to space
    .replace(/\b(bodyweight|with band|barbell|dumbbell|kettlebell|machine|cable|smith|trx|band)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return s
}

function scoreExercise(e: Ex, mediaUrlsById: Map<string, string | undefined>): number {
  let score = 0
  if (e.curated) score += 1000
  if (e.source === 'EXERCISEDB_V1') score += 500
  if (mediaUrlsById.get(e.id)) score += 300
  score += Math.min(200, e.usageCount || 0)
  if (e.imageUrl) score += 50
  if (e.videoUrl) score += 25
  return score
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const targetIdx = args.findIndex(a => a === '--target')
  const target = targetIdx >= 0 ? Math.max(1, Number(args[targetIdx + 1])) : undefined

  console.log('Loading exercises...')
  const [all, media] = await Promise.all([
    prisma.exercises.findMany({ where: {}, orderBy: { name: 'asc' } }),
    prisma.exercise_media.findMany({ where: { visibility: 'public' } }),
  ])

  const mediaByExercise = new Map<string, string | undefined>()
  for (const m of media) {
    if (!m.globalExerciseId) continue
    const prev = mediaByExercise.get(m.globalExerciseId)
    if (!prev || m.provider === 'exercisedb') mediaByExercise.set(m.globalExerciseId, m.url)
  }

  // Cluster by normalized name + primary bodyPart (to avoid merging very different movements)
  const clusters = new Map<string, Ex[]>()
  for (const e of all) {
    const key = `${normalizeName(e.name)}|${(e.bodyPart || '').toLowerCase()}`
    const arr = clusters.get(key) || []
    arr.push(e)
    clusters.set(key, arr)
  }

  const mergePlans: { canonical: Ex; dups: Ex[] }[] = []

  for (const [, group] of clusters) {
    if (group.length <= 1) continue
    // choose canonical by score
    const sorted = [...group].sort((a, b) => scoreExercise(b, mediaByExercise) - scoreExercise(a, mediaByExercise))
    const canonical = sorted[0]
    const dups = sorted.slice(1).filter(d => d.id !== canonical.id)
    if (dups.length) mergePlans.push({ canonical, dups })
  }

  console.log(`Identified ${mergePlans.length} duplicate clusters.`)
  if (!apply) {
    let totalDups = 0
    for (const p of mergePlans) totalDups += p.dups.length
    console.log(`Dry run. Would deactivate ${totalDups} duplicates.`)
  } else {
    console.log('Applying merges...')
  for (const plan of mergePlans) {
      const aliasSet = new Set<string>(plan.canonical.aliasNames || [])
      plan.dups.forEach(d => aliasSet.add(d.name))
      await prisma.exercises.update({ where: { id: plan.canonical.id }, data: { aliasNames: Array.from(aliasSet) } })
      // Reassign media from duplicates to canonical to preserve covers
      const dupIds = plan.dups.map(d => d.id)
      await prisma.exercise_media.updateMany({
        where: { globalExerciseId: { in: dupIds } },
        data: { globalExerciseId: plan.canonical.id }
      })
      await prisma.exercises.updateMany({ where: { id: { in: plan.dups.map(d => d.id) } }, data: { isActive: false, curated: false } })
    }
  }

  if (target) {
    // Compute count of active exercises after merges
    const active = await prisma.exercises.findMany({ where: { isActive: true } })
    if (active.length > target) {
      const sorted = active
        .map(e => ({ e, s: scoreExercise(e as any, mediaByExercise) }))
        .sort((a, b) => b.s - a.s)
      const keep = new Set(sorted.slice(0, target).map(x => x.e.id))
      const pruneIds = sorted.slice(target).map(x => x.e.id)
      if (!apply) {
        console.log(`Dry run. Would prune ${pruneIds.length} exercises to meet target ${target}.`)
      } else {
        console.log(`Pruning ${pruneIds.length} exercises to target ${target}...`)
        await prisma.exercises.updateMany({ where: { id: { in: pruneIds } }, data: { isActive: false, curated: false } })
      }
    } else {
      console.log(`Active exercises (${active.length}) <= target (${target}); no pruning necessary.`)
    }
  }

  console.log('Done.')
}

declare global { type awaited<T> = T extends Promise<infer U> ? U : T }

main().catch((e) => { console.error(e); process.exit(1) })
