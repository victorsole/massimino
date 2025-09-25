import { getPendingSafetyReports } from '@/core/database'
import { updateReportStatusAction } from './actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function ModerationPage() {
  const reports = await getPendingSafetyReports({ limit: 20 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Moderation Queue</h1>
        <p className="text-gray-600">Pending or investigating safety reports requiring review.</p>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Reported User</th>
              <th className="px-4 py-2 text-left">Violation</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Priority</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="px-4 py-2">
                  <div className="font-medium">{r.reportedUser?.name || r.reportedUserId}</div>
                  <div className="text-xs text-gray-500">{r.reportedUser?.role}</div>
                </td>
                <td className="px-4 py-2">{r.violationType}</td>
                <td className="px-4 py-2 max-w-[32rem]">
                  <div className="text-gray-700 whitespace-pre-wrap">{r.description}</div>
                </td>
                <td className="px-4 py-2">
                  <Badge className={r.priority === 'URGENT' ? 'bg-red-600' : r.priority === 'HIGH' ? 'bg-orange-600' : r.priority === 'MEDIUM' ? 'bg-yellow-600' : 'bg-gray-600'}>
                    {r.priority}
                  </Badge>
                </td>
                <td className="px-4 py-2">{r.status}</td>
                <td className="px-4 py-2">
                  <form action={updateReportStatusAction} className="flex flex-col gap-2">
                    <input type="hidden" name="reportId" value={r.id} />
                    <select name="status" defaultValue={r.status} className="border rounded px-2 py-1">
                      {['PENDING','INVESTIGATING','RESOLVED','DISMISSED'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <textarea name="resolution" placeholder="Resolution notes" className="border rounded px-2 py-1 min-w-[16rem]" />
                    <Button type="submit" size="sm">Update</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

