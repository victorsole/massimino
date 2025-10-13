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
  try {
    const body = await req.json()
    if (body && body.workoutData) overrides = body.workoutData
  } catch {}
  await acceptWorkoutProposal(id, overrides)
  return NextResponse.json({ success: true, workoutLogId: 'ok', redirectUrl: `/workout-log` })
}
