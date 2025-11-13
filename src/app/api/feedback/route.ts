import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { prisma } from '@/core/database'
import { z } from 'zod'

// Shared schema pieces
const baseSchema = z.object({
  type: z.enum(['BUG', 'FEATURE', 'GENERAL', 'NPS', 'AI']),
  title: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(5000).optional(),
  email: z.string().email().optional(),
  url: z.string().url().optional(),
  appVersion: z.string().max(50).optional(),
  platform: z.enum(['IOS', 'ANDROID', 'WEB']).optional(),
  userAgent: z.string().max(500).optional(),
  context: z.record(z.any()).optional(),
  labels: z.array(z.string()).max(10).optional(),
  severity: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
})

const aiSchema = baseSchema.extend({
  type: z.literal('AI'),
  related_type: z.literal('ai_chat_message'),
  related_id: z.string().min(1),
  ai_rating: z.enum(['UP', 'DOWN']),
  ai_tags: z.array(z.string()).max(10).optional(),
  message: z.string().max(2000).optional(), // optional comment
})

const npsSchema = baseSchema.extend({
  type: z.literal('NPS'),
  nps_score: z.number().int().min(0).max(10),
  message: z.string().max(2000).optional(),
})

const genericSchema = baseSchema.extend({
  type: z.enum(['BUG', 'FEATURE', 'GENERAL']),
  message: z.string().min(1).max(5000).optional(),
})

type CreatePayload = z.infer<typeof aiSchema> | z.infer<typeof npsSchema> | z.infer<typeof genericSchema>

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const raw = await request.json().catch(() => ({}))

    // Parse based on type
    const t = String(raw?.type || '')
    let body: CreatePayload
    if (t === 'AI') body = aiSchema.parse(raw)
    else if (t === 'NPS') body = npsSchema.parse(raw)
    else body = genericSchema.parse(raw)

    // Minimal table availability guard
    const db: any = prisma as any
    if (!db?.feedback_entries?.create) {
      return NextResponse.json(
        { error: 'Feedback tables not available. Run migrations.' },
        { status: 500 }
      )
    }

    const created = await db.feedback_entries.create({
      data: {
        userId: session?.user?.id || null,
        email: body.email ?? null,
        type: body.type,
        status: 'OPEN',
        severity: body.severity ?? null,
        title: body.title ?? null,
        message: body.message || body.title || (body.type === 'NPS' ? `NPS score: ${'nps_score' in body ? body.nps_score : ''}` : '(No message provided)'),
        url: body.url ?? null,
        appVersion: body.appVersion ?? null,
        platform: body.platform ?? null,
        userAgent: body.userAgent ?? null,
        context: body.context ?? null,
        labels: body.labels ?? [],
        assignedTo: null,
        related_type: (body as any).related_type ?? null,
        related_id: (body as any).related_id ?? null,
        ai_rating: (body as any).ai_rating ?? null,
        ai_tags: (body as any).ai_tags ?? [],
        nps_score: (body as any).nps_score ?? null,
      },
      select: { id: true },
    })

    return NextResponse.json({ success: true, id: created.id })
  } catch (error: any) {
    const msg = error?.issues?.[0]?.message || error?.message || 'Failed to submit feedback'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

// Admin list & updates are handled via server components/actions in /admin/feedback
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PATCH() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

