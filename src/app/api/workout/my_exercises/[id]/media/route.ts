import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { z } from 'zod'
import { listExerciseMediaDB, addExerciseMediaDB } from '@/core/database'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const media = await listExerciseMediaDB({ userExerciseId: params.id })
  return NextResponse.json(media)
}

const createSchema = z.object({
  provider: z.string(),
  url: z.string().url(),
  title: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  visibility: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const created = await addExerciseMediaDB(session.user.id, { userExerciseId: params.id }, parsed.data)
  return NextResponse.json({ success: true, media: created })
}

