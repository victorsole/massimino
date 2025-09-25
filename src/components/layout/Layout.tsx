'use client';

import { useSession } from 'next-auth/react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={session?.user || undefined} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
