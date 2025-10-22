import { prisma } from '@/core/database'
import { createGymIntegration } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CreateGymIntegrationForm from '../create_gym_integration_form'

export default async function IntegrationsSection() {
  let integrations: any[] = []
  try {
    integrations = await prisma.gym_integrations.findMany({ orderBy: { createdAt: 'desc' } })
  } catch {
    integrations = []
  }
  return (
    <>
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-sm text-green-700">Create Gym Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateGymIntegrationForm action={createGymIntegration} />
          <div className="text-xs text-gray-500 mt-2">Note: API key is shown once. Keep it secure.</div>
        </CardContent>
      </Card>

      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-sm text-green-700">Gym Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 && <div className="text-sm text-gray-500">No integrations yet or table not available.</div>}
          <div className="space-y-2">
            {integrations.map((g) => (
              <div key={g.id} className="border rounded p-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                <div>
                  <div className="font-medium">{g.partnerId.slice(0,8)}… • {g.status}</div>
                  <div className="text-xs text-gray-500">{new Date(g.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-xs">Features: {(g.allowedFeatures || []).join(', ') || '—'}</div>
                <div className="text-xs truncate">Webhook: {g.webhookUrl || '—'}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

