'use client';

// src/app/oauth/authorize/consent_form.tsx
// The Allow and Cancel buttons of the consent screen. The answer is posted to the server,
// which replies with the address to send the browser to.

import { useState } from 'react';

export function ConsentForm({ params }: { params: Record<string, string> }) {
  const [busy, setBusy] = useState<'allow' | 'cancel' | null>(null);
  const [error, setError] = useState('');

  async function answer(allow: boolean) {
    setBusy(allow ? 'allow' : 'cancel');
    setError('');
    try {
      const res = await fetch('/api/oauth/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ params, allow }) });
      const json = await res.json().catch(() => null);
      const target = json?.data?.redirect;
      if (!res.ok || typeof target !== 'string') throw new Error(json?.error?.message || 'Massimino could not record your answer. Please try again.');
      window.location.assign(target);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Something went wrong. Please try again.');
      setBusy(null);
    }
  }

  const base = 'inline-flex flex-1 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-60';
  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" disabled={busy !== null} onClick={() => answer(true)} className={`${base} bg-brand-primary text-white hover:bg-primary-hover`}>
          {busy === 'allow' ? 'Connecting…' : 'Allow'}
        </button>
        <button type="button" disabled={busy !== null} onClick={() => answer(false)} className={`${base} border border-brand-primary/30 bg-card text-brand-primary hover:bg-brand-primary/5`}>
          {busy === 'cancel' ? 'Cancelling…' : 'Cancel'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
