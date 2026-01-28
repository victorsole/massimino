import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { acceptWorkoutProposal } from '@/services/ai/massichat_service'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = params.id
  if (!id) return NextResponse.json({ error: 'Proposal ID required' }, { status: 400 })
  let overrides: any | undefined = undefined
  let sessionId: string | null = null
  let athleteId: string | null = null
  try {
    const body = await req.json()
    if (body && body.workoutData) overrides = body.workoutData
    if (body && body.overrides) overrides = body.overrides
    if (body && body.sessionId) sessionId = body.sessionId
    if (body && body.athleteId) athleteId = body.athleteId
  } catch {}
  await acceptWorkoutProposal(id, overrides, sessionId, athleteId)
  return NextResponse.json({ success: true, workoutLogId: 'ok', redirectUrl: `/workout-log` })
}
