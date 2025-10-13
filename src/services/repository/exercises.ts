// src/services/repository/exercises.ts
import { prisma } from '@/core/database'

export type ExerciseDTO = {
  id: string
  name: string
  category: string
  muscleGroups: string[]
  equipment: string[]
  instructions?: string | null
  videoUrl?: string | null
  imageUrl?: string | null
  difficulty: string
  safetyNotes?: string | null
  isActive: boolean
  usageCount: number
  lastUsed?: Date | null
  createdAt: Date
  updatedAt: Date
}

export type ListExercisesParams = {
  search?: string
  category?: string
  difficulty?: string
  muscle?: string
  equipment?: string
  isActive?: boolean
  page?: number
  pageSize?: number
  orderBy?: { field: 'name' | 'category' | 'difficulty' | 'usageCount' | 'updatedAt'; direction: 'asc' | 'desc' }
}

export type ListExercisesResult = {
  items: ExerciseDTO[]
  total: number
  page: number
  pageSize: number
}

export interface ExerciseRepository {
  list(params?: ListExercisesParams): Promise<ListExercisesResult>
  create(data: Omit<ExerciseDTO, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed' | 'isActive' > & { isActive?: boolean }): Promise<ExerciseDTO>
  update(id: string, data: Partial<Omit<ExerciseDTO, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ExerciseDTO>
  softDelete(id: string): Promise<void>
  bulkUpdate(ids: string[], data: Partial<Omit<ExerciseDTO, 'id' | 'createdAt' | 'updatedAt'>>): Promise<number>
  bulkSoftDelete(ids: string[]): Promise<number>
}

class PrismaExerciseRepository implements ExerciseRepository {
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 64)
  }
  async list(params: ListExercisesParams = {}): Promise<ListExercisesResult> {
    const page = Math.max(params.page ?? 1, 1)
    const pageSize = Math.min(Math.max(params.pageSize ?? 20, 1), 100)
    const where: any = {}
    if (params.search) where.name = { contains: params.search, mode: 'insensitive' }
    if (params.category) where.category = params.category
    if (params.difficulty) where.difficulty = params.difficulty
    if (params.muscle) where.muscleGroups = { has: params.muscle }
    if (params.equipment) where.equipment = { has: params.equipment }
    if (params.isActive !== undefined) where.isActive = params.isActive

    const orderBy = params.orderBy ? [{ [params.orderBy.field]: params.orderBy.direction }] as any : [{ isActive: 'desc' }, { name: 'asc' }]
    const [total, items] = await Promise.all([
      prisma.exercises.count({ where }),
      prisma.exercises.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
    return { items: items as ExerciseDTO[], total, page, pageSize }
  }

  async create(data: any): Promise<ExerciseDTO> {
    const exerciseData = {
      id: crypto.randomUUID(),
      name: data.name,
      slug: data.slug ?? this.slugify(data.name),
      category: data.category,
      muscleGroups: data.muscleGroups ?? [],
      equipment: data.equipment ?? [],
      instructions: data.instructions ?? null,
      videoUrl: data.videoUrl ?? null,
      imageUrl: data.imageUrl ?? null,
      difficulty: data.difficulty ?? 'BEGINNER',
      safetyNotes: data.safetyNotes ?? null,
      isActive: data.isActive ?? true,
      updatedAt: new Date(),
    }

    const created = await prisma.exercises.create({
      data: exerciseData,
    })
    return created as ExerciseDTO
  }

  async update(id: string, data: any): Promise<ExerciseDTO> {
    const updated = await prisma.exercises.update({
      where: { id },
      data,
    })
    // If name changed and slug not provided, backfill slug
    if (data.name && !data.slug) {
      try {
        const slug = this.slugify(data.name)
        await prisma.exercises.update({ where: { id }, data: { slug } })
        ;(updated as any).slug = slug
      } catch {}
    }
    return updated as ExerciseDTO
  }

  async softDelete(id: string): Promise<void> {
    await prisma.exercises.update({ where: { id }, data: { isActive: false } })
  }

  async bulkUpdate(ids: string[], data: any): Promise<number> {
    const res = await prisma.exercises.updateMany({ where: { id: { in: ids } }, data })
    return res.count
  }

  async bulkSoftDelete(ids: string[]): Promise<number> {
    const res = await prisma.exercises.updateMany({ where: { id: { in: ids } }, data: { isActive: false } })
    return res.count
  }
}

export function getExerciseRepository(): ExerciseRepository {
  return new PrismaExerciseRepository()
}
