import OpenAI from 'openai'
import { prisma } from '@/core/database'
import fs from 'fs/promises'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
  project: process.env.OPENAI_PROJECT,
})

export async function embedDocument(content: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured. Embedding requires an OpenAI API key.')
  }
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: content,
  })
  const vec = res.data?.[0]?.embedding
  if (!vec) throw new Error('Failed to compute embedding')
  return vec as unknown as number[]
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0
    const bi = b[i] ?? 0
    dot += ai * bi
    na += ai * ai
    nb += bi * bi
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export async function searchKnowledgeBase(query: string, limit = 5): Promise<{ documentName: string; content: string; similarity: number }[]> {
  const results: { documentName: string; content: string; similarity: number }[] = []

  // 1) Vectorized docs from DB (if present)
  try {
    const q = await embedDocument(query)
    const docs = await (prisma as any).fitness_knowledge_base.findMany({
      select: { documentName: true, content: true, embedding: true },
      take: 200,
    })
    const scored = (docs as Array<{ documentName: string; content: string; embedding: number[] | null }> ).map((d) => ({
      documentName: d.documentName,
      content: d.content,
      similarity: cosineSim((d.embedding || []) as unknown as number[], q),
    }))
    scored.sort((a, b) => b.similarity - a.similarity)
    results.push(...scored.slice(0, Math.min(limit, 3)))
  } catch (e) {
    // Swallow and continue with local docs fallback
  }

  // 2) Local NASM docs (lexical fallback; no new files/routes required)
  try {
    const nasmHits = await searchLocalNasm(query, limit)
    results.push(...nasmHits)
  } catch (e) {
    // ignore if FS not available
  }

  // 3) Deduplicate by content snippet
  const seen = new Set<string>()
  const deduped = results.filter((r) => {
    const key = r.content.slice(0, 120)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  deduped.sort((a, b) => b.similarity - a.similarity)
  return deduped.slice(0, limit)
}

const NASM_ROOTS = [
  'public/databases/NASM_CPT/converted',
  'public/databases/NASM_CNC/converted',
]

async function searchLocalNasm(query: string, limit: number): Promise<{ documentName: string; content: string; similarity: number }[]> {
  const baseDir = process.cwd()
  const files: string[] = []
  for (const rel of NASM_ROOTS) {
    const dir = path.join(baseDir, rel)
    const list = await safeWalk(dir)
    files.push(...list.filter((f) => f.endsWith('.md') && path.basename(f).toLowerCase().startsWith('section')))
  }

  // Keep it light: cap scanned files
  const toScan = files.slice(0, 80)
  const keywords = tokenize(query)
  if (keywords.length === 0) return []

  const scored: { documentName: string; content: string; similarity: number }[] = []
  for (const abs of toScan) {
    const rel = path.relative(baseDir, abs)
    const raw = await fs.readFile(abs, 'utf8')
    const chunks = chunkMarkdown(raw)
    for (let i = 0; i < chunks.length; i++) {
      const txt: string = String(chunks[i] ?? '')
      const score = lexicalScore(txt, keywords)
      if (score > 0) {
        // Map lexical score [0..] to a bounded 0..0.88 so DB vectors can still outrank
        const similarity = Math.min(0.88, score)
        scored.push({ documentName: `${rel}#${i}`, content: txt.slice(0, 1200), similarity })
      }
    }
  }
  scored.sort((a, b) => b.similarity - a.similarity)
  return scored.slice(0, Math.max(0, limit - 0))
}

async function safeWalk(dir: string): Promise<string[]> {
  try {
    const out: string[] = []
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const e of entries) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) out.push(...(await safeWalk(p)))
      else out.push(p)
    }
    return out
  } catch {
    return []
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3)
}

function lexicalScore(text: string, keywords: string[]): number {
  const lower = text.toLowerCase()
  let hits = 0
  for (const k of keywords) {
    if (lower.includes(k)) hits += 1
  }
  // Normalize by keyword count
  return hits / Math.max(1, keywords.length)
}

function chunkMarkdown(md: string): string[] {
  // Split by headings or paragraphs
  const parts = md.split(/\n(?=#+\s)|\n\n+/)
  const chunks: string[] = []
  let cur = ''
  for (const p of parts) {
    if ((cur + p).length < 1000) cur += (cur ? '\n\n' : '') + p
    else { if (cur) chunks.push(cur); cur = p }
  }
  if (cur) chunks.push(cur)
  return chunks
}
