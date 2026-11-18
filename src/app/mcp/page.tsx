// src/app/mcp/page.tsx
// How to connect an AI assistant (Claude, ChatGPT, others) to Massimino's MCP server.

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { TOOLS } from '@/lib/mcp/tools';
import { RATE_LIMIT, SITE_URL } from '@/lib/public-api/http';

export const metadata: Metadata = {
  title: 'MCP server',
  description:
    'Connect Claude, ChatGPT or any assistant that speaks the Model Context Protocol to Massimino\'s open fitness data: exercises, training programmes, public teams and Eurostat figures. One URL, no key.',
  alternates: { canonical: '/mcp' },
};

const ENDPOINT = `${SITE_URL}/api/mcp`;

const HOSTS = [
  {
    title: 'Claude',
    steps: ['Open Settings, then Connectors.', 'Choose "Add custom connector".', 'Name it Massimino and paste the URL.', 'Leave the OAuth fields empty and connect.'],
    note: 'In Claude Code, one command does it:',
    code: `claude mcp add --transport http massimino ${ENDPOINT}`,
  },
  {
    title: 'ChatGPT',
    steps: ['Open Settings, then Apps and Connectors.', 'Under Advanced, turn on Developer mode.', 'Create a connector, name it Massimino and paste the URL.', 'Set authentication to "No authentication" and create.'],
    note: 'Custom connectors need a paid ChatGPT plan. Search and fetch also work in deep research.',
    code: null,
  },
  {
    title: 'Other assistants',
    steps: ['Any client with Streamable HTTP transport works.', 'Give it the URL; no header is needed.', 'Cursor, VS Code, Gemini CLI and Mistral use a JSON or TOML entry with this URL.', 'The server is stateless and answers in JSON.'],
    note: 'A minimal entry for a JSON configuration file:',
    code: `{ "mcpServers": { "massimino": { "url": "${ENDPOINT}" } } }`,
  },
];

const FACTS = [
  { number: '01', title: 'No key needed', text: `About ${RATE_LIMIT.anonymous.maxRequests} requests a minute without a key, about ${RATE_LIMIT.keyed.maxRequests} with a free one from the API page.` },
  { number: '02', title: 'Read-only', text: 'Every tool only reads. Nothing an assistant does here can change Massimino or your account.' },
  { number: '03', title: 'The same open data', text: 'The tools serve exactly what the open API serves, with the same licences. Never members, emails or contact details.' },
  { number: '04', title: 'Your own log, if you choose', text: 'A key with the workout log permission adds one tool that reads the log of the account that owns the key, and nobody else\'s.' },
];

export default function McpPage() {
  return (
    <div className="bg-brand-secondary">
      {/* ── Hero ── */}
      <section className="bg-brand-primary-dark">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <p className="landing-eyebrow text-brand-secondary/75">Massimino MCP server</p>
          <h1 className="landing-title mt-4 max-w-4xl text-4xl text-white sm:text-5xl lg:text-6xl">Fitness data for your AI assistant</h1>
          <p className="landing-body mt-6 max-w-2xl text-lg text-brand-secondary/90">
            Add one URL to Claude or ChatGPT and it can look up exercises, read full training programmes and compare how active European countries are, straight from
            Massimino. No sign-up, no key.
          </p>
          <pre className="mt-10 max-w-2xl overflow-x-auto rounded-field bg-black/30 px-5 py-4 font-mono text-sm text-emerald-100">{ENDPOINT}</pre>
          <div className="mt-8">
            <Link href="/developers" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white underline-offset-4 hover:underline">
              Prefer plain JSON? The API <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Connect: three equal cells ── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="landing-eyebrow text-brand-primary/70">Connect</p>
          <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">Three ways in</h2>
          <ul className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-card bg-brand-primary/10 shadow-soft lg:grid-cols-3">
            {HOSTS.map((host) => (
              <li key={host.title} className="flex min-w-0 flex-col bg-card p-8">
                <h3 className="font-display text-xl font-semibold text-brand-primary">{host.title}</h3>
                <ol className="mt-5 space-y-3">
                  {host.steps.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm leading-relaxed text-gray-600">
                      <span className="font-display font-semibold tabular-nums text-brand-primary/50">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-auto pt-6 text-sm text-gray-600">{host.note}</p>
                {host.code && <pre className="mt-3 overflow-x-auto rounded-field bg-brand-primary/5 px-4 py-3 font-mono text-xs text-brand-primary">{host.code}</pre>}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-gray-600">Then ask something real, for example: &quot;Use Massimino to build me a beginner leg workout with dumbbells.&quot;</p>
        </div>
      </section>

      {/* ── Tools ── */}
      <section className="border-y border-brand-primary/10 bg-card py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="landing-eyebrow text-brand-primary/70">What the assistant gets</p>
          <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">{TOOLS.length} tools</h2>
          <dl className="mt-10 grid grid-cols-1 gap-x-12 md:grid-cols-2">
            {TOOLS.map((tool) => (
              <div key={tool.name} className="border-t border-brand-primary/10 py-5">
                <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <code className="font-mono text-sm font-semibold text-brand-primary">{tool.name}</code>
                  {tool.scope && <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary/70">Needs your key</span>}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-gray-600">{tool.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Facts: four equal columns ── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="landing-eyebrow text-brand-primary/70">How it behaves</p>
          <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">Four things to know</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map((fact) => (
              <div key={fact.number} className="border-t-2 border-brand-primary pt-5">
                <span className="font-display text-sm font-semibold tabular-nums text-brand-primary/50">{fact.number}</span>
                <h3 className="mt-2 font-display text-lg font-semibold text-brand-primary">{fact.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{fact.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-3xl text-sm leading-relaxed text-gray-600">
            To use a key, send it as an <code className="font-mono text-xs">Authorization: Bearer</code> header. Where an app only accepts a URL, add{' '}
            <code className="font-mono text-xs">?key=</code> to it instead; a key in a URL can end up in logs and history, so revoke it on the{' '}
            <Link href="/developers#console" className="font-semibold text-brand-primary underline-offset-4 hover:underline">
              API page
            </Link>{' '}
            when you are done. This is general fitness information, not medical advice.
          </p>
        </div>
      </section>
    </div>
  );
}
