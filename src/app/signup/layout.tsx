// src/app/signup/layout.tsx
// The page is a client component, so its head metadata lives here.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'Create a free Massimino account to log workouts, follow evidence-based programmes and train with verified coaches.',
  alternates: { canonical: '/signup' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
