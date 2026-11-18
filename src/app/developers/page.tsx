// src/app/developers/page.tsx
// The public home of the Massimino API: what it serves, the rules, and a live console.

import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { ApiConsole } from './api_console';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX, RATE_LIMIT } from '@/lib/public-api/http';

export const metadata: Metadata = {
  title: 'API',
  description:
    'The Massimino API: open, read-only fitness data. Exercises, training programmes with their workouts, public teams and Eurostat fitness figures, plus your own workout log with your own key. With a live console.',
  alternates: { canonical: '/developers' },
};

const RESOURCES = [
  {
    title: 'Exercises',
    path: '/api/v1/exercises',
    text: 'Public-domain exercises with step-by-step instructions, muscle groups, equipment and a photo.',
    license: 'Unlicense',
  },
  {
    title: 'Programmes and workouts',
    path: '/api/v1/programs',
    text: 'Training programmes written for Massimino, each with its sessions and the exercises in them.',
    license: 'Apache-2.0',
  },
  {
    title: 'Teams',
    path: '/api/v1/teams',
    text: 'Public training teams: name, description and size. Never members or contact details.',
    license: 'Not for reuse',
  },
  {
    title: 'Fitness Intelligence',
    path: '/api/v1/fitness-intelligence/countries',
    text: 'Eurostat figures on physical activity and sport employment, by country.',
    license: 'CC-BY-4.0',
  },
];

const FIELDS = [
  ['name', 'The resource name, for example exercises/7d0f… It never changes.'],
  ['uid', 'The identifier on its own.'],
  ['title', 'A label a person can read.'],
  ['body_txt', 'All the text of the resource, as plain text.'],
  ['body_html', 'The same text as escaped HTML, safe to put in a page.'],
  ['create_time', 'When the record was created.'],
  ['update_time', 'When it last changed.'],
  ['source, license', 'Where it comes from and whether you may reuse it.'],
];

const RULES = [
  {
    number: '01',
    title: 'No key needed',
    text: `About ${RATE_LIMIT.anonymous.maxRequests} requests a minute without a key, about ${RATE_LIMIT.keyed.maxRequests} with a free one. Limits are counted per server, so treat them as approximate.`,
  },
  {
    number: '02',
    title: 'Every list is paged',
    text: `${PAGE_SIZE_DEFAULT} items by default, ${PAGE_SIZE_MAX} at most. Send next_page_token back as page_token; an empty token means you have everything.`,
  },
  {
    number: '03',
    title: 'One error shape',
    text: 'Every error has a status and a reason, such as EXERCISE_NOT_FOUND. Match on those, not on the message.',
  },
  {
    number: '04',
    title: 'Stable by design',
    text: 'Within version 1, fields are added and never renamed or removed. Resource names stay valid for good.',
  },
];

export default function DevelopersPage() {
  return (
    <div className="bg-brand-secondary">
      {/* ── Hero ── */}
      <section className="bg-brand-primary-dark">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <p className="landing-eyebrow text-brand-secondary/75">Massimino API · version 1</p>
          <h1 className="landing-title mt-4 max-w-4xl text-4xl text-white sm:text-5xl lg:text-6xl">Open fitness data to build on</h1>
          <p className="landing-body mt-6 max-w-2xl text-lg text-brand-secondary/90">
            Massimino is open source, and so is its data. Read exercises, programmes, public teams and Eurostat fitness
            figures over a plain JSON API. No sign-up, no key, read-only.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#console"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-brand-primary transition-colors hover:bg-brand-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary-dark"
            >
              Try the console
            </a>
            <a
              href="/api/v1/openapi.json"
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white underline-offset-4 hover:underline"
            >
              OpenAPI contract <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="/mcp" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white underline-offset-4 hover:underline">
              Use it from Claude or ChatGPT <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <pre className="mt-10 max-w-2xl overflow-x-auto rounded-field bg-black/30 px-5 py-4 font-mono text-sm text-emerald-100">
            curl &quot;https://massimino.fitness/api/v1/exercises?q=squat&amp;page_size=2&quot;
          </pre>
        </div>
      </section>

      {/* ── Resources: four equal cells ── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="landing-eyebrow text-brand-primary/70">What it serves</p>
          <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">Four collections</h2>
          <ul className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-card bg-brand-primary/10 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
            {RESOURCES.map((resource) => (
              <li key={resource.path} className="flex min-h-[240px] flex-col bg-card p-8">
                <h3 className="font-display text-xl font-semibold text-brand-primary">{resource.title}</h3>
                <code className="mt-2 break-all font-mono text-xs text-gray-600">{resource.path}</code>
                <p className="mt-4 text-sm leading-relaxed text-gray-600">{resource.text}</p>
                <p className="mt-auto pt-6 text-xs font-semibold uppercase tracking-wider text-brand-primary/70">Licence: {resource.license}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-gray-600">
            Workout logs are personal, so they are not open data. You can read your own log at <code className="font-mono text-xs">/api/v1/me/workout-sets</code> and{' '}
            <code className="font-mono text-xs">/api/v1/me/workout-sessions</code>{' '}
            with a key you created with the workout log permission. It only ever returns the sessions of the account that owns the key.
          </p>
        </div>
      </section>

      {/* ── Console ── */}
      <section id="console" className="scroll-mt-20 border-y border-brand-primary/10 bg-card py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="landing-eyebrow text-brand-primary/70">Console</p>
          <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">Run a request</h2>
          <p className="landing-body mt-4 max-w-2xl text-gray-600">These are real calls to the live API, counted against your rate limit like any other.</p>
          <div className="mt-12">
            <ApiConsole />
          </div>
        </div>
      </section>

      {/* ── Canonical fields and rules: two equal columns ── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="landing-eyebrow text-brand-primary/70">Every resource</p>
            <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">The same core fields</h2>
            <dl className="mt-8 divide-y divide-brand-primary/10 border-y border-brand-primary/10">
              {FIELDS.map(([field, meaning]) => (
                <div key={field} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-mono text-sm font-semibold text-brand-primary">{field}</dt>
                  <dd className="text-sm text-gray-600 sm:col-span-2">{meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <p className="landing-eyebrow text-brand-primary/70">How it behaves</p>
            <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">Four rules</h2>
            <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
              {RULES.map((rule) => (
                <div key={rule.number} className="border-t-2 border-brand-primary pt-5">
                  <span className="font-display text-sm font-semibold tabular-nums text-brand-primary/50">{rule.number}</span>
                  <h3 className="mt-2 font-display text-lg font-semibold text-brand-primary">{rule.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{rule.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
