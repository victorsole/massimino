// src/app/contact/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Contact | Massimino',
  description: 'How to reach the Massimino team for support, privacy requests, safety reports and partnerships.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Card className="border-l-4 border-l-brand-primary">
        <CardHeader>
          <CardTitle>Contact us</CardTitle>
          <CardDescription>Massimino is built and run by Beresol BV.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-gray-800 text-[15px]">
          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Email</h2>
            <p>
              <a href="mailto:hello@beresol.eu" className="text-brand-primary hover:underline">
                hello@beresol.eu
              </a>{' '}
              for support, account and privacy requests. We reply within two working days.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Phone</h2>
            <p>
              <a href="tel:+32493365423" className="text-brand-primary hover:underline">
                +32 493 36 54 23
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Address</h2>
            <p>Zonnewende 181, 7325 EP Apeldoorn, Netherlands</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Looking for something specific?</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Gyms, brands and advertisers: see{' '}
                <Link href="/partnerships" className="text-brand-primary hover:underline">Partnerships</Link>.
              </li>
              <li>
                Reporting unsafe behaviour: read the{' '}
                <Link href="/safety" className="text-brand-primary hover:underline">Safety Guidelines</Link>{' '}
                and email us with the details.
              </li>
              <li>
                How we handle your data: see the{' '}
                <Link href="/privacy" className="text-brand-primary hover:underline">Privacy Policy</Link>.
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
