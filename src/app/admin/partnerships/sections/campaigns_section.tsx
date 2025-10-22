import { prisma } from '@/core/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createCampaign, submitCreative, approveCreative, rejectCreative, pauseCampaign, resumeCampaign } from '../actions'

export default async function CampaignsSection() {
  let campaigns: any[] = []
  try {
    campaigns = await prisma.ad_campaigns.findMany({ include: { ad_creatives: true }, orderBy: { createdAt: 'desc' } })
  } catch {
    return (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-sm text-amber-700">Ads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Ads tables not available (run DB migrations).</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-sm text-amber-700">Create Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCampaign} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input name="partnerId" placeholder="Partner ID" required />
            <Input name="name" placeholder="Campaign Name" required />
            <Input name="objective" placeholder="Objective (optional)" />
            <Input name="budgetCents" placeholder="Budget (cents)" />
            <Input type="datetime-local" name="startAt" placeholder="Start" />
            <Input type="datetime-local" name="endAt" placeholder="End" />
            <Input name="placements" placeholder="placements (comma) e.g. feed,workout" />
            <Textarea name="targeting" placeholder='Targeting JSON (e.g. {"goals":["hypertrophy"]})' className="md:col-span-3" />
            <div className="md:col-span-3"><Button variant="outline" type="submit">Create Campaign</Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {campaigns.map((c) => (
          <Card key={c.id} className="border-amber-200">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {c.name}
                  <Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'} className={c.status === 'PAUSED' ? 'bg-gray-200 text-gray-800' : ''}>{c.status}</Badge>
                </CardTitle>
                <div className="text-xs text-gray-600">Impr {c.impressions} / Clicks {c.clicks} • CTR {c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0.00'}%</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <form action={pauseCampaign}><input type="hidden" name="id" value={c.id} /><Button size="sm" variant="outline">Pause</Button></form>
                <form action={resumeCampaign}><input type="hidden" name="id" value={c.id} /><Button size="sm" variant="outline">Resume</Button></form>
              </div>
              <div className="text-xs text-gray-600 mb-2 flex flex-wrap gap-2 items-center">
                Placements:
                {(c.placements || []).map((p: string) => (
                  <Badge key={p} variant="secondary" className="uppercase">{p}</Badge>
                ))}
              </div>
              <div className="text-xs text-gray-600 mb-1">
                Budget: {typeof c.budgetCents === 'number' ? `€${(c.budgetCents/100).toFixed(2)}` : '—'} • Spend: €{((c.spendCents || 0)/100).toFixed(2)}
                {typeof c.cpmCents === 'number' ? ` • CPM €${(c.cpmCents/100).toFixed(2)}` : ''}
                {typeof c.cpcCents === 'number' ? ` • CPC €${(c.cpcCents/100).toFixed(2)}` : ''}
              </div>
              {typeof c.budgetCents === 'number' && c.budgetCents > 0 && (
                <div className="w-full h-2 bg-gray-200 rounded overflow-hidden mb-3">
                  <div className="h-2 bg-amber-500" style={{ width: `${Math.min(100, Math.round(((c.spendCents || 0) / c.budgetCents) * 100))}%` }} />
                </div>
              )}
              <form action={submitCreative} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <input type="hidden" name="campaignId" value={c.id} />
                <Input name="type" placeholder="IMAGE|VIDEO|NATIVE" defaultValue="IMAGE" />
                <Input name="assetUrl" placeholder="Asset URL" />
                <Input name="clickUrl" placeholder="Click URL" />
                <Input name="title" placeholder="Title" />
                <Input name="cta" placeholder="CTA" />
                <Textarea name="body" placeholder="Body" className="md:col-span-3" />
                <div className="md:col-span-3"><Button size="sm" variant="outline" type="submit">Add Creative</Button></div>
              </form>
              <div className="space-y-2">
                {c.ad_creatives.map((cr: any) => (
                  <div key={cr.id} className="border rounded p-2 flex items-center justify-between">
                    <div className="text-sm">[{cr.status}] {cr.title || cr.assetUrl} • Impr {cr.impressions} / Clicks {cr.clicks} • CTR {cr.impressions > 0 ? ((cr.clicks / cr.impressions) * 100).toFixed(2) : '0.00'}%</div>
                    <div className="flex items-center gap-2">
                      <form action={approveCreative}><input type="hidden" name="id" value={cr.id} /><Button size="sm" variant="outline">Approve</Button></form>
                      <form action={rejectCreative}><input type="hidden" name="id" value={cr.id} /><Button size="sm" variant="outline" className="text-red-600 border-red-300">Reject</Button></form>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

