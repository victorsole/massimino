// src/app/layout.tsx

import './globals.css'
import Layout from '@/components/layout/Layout'
import SessionProvider from '@/components/providers/SessionProvider'
import Script from 'next/script'

export const metadata = {
  title: 'Massimino - Safe Workouts for Everyone',
  description: 'The safety-first fitness community platform where trainers and athletes connect, track workouts, and achieve goals together.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-brand-secondary">
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
