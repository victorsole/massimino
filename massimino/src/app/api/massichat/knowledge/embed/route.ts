import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { embedDocument } from '@/services/ai/vector_search'
import { prisma } from '@/core/database'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { documents?: Array<{ name: string; content: string; metadata?: any }> }
  if (!Array.isArray(body.documents) || body.documents.length === 0) {
    return NextResponse.json({ success: false, error: 'No documents provided' }, { status: 400 })
  }

  for (const doc of body.documents) {
    if (!doc?.name || !doc?.content) continue
    const embedding = await embedDocument(doc.content)
    await prisma.fitness_knowledge_base.create({
      data: {
        documentName: doc.name,
        content: doc.content,
        embedding,
        metadata: doc.metadata ?? {},
      },
    })
  }

  return NextResponse.json({ success: true })
}

