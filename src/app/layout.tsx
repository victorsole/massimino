// src/app/layout.tsx

import './globals.css'
import Layout from '@/components/layout/Layout'
import SessionProvider from '@/components/providers/SessionProvider'
import Script from 'next/script'
import { Nunito_Sans, Lato } from 'next/font/google'
import { ConsentGatedScripts } from '@/components/layout/consent_gated_scripts'

// Brand fonts are self-hosted by next/font (served from /_next/static), so no request
// goes to Google and the CSP needs no third-party font or style origins.
const nunitoSans = Nunito_Sans({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  axes: ['opsz', 'wdth', 'YTLC'],
  variable: '--font-nunito-sans',
  display: 'swap',
  // next/font has no metric overrides for Nunito Sans, so skip the generated fallback face
  adjustFontFallback: false,
})

const lato = Lato({
  subsets: ['latin', 'latin-ext'],
  weight: ['100', '300', '400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-lato',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL('https://massimino.fitness'),
  title: 'Massimino - Safe Workouts for Everyone',
  description: 'The safety-first fitness community platform where trainers and athletes connect, track workouts, and achieve goals together.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Massimino',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2b5069',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${nunitoSans.variable} ${lato.variable}`}>
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt" />
      </head>
      <body className="antialiased bg-brand-secondary font-sans">
        <SessionProvider>
          <Layout>
            {children}
          </Layout>
        </SessionProvider>
        {/* Service Worker Registration */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
        <ConsentGatedScripts />
      </body>
    </html>
  )
}
