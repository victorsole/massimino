// scripts/backfill-exercise-taxonomy.ts
/**
 * Non-destructive backfill for new exercise taxonomy fields.
 * - Populates bodyPart, movementPattern, type, tags
 * - Optionally sets curated=true (opt-in via CLI flag)
 * - Never overwrites non-null fields
 *
 * Usage:
 *   npx ts-node scripts/backfill-exercise-taxonomy.ts --curated --dry-run
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Args = { curated: boolean; dryRun: boolean; limit?: number }

function parseArgs(): Args {
  const flags = new Set(process.argv.slice(2))
  const curated = flags.has('--curated')
  const dryRun = flags.has('--dry-run') || flags.has('--dryrun')
  const limitIdx = process.argv.findIndex(a => a === '--limit')
  const limit = limitIdx > -1 ? parseInt(process.argv[limitIdx + 1] || '0', 10) || undefined : undefined
  return { curated, dryRun, limit }
}

function inferBodyPart(name: string, muscles: string[]): string | null {
  const lower = name.toLowerCase()
  const set = new Set(muscles.map(m => m.toLowerCase()))
  if (set.has('chest') || /bench|push-up|push up|pec|chest/.test(lower)) return 'Chest'
  if (set.has('back') || /row|lat|pull-up|pull up|deadlift/.test(lower)) return 'Back'
  if (set.has('shoulders') || /overhead|press|shoulder|lateral raise|rear delt/.test(lower)) return 'Shoulders'
  if (set.has('arms') || set.has('biceps') || set.has('triceps') || /curl|extension|tricep|bicep/.test(lower)) return 'Arms'
  if (set.has('legs') || set.has('quadriceps') || set.has('hamstrings') || /squat|lunge|leg|quad|hamstring/.test(lower)) return 'Legs'
  if (set.has('glutes') || /glute|hip thrust|bridge/.test(lower)) return 'Glutes'
  if (set.has('core') || set.has('abdominals') || /plank|crunch|sit-up|dead bug|hollow/.test(lower)) return 'Core'
  return null
}

function inferMovementPattern(name: string): string | null {
  const n = name.toLowerCase()
  if (/squat/.test(n)) return 'Squat'
  if (/deadlift|hinge|rdl|good morning/.test(n)) return 'Hinge'
  if (/lunge|split squat|step-up|step up/.test(n)) return 'Lunge'
  if (/bench|push-up|push up|overhead press|shoulder press|press/.test(n)) return 'Push'
  if (/row|pull-up|pull up|pulldown|chin-up|chin up/.test(n)) return 'Pull'
  if (/rotation|twist|woodchop/.test(n)) return 'Rotation'
  if (/anti-rotation|pallof/.test(n)) return 'Anti-Rotation'
  if (/carry|farmer/.test(n)) return 'Carry'
  if (/walk|run|sprint|jog/.test(n)) return 'Gait'
  return null
}

function inferType(category: string, name: string): string {
  const c = (category || '').toLowerCase()
  const n = name.toLowerCase()
  if (/cardio|conditioning/.test(c) || /run|sprint|jog|jump rope|burpee/.test(n)) return 'Cardio'
  if (/mobility|flexibility|yoga|stretch/.test(c) || /stretch|mobility/.test(n)) return 'Mobility'
  if (/balance|stability/.test(c)) return 'Balance'
  return 'Resistance'
}

function inferTags(equipment: string[], name: string): string[] {
  const tags = new Set<string>()
  const eqLower = equipment.map(e => e.toLowerCase())
  const n = name.toLowerCase()
  if (eqLower.length === 0 || (eqLower.length === 1 && (eqLower[0] === 'bodyweight' || eqLower[0] === 'none'))) {
    tags.add('no-equipment')
    tags.add('at-home')
  }
  if (eqLower.includes('dumbbell')) tags.add('dumbbell')
  if (eqLower.includes('barbell')) tags.add('barbell')
  if (eqLower.includes('kettlebell')) tags.add('kettlebell')
  if (/beginner|easy/.test(n)) tags.add('beginner-friendly')
  return Array.from(tags)
}

async function main() {
  const { curated, dryRun, limit } = parseArgs()
  console.log('Backfill taxonomy starting...', { curatedDefault: curated, dryRun, limit })
  const where: any = { isActive: true }
  const items = await prisma.exercises.findMany({ where, orderBy: { name: 'asc' }, take: limit })
  let updated = 0
  for (const ex of items) {
    const next: any = {}
    if (!ex.bodyPart) next.bodyPart = inferBodyPart(ex.name, ex.muscleGroups) || null
    if (!ex.movementPattern) next.movementPattern = inferMovementPattern(ex.name)
    if (!ex.type) next.type = inferType(ex.category, ex.name)
    if (!ex.tags || ex.tags.length === 0) next.tags = inferTags(ex.equipment, ex.name)
    if (curated && ex.isCustom === false && ex.isActive && ex.usageCount >= 0 && ex.curated === false) next.curated = true

    // Skip if nothing to update
    if (Object.keys(next).length === 0) continue
    updated++
    if (dryRun) {
      console.log(`[DRY] ${ex.name} ->`, next)
      continue
    }
    await prisma.exercises.update({ where: { id: ex.id }, data: next })
    if (updated % 100 === 0) console.log(`Updated ${updated}/${items.length}`)
  }
  console.log(`Done. Updated ${updated} of ${items.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})

