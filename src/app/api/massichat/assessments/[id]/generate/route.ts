import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { prisma } from '@/core/database'
import { sendMassichatMessage } from '@/services/ai/massichat_service'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const id = params.id
    if (!id) return NextResponse.json({ error: 'assessment id required' }, { status: 400 })

    const assessment = await prisma.assessments.findUnique({ where: { id } })
    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    if (assessment.status !== 'complete') return NextResponse.json({ error: 'Assessment is not complete' }, { status: 400 })

    // Authorization: trainers can generate for their assessments; admins can generate for any; clients cannot here
    const role = session.user.role as string
    if (role !== 'TRAINER' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (role === 'TRAINER' && assessment.trainerId !== session.user.id) {
      return NextResponse.json({ error: 'Not your assessment' }, { status: 403 })
    }

    // Generate a workout for the client from this assessment
    const res = await sendMassichatMessage({
      userId: assessment.clientId,
      message: 'Generate a safe, personalized workout session from the referenced assessment.',
      assessmentId: assessment.id,
      includeAssessments: true,
      includeWorkoutHistory: true,
    })
    return NextResponse.json({ success: true, ...res })
  } catch (err: any) {
    console.error('Massichat assessment generate error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

