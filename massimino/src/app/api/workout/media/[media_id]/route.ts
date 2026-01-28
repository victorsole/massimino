import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { z } from 'zod'
import { updateExerciseMediaDB, deleteExerciseMediaDB } from '@/core/database'

const updateSchema = z.object({
  title: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  visibility: z.string().optional(),
  status: z.string().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { media_id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const isAdmin = ((session.user as any)?.role) === 'ADMIN'
  // Prevent non-admins from changing moderation status
  const data: any = { ...parsed.data }
  if (!isAdmin && 'status' in data) delete data.status
  const updated = await updateExerciseMediaDB(params.media_id, data, session.user.id)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, media: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: { media_id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ok = await deleteExerciseMediaDB(params.media_id, session.user.id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
