// src/app/login/layout.tsx
// The page is a client component, so its head metadata lives here.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Massimino to continue your training, log workouts and see feedback from your coach.',
  alternates: { canonical: '/login' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
