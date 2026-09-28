'use client';

import Script from 'next/script';
import { useCookieConsent } from '@/components/ui/cookie_consent';

/**
 * Third-party scripts that may only load after the visitor has consented.
 * Scripts cannot be unloaded once running, so withdrawing consent takes
 * full effect on the next page load.
 */
export function ConsentGatedScripts() {
  const consent = useCookieConsent();

  if (!consent?.marketing) return null;

  return (
    <>
      {/* Facebook SDK: fbAsyncInit must exist before the SDK loads */}
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
      <Script
        id="facebook-sdk-loader"
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
    </>
  );
}
