// src/app/fitness-intelligence/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { EUROPE_FITNESS_DATA_2024, getByPenetrationRate, getByMarketSize, getByGrowthRate } from '@/data/fitness/europe_2024';
import { EUROPE_TOTALS } from '@/types/fitness_data';
import { FitnessMapSection } from './components/fitness_map_section';
import {
  PenetrationTable,
  MarketTable,
  GrowthTable,
  GymChainsTable,
  SupplementsTable,
  InfluencersTable,
  HashtagComparisonTable,
  TikTokHashtagsTable,
  ActivityTable,
} from './components/fitness_tables';
import { EUROSTAT_ACTIVITY, EUROSTAT_ACTIVITY_META } from '@/data/fitness/eurostat_activity';
import {
  EUROPE_GYM_CHAINS_2024,
  EUROPE_SUPPLEMENTS_2024,
  EUROPE_INFLUENCERS_2024,
  HASHTAG_COMPARISON_2024,
  TIKTOK_FITNESS_HASHTAGS_2024,
  formatNumber,
} from '@/data/fitness/industry_2024';

export const metadata: Metadata = {
  title: 'Fitness Intelligence - Massimino',
  description: 'European fitness industry data visualization. Explore gym penetration rates, market sizes, and growth trends across Europe.',
  openGraph: {
    title: 'Fitness Intelligence - Massimino',
    description: 'European fitness industry data visualization with interactive maps.',
    type: 'website',
  },
};

// MDI icon paths
const ICONS = {
  earth: 'M17.9,17.39C17.64,16.59 16.89,16 16,16H15V13A1,1 0 0,0 14,12H8V10H10A1,1 0 0,0 11,9V7H13A2,2 0 0,0 15,5V4.59C17.93,5.77 20,8.64 20,12C20,14.08 19.2,15.97 17.9,17.39M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A2,2 0 0,0 11,18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z',
  chart: 'M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z',
  currency: 'M11.5,9A2.5,2.5 0 0,0 9,11.5A2.5,2.5 0 0,0 11.5,14A2.5,2.5 0 0,0 14,11.5A2.5,2.5 0 0,0 11.5,9M22,4V7L20,9V4H22M19,4V11L17,13V4H19M16,4V13.5L14.5,15H14V4H16M3,4V16L2,16V4H3M13,4V14.5L11.5,16H11V4H13M10,4V16H8V4H10M7,4V16L5,14V4H7Z',
  trendUp: 'M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z',
  run: 'M16.5,5.5A2,2 0 0,0 18.5,3.5A2,2 0 0,0 16.5,1.5A2,2 0 0,0 14.5,3.5A2,2 0 0,0 16.5,5.5M12.9,19.4L13.9,15L16,17V23H18V15.5L15.9,13.5L16.5,10.5C17.89,12.09 19.89,13 22,13V11C20.24,11.03 18.6,10.11 17.7,8.6L16.7,7C16.34,6.4 15.7,6 15,6C14.7,6 14.5,6.1 14.2,6.1L9,8.3V13H11V9.6L12.8,8.9L11.2,17L6.3,16L5.9,18L12.9,19.4Z',
  school: 'M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z',
  shield: 'M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.1 14.8,9.5V11C15.4,11 16,11.6 16,12.3V15.8C16,16.4 15.4,17 14.7,17H9.2C8.6,17 8,16.4 8,15.7V12.2C8,11.6 8.6,11 9.2,11V9.5C9.2,8.1 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,9.5V11H13.5V9.5C13.5,8.7 12.8,8.2 12,8.2Z',
  arrowRight: 'M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z',
  openNew: 'M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z',
  dumbbell: 'M20.57,14.86L22,13.43L20.57,12L17,15.57L8.43,7L12,3.43L10.57,2L9.14,3.43L7.71,2L5.57,4.14L4.14,2.71L2.71,4.14L4.14,5.57L2,7.71L3.43,9.14L2,10.57L3.43,12L7,8.43L15.57,17L12,20.57L13.43,22L14.86,20.57L16.29,22L18.43,19.86L19.86,21.29L21.29,19.86L19.86,18.43L22,16.29L20.57,14.86Z',
  pill: 'M6,2A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V4A2,2 0 0,0 18,2H6M6,4H18V20H6V4M12,6C9.79,6 8,7.79 8,10C8,11.5 8.71,12.85 9.82,13.72L10,14.14V17H14V14.14L14.18,13.72C15.29,12.85 16,11.5 16,10C16,7.79 14.21,6 12,6M12,8A2,2 0 0,1 14,10C14,10.74 13.6,11.39 13,11.73V15H11V11.73C10.4,11.39 10,10.74 10,10A2,2 0 0,1 12,8Z',
  account: 'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z',
  hashtag: 'M5.41,21L6.12,17H2.12L2.47,15H6.47L7.53,9H3.53L3.88,7H7.88L8.59,3H10.59L9.88,7H15.88L16.59,3H18.59L17.88,7H21.88L21.53,9H17.53L16.47,15H20.47L20.12,17H16.12L15.41,21H13.41L14.12,17H8.12L7.41,21H5.41M9.47,9L8.41,15H14.41L15.47,9H9.47Z',
  tiktok: 'M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z',
};

