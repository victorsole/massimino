import { prisma } from '@/core/database'
import { randomUUID } from 'crypto'

export type AccreditedProviderDTO = {
  id: string
  name: string
  country: string
  qualifications: string[]
  profilePath?: string | null
  profileUrl?: string | null
  slug?: string | null
  source: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type ListAccreditedParams = {
  // With exactOptionalPropertyTypes enabled, include undefined for callers
  search?: string | undefined
  country?: string | undefined
  qualification?: string | undefined
  isActive?: boolean | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

export type ListAccreditedResult = {
  items: AccreditedProviderDTO[]
  total: number
  page: number
  pageSize: number
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80)
}

export interface AccreditedRepository {
  list(params?: ListAccreditedParams): Promise<ListAccreditedResult>
  create(data: Omit<AccreditedProviderDTO, 'id'|'createdAt'|'updatedAt'|'source'|'isActive'> & { source?: string; isActive?: boolean }): Promise<AccreditedProviderDTO>
  update(id: string, data: Partial<AccreditedProviderDTO>): Promise<AccreditedProviderDTO>
  softDelete(id: string): Promise<void>
  upsertByNameCountry(data: Omit<AccreditedProviderDTO, 'id'|'createdAt'|'updatedAt'>): Promise<AccreditedProviderDTO>
}

class PrismaAccreditedRepository implements AccreditedRepository {
  async list(params: ListAccreditedParams = {}): Promise<ListAccreditedResult> {
    const ap = (prisma as any).accredited_providers
    if (!ap) {
      throw new Error('Prisma model accredited_providers not found. Run `npx prisma db push` and `npx prisma generate`, then restart the server.')
    }
    const page = Math.max(params.page ?? 1, 1)
    const pageSize = Math.min(Math.max(params.pageSize ?? 20, 1), 100)
    const where: any = {}
    if (params.search) where.name = { contains: params.search, mode: 'insensitive' }
    if (params.country) where.country = params.country
    if (params.qualification) where.qualifications = { has: params.qualification }
    if (params.isActive !== undefined) where.isActive = params.isActive

    const [total, items] = await Promise.all([
      ap.count({ where }),
      ap.findMany({ where, orderBy: [{ isActive: 'desc' }, { name: 'asc' }], skip: (page-1)*pageSize, take: pageSize })
    ])
    return { items: items as any, total, page, pageSize }
  }

  async create(data: any): Promise<AccreditedProviderDTO> {
    const ap = (prisma as any).accredited_providers
    if (!ap) {
      throw new Error('Prisma model accredited_providers not found. Run `npx prisma db push` and `npx prisma generate`, then restart the server.')
    }
    const created = await ap.create({
      data: {
        id: randomUUID(),
        name: data.name,
        country: data.country,
        qualifications: data.qualifications ?? [],
        profilePath: data.profilePath ?? null,
        profileUrl: data.profileUrl ?? null,
        slug: data.slug ?? slugify(`${data.name}-${data.country}`),
        source: data.source ?? 'EREPS',
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      }
    })
    return created as any
  }

  async update(id: string, data: any): Promise<AccreditedProviderDTO> {
    const ap = (prisma as any).accredited_providers
    if (!ap) {
      throw new Error('Prisma model accredited_providers not found. Run `npx prisma db push` and `npx prisma generate`, then restart the server.')
    }
    const updated = await ap.update({ where: { id }, data })
    return updated as any
  }

  async softDelete(id: string): Promise<void> {
    const ap = (prisma as any).accredited_providers
    if (!ap) {
      throw new Error('Prisma model accredited_providers not found. Run `npx prisma db push` and `npx prisma generate`, then restart the server.')
    }
    await ap.update({ where: { id }, data: { isActive: false } })
  }

  async upsertByNameCountry(data: any): Promise<AccreditedProviderDTO> {
    const ap = (prisma as any).accredited_providers
    if (!ap) {
      throw new Error('Prisma model accredited_providers not found. Run `npx prisma db push` and `npx prisma generate`, then restart the server.')
    }
    const up = await ap.upsert({
      where: { name_country: { name: data.name, country: data.country } as any },
      create: {
        id: randomUUID(),
        name: data.name,
        country: data.country,
        qualifications: data.qualifications ?? [],
        profilePath: data.profilePath ?? null,
        profileUrl: data.profileUrl ?? null,
        slug: data.slug ?? slugify(`${data.name}-${data.country}`),
        source: data.source ?? 'EREPS',
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      },
      update: {
        qualifications: data.qualifications ?? [],
        profilePath: data.profilePath ?? null,
        profileUrl: data.profileUrl ?? null,
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      }
    } as any)
    return up as any
  }
}

export function getAccreditedRepository(): AccreditedRepository {
  return new PrismaAccreditedRepository()
}
