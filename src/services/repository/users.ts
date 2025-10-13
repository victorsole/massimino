import { Prisma } from '@prisma/client'
import { prisma } from '@/core/database'

export type UserDTO = {
  id: string
  email: string
  name: string | null
  surname: string | null
  nickname: string | null
  image: string | null
  role: string
  status: string
  reputationScore: number
  warningCount: number
  trainerVerified: boolean
  massiminoUsername: string | null
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
  surname: true,
  nickname: true,
  image: true,
  role: true,
  status: true,
  reputationScore: true,
  warningCount: true,
  trainerVerified: true,
  massiminoUsername: true,
  createdAt: true,
} satisfies Prisma.usersSelect

class PrismaUserRepository implements UserRepository {
  async listUsers(params: ListUsersParams = {}): Promise<ListUsersResult> {
    const page = Math.max(params.page ?? 1, 1)
    const pageSize = Math.min(Math.max(params.pageSize ?? 20, 1), 100)

    const where: Prisma.usersWhereInput = params.search
      ? {
          OR: [
            { email: { contains: params.search, mode: 'insensitive' } },
            { name: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {}

    const orderBy: Prisma.usersOrderByWithRelationInput = (() => {
      const f = params.orderBy?.field ?? 'createdAt'
      const d = params.orderBy?.direction ?? 'desc'
      return { [f]: d } as Prisma.usersOrderByWithRelationInput
    })()

    const [total, items] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
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
    const user = await prisma.users.findUnique({ where: { id }, select: userSelect })
    return (user as unknown as UserDTO) ?? null
  }

  async updateUser(
    id: string,
    data: Partial<Pick<UserDTO, 'name' | 'image' | 'role' | 'status' | 'reputationScore' | 'warningCount' | 'trainerVerified'>>
  ): Promise<UserDTO> {
    const mapped: any = { ...data }
    if (data.role !== undefined) mapped.role = data.role as any
    if (data.status !== undefined) mapped.status = data.status as any
    const updated = await prisma.users.update({ where: { id }, data: mapped, select: userSelect })
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
    const userData: any = {
      id: crypto.randomUUID(),
      email: data.email,
      updatedAt: new Date(),
    }

    if (data.name !== undefined) userData.name = data.name
    if (data.image !== undefined) userData.image = data.image
    if (data.role !== undefined) userData.role = data.role
    if (data.status !== undefined) userData.status = data.status
    if (data.reputationScore !== undefined) userData.reputationScore = data.reputationScore
    if (data.warningCount !== undefined) userData.warningCount = data.warningCount
    if (data.trainerVerified !== undefined) userData.trainerVerified = data.trainerVerified
    if (data.passwordHash !== undefined) userData.password = data.passwordHash

    const created = await prisma.users.create({
      data: userData,
      select: userSelect,
    })
    return created as unknown as UserDTO
  }
}

export function getUserRepository(): UserRepository {
  return new PrismaUserRepository()
}
