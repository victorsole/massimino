import { prisma } from '@/core/database'
import { approveLead, rejectLead, convertLeadToPartner } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function LeadsSection() {
  let leads: any[] = []
  try {
    leads = await prisma.partner_leads.findMany({ orderBy: { createdAt: 'desc' } })
  } catch {
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-700">Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Leads table not available (run DB migrations).</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-sm text-blue-700">Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leads.length === 0 && <div className="text-sm text-gray-500">No leads yet.</div>}
          {leads.map((l) => (
            <div key={l.id} className="border rounded-md p-3 flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">{l.orgName} • <span className="uppercase text-xs">{l.type}</span></div>
                <div className="text-xs text-gray-600">{l.contactName} &lt;{l.email}&gt; • {new Date(l.createdAt).toLocaleString()}</div>
                <div className="text-xs">Status: {l.status}</div>
              </div>
              <div className="flex items-center gap-2">
                <form action={approveLead}><input type="hidden" name="id" value={l.id} /><Button variant="outline" size="sm">Approve</Button></form>
                <form action={rejectLead}><input type="hidden" name="id" value={l.id} /><Button variant="outline" size="sm" className="text-red-600 border-red-300">Reject</Button></form>
                <form action={convertLeadToPartner}><input type="hidden" name="id" value={l.id} /><Button variant="outline" size="sm">Convert</Button></form>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

