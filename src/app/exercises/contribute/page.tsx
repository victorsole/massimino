// src/app/exercises/contribute/page.tsx
"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import MediaLeaderboard from '@/components/leaderboards/media_leaderboard'

type PriorityItem = { id: string; name: string; category: string; muscleGroups: string[]; difficulty: string; priorityScore: number }

export default function ContributePage() {
  const [loading, setLoading] = useState(true)
  const [priority, setPriority] = useState<PriorityItem[]>([])
  const [coverage, setCoverage] = useState<{ filled: number; total: number }>({ filled: 0, total: 0 })

  useEffect(() => {
    let ignore = false
    async function run() {
      setLoading(true)
      try {
        const [prioRes, exRes] = await Promise.all([
          fetch('/api/workout/exercises/priority?limit=20', { cache: 'no-store' }),
          fetch('/api/workout/exercises?include=mediaCount', { cache: 'no-store' }),
        ])
        const prio = prioRes.ok ? await prioRes.json() : { items: [] }
        const ex = exRes.ok ? await exRes.json() : []
        if (ignore) return
        setPriority(prio.items || [])
        const total = Array.isArray(ex) ? ex.length : 0
        const filled = Array.isArray(ex) ? ex.filter((e: any) => (e.mediaCount || 0) > 0).length : 0
        setCoverage({ filled, total })
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    run()
    return () => { ignore = true }
  }, [])

  const pct = useMemo(() => coverage.total > 0 ? Math.round((coverage.filled / coverage.total) * 100) : 0, [coverage])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero */}
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
        <h1 className="text-3xl font-bold mb-2">Fill the Gym — Help Build the Best Exercise Library</h1>
        <p className="text-white/90 mb-6">Contribute exercise videos and earn XP, achievements, and partner rewards.</p>
        <div className="flex items-center gap-4">
          <Link href="/exercises" className="px-4 py-2 bg-white text-blue-700 font-semibold rounded">Start Contributing</Link>
          <div className="text-sm">
            <div className="font-semibold">Coverage Progress</div>
            <div className="w-64 bg-white/20 rounded h-2 mt-1">
              <div className="bg-white rounded h-2" style={{ width: `${pct}%` }}></div>
            </div>
            <div className="text-white/90 mt-1">{coverage.filled} / {coverage.total} exercises completed ({pct}%)</div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader><CardTitle>How It Works</CardTitle></CardHeader>
        <CardContent>
          <ol className="list-decimal pl-6 space-y-1 text-gray-700">
            <li>Browse exercises needing media (see high-priority list below).</li>
            <li>Find or record a video on YouTube, Instagram, or TikTok.</li>
            <li>Open the exercise in the database and click “+ Media” to submit.</li>
            <li>Earn XP and unlock achievements when your media is approved.</li>
          </ol>
        </CardContent>
      </Card>

      {/* High-priority exercises */}
      <Card>
        <CardHeader className="flex items-center justify-between"><CardTitle>High-Priority Exercises</CardTitle>
          <Link href="/exercises" className="text-blue-600 hover:underline">Go to Exercises</Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-gray-500 py-4">Loading…</div>
          ) : priority.length === 0 ? (
            <div className="text-sm text-gray-500 py-4">No high-priority items found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {priority.map(item => (
                <div key={item.id} className="border rounded p-4">
                  <div className="font-semibold leading-tight">{item.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{item.category} • {item.difficulty}</div>
                  <div className="mt-2 text-xs text-gray-600">Priority Score: {item.priorityScore}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Link href={`/exercises?exerciseId=${encodeURIComponent(item.id)}&openMedia=1`} className="px-3 py-1 border rounded">Contribute Now</Link>
                    <Button variant="ghost" asChild><a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.name)}`} target="_blank" rel="noopener noreferrer">Search YouTube</a></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <MediaLeaderboard initially="monthly" />

      {/* FAQs */}
      <Card>
        <CardHeader><CardTitle>FAQs</CardTitle></CardHeader>
        <CardContent className="text-gray-700">
          <div className="space-y-2">
            <div>
              <div className="font-semibold">How do I submit media?</div>
              <div>Open the exercise in the database and click “+ Media”, then paste your link.</div>
            </div>
            <div>
              <div className="font-semibold">How long does approval take?</div>
              <div>Approvals are manual and typically processed within a few days.</div>
            </div>
            <div>
              <div className="font-semibold">What if my media is rejected?</div>
              <div>You can resubmit with updated links. Ensure content follows guidelines.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
