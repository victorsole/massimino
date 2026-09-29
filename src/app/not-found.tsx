import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found | Massimino',
  robots: { index: false },
};

const suggestions = [
  { href: '/exercises', label: 'Exercise library' },
  { href: '/workout-log?tab=programs', label: 'Training programmes' },
  { href: '/fitness-intelligence', label: 'Fitness Intelligence' },
  { href: '/contact', label: 'Contact us' },
];

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#fcfaf5] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <p className="font-display text-6xl font-bold text-[#2b5069] mb-2">404</p>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">This page could not be found</h1>
        <p className="font-body text-gray-600 mb-6">
          The link may be old or mistyped. Here are some places to start instead.
        </p>
        <ul className="flex flex-wrap justify-center gap-2 mb-8">
          {suggestions.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="inline-block rounded-full border border-[#2b5069]/20 bg-white px-4 py-1.5 text-sm text-[#2b5069] hover:border-[#2b5069]/50"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#2b5069] text-white px-5 py-2.5 rounded-lg font-display text-sm uppercase tracking-wider hover:bg-[#1e3d52] transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