function Icon({ path, size = 24, className = '' }: { path: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d={path} />
    </svg>
  );
}

// Reusable section shell with brand-styled header
function Section({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  caption,
  delay = 0,
  children,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  caption?: React.ReactNode;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className="mt-8 overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="border-b border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconBg}`}>
            <Icon path={icon} size={24} className={iconColor} />
          </div>
          <div>
            <h2 className="text-base font-bold text-brand-primary sm:text-xl">{title}</h2>
            <p className="text-sm text-gray-600 sm:text-base">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-3 sm:p-6">
        {children}
        {caption && <p className="mt-4 text-sm text-gray-500">{caption}</p>}
      </div>
    </section>
  );
}

function formatMarketSize(eur: number): string {
  if (eur >= 1000000000) return `${(eur / 1000000000).toFixed(1)}B`;
  return `${(eur / 1000000).toFixed(0)}M`;
}

export default function FitnessIntelligencePage() {
  const allByPenetration = getByPenetrationRate();
  const allByMarket = getByMarketSize();
  const allByGrowth = getByGrowthRate();
  const totalChainMembers = EUROPE_GYM_CHAINS_2024.reduce((sum, c) => sum + c.members, 0);

  return (
    <main className="min-h-screen overflow-x-hidden bg-brand-secondary">
      {/* Hero band */}
      <div className="bg-gradient-to-br from-brand-primary to-brand-primary-dark">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/90">
              <Icon path={ICONS.earth} size={14} /> EuropeActive / Deloitte 2026
            </span>
            <h1 className="mt-3 text-2xl font-bold text-white sm:text-4xl">Fitness Intelligence</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/80 sm:text-base">
              Interactive maps and rankings of gym penetration, market size, membership and growth across Europe.
              Click any country for a detailed breakdown of its operators and creators.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="-mt-14 mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            {
              value: `${(EUROPE_TOTALS.total_members / 1000000).toFixed(1)}M`,
              label: 'Total members (FY2025)',
              note: 'All-time high; +5.8% YoY',
              accent: 'text-brand-primary',
            },
            {
              value: `€${(EUROPE_TOTALS.total_market_eur / 1000000000).toFixed(1)}B`,
              label: 'Market size (FY2025)',
              note: '+9% YoY growth',
              accent: 'text-emerald-600',
            },
            {
              value: `${EUROPE_TOTALS.total_clubs.toLocaleString()}+`,
              label: 'Fitness clubs (FY2025)',
              note: '+3% increase YoY',
              accent: 'text-orange-600',
            },
            {
              value: `${EUROPE_TOTALS.average_penetration}%`,
              label: 'Avg penetration',
              note: '100M members target by 2030',
              accent: 'text-purple-600',
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md animate-fade-in-up"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className={`text-xl font-bold sm:text-2xl ${stat.accent}`}>{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className="mt-1 text-xs text-green-600">{stat.note}</div>
            </div>
          ))}
        </div>

        {/* Interactive Map */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm animate-scale-in">
          <FitnessMapSection data={EUROPE_FITNESS_DATA_2024} totalMarketEur={EUROPE_TOTALS.total_market_eur} />
        </div>

        {/* Where Europeans Work Out */}
        <Section
          icon={ICONS.chart}
          iconBg="bg-brand-primary/10"
          iconColor="text-brand-primary"
          title="Where Europeans Work Out"
          subtitle="Gym penetration rates by country. Sweden leads at 21.6%"
          caption={
            <>
              {allByPenetration.length} countries · EU average: {EUROPE_TOTALS.average_penetration}% · US comparison: 23.7%.
              National leaders (Sweden, Norway, Netherlands) far exceed the EU average, which is held down by
              Eastern and Southern markets.
            </>
          }
        >
          <PenetrationTable data={allByPenetration} totalMarketEur={EUROPE_TOTALS.total_market_eur} />
        </Section>

        {/* The Market */}
        <Section
          icon={ICONS.currency}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          title={`The €${(EUROPE_TOTALS.total_market_eur / 1000000000).toFixed(0)} Billion Market`}
          subtitle="Revenue distribution across Europe. The UK leads with €6.7B"
          caption={
            <>
              {allByMarket.length} countries · Total European market: €
              {(EUROPE_TOTALS.total_market_eur / 1000000000).toFixed(1)}B (FY2025) · +9% YoY growth
            </>
          }
        >
          <MarketTable data={allByMarket} totalMarketEur={EUROPE_TOTALS.total_market_eur} />
        </Section>

        {/* Fastest Growing Markets */}
        <Section
          icon={ICONS.trendUp}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          title="Fastest Growing Markets"
          subtitle="Membership growth and CAGR projections through 2031"
          caption={
            <>
              {allByGrowth.length} countries · European target: 100M members by 2030. Low-penetration Eastern
              European markets show the highest growth headroom.
            </>
          }
        >
          <GrowthTable data={allByGrowth} />
        </Section>

        {/* Physical Activity (Eurostat, live via Massimino API) */}
        <Section
          icon={ICONS.run}
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
          title="How Active Are Europeans?"
          subtitle={`Adults meeting the WHO activity guideline. EU average ${EUROSTAT_ACTIVITY_META.eu27_average}%`}
          caption={
            <>
              Official EU data ({EUROSTAT_ACTIVITY.length} countries) from Eurostat dataset{' '}
              <a
                href={EUROSTAT_ACTIVITY_META.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:underline"
              >
                {EUROSTAT_ACTIVITY_META.dataset_code}
              </a>{' '}
              (EHIS {EUROSTAT_ACTIVITY[0].year}), retrieved live via the Massimino Fitness open-data API. Gym
              membership and actually meeting activity guidelines are very different things. Iceland and the Nordics
              lead both, but several high-membership markets sit below the EU average.
            </>
          }
        >
          <ActivityTable data={EUROSTAT_ACTIVITY} />
        </Section>

        {/* Top Operators */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 animate-fade-in-up">
          <h3 className="mb-4 text-base font-semibold text-brand-primary sm:text-lg">Top European Operators (2026)</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              {
                rank: 1,
                name: 'Basic-Fit',
                href: 'https://www.basic-fit.com',
                stat: '4.82M members · 1,660 clubs',
                note: '+17% revenue FY25 (€1.42B)',
                ring: 'bg-brand-primary',
                tint: 'bg-brand-primary/5',
              },
              {
                rank: 2,
                name: 'PureGym',
                href: 'https://www.puregym.com',
                stat: '2.3M members · 714 sites',
                note: '+23% revenue FY25 (€868M)',
                ring: 'bg-gray-600',
                tint: 'bg-gray-50',
              },
              {
                rank: 3,
                name: 'RSG Group',
                href: 'https://rsggroup.com/en/',
                stat: '4.5M+ members · 900+ sites',
                note: "McFit, Gold's Gym, John Reed",
                ring: 'bg-amber-600',
                tint: 'bg-amber-50',
              },
            ].map((op) => (
              <div
                key={op.name}
                className={`flex items-center gap-4 rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${op.tint}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white sm:h-12 sm:w-12 ${op.ring}`}>
                  {op.rank}
                </div>
                <div className="min-w-0">
                  <a href={op.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 transition-colors hover:text-brand-primary">
                    {op.name}
                  </a>
                  <div className="text-sm text-gray-600">{op.stat}</div>
                  <div className="text-xs text-green-600">{op.note}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            By revenue, David Lloyd (~€995M FY24) and Benefit Systems (~€1.0B FY25) rank just behind Basic-Fit.
          </p>
        </div>

        {/* Top European Gym Chains */}
        <Section
          icon={ICONS.dumbbell}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          title="Top European Gym Chains"
          subtitle="Membership, locations, and revenue data (FY2025)"
          caption={
            <>
              {EUROPE_GYM_CHAINS_2024.length} chains · Combined members: {formatNumber(totalChainMembers)} · Basic-Fit
              FY2025: +564K members, +17% revenue
            </>
          }
        >
          <GymChainsTable data={EUROPE_GYM_CHAINS_2024} />
        </Section>

        {/* Top European Supplement Companies */}
        <Section
          icon={ICONS.pill}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          title="Top European Supplement Companies"
          subtitle="Revenue and market position (latest filed)"
          caption={
            <>
              {EUROPE_SUPPLEMENTS_2024.length} companies · EU sports-nutrition market: ~€6.1B (2026), projected ~€8.9B by
              2031 at 7.9% CAGR
            </>
          }
        >
          <SupplementsTable data={EUROPE_SUPPLEMENTS_2024} />
        </Section>

        {/* Top European Fitness Influencers */}
        <Section
          icon={ICONS.account}
          iconBg="bg-pink-100"
          iconColor="text-pink-600"
          title="Top European Fitness Influencers"
          subtitle="Social media reach and follower counts (2026)"
          caption={
            <>
              {EUROPE_INFLUENCERS_2024.length} creators · Tibo InShape is Europe&apos;s largest fitness creator
              (27M YouTube) · Pamela Reif leads in the DACH region
            </>
          }
        >
          <InfluencersTable data={EUROPE_INFLUENCERS_2024} />
        </Section>

        {/* Fitness Hashtag Statistics */}
        <Section
          icon={ICONS.hashtag}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          title="Fitness Hashtag Statistics"
          subtitle="Instagram vs TikTok comparison"
          caption={
            <>
              #gym dominates TikTok · #fitness leads Instagram. Note: Instagram stopped surfacing public hashtag post
              counts in late 2025, so IG figures are best-available estimates.
            </>
          }
        >
          <HashtagComparisonTable data={HASHTAG_COMPARISON_2024} />
        </Section>

        {/* TikTok Engagement Leaders */}
        <Section
          icon={ICONS.tiktok}
          iconBg="bg-cyan-100"
          iconColor="text-cyan-600"
          title="TikTok Fitness Engagement Leaders"
          subtitle="Highest views and engagement per video"
          caption={
            <>
              Platform-native hashtags (#GymTok, #FitTok) outperform traditional tags. TikTok fitness content averages
              ~7× the engagement of Instagram; fitness on Instagram still beats the platform&apos;s 0.48% average at a
              2.8% median (Socialinsider 2026).
            </>
          }
        >
          <TikTokHashtagsTable data={TIKTOK_FITNESS_HASHTAGS_2024} />
        </Section>

        {/* EU Legal Framework */}
        <div className="mt-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-brand-primary/10 p-2.5">
              <Icon path={ICONS.school} size={24} className="text-brand-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-primary sm:text-2xl">EU Legal Framework</h2>
              <p className="text-sm text-gray-600 sm:text-base">Fitness, Sports, Health Supplements &amp; Influencer Marketing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {/* Sports */}
            <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-green-200">
                  <Icon path={ICONS.run} size={20} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Sports &amp; Physical Activity</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><strong>TFEU Art. 165</strong> - EU sports competence</li>
                <li><a href="https://eur-lex.europa.eu/eli/reg/2021/817/oj/eng" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>Erasmus+ (2021/817)</strong></a> - Grassroots funding</li>
                <li>Health-enhancing physical activity</li>
              </ul>
            </div>

            {/* Supplements */}
            <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-orange-200">
                  <Icon path={ICONS.shield} size={20} className="text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Health &amp; Supplements</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02006R1924-20141213" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>Reg. 1924/2006</strong></a> - Health claims pre-auth</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32011R1169" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>FIC 1169/2011</strong></a> - Mandatory labelling</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02015R2283-20210327" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>Novel Foods 2015/2283</strong></a> - New ingredients</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02017R0745-20250110" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>MDR 2017/745</strong></a> - Fitness devices</li>
              </ul>
            </div>

            {/* Consumer */}
            <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-200">
                  <Icon path={ICONS.shield} size={20} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Consumer &amp; Product Safety</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="https://eur-lex.europa.eu/eli/reg/2023/988/oj/eng" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>GPSR 2023/988</strong></a> - Equipment safety</li>
                <li><a href="https://europa.eu/youreurope/business/product-requirements/labels-markings/ce-marking/index_en.htm" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>CE Marking</strong></a> - Required</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02011L0083-20220528" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>Consumer Rights Dir.</strong></a> - Contracts</li>
              </ul>
            </div>

            {/* Influencer */}
            <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-pink-200">
                  <Icon path={ICONS.earth} size={20} className="text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Influencer Marketing</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02005L0029-20220528" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>UCPD 2005/29</strong></a> - Disclose relationships</li>
                <li><a href="https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>DSA 2022/2065</strong></a> - Ad transparency</li>
                <li><a href="https://eur-lex.europa.eu/eli/dir/2018/1808/oj/eng" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>AVMSD 2018/1808</strong></a> - Clear identification</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02016R0679-20160504" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>GDPR</strong></a> - Consent for targeted ads</li>
              </ul>
            </div>

            {/* Anti-Doping */}
            <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-red-200">
                  <Icon path={ICONS.shield} size={20} className="text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Anti-Doping</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="https://rm.coe.int/168007b0d8" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>CoE Convention (1989)</strong></a> - Obligations</li>
                <li><a href="https://www.wada-ama.org/en/what-we-do/world-anti-doping-code" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>WADA Code</strong></a> - Via federations</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02019R1148-20190711" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>Reg. 2019/1148</strong></a> - Precursors</li>
              </ul>
            </div>

            {/* Penalties */}
            <div className="group rounded-2xl border border-gray-100 bg-gradient-to-br from-brand-secondary to-brand-secondary-dark p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 transition-all duration-300 group-hover:scale-110 group-hover:bg-gray-300">
                  <Icon path={ICONS.shield} size={20} className="text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Enforcement &amp; Penalties</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02005L0029-20220528" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>UCPD:</strong></a> Up to 4% turnover</li>
                <li><a href="https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>DSA:</strong></a> Up to 6% global turnover</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02016R0679-20160504" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>GDPR:</strong></a> Up to €20M or 4%</li>
                <li><a href="https://eur-lex.europa.eu/eli/reg/2023/988/oj/eng" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline"><strong>Product safety:</strong></a> Criminal liability</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="font-medium">Sources:</span>
            <a href="https://eur-lex.europa.eu/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">EUR-Lex</a> |
            <a href="https://op.europa.eu/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">EU Publications Office</a> |
            <span>European Commission DG SANTE</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Join Massimino */}
          <div className="group relative min-h-[200px] overflow-hidden rounded-2xl animate-fade-in-left">
            <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
              <source src="/images/background/autumn_run.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/80 to-brand-primary-dark/60" />
            <div className="relative z-10 h-full p-6 text-white">
              <div className="flex h-full gap-6">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-white/95 p-2 shadow-lg backdrop-blur group-hover:animate-float">
                  <div className="relative h-full w-full">
                    <Image src="/massimino_logo_word.png" alt="Massimino" fill className="object-contain" sizes="96px" />
                  </div>
                </div>
                <div className="flex min-w-0 flex-col justify-between">
                  <div>
                    <h3 className="mb-2 text-xl font-bold drop-shadow-md">Join Massimino</h3>
                    <p className="text-sm text-white/95 drop-shadow">
                      Access personalised training programmes, track your progress, and connect with a community of
                      fitness enthusiasts.
                    </p>
                  </div>
                  <Link
                    href="/signup"
                    className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-brand-primary shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <span>Get Started Free</span>
                    <Icon path={ICONS.arrowRight} size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Beresol BV */}
          <div className="group relative min-h-[200px] overflow-hidden rounded-2xl animate-fade-in-right">
            <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
              <source src="/images/background/euflag.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-800/70 to-blue-600/50" />
            <div className="relative z-10 h-full p-6 text-white">
              <div className="flex h-full gap-6">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-white/95 p-2 shadow-lg backdrop-blur group-hover:animate-float">
                  <div className="relative h-full w-full">
                    <Image src="/beresol-logo.png" alt="Beresol BV" fill className="object-contain" sizes="96px" />
                  </div>
                </div>
                <div className="flex min-w-0 flex-col justify-between">
                  <div>
                    <h3 className="mb-2 text-xl font-bold drop-shadow-md">Beresol BV</h3>
                    <p className="text-sm text-white/95 drop-shadow">
                      Stay compliant with EU fitness regulations. Comprehensive regulatory intelligence for fitness
                      businesses and influencers.
                    </p>
                  </div>
                  <a
                    href="https://beresol.eu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <span>Visit Beresol</span>
                    <Icon path={ICONS.openNew} size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom EU Policy Monitor CTA */}
        <div className="group mt-8 rounded-2xl border border-gray-200/60 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:border-brand-primary/40 hover:shadow-md animate-fade-in-up">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 transition-transform duration-300 group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-brand-primary">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-brand-primary">Need a tailored EU policy monitor?</h4>
          </div>
          <p className="mx-auto mb-6 max-w-2xl leading-relaxed text-gray-600">
            In <a href="https://beresol.eu" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-primary hover:underline">Beresol</a>, we build custom intelligence dashboards tracking legislation, funding programmes, stakeholder movements, and regulatory developments in any policy area of the European Union.
          </p>
          <a
            href="mailto:hello@beresol.eu?subject=Custom EU Policy Monitor Inquiry"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-6 py-3 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-primary-dark hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <rect width="20" height="16" x="2" y="4" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
            Get in Touch
          </a>
        </div>

        {/* Data Sources */}
        <div className="mt-12 rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm animate-blur-in">
          <h4 className="mb-4 font-semibold text-brand-primary">Data Sources &amp; Methodology</h4>
          <div className="grid gap-6 text-sm text-gray-600 md:grid-cols-2">
            <div>
              <h5 className="mb-2 font-medium text-gray-700">Primary Sources</h5>
              <ul className="space-y-1">
                <li><a href="https://www.europeactive.eu/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">EuropeActive/Deloitte</a> - 2026 European Health &amp; Fitness Market Report (FY2025)</li>
                <li><a href="https://www.healthandfitness.org/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Health &amp; Fitness Association (HFA)</a> - 2026 Global Report</li>
                <li>National bodies: ukactive, DSSV (Germany), AGAP (Portugal), swiss active</li>
                <li>Company filings: Basic-Fit, PureGym, The Gym Group, SATS, Benefit Systems FY2025</li>
              </ul>
            </div>
            <div>
              <h5 className="mb-2 font-medium text-gray-700">Map Technology</h5>
              <ul className="space-y-1">
                <li><a href="https://maplibre.org/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">MapLibre GL JS</a> - Open-source map rendering (BSD-3)</li>
                <li><a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">OpenStreetMap</a> - Geographic data (ODbL)</li>
                <li><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Natural Earth</a> - GeoJSON boundaries</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Europe-wide totals as of FY2025 (EuropeActive/Deloitte 2026 report). Per-country figures blend FY2024 and
            FY2025 national-body data; some smaller markets are estimates. Social figures observed June 2026 and change
            rapidly.
          </p>
        </div>
      </div>
    </main>
  );
}
