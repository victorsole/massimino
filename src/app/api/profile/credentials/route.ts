// src/api/profile/credentials/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { prisma } from '@/core/database'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ credentials: [] })
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { trainerCredentials: true } })
    let credentials: any[] = []
    try { if (user?.trainerCredentials) credentials = JSON.parse(user.trainerCredentials); if (!Array.isArray(credentials)) credentials = [] } catch {}
    return NextResponse.json({ credentials })
  } catch (e) {
    return NextResponse.json({ credentials: [] })
  }
}

