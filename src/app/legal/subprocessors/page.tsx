// src/app/legal/subprocessors/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Subprocessors • Massimino',
  description: 'Current list of Massimino’s data subprocessors and purposes.',
}

export default function SubprocessorsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle>Subprocessors</CardTitle>
          <CardDescription>
            Third‑party service providers that process personal data on our behalf
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-gray-800">
          <p className="text-[15px]">
            We engage the following subprocessors to deliver the Platform. Each subprocessor is bound by a data
            processing agreement and appropriate transfer safeguards. We will update this page when we add or
            replace subprocessors where required by law or contract.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-3 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 border">Subprocessor</th>
                  <th className="text-left p-2 border">Purpose</th>
                  <th className="text-left p-2 border">Data Location</th>
                  <th className="text-left p-2 border">Safeguards</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border">Vercel, Inc.</td>
                  <td className="p-2 border">Application hosting, serverless functions, CDN</td>
                  <td className="p-2 border">EU/Global (provider network)</td>
                  <td className="p-2 border">DPA, SCCs, security certifications</td>
                </tr>
                <tr>
                  <td className="p-2 border">Supabase</td>
                  <td className="p-2 border">Managed PostgreSQL database and pooling</td>
                  <td className="p-2 border">EU (Paris region)</td>
                  <td className="p-2 border">DPA, EU data residency, SCCs as applicable</td>
                </tr>
                <tr>
                  <td className="p-2 border">OpenAI, L.L.C.</td>
                  <td className="p-2 border">LLM inference for Massichat (AI assistant)</td>
                  <td className="p-2 border">US</td>
                  <td className="p-2 border">DPA, SCCs; no training on API data</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[15px]">
            OAuth providers (e.g., Google, LinkedIn) act as independent controllers when used for sign‑in and are
            not Massimino subprocessors. DNS and domain management (IONOS) does not process platform user data.
          </p>

          <p className="text-[15px]">
            Questions about this list? Contact us at
            {' '}<a href="mailto:privacy@massimino.fitness" className="text-blue-600 hover:underline">privacy@massimino.fitness</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

