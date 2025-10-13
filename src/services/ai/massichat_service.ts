import OpenAI from 'openai'
import { prisma } from '@/core/database'
import { buildUserContext } from './context_builder'
import { searchKnowledgeBase } from './vector_search'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
  // Optional: allow pinning a specific OpenAI project if provided
  project: process.env.OPENAI_PROJECT,
})

function provider(): 'openai' | 'anthropic' {
  const p = (process.env.AI_PROVIDER || 'openai').toLowerCase()
  return p === 'anthropic' ? 'anthropic' : 'openai'
}

export interface MassichatRequest {
  userId: string
  sessionId?: string
  message: string
  includeAssessments?: boolean
  includeWorkoutHistory?: boolean
  assessmentId?: string
  assessmentIds?: string[]
}

export interface MassichatResponse {
  sessionId: string
  message: string
  workoutProposal?: { id: string; summary?: string; workoutData: any }
  requiresAcceptance: boolean
  suggestions?: string[]
}

export async function sendMassichatMessage(req: MassichatRequest): Promise<MassichatResponse> {
  const prov = provider()
  if (prov === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured. Set it in your environment to use Massichat.')
    }
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured. Set it in your environment or set AI_PROVIDER=openai.')
    }
  }
  const db: any = prisma as any
  if (!db?.ai_chat_sessions?.create || !db?.ai_chat_messages?.create) {
    throw new Error('Massichat tables not available. Run: npm run db:generate && npm run db:migrate')
  }
  // 1) ensure session
  let sessionId = req.sessionId
  let session
  if (sessionId) {
    session = await db.ai_chat_sessions.findUnique({ where: { id: sessionId } })
  }
  if (!session) {
    session = await db.ai_chat_sessions.create({
      data: {
        userId: req.userId,
        title: null,
        status: 'active',
      },
    })
    sessionId = session.id
  }

  // 2) build context
  const focus = req.assessmentId ? [req.assessmentId] : req.assessmentIds
  const context = await buildUserContext(req.userId, ...(focus ? [{ focusAssessmentIds: focus }] as const : []))

  // 3) persist user message
  await db.ai_chat_messages.create({
    data: {
      sessionId,
      role: 'user',
      content: req.message,
      metadata: null,
      aiProvider: null,
    },
  })

  // 4) build prompt
