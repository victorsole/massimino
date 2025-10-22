import { prisma } from '@/core/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdsMetricsSection() {
  try {
    const impressions = await (prisma as any).ad_events.groupBy({
      by: ['placement'],
      where: { event: 'IMPRESSION' as any },
      _count: { _all: true },
    });
    const clicks = await (prisma as any).ad_events.groupBy({
      by: ['placement'],
      where: { event: 'CLICK' as any },
      _count: { _all: true },
    });
    const map = new Map<string, { impressions: number; clicks: number }>();
    for (const r of impressions) map.set(r.placement as any, { impressions: (r as any)._count._all, clicks: 0 });
    for (const r of clicks) {
      const key = r.placement as any;
      const prev = map.get(key) || { impressions: 0, clicks: 0 };
      map.set(key, { impressions: prev.impressions, clicks: (r as any)._count._all });
    }
    const rows = Array.from(map.entries()).map(([placement, v]) => ({
      placement,
      impressions: v.impressions,
      clicks: v.clicks,
      ctr: v.impressions > 0 ? ((v.clicks / v.impressions) * 100).toFixed(2) + '%' : '0.00%',
    }));

    return (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-sm text-amber-700">CTR by Placement</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 && <div className="text-sm text-gray-500">No ad events yet.</div>}
          {rows.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {rows.map((p) => (
                <div key={p.placement} className="px-3 py-2 rounded border bg-white">
                  <div className="text-xs text-gray-500 uppercase">{p.placement}</div>
                  <div className="text-sm">{p.ctr} <span className="text-xs text-gray-500">({p.clicks}/{p.impressions})</span></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  } catch {
    return (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-sm text-amber-700">CTR by Placement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Ad events table not available (run DB migrations).</div>
        </CardContent>
      </Card>
    )
  }
}

