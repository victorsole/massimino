// src/app/admin/feedback/page.tsx
import { prisma } from '@/core/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'
import { sendEmail } from '@/services/email/email_service'

async function setStatus(id: string, status: 'OPEN'|'TRIAGED'|'IN_PROGRESS'|'RESOLVED'|'CLOSED') {
  'use server'
  const db: any = prisma as any
  if (!db?.feedback_entries?.update) return
  await db.feedback_entries.update({ where: { id }, data: { status } }).catch(() => null)
  revalidatePath('/admin/feedback')
}

async function setSeverity(id: string, severity: 'P0'|'P1'|'P2'|'P3') {
  'use server'
  const db: any = prisma as any
  if (!db?.feedback_entries?.update) return
  await db.feedback_entries.update({ where: { id }, data: { severity } }).catch(() => null)
  revalidatePath('/admin/feedback')
}

async function updateEntry(formData: FormData) {
  'use server'
  const db: any = prisma as any
  if (!db?.feedback_entries?.update) return
  const id = String(formData.get('id') || '')
  const title = String(formData.get('title') || '') || null
  const message = String(formData.get('message') || '') || null
  const status = String(formData.get('status') || '') as any
  const severity = String(formData.get('severity') || '') as any
  const labelsRaw = String(formData.get('labels') || '')
  const labels = labelsRaw ? labelsRaw.split(',').map((s) => s.trim()).filter(Boolean) : []
  if (!id) return
  await db.feedback_entries.update({ where: { id }, data: { title, message, status, severity: severity || null, labels } }).catch(() => null)
  revalidatePath('/admin/feedback')
}

async function addComment(formData: FormData) {
  'use server'
  const session = await getServerSession(authOptions)
  const db: any = prisma as any
  if (!db?.feedback_comments?.create || !db?.feedback_entries?.findUnique) return
  const ticketId = String(formData.get('ticketId') || '')
  const content = String(formData.get('content') || '')
  const visibility = (String(formData.get('visibility') || 'INTERNAL') === 'PUBLIC') ? 'PUBLIC' : 'INTERNAL'
  const send = String(formData.get('sendEmail') || '') === 'on'
  if (!ticketId || !content) return
  await db.feedback_comments.create({ data: { ticketId, content, visibility, authorId: session?.user?.id || null } })
  if (send) {
    const entry = await db.feedback_entries.findUnique({ where: { id: ticketId }, select: { email: true, title: true } })
    if (entry?.email) {
      await sendEmail({ to: entry.email, subject: `Re: ${entry.title || 'Feedback'}`, text: content }).catch(() => null)
    }
  }
  revalidatePath('/admin/feedback')
}

async function deleteEntry(formData: FormData) {
  'use server'
  const db: any = prisma as any
  if (!db?.feedback_entries?.delete) return
  const id = String(formData.get('id') || '')
  if (!id) return
  await db.feedback_entries.delete({ where: { id } }).catch(() => null)
  revalidatePath('/admin/feedback')
}

