import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { z } from 'zod'
import { 
  listUserExercisesDB,
  createUserExerciseDB
} from '@/core/database'

const listSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  muscle: z.string().optional(),
  equipment: z.string().optional(),
  visibility: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const parsed = listSchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  const items = await listUserExercisesDB(session.user.id, parsed.data)
  return NextResponse.json(items)
}

const createSchema = z.object({
  baseExerciseId: z.string().optional(),
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  muscleGroups: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  difficulty: z.string().optional(),
  safetyNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const created = await createUserExerciseDB(session.user.id, parsed.data)
  return NextResponse.json({ success: true, exercise: created })
}

