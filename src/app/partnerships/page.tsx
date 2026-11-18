// src/app/partnerships/page.tsx
// Layout rules for this page: every section sits on the same 12-column container,
// every grid has equal columns and equal-height cells, and colour comes from the brand
// tokens only (no per-card accent colours).

import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Check, Mail, Phone } from 'lucide-react';
import { LeadDialog } from './lead_dialogs';

export const metadata: Metadata = {
  title: 'Partnerships',
  description: 'Partner with Massimino to reach athletes and personal trainers on a safety-first fitness platform.',
  alternates: { canonical: '/partnerships' },
};

type Partner = {
  name: string;
  place?: string;
  logo: string;
  line: string;
  href?: string;
};

// UTM parameters let partners see the visits Massimino sends them.
const utm = (campaign: string) => `utm_source=massimino&utm_medium=partnerships_page&utm_campaign=${campaign}`;

const PARTNERS: Partner[] = [
  {
    name: 'Amix',
    place: 'Spain',
    logo: '/images/amix-logo.png',
    line: 'Sports supplements: protein, pre-workout and recovery.',
    href: `https://amix.com/?${utm('amix')}`,
  },
  {
    name: 'Quota Vita',
    place: 'Spain',
    logo: '/images/quotavitalogo.jpg',
    line: 'Whey protein with Mediterranean flavours, made in Barcelona.',
    href: `https://www.quotavita.com/en?${utm('quotavita')}`,
  },
  {
    name: 'MU Amsterdam',
    place: 'Netherlands',
    logo: '/images/muscleupstore.png',
    line: 'Premium training apparel designed in Amsterdam.',
    href: `https://muscleupstore.nl/?${utm('mu_amsterdam')}`,
  },
  {
    name: 'Pump Gymwear',
    place: 'Netherlands',
    logo: '/images/pumpgymwear.png',
    line: 'Dutch gym wear: oversized tees, muscle-fit cuts and joggers.',
    href: `https://pumpgymwear.com/en?${utm('pump_gymwear')}`,
  },
  {
    name: 'Pilates4Life',
    place: 'Spain',
    logo: '/images/pilates4life-logo.webp',
    line: 'Reformer Pilates classes in Barcelona.',
    href: `https://www.pilates4life.es/?${utm('pilates4life')}`,
  },
  {
    name: 'Bo',
    place: 'Europe',
    logo: '/images/Bo_logo.png',
    line: 'A network linking visitors with local producers across Europe.',
    href: `http://app.hellobo.eu?${utm('bo')}`,
  },
  {
    // No link: verdabros.com does not resolve (checked 2026-11-16).
    name: 'Verdabros',
    logo: '/images/verdabros-logo.svg',
    line: 'Authors of the Pro Ski Fitness programme on Massimino.',
  },
];

const WAYS = [
  {
    id: 'gyms',
    number: '01',
    eyebrow: 'For gyms and studios',
    title: 'Bring Massimino to your members',
    body: 'Give your trainers and members one place for programmes, workout logs and coach feedback, under your own name.',
    points: [
      'Your branding on teams and programmes',
      'Trainer and athlete accounts for your staff and members',
      'Member progress your coaches can act on',
      'Revenue sharing on paid programmes',
    ],
    steps: [
      { name: 'Explore', text: 'A scoping call and a look at the platform.' },
      { name: 'Set up', text: 'Your teams, trainers and programmes go in.' },
      { name: 'Launch', text: 'A pilot with one location, then the rest.' },
    ],
    variant: 'gym' as const,
    note: 'API and white-label integration are on the roadmap, not available yet.',
  },
  {
    id: 'brands',
    number: '02',
    eyebrow: 'For brands',
    title: 'Reach people who train',
    body: 'Show supplements, equipment, apparel or services next to the workouts and programmes they belong with.',
    points: [
      'Placements in the feed, workouts and teams',
      'Every creative reviewed against the safety guidelines',
      'Impressions, clicks and click-through rate reported',
      'Budgets sized for a small, focused audience',
    ],
    steps: [
      { name: 'Brief', text: 'Goals, placements and dates.' },
      { name: 'Submit', text: 'Creatives to spec; we review them.' },
      { name: 'Measure', text: 'A report when the campaign ends.' },
    ],
    variant: 'ad' as const,
    note: 'Massimino is a young community. Expect relevance, not scale.',
  },
];

const REASONS = [
  {
    number: '01',
    title: 'A safety-first setting',
    text: 'Moderation and anti-harassment rules shape the whole platform, so your brand appears somewhere people trust.',
  },
  {
    number: '02',
    title: 'An audience that trains',
    text: 'Athletes and personal trainers who log workouts and follow programmes, not a general lifestyle feed.',
  },
  {
    number: '03',
    title: 'Plain reporting',
    text: 'What ran, where, and what it did. No estimated reach, no modelled numbers.',
  },
];

