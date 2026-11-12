// src/app/massiminos/layout.tsx
// The page is a client component, so its head metadata lives here.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Discover fitness enthusiasts and trainers near you on Massimino, filtered by role, experience and goals.',
  alternates: { canonical: '/massiminos' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
