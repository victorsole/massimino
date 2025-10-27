// src/app/admin/moderation/media_queue/page.tsx
import Link from 'next/link'
import { prisma } from '@/core/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/core'

export const dynamic = 'force-dynamic'

async function moderate(mediaId: string, action: string, payload: any = {}) {
  'use server'
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/workout/media/${mediaId}/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(j?.error || 'Moderation failed')
  }
}

export default async function MediaQueuePage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return <div className="p-6">Unauthorized</div>
  }

  const q = typeof searchParams?.q === 'string' ? searchParams!.q : ''
  const status = (typeof searchParams?.status === 'string' ? searchParams!.status : 'pending').toLowerCase()
  const page = Math.max(parseInt((searchParams?.page as string) || '1', 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt((searchParams?.pageSize as string) || '24', 10) || 24, 1), 100)
  const skip = (page - 1) * pageSize

  const where: any = {}
  if (status !== 'all') where.status = status.toUpperCase()
  if (q) {
    where.OR = [
      { url: { contains: q, mode: 'insensitive' } },
      { provider: { contains: q, mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
      { users: { name: { contains: q, mode: 'insensitive' } } as any },
      { exercises: { name: { contains: q, mode: 'insensitive' } } as any },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.exercise_media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: { exercises: { select: { id: true, name: true, category: true } }, users: { select: { id: true, name: true, email: true } } },
    }),
    prisma.exercise_media.count({ where }),
  ])
  const totalPages = Math.max(Math.ceil(total / pageSize), 1)

  const mkHref = (patch: Record<string, string | number>) => {
    const sp = new URLSearchParams()
    const ns = { q, status, page, pageSize, ...patch }
    Object.entries(ns).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      sp.set(k, String(v))
    })
    return `/admin/moderation/media_queue?${sp.toString()}`
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Exercise Media Queue</h1>
      <form className="flex flex-wrap gap-2 items-center" action="/admin/moderation/media_queue" method="get">
        <input type="text" name="q" defaultValue={q} placeholder="Search (url, provider, user, exercise)" className="border rounded px-3 py-2 w-64" />
        <select name="status" defaultValue={status} className="border rounded px-3 py-2">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select name="pageSize" defaultValue={String(pageSize)} className="border rounded px-3 py-2">
          {[24,48,96].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
        <button type="submit" className="px-3 py-2 bg-gray-800 text-white rounded">Apply</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => {
          const validate = (url: string, provider: string) => {
            const u = url.toLowerCase()
            const p = provider.toLowerCase()
            let ok = false
            let reason = ''
            let thumb: string | undefined
            if (p === 'youtube') {
              const m = u.match(/(?:v=|youtu\.be\/)\w{6,}/)
              const id = m ? (m[0].split('v=').pop() || '').replace('youtu.be/','') : ''
              ok = /youtube\.com|youtu\.be/.test(u)
              if (id) thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`
              if (!ok) reason = 'URL not YouTube'
            } else if (p === 'instagram') {
              ok = /instagram\.com\//.test(u)
              reason = ok ? '' : 'URL not Instagram'
            } else if (p === 'tiktok') {
              ok = /tiktok\.com\//.test(u)
              reason = ok ? '' : 'URL not TikTok'
            } else {
              ok = /^https?:\/\//.test(u)
              reason = ok ? '' : 'Invalid URL'
            }
            return { ok, reason, thumb }
          }
          const { ok, reason, thumb } = validate(item.url, item.provider)
          const preview = item.thumbnailUrl || thumb
          return (
          <div key={item.id} className="border rounded p-4 space-y-3">
            <div className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleString()}</div>
            <div className="font-medium">{item.exercises?.name || 'Custom Exercise'}</div>
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <span>Provider: {item.provider}</span>
              <span>• Status: {item.status}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ok ? 'valid' : reason || 'invalid'}</span>
            </div>
            {preview && (
              <div className="relative w-full aspect-video bg-gray-50 overflow-hidden rounded">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            )}
            <div className="text-xs truncate">URL: <a href={item.url} target="_blank" className="text-blue-600 underline">{item.url}</a></div>
            <div className="text-xs text-gray-600">User: {item.users?.name || item.userId}</div>
            <div className="flex gap-2">
              <form action={async () => { 'use server'; await moderate(item.id, 'approve', { visibility: 'public' }) }}>
                <button className="px-3 py-1 bg-green-600 text-white rounded" type="submit">Approve</button>
              </form>
              <form action={async () => { 'use server'; await moderate(item.id, 'reject', { visibility: 'private' }) }}>
                <button className="px-3 py-1 bg-red-600 text-white rounded" type="submit">Reject</button>
              </form>
              <form action={async () => { 'use server'; await moderate(item.id, 'feature', {}) }}>
                <button className="px-3 py-1 bg-amber-600 text-white rounded" type="submit">Feature</button>
              </form>
            </div>
          </div>
        )})}
        {items.length === 0 && <div className="text-gray-600">No results</div>}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-gray-600">Page {page} / {totalPages} • Total {total.toLocaleString()}</div>
        <div className="flex items-center gap-2">
          <Link href={mkHref({ page: 1 })} className="px-3 py-1 border rounded">First</Link>
          <Link href={mkHref({ page: Math.max(1, page-1) })} className="px-3 py-1 border rounded">Prev</Link>
          <Link href={mkHref({ page: Math.min(totalPages, page+1) })} className="px-3 py-1 border rounded">Next</Link>
          <Link href={mkHref({ page: totalPages })} className="px-3 py-1 border rounded">Last</Link>
        </div>
      </div>
    </div>
  )
}
