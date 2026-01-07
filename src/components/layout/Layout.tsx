'use client';

import { useSession } from 'next-auth/react';
import Header from './Header';
import Footer from './Footer';
import DynamicBackground from './dynamic_background';
import { CookieConsent } from '@/components/ui/cookie_consent';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Dynamic User Background */}
      <DynamicBackground />

      {/* Content with higher z-index */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header user={session?.user || undefined} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
}
