// src/app/layout.tsx

import './globals.css'
import type { Metadata } from 'next'
import Layout from '@/components/layout/Layout'
import SessionProvider from '@/components/providers/SessionProvider'
import Script from 'next/script'
import { Inter, Inter_Tight } from 'next/font/google'
import { ConsentGatedScripts } from '@/components/layout/consent_gated_scripts'
import { NotifyHost } from '@/components/ui/notify_host'

// Brand fonts are self-hosted by next/font (served from /_next/static), so no request
// goes to Google and the CSP needs no third-party font or style origins.
// Inter Tight for headings (font-display), Inter for body text (font-sans / font-body).
// Both are variable fonts, so every weight is available without listing them.
const interTight = Inter_Tight({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  variable: '--font-inter-tight',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  variable: '--font-inter',
  display: 'swap',
})

const siteDescription = 'The safety-first fitness community platform where trainers and athletes connect, track workouts, and achieve goals together.'

// Pages set only the first part of the title ("Safety Guidelines"); the template adds the brand.
// No canonical here: it would be inherited by every page. Each public page sets its own.
export const metadata: Metadata = {
  metadataBase: new URL('https://massimino.fitness'),
  title: {
    default: 'Massimino - Safe Workouts for Everyone',
    template: '%s | Massimino',
  },
  description: siteDescription,
  // Defaults for link previews; the image comes from src/app/opengraph-image.tsx
  openGraph: {
    type: 'website',
    siteName: 'Massimino',
    locale: 'en_US',
    title: 'Massimino - Safe Workouts for Everyone',
    description: siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Massimino - Safe Workouts for Everyone',
    description: siteDescription,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Massimino',
  },
  icons: {
    icon: [
      // Vector first: browsers that support SVG favicons get a sharp icon at any size
      { url: '/massimino_logo.svg', type: 'image/svg+xml' },
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
    <html lang="en" className={`${interTight.variable} ${inter.variable}`}>
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt" />
        {/* Icon font for the `mdi mdi-*` classes used across the app (self-hosted subset) */}
        <link rel="stylesheet" href="/fonts/mdi/mdi.css" />
      </head>
      <body className="antialiased bg-brand-secondary font-sans">
        <SessionProvider>
          <Layout>
            {children}
          </Layout>
        </SessionProvider>
        {/* Service worker: production only. In development the chunk URLs are not hashed,
            so a caching worker serves stale scripts and breaks hydration; there we remove
            any worker and cache left behind by an earlier run on the same origin. */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: process.env.NODE_ENV === 'production'
              ? `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `
              : `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  regs.forEach(function(reg) { reg.unregister(); });
                });
              }
              if ('caches' in window) {
                caches.keys().then(function(keys) {
                  keys.forEach(function(key) { caches.delete(key); });
                });
              }
            `,
          }}
        />
        <NotifyHost />
        <ConsentGatedScripts />
      </body>
    </html>
  )
}