const system = `You are Massichat, a specialized AI fitness coach for the Massimino app.
Always prioritize safety and progressive overload principles. Use concise, helpful answers.

Clarifications policy:
- Ask at most ONE very short clarifying question ONLY if absolutely necessary for safety.
- Even if you ask a question, you MUST still provide an initial recommendation or workout using safe, reasonable assumptions. Never reply with a question alone.
- If assumptions are used, state them briefly in one line ("Assuming: ...").

When proposing a workout:
1) First write a brief 1-2 sentence rationale (and assumptions if any).
2) Then on a new line write exactly: WORKOUT_PROPOSAL_JSON
3) Immediately after, include a fenced JSON block with fields:
   { title, description, items:[{ exerciseName, sets, reps, restSeconds, notes? }] }
4) After the JSON block, include one single line:
   FOLLOW_UP_SUGGESTIONS: ["<short suggestion 1>", "<short suggestion 2>", "<short suggestion 3>"]
   Keep each suggestion under 10 words.
5) No other prose after the suggestions line.`;

  const userContext = `User Profile:\n${context.userProfile}\n\nAssessments:\n${context.assessmentSummary}\n\nHistory:\n${context.workoutHistory}`

  // 3.b) Knowledge snippets (top-3)
  let kbContext = ''
  try {
    const hits = await searchKnowledgeBase(req.message, 3)
    if (hits.length) {
      kbContext = '\n\nKnowledge Base Snippets (for reference):\n' + hits.map(h => `- (${h.similarity.toFixed(2)}) ${h.content.slice(0, 300)}...`).join('\n')
    }
  } catch {}

  // 5) call OpenAI
  let aiText = 'I could not generate a response.'
  let modelUsed = ''
  if (prov === 'openai') {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'system', content: userContext + kbContext },
        { role: 'user', content: req.message },
      ],
      temperature: 0.4,
      max_tokens: 800,
    })
    aiText = completion.choices[0]?.message?.content || aiText
    modelUsed = 'gpt-4o-mini'
  } else {
    // Anthropic (Claude) via HTTP to avoid SDK dependency
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY as string,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        temperature: 0.4,
        system,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: `${userContext}${kbContext}\n\n${req.message}` },
            ],
          },
        ],
      }),
    })
    if (!resp.ok) {
      const err = await resp.text().catch(() => '')
      throw new Error(`Anthropic error: ${resp.status} ${err}`)
    }
    const data: any = await resp.json()
    const parts = Array.isArray(data?.content) ? data.content : []
    aiText = parts.map((p: any) => p?.text).filter(Boolean).join('\n').trim() || aiText
    modelUsed = data?.model || 'claude'
  }
  const suggestions = extractFollowUps(aiText)

  // 6) detect workout proposal JSON
  const parsed = tryParseWorkoutProposal(aiText)
  let workoutProposal: { id: string; summary?: string; workoutData: any } | undefined

  if (parsed) {
    if (!db?.ai_workout_proposals?.create) {
      // If proposals table is missing, still return the text without requiring acceptance
      workoutProposal = undefined
    } else {
      const proposal = await db.ai_workout_proposals.create({
        data: {
          sessionId,
          userId: req.userId,
          status: 'pending',
          workoutData: parsed,
          aiReasoning: extractReasoning(aiText),
        },
      })
      workoutProposal = { id: proposal.id, summary: parsed.title || 'Proposed workout', workoutData: parsed }
    }
  }
  // Fallback: if the assistant did not include a JSON proposal, make a second, strict JSON-only attempt
  if (!workoutProposal) {
    try {
      const jsonOnly = await requestWorkoutJson({
        provider: prov,
        modelUsed,
        system,
        userContext: userContext + kbContext,
        userMessage: req.message,
      })
      if (jsonOnly) {
        const proposal = await (prisma as any).ai_workout_proposals.create({
          data: {
            sessionId,
            userId: req.userId,
            status: 'pending',
            workoutData: jsonOnly,
            aiReasoning: extractReasoning(aiText),
          },
        })
        workoutProposal = { id: proposal.id, summary: jsonOnly.title || 'Proposed workout', workoutData: jsonOnly }
      }
    } catch {}
  }

  // 7) persist assistant message
  await db.ai_chat_messages.create({
    data: {
      sessionId,
      role: 'assistant',
      content: aiText,
      metadata: { model: modelUsed },
      aiProvider: prov,
    },
  })

  // 8) update session title on first turn
  if (!session.title) {
    await db.ai_chat_sessions.update({ where: { id: sessionId }, data: { title: req.message.slice(0, 60) } })
  }

  return {
    sessionId: sessionId!,
    message: aiText,
    ...(workoutProposal ? { workoutProposal } : {}),
    requiresAcceptance: Boolean(workoutProposal),
    ...(suggestions.length ? { suggestions } : {}),
  }
}

export async function acceptWorkoutProposal(proposalId: string, overrides?: any): Promise<string> {
  const db: any = prisma as any
  if (!db?.ai_workout_proposals?.findUnique || !db?.workout_log_entries?.create) {
    throw new Error('Workout proposal tables not available. Run: npm run db:migrate')
  }
  const proposal = await db.ai_workout_proposals.findUnique({ where: { id: proposalId } })
  if (!proposal || proposal.status !== 'pending') throw new Error('Invalid proposal')

  const data = (overrides ?? proposal.workoutData) as any
  // Minimal implementation: create entries for today
  const today = new Date()
  const entries = [] as any[]
  for (const item of data.items || []) {
    entries.push({
      id: cryptoRandom(),
      userId: proposal.userId,
      exerciseId: await resolveExerciseId(item.exerciseName),
      date: today,
      order: '0',
      setNumber: item.sets || 1,
      setType: 'STRAIGHT',
      reps: parseInt(String(item.reps || '8'), 10) || 8,
      weight: '0',
      unit: 'KG',
      restSeconds: item.restSeconds ?? null,
      userComments: item.notes ?? null,
      createdAt: today,
      updatedAt: today,
    })
  }

  // Create all entries in a transaction
  await prisma.$transaction(async (tx) => {
    for (const e of entries) {
      await tx.workout_log_entries.create({ data: e })
    }
    await (tx as any).ai_workout_proposals.update({
      where: { id: proposalId },
      data: { status: 'accepted', acceptedAt: new Date() },
    })
  })

  return 'ok'
}

