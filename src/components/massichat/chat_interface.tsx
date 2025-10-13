// src/components/massichat/chat_interface.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChatMessage { role: 'user' | 'assistant'; content: string }
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
    let t = text.replace(/WORKOUT_PROPOSAL_JSON\s*/g, '')
    t = t.replace(/```json[\s\S]*?```/gi, '').trim()
    t = t.replace(/\{[\s\S]*\}$/m, (m) => (m.length > 50 ? '' : m)).trim()
    return t
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
        const msgs: ChatMessage[] = (data.messages || []).map((m: any) => ({ role: m.role, content: m.content })).filter((m: any) => (m.role === 'user' || m.role === 'assistant'))
        setMessages(msgs)
        setWorkoutProposal(null)
        setEditable(null)
        setShowPreview(false)
        setEditMode(false)
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
    safe = safe.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 rounded">$1</code>')
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    return safe
  }

  function renderMarkdown(text: string) {
    const lines = text.split(/\r?\n/)
    const elements: JSX.Element[] = []
    let list: string[] = []
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

    for (const raw of lines) {
      const line = raw.trim()
      if (!line) { flushPara(); flushList(); continue }
      if (/^[-\*]\s+/.test(line)) { flushPara(); list.push(line.replace(/^[-\*]\s+/, '')); continue }
      if (/^###\s+/.test(line)) { flushPara(); flushList(); elements.push(<div className="font-semibold" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^###\s+/, '')) }} />); continue }
      if (/^##\s+/.test(line)) { flushPara(); flushList(); elements.push(<div className="font-semibold" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^##\s+/, '')) }} />); continue }
      if (/^#\s+/.test(line)) { flushPara(); flushList(); elements.push(<div className="font-bold" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^#\s+/, '')) }} />); continue }
      para.push(line)
    }
    flushPara(); flushList()
    return <>{elements.map((el, i) => <div key={i}>{el}</div>)}</>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>💬 Massichat - Your AI Fitness Coach</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setSessionId(null); setMessages([]); setWorkoutProposal(null); setEditable(null); }}>New Chat</Button>
          </div>
        </div>
        {flashMessage && (
          <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 inline-block">
            {flashMessage}
          </div>
        )}
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Recent Sessions</div>
            <div className="flex items-center gap-2">
              {sessionId && (
                <>
                  <Button variant="ghost" size="sm" onClick={renameCurrentSession} disabled={!!renaming}>
                    {renaming ? 'Renaming…' : 'Rename'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteSessionById(sessionId!)}>
                    Delete
                  </Button>
                </>
              )}
              {loadingSessions && <div className="text-xs text-gray-500">Loading…</div>}
            </div>
          </div>
          <div className="mt-1 flex gap-2 overflow-x-auto pb-1">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-1">
                <button onClick={() => loadSession(s.id)} className={`text-xs px-2 py-1 rounded border ${sessionId === s.id ? 'bg-gray-200' : 'bg-white'} hover:bg-gray-100`}>{s.title || 'Untitled'}</button>
                <button onClick={() => deleteSessionById(s.id)} className="text-xs text-gray-500 hover:text-red-600" title="Delete">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div ref={scrollRef} className="h-80 overflow-y-auto space-y-3 rounded border p-3 bg-white">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                  {m.role === 'assistant' ? renderMarkdown(m.content) : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-600">
                  <span>Massichat is typing</span>
                  <span className="inline-block animate-pulse">...</span>
                </div>
              </div>
            )}
            {messages.length === 0 && (
              <div className="text-sm text-gray-500">Ask me for a personalized workout or tips. Example: "I want a 30-minute full-body at home."</div>
            )}
          </div>

          {workoutProposal && (
            <Card className="border-2 border-green-500">
              <CardHeader>
                <CardTitle>🏋️ Proposed Workout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">{(editable?.title || workoutProposal.workoutData?.title) || workoutProposal.summary || 'New workout available'}</div>
                      {(editable?.description || workoutProposal.workoutData?.description) && (
                        <div className="text-xs text-gray-500 mt-0.5">{editable?.description || workoutProposal.workoutData?.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {workoutProposal.workoutData?.items?.length ? (
                        <Button variant="secondary" size="sm" onClick={() => setShowPreview((s) => !s)}>
                          {showPreview ? 'Hide' : 'Preview'}
                        </Button>
                      ) : null}
                      {showPreview ? (
                        <Button variant="outline" size="sm" onClick={() => setEditMode((e) => !e)}>
                          {editMode ? 'Done' : 'Edit'}
                        </Button>
                      ) : null}
                      {showPreview ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!editable) return;
                            setTemplateForm({ name: editable.title || 'Workout Template', isPublic: false, difficulty: 'INTERMEDIATE', tags: '' });
                            setShowTemplateModal(true);
                          }}
                        >
                          Save as Template
                        </Button>
                      ) : null}
                      <Button onClick={acceptWorkout} size="sm">Accept & Add</Button>
                    </div>
                  </div>

                  {showPreview && (
                    <div className="rounded border bg-white p-2 space-y-2">
                      {/* Totals */}
                      {(() => { const t = totals(editable || workoutProposal.workoutData); return (
                        <div className="text-xs text-gray-600">Totals: {t.totalSets} sets • {t.totalReps} reps • ~{t.totalRestMin} min rest</div>
                      ) })()}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="px-2 py-1 w-16">#</th>
                              <th className="px-2 py-1">Exercise</th>
                              <th className="px-2 py-1">Sets</th>
                              <th className="px-2 py-1">Reps</th>
                              <th className="px-2 py-1">Rest (s)</th>
                              <th className="px-2 py-1">Notes</th>
                              {editMode && <th className="px-2 py-1 w-20">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {((editable?.items || workoutProposal.workoutData?.items || []) as WorkoutItemPreview[]).map((it, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-2 py-1">
                                  {editMode ? (
                                    <div className="flex items-center gap-1">
                                      <button className="px-1 py-0.5 border rounded" onClick={() => moveItem(idx, -1)} title="Move up">↑</button>
                                      <button className="px-1 py-0.5 border rounded" onClick={() => moveItem(idx, 1)} title="Move down">↓</button>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">{idx + 1}</span>
                                  )}
                                </td>
                                <td className="px-2 py-1 font-medium">
                                  {editMode ? (
                                    <input className="w-full border rounded px-1 py-0.5" type="text" value={it.exerciseName || ''} onChange={(e) => onItemChange(idx, { exerciseName: e.target.value })} />
                                  ) : (
                                    <span>{it.exerciseName || 'Exercise'}</span>
                                  )}
                                </td>
                                <td className="px-2 py-1">
                                  {editMode ? (
                                    <input className="w-16 border rounded px-1 py-0.5" type="number" value={it.sets ?? ''} onChange={(e) => onItemChange(idx, { sets: Number(e.target.value) })} />
                                  ) : (
                                    <span>{it.sets ?? '-'}</span>
                                  )}
                                </td>
                                <td className="px-2 py-1">
                                  {editMode ? (
                                    <input className="w-16 border rounded px-1 py-0.5" type="number" value={it.reps ?? ''} onChange={(e) => onItemChange(idx, { reps: Number(e.target.value) })} />
                                  ) : (
                                    <span>{it.reps ?? '-'}</span>
                                  )}
                                </td>
                                <td className="px-2 py-1">
                                  {editMode ? (
                                    <input className="w-20 border rounded px-1 py-0.5" type="number" value={it.restSeconds ?? ''} onChange={(e) => onItemChange(idx, { restSeconds: Number(e.target.value) })} />
                                  ) : (
                                    <span>{it.restSeconds ?? '-'}</span>
                                  )}
                                </td>
                                <td className="px-2 py-1">
                                  {editMode ? (
                                    <input className="w-full border rounded px-1 py-0.5" type="text" value={it.notes ?? ''} onChange={(e) => onItemChange(idx, { notes: e.target.value })} />
                                  ) : (
                                    <span className="text-gray-600">{it.notes ?? '-'}</span>
                                  )}
                                </td>
                                {editMode && (
                                  <td className="px-2 py-1">
                                    <button className="px-2 py-0.5 border rounded text-red-600" onClick={() => removeItem(idx)}>Remove</button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {editMode && (
                          <div className="mt-2">
                            <Button variant="secondary" size="sm" onClick={addItem}>+ Add Exercise</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Template Modal */}
          {showTemplateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30" onClick={() => !templateSaving && setShowTemplateModal(false)} />
              <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-4">
                <div className="text-lg font-semibold mb-3">Save as Template</div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Name</label>
                    <Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="Template name" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Difficulty</label>
                    <select
                      className="w-full border rounded px-2 py-2 text-sm"
                      value={templateForm.difficulty}
                      onChange={(e) => setTemplateForm({ ...templateForm, difficulty: e.target.value as any })}
                    >
                      <option value="BEGINNER">BEGINNER</option>
                      <option value="INTERMEDIATE">INTERMEDIATE</option>
                      <option value="ADVANCED">ADVANCED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tags (comma-separated)</label>
                    <Input value={templateForm.tags} onChange={(e) => setTemplateForm({ ...templateForm, tags: e.target.value })} placeholder="e.g., arms, hypertrophy" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="tmpl-public" type="checkbox" className="h-4 w-4" checked={templateForm.isPublic} onChange={(e) => setTemplateForm({ ...templateForm, isPublic: e.target.checked })} />
                    <label htmlFor="tmpl-public" className="text-sm text-gray-700">Make template public</label>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowTemplateModal(false)} disabled={templateSaving}>Cancel</Button>
                  <Button size="sm" onClick={saveAsTemplate} disabled={templateSaving}>{templateSaving ? 'Saving…' : 'Save'}</Button>
                </div>
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 4).map((s, i) => (
                <Button key={i} variant="secondary" size="sm" onClick={() => { setInput(s); setTimeout(() => sendMessage(), 0) }}>
                  {s}
                </Button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me about your workout..." onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
            <Button onClick={sendMessage} disabled={loading}>{loading ? 'Sending...' : 'Send'}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
