// src/app/exercises/layout.tsx
// The exercises page is a client component, so its metadata lives here.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Exercise Library | Massimino',
  description:
    'Browse the Massimino exercise library: movements by muscle group, equipment and difficulty, with form cues and safety guidance.',
  alternates: { canonical: '/exercises' },
}

export default function ExercisesLayout({ children }: { children: React.ReactNode }) {
  return children
}
