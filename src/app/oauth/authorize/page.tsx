// src/app/oauth/authorize/page.tsx
// The consent screen of the assistant sign-in: "<app> wants to read your workout log".
// A person arrives here from ChatGPT, Claude or another assistant app. They must already
// be signed in to Massimino in the normal way; if not, they are sent to /login and back.

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/core';
import { checkAuthorizeRequest } from '@/lib/mcp/oauth';
import { ConsentForm } from './consent_form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Connect an assistant', robots: { index: false, follow: false } };

type Params = Record<string, string | string[] | undefined>;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-brand-secondary px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-lg rounded-card bg-card p-8 shadow-soft sm:p-10">{children}</div>
    </div>
  );
}

export default async function AuthorizePage({ searchParams }: { searchParams: Params }) {
  // One value per parameter; a repeated parameter is taken as absent
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) if (typeof value === 'string') params[key] = value;

  const check = checkAuthorizeRequest(params);
  if (!check.ok) {
    // An error the app can handle goes back to it; anything else is explained here
    if (check.redirect) redirect(check.redirect);
    return (
      <Shell>
        <p className="landing-eyebrow text-brand-primary/70">Connect an assistant</p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-brand-primary">This link does not work</h1>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">{check.message}</p>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          Start again from your assistant app. The steps are on the{' '}
          <Link href="/mcp" className="font-semibold text-brand-primary underline-offset-4 hover:underline">
            MCP page
          </Link>
          .
        </p>
      </Shell>
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/oauth/authorize?${new URLSearchParams(params).toString()}`)}`);
  }

  const { client, request } = check;
  const returnHost = new URL(request.redirectUri).host;

  return (
    <Shell>
      <p className="landing-eyebrow text-brand-primary/70">Connect an assistant</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-brand-primary">
        Let <span className="break-words">{client.name}</span> read your workout log?
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-gray-600">
        You are signed in as <strong className="font-semibold text-gray-900">{session.user.name || session.user.email}</strong>.
      </p>

      <dl className="mt-6 divide-y divide-brand-primary/10 border-y border-brand-primary/10 text-sm">
        <div className="py-4">
          <dt className="font-semibold text-brand-primary">It will be able to</dt>
          <dd className="mt-1 leading-relaxed text-gray-600">Read the sets and sessions you logged: date, exercise, repetitions, weight and your notes.</dd>
        </div>
        <div className="py-4">
          <dt className="font-semibold text-brand-primary">It will not be able to</dt>
          <dd className="mt-1 leading-relaxed text-gray-600">Change or delete anything, see your email or password, or read anyone else&apos;s data.</dd>
        </div>
        <div className="py-4">
          <dt className="font-semibold text-brand-primary">After you allow, you return to</dt>
          <dd className="mt-1 break-all font-mono text-xs text-gray-900">{returnHost}</dd>
          <dd className="mt-2 leading-relaxed text-gray-600">Only continue if you started this from that app yourself. The name above is what the app calls itself; Massimino has not verified it.</dd>
        </div>
      </dl>

      <ConsentForm params={params} />

      <p className="mt-6 text-xs leading-relaxed text-gray-600">
        You can end this at any time: it appears in your key list on the{' '}
        <Link href="/developers#console" className="font-semibold text-brand-primary underline-offset-4 hover:underline">
          API page
        </Link>
        , where Revoke stops it at once.
      </p>
    </Shell>
  );
}
