import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { z } from 'zod'
import { attachMediaToEntryDB, detachMediaFromEntryDB } from '@/core/database'

const attachSchema = z.object({ mediaId: z.string() })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const parsed = attachSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const ok = await attachMediaToEntryDB(params.id, parsed.data.mediaId, session.user.id)
  if (!ok) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const mediaId = searchParams.get('mediaId')
  if (!mediaId) return NextResponse.json({ error: 'mediaId required' }, { status: 400 })
  const ok = await detachMediaFromEntryDB(params.id, mediaId, session.user.id)
  if (!ok) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
  return NextResponse.json({ success: true })
}
