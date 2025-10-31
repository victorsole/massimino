// src/app/cookies/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Cookie Policy • Massimino',
  description: 'Learn about cookies used on Massimino and manage your preferences.',
}

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle>Cookie Policy</CardTitle>
          <CardDescription>
            What cookies we use, why we use them, and how you can control them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-gray-800">
          <p className="text-[15px]">
            Cookies are small text files stored on your device. We use cookies and similar technologies to
            keep you signed in, protect your account, improve performance, and remember your preferences.
            You can change your preferences at any time in your browser settings or by using the cookie
            controls described below.
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-2">Cookie Categories</h2>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Strictly Necessary</strong> — required for core functionality such as authentication and security. These cannot be disabled.</li>
              <li><strong>Preferences</strong> — remember choices like language or UI settings.</li>
              <li><strong>Analytics</strong> — help us understand usage and improve performance (set only with your consent in applicable regions).</li>
              <li><strong>Marketing</strong> — measure campaign effectiveness (set only with your consent; currently limited or unused).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-2">Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm mt-3 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 border">Name</th>
                    <th className="text-left p-2 border">Provider</th>
                    <th className="text-left p-2 border">Category</th>
                    <th className="text-left p-2 border">Purpose</th>
                    <th className="text-left p-2 border">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border break-all">next-auth.session-token / __Secure-next-auth.session-token</td>
                    <td className="p-2 border">Massimino</td>
                    <td className="p-2 border">Strictly Necessary</td>
                    <td className="p-2 border">Maintains your authenticated session securely.</td>
                    <td className="p-2 border">Session or up to 30 days</td>
                  </tr>
                  <tr>
                    <td className="p-2 border break-all">next-auth.csrf-token</td>
                    <td className="p-2 border">Massimino</td>
                    <td className="p-2 border">Strictly Necessary</td>
                    <td className="p-2 border">Protects against cross‑site request forgery during sign‑in.</td>
                    <td className="p-2 border">Session</td>
                  </tr>
                  <tr>
                    <td className="p-2 border break-all">cookies-consent</td>
                    <td className="p-2 border">Massimino</td>
                    <td className="p-2 border">Preferences</td>
                    <td className="p-2 border">Stores your cookie choices (e.g., analytics on/off).</td>
                    <td className="p-2 border">6–12 months</td>
                  </tr>
                  <tr>
                    <td className="p-2 border break-all">locale / ui-preferences</td>
                    <td className="p-2 border">Massimino</td>
                    <td className="p-2 border">Preferences</td>
                    <td className="p-2 border">Remembers language and interface settings.</td>
                    <td className="p-2 border">Up to 12 months</td>
                  </tr>
                  {/* Add analytics/marketing rows here if/when enabled (e.g., _ga) */}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">Note: Actual names and durations may vary by environment and security settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-2">Managing Cookies</h2>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Browser controls</strong>: You can block or delete cookies in your browser settings. This may impact site functionality.
              </li>
              <li>
                <strong>Preferences</strong>: If a cookie banner or settings panel is shown, use it to toggle non‑essential cookies at any time.
              </li>
              <li>
                <strong>Do Not Track</strong>: Where supported, we honor applicable regional requirements for tracking preferences.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-2">Contact</h2>
            <p className="mt-2 text-[15px]">
              Questions about this Cookie Policy? Contact us at
              {' '}<a href="mailto:helloberesol@gmail.com" className="text-blue-600 hover:underline">privacy@massimino.fitness</a>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}

