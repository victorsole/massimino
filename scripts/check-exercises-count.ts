import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const total = await prisma.exercises.count()
  const active = await prisma.exercises.count({ where: { isActive: true } })
  const curated = await prisma.exercises.count({ where: { curated: true, isActive: true } })
  const withMedia = await prisma.exercises.count({
    where: {
      isActive: true,
      exercise_media: {
        some: {
          status: 'approved',
          visibility: 'public'
        }
      }
    }
  })
  const sample = await prisma.exercises.findMany({ where: { curated: true, isActive: true }, take: 5, orderBy: { name: 'asc' } })
  console.log({
    total,
    active,
    curated,
    withMedia,
    withoutMedia: active - withMedia,
    sample: sample.map(s => ({
      id: s.id,
      name: s.name,
      bodyPart: s.bodyPart,
      movementPattern: s.movementPattern,
      type: s.type
    }))
  })
}

main().finally(() => prisma.$disconnect())

