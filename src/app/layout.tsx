// src/app/layout.tsx

import './globals.css'
import Layout from '@/components/layout/Layout'
import SessionProvider from '@/components/providers/SessionProvider'
import Script from 'next/script'

export const metadata = {
  title: 'Massimino - Safe Workouts for Everyone',
  description: 'The safety-first fitness community platform where trainers and athletes connect, track workouts, and achieve goals together.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap" rel="stylesheet" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt" />
      </head>
      <body className="antialiased bg-brand-secondary font-sans">
        <SessionProvider>
          <Layout>
            {children}
          </Layout>
        </SessionProvider>
        {/* Facebook SDK */}
        <Script
          id="facebook-sdk-loader"
          src="https://connect.facebook.net/en_US/sdk.js"
          strategy="afterInteractive"
          async
          defer
          crossOrigin="anonymous"
        />
        <Script
          id="facebook-sdk-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.fbAsyncInit = function() {
                FB.init({
                  appId: '${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? ''}',
                  cookie: true,
                  xfbml: true,
                  version: 'v18.0'
                });
                if (FB && FB.AppEvents) {
                  FB.AppEvents.logPageView();
                }
              };
            `,
          }}
        />
      </body>
    </html>
  )
}
