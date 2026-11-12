// src/app/workout-log/layout.tsx
// The page is a client component, so its head metadata lives here.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workout Log',
  description: 'Track your workouts, follow programmes and see coach feedback in the Massimino Workout Log.',
  alternates: { canonical: '/workout-log' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
