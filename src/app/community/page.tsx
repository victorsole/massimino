// src/app/community/page.tsx
// Layout rules for this page: one container, grids with equal columns and equal-height
// cells (3 x 2 principles, 3 x 3 features, 4 values), and brand colours only.

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Dumbbell,
  Library,
  MessagesSquare,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Join the Massimino fitness community and connect with trainers and athletes',
  alternates: { canonical: '/community' },
};

const PRINCIPLES = [
  {
    title: 'Well-being over numbers',
    text: 'Your health and how you feel come first, not only calories burned or weight lost.',
  },
  {
    title: 'A whole picture',
    text: 'Professional guidance, community support, sound technique and habits you can keep.',
  },
  {
    title: 'Safety by design',
    text: 'Verified trainers, moderation and clear rules, built in from the start.',
  },
  {
    title: 'Personal, not automatic',
    text: 'Real trainers who know your situation, instead of one plan for everyone.',
  },
  {
    title: 'Motivation that lasts',
    text: 'Progress through mastery, choice and connection, never through shame or guilt.',
  },
  {
    title: 'People at the centre',
    text: 'Trainers, teams and the people you train with are the core of the product.',
  },
];

type Feature = { icon: LucideIcon; title: string; text: string; href: string; action: string };

const FEATURES: Feature[] = [
  {
    icon: UserPlus,
    title: 'Find trainers',
    text: 'Connect with verified professional trainers who can guide your training.',
    href: '/teams/discover',
    action: 'Discover trainers',
  },
  {
    icon: Users,
    title: 'Join teams',
    text: 'Train alongside people who share your goals.',
    href: '/teams/discover',
    action: 'Browse teams',
  },
  {
    icon: MessagesSquare,
    title: 'Chat and connect',
    text: 'Talk to your trainers and teammates through moderated messaging.',
    href: '/messages',
    action: 'Open messages',
  },
  {
    icon: Dumbbell,
    title: 'Log workouts',
    text: 'Record your sessions and share your progress with your trainer.',
    href: '/workout-log',
    action: 'Open the workout log',
  },
  {
    icon: BarChart3,
    title: 'Track progress',
    text: 'See your sessions, volume and streaks over time.',
    href: '/dashboard',
    action: 'Open the dashboard',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    text: 'See where you stand among the people you train with.',
    href: '/dashboard',
    action: 'View leaderboards',
  },
  {
    icon: Sparkles,
    title: 'Massichat',
    text: 'An AI fitness coach for workout ideas and training questions.',
    href: '/massichat',
    action: 'Chat with Massichat',
  },
  {
    icon: ClipboardCheck,
    title: 'Assessments',
    text: 'A trainer assesses your posture, cardio and readiness, then advises.',
    href: '/assessments',
    action: 'View assessments',
  },
  {
    icon: Library,
    title: 'Exercise library',
    text: 'Browse exercises by muscle group and equipment, with instructions.',
    href: '/exercises',
    action: 'Browse exercises',
  },
];

const VALUES = [
  {
    title: 'Respect and support',
    text: 'A positive place where people back each other up.',
  },
  {
    title: 'Everyone welcome',
    text: 'Every level and background, from a first session to a professional.',
  },
  {
    title: 'Safety first',
    text: 'Verified trainers, content moderation and safety guidelines.',
  },
  {
    title: 'Quality and expertise',
    text: 'Accredited professionals and resources you can rely on.',
  },
];

export default function CommunityPage() {
  return (
    <div className="bg-brand-secondary">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-brand-primary-dark">
        <Image
          src="/images/background/athletism_blue.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-25"
        />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="landing-eyebrow text-brand-secondary/75">Community</p>
          <h1 className="landing-title mt-4 max-w-4xl text-4xl text-white sm:text-5xl lg:text-6xl">
            Train with people, not against them
          </h1>
          <p className="landing-body mt-6 max-w-2xl text-lg text-brand-secondary/90">
            Find trainers, join teams and reach your goals together, in a safe and supportive environment.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-brand-primary transition-colors hover:bg-brand-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary-dark"
            >
              Create a free account
            </Link>
            <Link
              href="/teams/discover"
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white underline-offset-4 hover:underline"
            >
              Explore teams <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── A different approach: heading row, then a 3 x 2 grid ──────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="landing-eyebrow text-brand-primary/70">Our approach</p>
              <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">
                A different approach to fitness
              </h2>
            </div>
            <p className="landing-body text-gray-600 lg:col-span-5">
              Many fitness apps reduce training to numbers: rigid calorie targets, goals set by an algorithm,
              rankings that discourage more people than they motivate. Massimino starts from six principles instead.
            </p>
          </div>

          <ol className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-card bg-brand-primary/10 shadow-soft sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((principle, index) => (
              <li key={principle.title} className="flex min-h-[200px] flex-col bg-card p-8">
                <span className="font-display text-sm font-semibold tabular-nums text-brand-primary/50">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-brand-primary">{principle.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{principle.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── What you can do: 3 x 3 grid, each cell is one link ────────────── */}
      <section className="border-y border-brand-primary/10 bg-card py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="landing-eyebrow text-brand-primary/70">Inside Massimino</p>
          <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">What you can do here</h2>

          <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text, href, action }) => (
              <li key={title}>
                <Link
                  href={href}
                  className="group flex h-full min-h-[220px] flex-col rounded-card bg-brand-secondary p-8 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-field bg-brand-primary text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-semibold text-brand-primary">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-brand-primary">
                    {action}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Values: four equal columns on petrol ──────────────────────────── */}
      <section className="bg-brand-primary">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <p className="landing-eyebrow text-brand-secondary/70">What we stand for</p>
          <h2 className="landing-title mt-3 text-3xl text-white sm:text-4xl">Our community values</h2>

          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, index) => (
              <div key={value.title} className="border-t-2 border-white/40 pt-6">
                <span className="font-display text-sm font-semibold tabular-nums text-brand-secondary/60">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-display text-xl font-semibold text-white">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-secondary/85">{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to action ────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="landing-eyebrow text-brand-primary/70">Join us</p>
            <h2 className="landing-title mt-3 text-3xl text-brand-primary sm:text-4xl">Ready to join the community?</h2>
            <p className="landing-body mt-4 max-w-xl text-gray-600">
              Start today and connect with trainers and athletes who share your goals. Please read our{' '}
              <Link href="/safety" className="font-semibold text-brand-primary underline underline-offset-2 hover:decoration-2">
                safety guidelines
              </Link>{' '}
              so the experience stays safe and positive for everyone.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-brand-primary px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              Sign up
            </Link>
            <Link
              href="/teams/discover"
              className="inline-flex items-center justify-center rounded-full border border-brand-primary px-8 py-4 text-sm font-semibold uppercase tracking-wider text-brand-primary transition-colors hover:bg-brand-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              Explore teams
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
