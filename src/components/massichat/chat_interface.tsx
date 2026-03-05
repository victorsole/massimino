// src/components/massichat/chat_interface.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Medal, Frown, ChevronDown, ChevronUp, Send, Plus, Trash2, Pencil, Sparkles, Dumbbell, Apple, Clock, ArrowRight } from 'lucide-react'
import Image from 'next/image'

interface ChatMessage { id?: string; role: 'user' | 'assistant'; content: string }
interface WorkoutItemPreview { exerciseName: string; sets?: number; reps?: number; restSeconds?: number; notes?: string }
interface WorkoutProposalPreview { id: string; summary?: string; workoutData?: { title?: string; description?: string; items?: WorkoutItemPreview[] } }

export function MassichatInterface({ initialSessionId, flashMessage }: { initialSessionId?: string; flashMessage?: string } = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [workoutProposal, setWorkoutProposal] = useState<WorkoutProposalPreview | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editable, setEditable] = useState<WorkoutProposalPreview['workoutData'] | null>(null)
  const [sessions, setSessions] = useState<Array<{ id: string; title: string | null; updatedAt?: string; last?: string }>>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateForm, setTemplateForm] = useState<{ name: string; isPublic: boolean; difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'; tags: string }>(
    { name: '', isPublic: false, difficulty: 'INTERMEDIATE', tags: '' }
  )
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [renaming, setRenaming] = useState<string | null>(null)
  const [sessionsExpanded, setSessionsExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Load recent sessions
    ;(async () => {
      try {
        setLoadingSessions(true)
        const res = await fetch('/api/massichat?list=true')
        const data = await res.json()
        if (res.ok && Array.isArray(data.sessions)) {
          setSessions(
            data.sessions.map((s: any) => ({
              id: s.id,
              title: s.title,
              updatedAt: s.updatedAt,
              last: s.ai_chat_messages?.[0]?.content || null,
            }))
          )
        }
      } catch {}
      finally { setLoadingSessions(false) }
    })()
  }, [])

  // Load initial session if provided via props
  useEffect(() => {
    if (initialSessionId && !sessionId) {
      loadSession(initialSessionId)
    }
  }, [initialSessionId])

  function cleanAssistantText(text: string): string {
    if (!text) return ''
    let t = text
    // Remove explicit marker
    t = t.replace(/WORKOUT_PROPOSAL_JSON\s*/g, '')
    // Remove fenced JSON blocks
    t = t.replace(/```json[\s\S]*?```/gi, '')
    // Remove any remaining JSON-looking block at the end
    t = t.replace(/\{[\s\S]*\}$/m, (m) => (m.length > 50 ? '' : m))
    // Remove FOLLOW_UP_SUGGESTIONS line if present
    t = t.replace(/FOLLOW_UP_SUGGESTIONS\s*:\s*\[[\s\S]*?\]\s*$/i, '')
    // Remove stray backticks or code fence remnants
    t = t.replace(/`{1,3}/g, '')
    return t.trim()
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg: ChatMessage = { role: 'user', content: input }
    const prev = [...messages, userMsg]
    setMessages(prev)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/massichat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, sessionId }),
      })
      const data = await res.json()
      if (res.ok) {
        setSessionId(data.sessionId)
        const assistantMsg: ChatMessage = { role: 'assistant', content: cleanAssistantText(data.displayMessage || data.message) }
        setMessages([...prev, assistantMsg])
        if (data.workoutProposal) {
          setWorkoutProposal({ id: data.workoutProposal.id, summary: data.workoutProposal.summary, workoutData: data.workoutProposal.workoutData })
          setEditable(data.workoutProposal.workoutData || null)
        }
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])
      } else {
        const errMsg: ChatMessage = { role: 'assistant', content: data.error || 'Something went wrong.' }
        setMessages([...prev, errMsg])
      }
    } catch (e) {
      const failMsg: ChatMessage = { role: 'assistant', content: 'Failed to reach server.' }
      setMessages([...messages, failMsg])
    } finally {
      setLoading(false)
    }
  }

  const acceptWorkout = async () => {
    if (!workoutProposal) return
    const body = editable ? { workoutData: editable } : null
    const init: RequestInit = body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : { method: 'POST' }
    const res = await fetch(`/api/massichat/proposals/${workoutProposal.id}/accept`, init)
    const data = await res.json()
    if (data.success && data.redirectUrl) window.location.href = data.redirectUrl
  }

  function onItemChange(index: number, patch: Partial<WorkoutItemPreview>) {
    setEditable((cur) => {
      const next = cur ? { ...cur } : { title: '', description: '', items: [] }
      const items = Array.isArray(next.items) ? [...next.items] : []
      const current = items[index] || { exerciseName: '' }
      const base: WorkoutItemPreview = {
        exerciseName: (current as any).exerciseName || '',
        sets: (current as any).sets,
        reps: (current as any).reps,
        restSeconds: (current as any).restSeconds,
        notes: (current as any).notes,
      }
      items[index] = { ...base, ...patch }
      next.items = items
      return next
    })
  }

  function moveItem(index: number, delta: number) {
    setEditable((cur) => {
      if (!cur) return cur
      const next = { ...cur }
      const items: WorkoutItemPreview[] = Array.isArray(next.items) ? ([...next.items] as WorkoutItemPreview[]) : []
      const newIndex = index + delta
      if (newIndex < 0 || newIndex >= items.length) return cur
      const tmp = items[index] as WorkoutItemPreview
      items[index] = items[newIndex] as WorkoutItemPreview
      items[newIndex] = tmp
      next.items = items
      return next
    })
  }

  function removeItem(index: number) {
    setEditable((cur) => {
      if (!cur) return cur
      const next = { ...cur }
      const items = Array.isArray(next.items) ? [...next.items] : []
      items.splice(index, 1)
      next.items = items
      return next
    })
  }

  function addItem() {
    setEditable((cur) => {
      const next = cur ? { ...cur } : { title: '', description: '', items: [] }
      const items = Array.isArray(next.items) ? [...next.items] : []
      items.push({ exerciseName: '', sets: 3, reps: 10, restSeconds: 60, notes: '' })
      next.items = items
      return next
    })
  }

  function totals(data?: WorkoutProposalPreview['workoutData']) {
    const items = data?.items || []
    const totalSets = items.reduce((s, it) => s + (Number(it.sets) || 0), 0)
    const totalReps = items.reduce((s, it) => s + (Number(it.sets) || 0) * (Number(it.reps) || 0), 0)
    const totalRestSec = items.reduce((s, it) => s + (Number(it.sets) || 0) * (Number(it.restSeconds) || 0), 0)
    const totalRestMin = Math.round((totalRestSec / 60) * 10) / 10
    return { totalSets, totalReps, totalRestMin }
  }

  async function loadSession(id: string) {
    try {
      const res = await fetch(`/api/massichat?sessionId=${encodeURIComponent(id)}`)
      const data = await res.json()
      if (res.ok) {
        setSessionId(id)
        const msgs: ChatMessage[] = (data.messages || [])
          .map((m: any) => ({ id: m.id, role: m.role, content: m.role === 'assistant' ? cleanAssistantText(m.content) : m.content }))
          .filter((m: any) => (m.role === 'user' || m.role === 'assistant'))
        setMessages(msgs)
        setWorkoutProposal(null)
        setEditable(null)
        setShowPreview(false)
        setEditMode(false)
      }
    } catch {}
  }

  async function rateAssistantMessage(msg: ChatMessage, rating: 'UP' | 'DOWN') {
    try {
      let messageId = msg.id
      // If no id (fresh message), fetch latest assistant message in session
      if (!messageId && sessionId) {
        const res = await fetch(`/api/massichat?sessionId=${encodeURIComponent(sessionId)}`)
        const data = await res.json()
        if (res.ok && Array.isArray(data.messages)) {
          const lastAssistant = [...data.messages].reverse().find((m: any) => m.role === 'assistant')
          if (lastAssistant) messageId = lastAssistant.id
        }
      }
      if (!messageId) return alert('Unable to identify message for feedback')
      const payload = {
        type: 'AI',
        related_type: 'ai_chat_message',
        related_id: messageId,
        ai_rating: rating,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        platform: 'WEB',
      }
      const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data?.error || 'Failed to send feedback')
      }
    } catch {}
  }

  async function saveAsTemplate() {
    if (!editable || !Array.isArray(editable.items) || editable.items.length === 0) return
    try {
      setTemplateSaving(true)
      const name = templateForm.name || editable.title || 'Workout Template'
      const description = editable.description || ''
      const tagsArr = templateForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
      // Resolve exercise IDs by name
      const resolved: Array<{ exerciseId: string; order: number; sets: number; reps: string; restTime?: string; notes?: string }> = []
      for (let i = 0; i < editable.items.length; i++) {
        const it = editable.items[i]
        if (!it) continue
        const q = encodeURIComponent(it.exerciseName || '')
        let exerciseId: string | null = null
        try {
          if (q) {
            const r = await fetch(`/api/workout/exercises?search=${q}&limit=1`)
            const arr = await r.json()
            if (Array.isArray(arr) && arr[0]?.id) exerciseId = arr[0].id
          }
          if (!exerciseId) {
            const r2 = await fetch(`/api/workout/exercises`)
            const arr2 = await r2.json()
            if (Array.isArray(arr2) && arr2[0]?.id) exerciseId = arr2[0].id
          }
        } catch {}
        if (!exerciseId) throw new Error('Could not resolve exercise for template')
        const obj: { exerciseId: string; order: number; sets: number; reps: string; restTime?: string; notes?: string } = {
          exerciseId,
          order: i + 1,
          sets: Number(it.sets) || 1,
          reps: String(it.reps ?? '8'),
        }
        if (typeof it.restSeconds === 'number') obj.restTime = `${it.restSeconds}s`
        if (it.notes) obj.notes = it.notes
        resolved.push(obj)
      }
      const payload = {
        name,
        description,
        category: 'Arms',
        difficulty: templateForm.difficulty,
        duration: undefined,
        equipment: [],
        isPublic: templateForm.isPublic,
        price: undefined,
        currency: 'USD',
        tags: tagsArr,
        exercises: resolved,
      }
      const resp = await fetch('/api/workout/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const out = await resp.json()
      if (!resp.ok) throw new Error(out?.error || 'Failed to save template')
      alert('Template saved successfully')
      setShowTemplateModal(false)
    } catch (e: any) {
      alert(e?.message || 'Failed to save template')
    } finally {
      setTemplateSaving(false)
    }
  }

  //

  async function renameCurrentSession() {
    if (!sessionId) return
    const current = sessions.find((s) => s.id === sessionId)
    const nextTitle = window.prompt('Rename session', current?.title || '')
    if (!nextTitle) return
    try {
      setRenaming(sessionId)
      const res = await fetch('/api/massichat', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, title: nextTitle }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to rename')
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title: nextTitle } : s)))
    } catch (e: any) {
      alert(e?.message || 'Rename failed')
    } finally {
      setRenaming(null)
    }
  }

  async function deleteSessionById(id: string) {
    if (!id) return
    if (!window.confirm('Delete this session? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/massichat?sessionId=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (sessionId === id) {
        setSessionId(null)
        setMessages([])
        setWorkoutProposal(null)
        setEditable(null)
        setSuggestions([])
        setShowPreview(false)
        setEditMode(false)
      }
    } catch (e: any) {
      alert(e?.message || 'Delete failed')
    }
  }

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function formatInline(text: string) {
    let safe = escapeHtml(text)
    // Basic bold/italic/code
    safe = safe.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 rounded">$1</code>')
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Markdown-style links: [text](url)
    safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-brand-primary underline">$1</a>')
    // Auto-link plain URLs
    safe = safe.replace(/(?<!["'>])(https?:\/\/[^\s<]+)(?![^<]*>)/g, '<a href="$1" target="_blank" rel="noopener" class="text-brand-primary underline">$1</a>')
    // Ensure partner names are clickable if mentioned without a link
    if (!/amix\.com/i.test(safe)) {
      safe = safe.replace(/\bAmix\b/g, '<a href="https://amix.com/?utm_source=massimino&utm_medium=massichat&utm_campaign=amix" target="_blank" rel="noopener" class="text-brand-primary underline">Amix</a>')
    }
    if (!/jims\.be/i.test(safe)) {
      safe = safe.replace(/\bJims\b/g, '<a href="https://www.jims.be/nl?utm_source=massimino&utm_medium=massichat&utm_campaign=jims" target="_blank" rel="noopener" class="text-brand-primary underline">Jims</a>')
    }
    return safe
  }

  function renderMarkdown(text: string) {
    const lines = text.split(/\r?\n/)
    const elements: JSX.Element[] = []
    let list: string[] = []
    let olist: string[] = []
    let para: string[] = []

    const flushPara = () => {
      if (para.length) {
        const content = para.join(' ')
        elements.push(
          <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
        )
        para = []
      }
    }
    const flushList = () => {
      if (list.length) {
        elements.push(
          <ul className="list-disc pl-5 space-y-1">
            {list.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ul>
        )
        list = []
      }
    }
    const flushOList = () => {
      if (olist.length) {
        elements.push(
          <ol className="list-decimal pl-5 space-y-1">
            {olist.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ol>
        )
        olist = []
      }
    }

    for (const raw of lines) {
      const line = raw.trim()
      if (!line) { flushPara(); flushList(); flushOList(); continue }
      if (/^[-\*]\s+/.test(line)) { flushPara(); flushOList(); list.push(line.replace(/^[-\*]\s+/, '')); continue }
      if (/^\d+[\.)]\s+/.test(line)) { flushPara(); flushList(); olist.push(line.replace(/^\d+[\.)]\s+/, '')); continue }
      if (/^###\s+/.test(line)) { flushPara(); flushList(); elements.push(<div className="font-semibold" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^###\s+/, '')) }} />); continue }
      if (/^##\s+/.test(line)) { flushPara(); flushList(); elements.push(<div className="font-semibold" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^##\s+/, '')) }} />); continue }
      if (/^#\s+/.test(line)) { flushPara(); flushList(); elements.push(<div className="font-bold" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^#\s+/, '')) }} />); continue }
      para.push(line)
    }
    flushPara(); flushList(); flushOList()
    return <>{elements.map((el, i) => <div key={i}>{el}</div>)}</>
  }

  return (
    <>
      <div className="flex flex-col h-[600px] sm:h-[650px] lg:h-[calc(100vh-14rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2b5069]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              <Image src="/massimino_logo.png" alt="MassiChat" width={24} height={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display leading-tight">MassiChat</h3>
              <p className="text-xs text-gray-500 leading-tight">AI Fitness Coach</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <button
                onClick={() => setSessionsExpanded(!sessionsExpanded)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${sessionsExpanded ? 'bg-[#2b5069]/10 text-[#2b5069]' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                History
                {sessions.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-[#2b5069] text-white rounded-full">{sessions.length}</span>
                )}
                {sessionsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            <button
              onClick={() => { setSessionId(null); setMessages([]); setWorkoutProposal(null); setEditable(null); setSuggestions([]); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#2b5069] text-white hover:bg-[#2b5069]/90 transition-colors"
              title="New Chat"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Flash message */}
        {flashMessage && (
          <div className="flex-shrink-0 mx-4 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            {flashMessage}
          </div>
        )}

        {/* Session panel - slide down */}
        {sessionsExpanded && (
          <div className="flex-shrink-0 border-b border-gray-100 bg-gray-50/80 overflow-y-auto max-h-48">
            {loadingSessions && <div className="px-4 py-2 text-xs text-gray-500">Loading sessions...</div>}
            <div className="py-1">
              {sessions.slice(0, 10).map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors ${sessionId === s.id ? 'bg-[#2b5069]/10' : 'hover:bg-gray-100'}`}
                  onClick={() => loadSession(s.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm truncate ${sessionId === s.id ? 'font-medium text-[#2b5069]' : 'text-gray-700'}`}>
                      {s.title || 'Untitled'}
                    </div>
                    {s.last && <div className="text-xs text-gray-400 truncate mt-0.5">{s.last.slice(0, 60)}</div>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSessionId(s.id); renameCurrentSession(); }}
                      className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                      title="Rename"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSessionById(s.id); }}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {sessions.length > 10 && (
                <div className="px-4 py-1.5 text-xs text-gray-400">+{sessions.length - 10} more sessions</div>
              )}
            </div>
          </div>
        )}

        {/* Message area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#fcfaf5]/50">
          {/* Welcome / Empty state */}
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-full bg-[#2b5069]/10 flex items-center justify-center mb-4 overflow-hidden">
                <Image src="/massimino_logo.png" alt="MassiChat" width={40} height={40} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 font-display mb-1">Welcome to MassiChat</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs">Your AI-powered fitness coach. Ask me anything about workouts, nutrition, or training.</p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                <button
                  onClick={() => setInput('Create a workout for me')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 bg-white hover:border-[#2b5069]/30 hover:shadow-sm transition-all text-center group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Dumbbell size={20} className="text-[#2b5069]" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Create a workout</span>
                </button>
                <button
                  onClick={() => setInput('Give me nutrition advice')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 bg-white hover:border-green-300 hover:shadow-sm transition-all text-center group"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <Apple size={20} className="text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Nutrition advice</span>
                </button>
                <button
                  onClick={() => setInput('Give me a quick 20-minute HIIT session')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 bg-white hover:border-orange-300 hover:shadow-sm transition-all text-center group"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <Clock size={20} className="text-orange-500" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Quick HIIT session</span>
                </button>
                <button
                  onClick={() => setInput('Give me training tips to improve')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 bg-white hover:border-purple-300 hover:shadow-sm transition-all text-center group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <Sparkles size={20} className="text-purple-500" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Training tips</span>
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {/* Assistant avatar */}
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#2b5069]/10 flex items-center justify-center flex-shrink-0 mb-1 overflow-hidden">
                  <Image src="/massimino_logo.png" alt="M" width={22} height={22} />
                </div>
              )}
              <div className="flex flex-col max-w-[75%] sm:max-w-[70%]">
                <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#2b5069] text-white rounded-2xl rounded-br-md'
                    : 'bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md text-gray-800'
                }`}>
                  {m.role === 'assistant' ? renderMarkdown(m.content) : m.content}
                </div>
                {/* Feedback buttons below assistant bubbles */}
                {m.role === 'assistant' && (
                  <div className="flex gap-1 mt-1 ml-1">
                    <button
                      aria-label="Helpful"
                      className="p-1 rounded-md text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                      onClick={() => rateAssistantMessage(m, 'UP')}
                    >
                      <Medal size={16} />
                    </button>
                    <button
                      aria-label="Not helpful"
                      className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => rateAssistantMessage(m, 'DOWN')}
                    >
                      <Frown size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-[#2b5069] flex items-center justify-center flex-shrink-0 mb-1">
                <Image src="/massimino-logo.svg" alt="M" width={18} height={18} className="brightness-0 invert" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2b5069]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#2b5069]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#2b5069]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Workout proposal */}
        {workoutProposal && (
          <div className="flex-shrink-0 mx-4 mb-3">
            <div className="rounded-2xl bg-gradient-to-br from-[#2b5069]/5 to-transparent border border-gray-100 overflow-hidden">
              <div className="px-4 py-3">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#2b5069]/10 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={18} className="text-[#2b5069]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">
                      {(editable?.title || workoutProposal.workoutData?.title) || workoutProposal.summary || 'Proposed Workout'}
                    </div>
                    {(editable?.description || workoutProposal.workoutData?.description) && (
                      <div className="text-xs text-gray-500 mt-0.5">{editable?.description || workoutProposal.workoutData?.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {workoutProposal.workoutData?.items?.length ? (
                    <button
                      onClick={() => setShowPreview((s) => !s)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {showPreview ? 'Hide' : 'Preview'}
                    </button>
                  ) : null}
                  {showPreview && (
                    <button
                      onClick={() => setEditMode((e) => !e)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {editMode ? 'Done' : 'Edit'}
                    </button>
                  )}
                  {showPreview && (
                    <button
                      onClick={() => {
                        if (!editable) return;
                        setTemplateForm({ name: editable.title || 'Workout Template', isPublic: false, difficulty: 'INTERMEDIATE', tags: '' });
                        setShowTemplateModal(true);
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Save as Template
                    </button>
                  )}
                  <button
                    onClick={acceptWorkout}
                    className="text-xs font-medium px-4 py-1.5 rounded-lg bg-[#2b5069] text-white hover:bg-[#2b5069]/90 transition-colors ml-auto"
                  >
                    Accept & Add
                  </button>
                </div>

                {showPreview && (
                  <div className="space-y-2">
                    {/* Totals row */}
                    {(() => {
                      const t = totals(editable || workoutProposal.workoutData);
                      return (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <span>{t.totalSets} sets</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span>{t.totalReps} reps</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span>~{t.totalRestMin} min rest</span>
                        </div>
                      );
                    })()}
                    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-gray-400 font-medium w-12">#</th>
                            <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-gray-400 font-medium">Exercise</th>
                            <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-gray-400 font-medium">Sets</th>
                            <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-gray-400 font-medium">Reps</th>
                            <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-gray-400 font-medium">Rest</th>
                            <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-gray-400 font-medium">Notes</th>
                            {editMode && <th className="px-3 py-2 w-20" />}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {((editable?.items || workoutProposal.workoutData?.items || []) as WorkoutItemPreview[]).map((it, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2">
                                {editMode ? (
                                  <div className="flex items-center gap-0.5">
                                    <button className="px-1 py-0.5 border rounded text-xs text-gray-500 hover:bg-gray-100" onClick={() => moveItem(idx, -1)}>&#8593;</button>
                                    <button className="px-1 py-0.5 border rounded text-xs text-gray-500 hover:bg-gray-100" onClick={() => moveItem(idx, 1)}>&#8595;</button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">{idx + 1}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-800">
                                {editMode ? (
                                  <input className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-[#2b5069] focus:border-[#2b5069] outline-none" type="text" value={it.exerciseName || ''} onChange={(e) => onItemChange(idx, { exerciseName: e.target.value })} />
                                ) : (
                                  <span>{it.exerciseName || 'Exercise'}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {editMode ? (
                                  <input className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-[#2b5069] focus:border-[#2b5069] outline-none" type="number" value={it.sets ?? ''} onChange={(e) => onItemChange(idx, { sets: Number(e.target.value) })} />
                                ) : (
                                  <span>{it.sets ?? '-'}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {editMode ? (
                                  <input className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-[#2b5069] focus:border-[#2b5069] outline-none" type="number" value={it.reps ?? ''} onChange={(e) => onItemChange(idx, { reps: Number(e.target.value) })} />
                                ) : (
                                  <span>{it.reps ?? '-'}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {editMode ? (
                                  <input className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-[#2b5069] focus:border-[#2b5069] outline-none" type="number" value={it.restSeconds ?? ''} onChange={(e) => onItemChange(idx, { restSeconds: Number(e.target.value) })} />
                                ) : (
                                  <span>{it.restSeconds ? `${it.restSeconds}s` : '-'}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-500 text-xs">
                                {editMode ? (
                                  <input className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-[#2b5069] focus:border-[#2b5069] outline-none" type="text" value={it.notes ?? ''} onChange={(e) => onItemChange(idx, { notes: e.target.value })} />
                                ) : (
                                  <span>{it.notes ?? '-'}</span>
                                )}
                              </td>
                              {editMode && (
                                <td className="px-3 py-2">
                                  <button className="text-xs text-red-500 hover:text-red-700 font-medium" onClick={() => removeItem(idx)}>Remove</button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {editMode && (
                        <div className="px-3 py-2 border-t border-gray-50">
                          <button onClick={addItem} className="text-xs font-medium text-[#2b5069] hover:text-[#2b5069]/80">+ Add Exercise</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Suggestion chips */}
        {suggestions.length > 0 && (
          <div className="flex-shrink-0 px-4 pb-2 flex flex-wrap gap-2">
            {suggestions.slice(0, 4).map((s, i) => (
              <button
                key={i}
                onClick={() => { setInput(s); setTimeout(() => sendMessage(), 0) }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-[#2b5069]/20 text-[#2b5069] bg-[#2b5069]/5 hover:bg-[#2b5069]/10 transition-colors"
              >
                <ArrowRight size={12} />
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 bg-white">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me about your workout..."
                className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-[#2b5069]/20 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={loading}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all flex-shrink-0 ${
                input.trim()
                  ? 'bg-[#2b5069] text-white hover:bg-[#2b5069]/90 shadow-sm'
                  : 'bg-gray-100 text-gray-400'
              } disabled:opacity-50`}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Template modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !templateSaving && setShowTemplateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-lg font-bold text-gray-900 font-display mb-4">Save as Template</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Template name"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2b5069]/20 focus:border-[#2b5069] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2b5069]/20 focus:border-[#2b5069] outline-none transition-all"
                  value={templateForm.difficulty}
                  onChange={(e) => setTemplateForm({ ...templateForm, difficulty: e.target.value as any })}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={templateForm.tags}
                  onChange={(e) => setTemplateForm({ ...templateForm, tags: e.target.value })}
                  placeholder="e.g., arms, hypertrophy"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2b5069]/20 focus:border-[#2b5069] outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <input id="tmpl-public" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#2b5069] focus:ring-[#2b5069]" checked={templateForm.isPublic} onChange={(e) => setTemplateForm({ ...templateForm, isPublic: e.target.checked })} />
                <label htmlFor="tmpl-public" className="text-sm text-gray-700">Make template public</label>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowTemplateModal(false)}
                disabled={templateSaving}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveAsTemplate}
                disabled={templateSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2b5069] rounded-xl hover:bg-[#2b5069]/90 transition-colors disabled:opacity-50"
              >
                {templateSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