function tryParseWorkoutProposal(text: string): any | null {
  // Preferred: Look for a JSON block after explicit marker
  const marker = 'WORKOUT_PROPOSAL_JSON'
  const idx = text.indexOf(marker)
  if (idx !== -1) {
    const after = text.slice(idx + marker.length)
    const match = after.match(/```json[\s\S]*?```|\{[\s\S]*\}/)
    if (match) {
      const raw = match[0].replace(/```json|```/g, '').trim()
      try { return JSON.parse(raw) } catch {}
    }
  }

  // Fallback: any fenced JSON block in the message
  const fence = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fence?.[1]) {
    try {
      const obj = JSON.parse(fence[1])
      if (isWorkoutShape(obj)) return obj
    } catch {}
  }

  // Last resort: first JSON-looking object in text
  const brace = text.match(/\{[\s\S]*\}/)
  if (brace) {
    try {
      const obj = JSON.parse(brace[0])
      if (isWorkoutShape(obj)) return obj
    } catch {}
  }

  return null
}

function isWorkoutShape(obj: any): boolean {
  return Boolean(
    obj && typeof obj === 'object' &&
    Array.isArray(obj.items) &&
    (obj.title || obj.description)
  )
}

async function requestWorkoutJson(args: {
  provider: 'openai' | 'anthropic'
  modelUsed: string
  system: string
  userContext: string
  userMessage: string
}): Promise<any | null> {
  const instruction = `Return ONLY a fenced JSON block (no prose) immediately after this line: WORKOUT_PROPOSAL_JSON\n\n\nThe JSON MUST have: {\n  "title": string,\n  "description": string,\n  "items": [{ "exerciseName": string, "sets": number, "reps": number, "restSeconds": number, "notes"?: string }]\n}\nNo additional text before or after the JSON.`

  if (args.provider === 'openai') {
    const resp = await openai.chat.completions.create({
      model: args.modelUsed || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: args.system },
        { role: 'system', content: args.userContext },
        { role: 'user', content: `${args.userMessage}\n\n${instruction}` },
      ],
      temperature: 0.2,
      max_tokens: 700,
    })
    const txt = resp.choices[0]?.message?.content || ''
    const parsed = tryParseWorkoutProposal(txt)
    return parsed || null
  } else {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY as string,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 700,
        temperature: 0.2,
        system: args.system,
        messages: [
          { role: 'user', content: [{ type: 'text', text: `${args.userContext}\n\n${args.userMessage}\n\n${instruction}` }] },
        ],
      }),
    })
    if (!resp.ok) return null
    const data: any = await resp.json()
    const txt = (Array.isArray(data?.content) ? data.content : []).map((p: any) => p?.text).filter(Boolean).join('\n')
    const parsed = tryParseWorkoutProposal(txt || '')
    return parsed || null
  }
}

function extractReasoning(text: string): string | undefined {
  // naive: everything before marker
  const marker = 'WORKOUT_PROPOSAL_JSON'
  const idx = text.indexOf(marker)
  if (idx === -1) return undefined
  return text.slice(0, idx).trim()
}

function extractFollowUps(text: string): string[] {
  // Look for a FOLLOW_UP_SUGGESTIONS: [ ... ] line
  const m = text.match(/FOLLOW_UP_SUGGESTIONS\s*:\s*\[(.*)\]/i)
  if (m && m[1]) {
    try {
      const arr = JSON.parse('[' + m[1] + ']')
      return Array.isArray(arr) ? arr.map((s) => String(s)).filter(Boolean).slice(0, 5) : []
    } catch {}
  }
  // Fallback: parse bullets at the end
  const lines = text.split(/\n+/).slice(-5)
  const hints = lines
    .map((l) => l.replace(/^[-•\*]\s*/, '').trim())
    .filter((l) => l && l.length <= 60)
  return hints.slice(0, 3)
}

async function resolveExerciseId(name: string): Promise<string> {
  if (!name) throw new Error('Exercise name missing')
  const ex = await prisma.exercises.findFirst({ where: { name: { equals: name, mode: 'insensitive' } }, select: { id: true } })
  if (ex) return ex.id
  // fallback: pick any existing exercise to avoid failing
  const any = await prisma.exercises.findFirst({ select: { id: true } })
  if (any) return any.id
  throw new Error('No exercises available')
}

function cryptoRandom() {
  // Simple UUID v4 replacement without bringing extra deps
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
