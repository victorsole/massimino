'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import DynamicBackground from './dynamic_background';
import { CookieConsent } from '@/components/ui/cookie_consent';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

interface LayoutProps {
  children: React.ReactNode;
}

// Routes that always use the public layout (no dashboard shell)
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/privacy',
  '/terms',
  '/safety',
  '/cookies',
  '/contact',
  '/forgot-password',
  '/reset-password',
  '/legal',
  '/unauthorized',
  '/accept-invitation',
  '/team_invite',
  '/bio',
  '/trainer',
];

function isPublicRoute(pathname: string): boolean {
  // Exact match for landing page
  if (pathname === '/') return true;
  // Prefix match for other public routes
  return publicRoutes.some(route => route !== '/' && pathname.startsWith(route));
}

export default function Layout({ children }: LayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard routes use their own layout.tsx shell already
  if (pathname?.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // Logged-in users on app pages get the dashboard shell
  const shell = Boolean(session?.user && pathname && !isPublicRoute(pathname));

  // One tree for both layouts. The page ({children}) always sits at the same place
  // (root div > content div > main), so when the session arrives and the public layout
  // turns into the app shell, React keeps the page mounted. With two separate trees the
  // page was unmounted and mounted again, which fired every data request a second time.
  return (
    <div className={shell ? 'min-h-screen bg-brand-secondary flex font-sans' : 'min-h-screen flex flex-col relative'}>
      {shell ? (
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden transition-opacity"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <DashboardSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            userRole={session?.user?.role as string | undefined}
            userName={session?.user?.name || ''}
            userImage={session?.user?.image || ''}
          />
        </>
      ) : (
        <DynamicBackground />
      )}

      {/* Content column */}
      <div
        className={
          shell
            ? 'flex-1 min-w-0 lg:ml-[200px] md:ml-[70px] ml-0 min-h-screen flex flex-col transition-[margin] duration-300 overflow-x-clip'
            : 'relative z-10 flex flex-col min-h-screen'
        }
      >
        {shell ? (
          <DashboardHeader
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            userName={session?.user?.name || ''}
            userImage={session?.user?.image || ''}
            userId={session?.user?.id}
          />
        ) : (
          <Header user={session?.user || undefined} sessionLoading={status === 'loading' && !!pathname && !isPublicRoute(pathname)} />
        )}
        <main className={shell ? 'flex-1 p-4 sm:p-5 md:p-6 lg:p-8' : 'flex-1'}>
          {children}
        </main>
        {shell ? null : <Footer />}
      </div>

      {/* Mobile FAB (app shell only) */}
      {shell ? (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-[#2b5069] text-white shadow-lg shadow-[#2b5069]/25 z-[60] flex items-center justify-center md:hidden hover:bg-[#1e3a4d] active:scale-95 transition-all"
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      ) : null}

      <CookieConsent />
    </div>
  );
}
