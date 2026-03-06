'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#fcfaf5] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#2b5069]" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#fcfaf5] flex font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={session.user?.role as string | undefined}
        userName={session.user?.name || ''}
        userImage={session.user?.image || ''}
      />

      {/* Main content area */}
      <div className="flex-1 min-w-0 lg:ml-[200px] md:ml-[70px] ml-0 min-h-screen flex flex-col transition-[margin] duration-300 overflow-x-hidden">
        <DashboardHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          userName={session.user?.name || ''}
          userImage={session.user?.image || ''}
          userId={session.user?.id}
        />
        <main className="flex-1 p-4 sm:p-5 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile FAB */}
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
    </div>
  );
}
