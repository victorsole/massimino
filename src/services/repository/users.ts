import { Prisma } from '@prisma/client'
import { prisma } from '@/core/database'

export type UserDTO = {
  id: string
  email: string
  name: string | null
  image: string | null
  role: string
  status: string
  reputationScore: number
  warningCount: number
  trainerVerified: boolean
  createdAt: Date
}

export type ListUsersParams = {
  search?: string
  page?: number
  pageSize?: number
  orderBy?: { field: 'createdAt' | 'email' | 'reputationScore'; direction: 'asc' | 'desc' }
}

export type ListUsersResult = {
  items: UserDTO[]
  total: number
  page: number
  pageSize: number
}

export interface UserRepository {
  listUsers(params?: ListUsersParams): Promise<ListUsersResult>
  getUserById(id: string): Promise<UserDTO | null>
  updateUser(id: string, data: Partial<Pick<UserDTO, 'name' | 'image' | 'role' | 'status' | 'reputationScore' | 'warningCount' | 'trainerVerified'>>): Promise<UserDTO>
  createUser(data: {
    email: string
    name?: string | null
    image?: string | null
    role?: string
    status?: string
    reputationScore?: number
    warningCount?: number
    trainerVerified?: boolean
    passwordHash?: string | null
  }): Promise<UserDTO>
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  role: true,
  status: true,
  reputationScore: true,
  warningCount: true,
  trainerVerified: true,
  createdAt: true,
} satisfies Prisma.UserSelect

class PrismaUserRepository implements UserRepository {
  async listUsers(params: ListUsersParams = {}): Promise<ListUsersResult> {
    const page = Math.max(params.page ?? 1, 1)
    const pageSize = Math.min(Math.max(params.pageSize ?? 20, 1), 100)

    const where: Prisma.UserWhereInput = params.search
      ? {
          OR: [
            { email: { contains: params.search, mode: 'insensitive' } },
            { name: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {}

    const orderBy: Prisma.UserOrderByWithRelationInput = (() => {
      const f = params.orderBy?.field ?? 'createdAt'
      const d = params.orderBy?.direction ?? 'desc'
      return { [f]: d } as Prisma.UserOrderByWithRelationInput
    })()

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: userSelect,
      }),
    ])

    return { items: items as unknown as UserDTO[], total, page, pageSize }
  }

  async getUserById(id: string): Promise<UserDTO | null> {
    const user = await prisma.user.findUnique({ where: { id }, select: userSelect })
    return (user as unknown as UserDTO) ?? null
  }

  async updateUser(
    id: string,
    data: Partial<Pick<UserDTO, 'name' | 'image' | 'role' | 'status' | 'reputationScore' | 'warningCount' | 'trainerVerified'>>
  ): Promise<UserDTO> {
    const mapped: any = { ...data }
    if (data.role !== undefined) mapped.role = data.role as any
    if (data.status !== undefined) mapped.status = data.status as any
    const updated = await prisma.user.update({ where: { id }, data: mapped, select: userSelect })
    return updated as unknown as UserDTO
  }

  async createUser(data: {
    email: string
    name?: string | null
    image?: string | null
    role?: string
    status?: string
    reputationScore?: number
    warningCount?: number
    trainerVerified?: boolean
    passwordHash?: string | null
  }): Promise<UserDTO> {
    const created = await prisma.user.create({
      data: {
        email: data.email,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.role !== undefined && { role: data.role as any }),
        ...(data.status !== undefined && { status: data.status as any }),
        ...(data.reputationScore !== undefined && { reputationScore: data.reputationScore }),
        ...(data.warningCount !== undefined && { warningCount: data.warningCount }),
        ...(data.trainerVerified !== undefined && { trainerVerified: data.trainerVerified }),
        ...(data.passwordHash !== undefined && { password: data.passwordHash }),
      },
      select: userSelect,
    })
    return created as unknown as UserDTO
  }
}

export function getUserRepository(): UserRepository {
  return new PrismaUserRepository()
}