export default async function AdminFeedbackPage() {
  const db: any = prisma as any
  if (!db?.feedback_entries?.findMany) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Feedback</h1>
        <p className="text-gray-600">Feedback tables not available. Run migrations.</p>
      </div>
    )
  }

  const [openCount, p0p1Count, recent] = await Promise.all([
    db.feedback_entries.count({ where: { status: { in: ['OPEN', 'TRIAGED'] } } }),
    db.feedback_entries.count({ where: { type: 'BUG', severity: { in: ['P0', 'P1'] }, status: { in: ['OPEN', 'TRIAGED'] } } }),
    db.feedback_entries.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, type: true, status: true, severity: true, title: true, message: true, createdAt: true, ai_rating: true, nps_score: true, labels: true, email: true },
    }),
  ])

  // Comments for these tickets
  const commentMap: Record<string, Array<{ id: string; content: string; visibility: 'PUBLIC'|'INTERNAL'; createdAt: string }>> = {}
  try {
    const ids = recent.map((r: any) => r.id)
    if (ids.length) {
      const rows = await (prisma as any).feedback_comments.findMany({ where: { ticketId: { in: ids } }, orderBy: { createdAt: 'desc' }, take: 200 })
      for (const c of rows) {
        if (!commentMap[c.ticketId]) commentMap[c.ticketId] = []
        commentMap[c.ticketId]!.push({ id: c.id, content: c.content, visibility: c.visibility, createdAt: c.createdAt })
      }
    }
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Feedback</h1>
        <p className="text-gray-600">Triage and review user feedback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-brand-primary/20">
          <CardHeader className="pb-2 bg-brand-secondary/30">
            <CardTitle className="text-sm font-medium text-brand-primary">Open / Triaged</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-brand-primary">{openCount}</div>
          </CardContent>
        </Card>
        <Card className="border-brand-primary/20">
          <CardHeader className="pb-2 bg-brand-secondary/30">
            <CardTitle className="text-sm font-medium text-brand-primary">P0/P1 Bugs</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{p0p1Count}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-brand-primary/20">
        <CardHeader className="pb-2 bg-brand-secondary/30">
          <CardTitle className="text-sm font-medium text-brand-primary">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-2 py-2">When</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Severity</th>
                  <th className="px-2 py-2">Title / Message</th>
                  <th className="px-2 py-2">Signals</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-2 py-2 text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-2 py-2">
                      <Badge className="bg-brand-primary/10 text-brand-primary">{r.type}</Badge>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-xs px-2 py-1 rounded bg-gray-100">{r.status}</span>
                    </td>
                    <td className="px-2 py-2">
                      {r.severity ? (
                        <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">{r.severity}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 max-w-[520px]">
                      <div className="font-medium truncate">{r.title || (r.message || '').slice(0, 80)}</div>
                      <div className="text-gray-500 truncate">{(r.message || '').slice(0, 140)}</div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-2 items-center">
                        {r.ai_rating && (
                          <span className={`text-xs px-2 py-1 rounded ${r.ai_rating === 'UP' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>AI: {r.ai_rating}</span>
                        )}
                        {typeof r.nps_score === 'number' && (
                          <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">NPS: {r.nps_score}</span>
                        )}
                        {Array.isArray(r.labels) && r.labels.slice(0,2).map((l: string) => (
                          <span key={l} className="text-xs px-2 py-1 rounded bg-gray-100">{l}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-2">
                        <form action={async () => { 'use server'; await setStatus(r.id, r.status === 'OPEN' ? 'TRIAGED' : 'IN_PROGRESS') }}>
                          <Button size="sm" variant="outline">Advance</Button>
                        </form>
                        {r.type === 'BUG' && !r.severity && (
                          <div className="flex gap-1">
                            <form action={async () => { 'use server'; await setSeverity(r.id, 'P1') }}><Button size="sm" variant="outline">P1</Button></form>
                            <form action={async () => { 'use server'; await setSeverity(r.id, 'P2') }}><Button size="sm" variant="outline">P2</Button></form>
                          </div>
                        )}
                        <form action={deleteEntry}>
                          <input type="hidden" name="id" value={r.id} />
                          <Button size="sm" variant="outline" className="text-red-600 border-red-300">Delete</Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Manage section */}
            <div className="divide-y">
              {recent.map((r: any) => (
                <div key={r.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-brand-primary">Manage: {r.title || r.id}</div>
                    <div className="text-xs text-gray-500">{r.email ? `Email: ${r.email}` : 'Anonymous'}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <form action={updateEntry} className="space-y-2 md:col-span-2">
                      <input type="hidden" name="id" value={r.id} />
                      <div>
                        <label className="text-xs text-gray-500">Title</label>
                        <Input name="title" defaultValue={r.title || ''} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Message</label>
                        <Textarea name="message" defaultValue={r.message || ''} rows={3} />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Status</label>
                          <Input name="status" defaultValue={r.status} placeholder="OPEN|TRIAGED|IN_PROGRESS|RESOLVED|CLOSED" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Severity</label>
                          <Input name="severity" defaultValue={r.severity || ''} placeholder="P0|P1|P2|P3" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Labels (comma separated)</label>
                          <Input name="labels" defaultValue={(r.labels || []).join(', ')} />
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Save</Button>
                    </form>
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">Comments</div>
                      <div className="max-h-40 overflow-y-auto border rounded p-2 bg-white">
                        {(commentMap[r.id] || []).map((c) => (
                          <div key={c.id} className="text-xs mb-2">
                            <span className={`px-1 rounded mr-1 ${c.visibility === 'PUBLIC' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>{c.visibility}</span>
                            <span className="text-gray-500 mr-2">{new Date(c.createdAt).toLocaleString()}</span>
                            <span className="text-gray-800">{c.content}</span>
                          </div>
                        ))}
                        {(!commentMap[r.id] || commentMap[r.id].length === 0) && (
                          <div className="text-xs text-gray-400">No comments yet.</div>
                        )}
                      </div>
                      <form action={addComment} className="space-y-2">
                        <input type="hidden" name="ticketId" value={r.id} />
                        <Textarea name="content" placeholder="Add a note or a reply..." rows={3} />
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-gray-500">Visibility:</label>
                          <select name="visibility" className="text-xs border rounded px-2 py-1">
                            <option value="INTERNAL">INTERNAL</option>
                            <option value="PUBLIC">PUBLIC</option>
                          </select>
                          {r.email && (
                            <label className="text-xs text-gray-700 inline-flex items-center gap-1">
                              <input type="checkbox" name="sendEmail" /> Send email to user
                            </label>
                          )}
                          <Button size="sm" variant="outline">Post</Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
