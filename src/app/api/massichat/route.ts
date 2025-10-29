import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { prisma } from '@/core/database'
import { sendMassichatMessage } from '@/services/ai/massichat_service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { message, sessionId, includeAssessments, includeWorkoutHistory, athleteId } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Determine target user (for trainers planning for athletes)
    let targetUserId = session.user.id;
    if (athleteId && session.user.role === 'TRAINER') {
      // Verify trainer has access to this athlete
      const relationship = await (prisma as any).trainer_clients.findFirst({
        where: { trainerId: session.user.id, clientId: athleteId, status: 'ACTIVE' },
      });
      if (relationship) {
        targetUserId = athleteId;
      }
    }

    const res = await sendMassichatMessage({
      userId: targetUserId,
      sessionId,
      message,
      includeAssessments: includeAssessments ?? true,
      includeWorkoutHistory: includeWorkoutHistory ?? true,
    })
    return NextResponse.json(res)
  } catch (err: any) {
    const raw = err?.message || 'Internal server error'
    const redacted = redactSecrets(raw)
    console.error('Massichat POST error:', redacted)
    return NextResponse.json({ error: redacted }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const list = searchParams.get('list') === 'true'
    const sessionId = searchParams.get('sessionId')
    const db: any = prisma as any
    if (!db?.ai_chat_sessions) {
      return NextResponse.json({ error: 'Massichat tables not available. Run migrations.' }, { status: 500 })
    }

    if (list) {
      const sessions = await db.ai_chat_sessions.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: { ai_chat_messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      })
      return NextResponse.json({ sessions })
    }

    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    const sess = await db.ai_chat_sessions.findFirst({ where: { id: sessionId, userId: session.user.id } })
    if (!sess) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const messages = await db.ai_chat_messages.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } })
    return NextResponse.json({ session: sess, messages })
  } catch (err: any) {
    const raw = err?.message || 'Internal server error'
    const redacted = redactSecrets(raw)
    console.error('Massichat GET error:', redacted)
    return NextResponse.json({ error: redacted }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json().catch(() => ({})) as { sessionId?: string; title?: string }
    const sessionId = body.sessionId
    const title = (body.title || '').trim()
    const db: any = prisma as any
    if (!db?.ai_chat_sessions?.update) return NextResponse.json({ error: 'Massichat tables not available' }, { status: 500 })
    if (!sessionId || !title) return NextResponse.json({ error: 'sessionId and title are required' }, { status: 400 })
    const updated = await db.ai_chat_sessions.update({ where: { id: sessionId, userId: session.user.id }, data: { title } }).catch(() => null)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    const raw = err?.message || 'Internal server error'
    const redacted = redactSecrets(raw)
    console.error('Massichat PATCH error:', redacted)
    return NextResponse.json({ error: redacted }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const db: any = prisma as any
    if (!db?.ai_chat_sessions?.deleteMany) return NextResponse.json({ error: 'Massichat tables not available' }, { status: 500 })
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    const res = await db.ai_chat_sessions.deleteMany({ where: { id: sessionId, userId: session.user.id } })
    if (res.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    const raw = err?.message || 'Internal server error'
    const redacted = redactSecrets(raw)
    console.error('Massichat DELETE error:', redacted)
    return NextResponse.json({ error: redacted }, { status: 500 })
  }
}

function redactSecrets(msg: string): string {
  try {
    // Redact API keys like sk-... or sk-proj-...
    return msg.replace(/sk-[a-zA-Z0-9_\-]+/g, 'sk-***')
  } catch {
    return 'Internal server error'
  }
}
