// src/app/page.tsx
// Server entry for the homepage so it can carry head metadata; the page itself
// is the client component in home_page.tsx.

import type { Metadata } from 'next';
import HomePage from './home_page';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function Page() {
  return <HomePage />;
}