export default function PartnershipsPage() {
  return (
    <div className="bg-brand-secondary">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-brand-primary-dark">
        <Image
          src="/images/background/barbell.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-25"
        />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="landing-eyebrow text-brand-secondary/75">Partnerships</p>
          <h1 className="landing-title mt-4 max-w-4xl text-4xl text-white sm:text-5xl lg:text-6xl">
            Brands and gyms we train with
          </h1>
          <p className="landing-body mt-6 max-w-2xl text-lg text-brand-secondary/90">
            Massimino is a safety-first fitness community for athletes and personal trainers.
            We work with a small number of partners whose products and places we would use ourselves.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <LeadDialog variant="generic" size="lg" className="bg-white text-brand-primary hover:bg-brand-secondary" />
            <a
              href="#partners"
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white underline-offset-4 hover:underline"
            >
              See our partners <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Partners: 4 x 2 grid, the eighth cell is the invitation ───────── */}
      <section id="partners" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="landing-eyebrow text-brand-primary/70">Our partners</p>
              <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">Seven partners so far</h2>
            </div>
            <p className="landing-body text-gray-600 lg:col-span-5">
              Each one was chosen by hand. Links carry a tag so partners can see the visits we send them.
            </p>
          </div>

          <ul className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-card bg-brand-primary/10 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
            {PARTNERS.map((partner) => {
              const body = (
                <>
                  <div className="flex h-24 items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={partner.logo}
                      alt={`${partner.name} logo`}
                      className="max-h-14 w-auto max-w-[70%] object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-6 flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold text-brand-primary">{partner.name}</h3>
                    {partner.place && (
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{partner.place}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{partner.line}</p>
                  {partner.href && (
                    <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-brand-primary">
                      Visit {partner.name}
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  )}
                </>
              );
              return (
                <li key={partner.name} className="bg-card">
                  {partner.href ? (
                    <a
                      href={partner.href}
                      target="_blank"
                      rel="noopener"
                      className="group flex h-full min-h-[280px] flex-col p-8 transition-colors hover:bg-brand-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="flex h-full min-h-[280px] flex-col p-8">{body}</div>
                  )}
                </li>
              );
            })}
            <li className="bg-brand-primary">
              <div className="flex h-full min-h-[280px] flex-col p-8 text-white">
                <p className="landing-eyebrow text-brand-secondary/70">Next</p>
                <h3 className="mt-4 font-display text-2xl font-semibold leading-tight">Your brand could sit here</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-secondary/85">
                  Tell us what you make and who it is for.
                </p>
                <div className="mt-auto pt-6">
                  <LeadDialog variant="generic" className="bg-white text-brand-primary hover:bg-brand-secondary" fullWidth />
                </div>
              </div>
            </li>
          </ul>
          <p className="mt-4 text-xs text-gray-500">Partnership details are subject to change.</p>
        </div>
      </section>

      {/* ── Two ways to partner: two equal columns ────────────────────────── */}
      <section className="border-y border-brand-primary/10 bg-card py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="landing-eyebrow text-brand-primary/70">Work with us</p>
          <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">Two ways to partner</h2>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {WAYS.map((way) => (
              <article
                key={way.id}
                id={way.id}
                className="flex scroll-mt-20 flex-col rounded-card bg-brand-secondary p-8 shadow-soft sm:p-10"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-sm font-semibold tabular-nums text-brand-primary/50">{way.number}</span>
                  <p className="landing-eyebrow text-brand-primary/70">{way.eyebrow}</p>
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold leading-tight text-brand-primary sm:text-3xl">
                  {way.title}
                </h3>
                <p className="landing-body mt-4 text-gray-700">{way.body}</p>

                <ul className="mt-8 divide-y divide-brand-primary/10 border-y border-brand-primary/10">
                  {way.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 py-3 text-sm text-gray-800">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-primary" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>

                <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {way.steps.map((step, index) => (
                    <li key={step.name}>
                      <p className="font-display text-xs font-semibold uppercase tracking-wider text-brand-primary/60">
                        Step {index + 1}
                      </p>
                      <p className="mt-1 font-display font-semibold text-brand-primary">{step.name}</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.text}</p>
                    </li>
                  ))}
                </ol>

                <p className="mt-8 text-xs leading-relaxed text-gray-500">{way.note}</p>
                <div className="mt-auto pt-6">
                  <LeadDialog variant={way.variant} fullWidth />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Massimino: three equal columns ────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="landing-eyebrow text-brand-primary/70">Why Massimino</p>
          <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">What a partner gets</h2>

          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
            {REASONS.map((reason) => (
              <div key={reason.number} className="border-t-2 border-brand-primary pt-6">
                <span className="font-display text-sm font-semibold tabular-nums text-brand-primary/50">{reason.number}</span>
                <h3 className="mt-3 font-display text-xl font-semibold text-brand-primary">{reason.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{reason.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────────── */}
      <section className="bg-brand-primary">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="landing-eyebrow text-brand-secondary/70">Get in touch</p>
            <h2 className="landing-title mt-3 text-3xl text-white sm:text-4xl">Talk to the team behind it</h2>
            <p className="landing-body mt-4 max-w-xl text-brand-secondary/90">
              Massimino is built and run by Beresol BV. Write or call and we will come back to you.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href="mailto:hello@beresol.eu"
              className="flex items-center gap-3 rounded-field bg-white/10 px-5 py-4 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Mail className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-xs uppercase tracking-wider text-brand-secondary/70">Email</span>
                <span className="block truncate font-semibold">hello@beresol.eu</span>
              </span>
            </a>
            <a
              href="tel:+32493365423"
              className="flex items-center gap-3 rounded-field bg-white/10 px-5 py-4 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Phone className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-xs uppercase tracking-wider text-brand-secondary/70">Phone</span>
                <span className="block truncate font-semibold">+32 493 36 5423</span>
              </span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
