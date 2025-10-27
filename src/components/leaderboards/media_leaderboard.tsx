"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type LeaderboardEntry = {
  userId: string
  user?: { id: string; name: string | null; image?: string | null }
  rank: number
  score: number
  metrics: { approved?: number; featured?: number; rejected?: number }
}

type Timeframe = 'daily' | 'weekly' | 'monthly' | 'all_time'
type Metric = 'count' | 'quality'

export function MediaLeaderboard({ initially = 'monthly' as Timeframe }) {
  const [timeframe, setTimeframe] = useState<Timeframe>(initially)
  const [metric, setMetric] = useState<Metric>('count')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<LeaderboardEntry[]>([])

  const title = useMemo(() => (metric === 'quality' ? 'Quality Contributors' : 'Top Media Contributors'), [metric])

  useEffect(() => {
    let ignore = false
    async function run() {
      setLoading(true)
      try {
        const url = `/api/leaderboards?type=media&timeframe=${timeframe}&metric=${metric}&limit=10`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to load leaderboard')
        const data = await res.json()
        if (!ignore) setRows(data?.data?.leaderboard || [])
      } catch {
        if (!ignore) setRows([])
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    run()
    return () => { ignore = true }
  }, [timeframe, metric])

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 rounded p-1">
            {(['daily','weekly','monthly','all_time'] as Timeframe[]).map(tf => (
              <Button key={tf} size="sm" variant={timeframe===tf? 'default':'ghost'} onClick={()=>setTimeframe(tf)} className="mr-1 last:mr-0">
                {tf.replace('_',' ')}
              </Button>
            ))}
          </div>
          <div className="bg-gray-100 rounded p-1">
            <Button size="sm" variant={metric==='count'?'default':'ghost'} onClick={()=>setMetric('count')}>Count</Button>
            <Button size="sm" variant={metric==='quality'?'default':'ghost'} onClick={()=>setMetric('quality')}>Quality</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-gray-500 py-4">Loading leaderboard…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-500 py-4">No data available</div>
        ) : (
          <div className="divide-y">
            {rows.map((r) => (
              <div key={`${r.userId}-${r.rank}`} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center font-semibold">{r.rank}</div>
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                    {r.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.user.image} alt={r.user?.name || 'User'} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <div className="font-medium">{r.user?.name || 'User'}</div>
                    <div className="text-xs text-gray-500">
                      {metric==='quality' ? (
                        <>Score {r.score} • featured {r.metrics.featured||0} • approved {r.metrics.approved||0} • rejected {r.metrics.rejected||0}</>
                      ) : (
                        <>Contributions {r.score} • featured {r.metrics.featured||0}</>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MediaLeaderboard

