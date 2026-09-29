// src/app/[username]/page.tsx
// Short profile links: massimino.fitness/{username} -> /bio/{username}.
// Real routes (e.g. /offline, /exercises) always take precedence over this
// dynamic segment, and anything that is not an existing username is a 404.

import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/core/database/client'

export const dynamic = 'force-dynamic'

const USERNAME_PATTERN = /^[a-z0-9._-]{2,40}$/i

async function findUsername(candidate: string): Promise<string | null> {
  try {
    const user = await prisma.users.findFirst({
      where: {
        massiminoUsername: { equals: candidate, mode: 'insensitive' },
        status: { not: 'BANNED' },
      },
      select: { massiminoUsername: true },
    })
    return user?.massiminoUsername ?? null
  } catch {
    return null
  }
}

export default async function UsernameShortcut({ params }: { params: { username: string } }) {
  const candidate = decodeURIComponent(params.username)
  if (!USERNAME_PATTERN.test(candidate)) notFound()

  const username = await findUsername(candidate)
  if (!username) notFound()

  redirect(`/bio/${encodeURIComponent(username)}`)
}
