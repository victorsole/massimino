// src/app/fitness-intelligence/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { EUROPE_FITNESS_DATA_2024, getByPenetrationRate, getByMarketSize, getByGrowthRate } from '@/data/fitness/europe_2024';
import { EUROPE_TOTALS } from '@/types/fitness_data';
import { EuropeMap } from './components/europe_map';
import {
  EUROPE_GYM_CHAINS_2024,
  EUROPE_INFLUENCERS_2024,
  HASHTAG_COMPARISON_2024,
  TIKTOK_FITNESS_HASHTAGS_2024,
  formatNumber,
  formatRevenue,
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
};

function Icon({ path, size = 24, className = '' }: { path: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d={path} />
    </svg>
  );
}

function formatMarketSize(eur: number): string {
  if (eur >= 1000000000) {
    return `${(eur / 1000000000).toFixed(1)}B`;
  }
  return `${(eur / 1000000).toFixed(0)}M`;
}

export default function FitnessIntelligencePage() {
  // Show all countries (42 total) in each table for comprehensive coverage
  const allByPenetration = getByPenetrationRate();
  const allByMarket = getByMarketSize();
  const allByGrowth = getByGrowthRate();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-bold text-gray-900">Fitness Intelligence</h1>
            <p className="text-gray-600">European fitness industry data visualization</p>
          </div>
          <p className="text-gray-500 max-w-3xl animate-fade-in-up-delay-1">
            Explore interactive maps showing gym penetration rates, market sizes,
            membership statistics, and growth trends across Europe. Data powered by EuropeActive and industry reports.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-fade-in-up-delay-1 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="text-2xl font-bold text-blue-600">
              {(EUROPE_TOTALS.total_members / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-500">Total Members (2024)</div>
            <div className="text-xs text-green-600 mt-1">+5.8% from 2023</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-fade-in-up-delay-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="text-2xl font-bold text-emerald-600">
              {(EUROPE_TOTALS.total_market_eur / 1000000000).toFixed(0)}B
            </div>
            <div className="text-sm text-gray-500">Market Size (EUR)</div>
            <div className="text-xs text-green-600 mt-1">+10% YoY growth</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-fade-in-up-delay-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="text-2xl font-bold text-purple-600">
              {EUROPE_TOTALS.total_clubs.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Fitness Clubs</div>
            <div className="text-xs text-green-600 mt-1">+2% from 2023</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-fade-in-up-delay-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="text-2xl font-bold text-amber-600">
              {EUROPE_TOTALS.cagr_2024_2031}%
            </div>
            <div className="text-sm text-gray-500">CAGR 2024-2031</div>
            <div className="text-xs text-blue-600 mt-1">100M target by 2030</div>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 animate-scale-in hover:shadow-lg transition-shadow duration-300">
          <EuropeMap data={EUROPE_FITNESS_DATA_2024} />
        </div>

        {/* Section: Where Europeans Work Out */}
        <section className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-left hover:shadow-lg transition-shadow duration-300">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center hover:scale-110 hover:rotate-3 transition-transform duration-300">
                <Icon path={ICONS.chart} size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Where Europeans Work Out</h2>
                <p className="text-gray-600">Gym penetration rates by country - Sweden leads at 21.6%</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="text-left p-3 font-semibold">Rank</th>
                    <th className="text-left p-3 font-semibold">Country</th>
                    <th className="text-left p-3 font-semibold">Penetration Rate</th>
                    <th className="text-left p-3 font-semibold">Members</th>
                    <th className="text-left p-3 font-semibold">Top Chains</th>
                  </tr>
                </thead>
                <tbody>
                  {allByPenetration.map((country, idx) => (
                    <tr key={country.iso_code} className="border-b border-gray-100 hover:bg-blue-50 hover:scale-[1.01] transition-all duration-200 cursor-default">
                      <td className="p-3">{idx + 1}</td>
                      <td className="p-3 font-medium">{country.name}</td>
                      <td className="p-3 text-blue-600 font-semibold">{country.penetration_rate}%</td>
                      <td className="p-3">{country.members_millions.toFixed(2)}M</td>
                      <td className="p-3 text-gray-500 text-xs">{country.top_chains.slice(0, 2).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {allByPenetration.length} countries | EU Average: {EUROPE_TOTALS.average_penetration}% | US Comparison: 23.7% - significant growth potential remains
            </p>
          </div>
        </section>

        {/* Section: The 36 Billion Market */}
        <section className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-right hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.1s' }}>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center hover:scale-110 hover:-rotate-3 transition-transform duration-300">
                <Icon path={ICONS.currency} size={24} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">The 36 Billion Market</h2>
                <p className="text-gray-600">Revenue distribution across Europe - UK leads with 6.7B</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="text-left p-3 font-semibold">Rank</th>
                    <th className="text-left p-3 font-semibold">Country</th>
                    <th className="text-left p-3 font-semibold">Revenue (EUR)</th>
                    <th className="text-left p-3 font-semibold">Clubs</th>
                    <th className="text-left p-3 font-semibold">Market Share</th>
                  </tr>
                </thead>
                <tbody>
                  {allByMarket.map((country, idx) => (
                    <tr key={country.iso_code} className="border-b border-gray-100 hover:bg-emerald-50 hover:scale-[1.01] transition-all duration-200 cursor-default">
                      <td className="p-3">{idx + 1}</td>
                      <td className="p-3 font-medium">{country.name}</td>
                      <td className="p-3 text-emerald-600 font-semibold">{formatMarketSize(country.market_size_eur)}</td>
                      <td className="p-3">{country.clubs_count.toLocaleString()}</td>
                      <td className="p-3 text-gray-500">
                        {((country.market_size_eur / EUROPE_TOTALS.total_market_eur) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {allByMarket.length} countries | Total European Market: {(EUROPE_TOTALS.total_market_eur / 1000000000).toFixed(0)}B (2024) | +10% YoY growth
            </p>
          </div>
        </section>

        {/* Section: Fastest Growing Markets */}
        <section className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-left hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.2s' }}>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center hover:scale-110 hover:rotate-6 transition-transform duration-300">
                <Icon path={ICONS.trendUp} size={24} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Fastest Growing Markets</h2>
                <p className="text-gray-600">Membership growth and CAGR projections through 2031</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="text-left p-3 font-semibold">Rank</th>
                    <th className="text-left p-3 font-semibold">Country</th>
                    <th className="text-left p-3 font-semibold">CAGR (2024-31)</th>
                    <th className="text-left p-3 font-semibold">Current Penetration</th>
                    <th className="text-left p-3 font-semibold">Potential</th>
                  </tr>
                </thead>
                <tbody>
                  {allByGrowth.map((country, idx) => (
                    <tr key={country.iso_code} className="border-b border-gray-100 hover:bg-purple-50 hover:scale-[1.01] transition-all duration-200 cursor-default">
                      <td className="p-3">{idx + 1}</td>
                      <td className="p-3 font-medium">{country.name}</td>
                      <td className="p-3 text-purple-600 font-semibold">{country.growth_cagr}%</td>
                      <td className="p-3">{country.penetration_rate}%</td>
                      <td className="p-3">
                        {country.penetration_rate < 5 ? (
                          <span className="text-amber-600 font-medium">Very High</span>
                        ) : country.penetration_rate < 10 ? (
                          <span className="text-green-600 font-medium">High</span>
                        ) : (
                          <span className="text-blue-600 font-medium">Moderate</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {allByGrowth.length} countries | European CAGR: {EUROPE_TOTALS.cagr_2024_2031}% (2024-2031) | Target: 100M members by 2030
            </p>
          </div>
        </section>

        {/* Top Operators */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top European Operators (2024)</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default group">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold group-hover:animate-heartbeat">1</div>
              <div>
                <a href="https://www.basic-fit.com/nl-nl/home" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200">Basic-Fit</a>
                <div className="text-sm text-gray-600">4.25M members | 1,537 clubs</div>
                <div className="text-xs text-green-600">+17% revenue growth</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default group">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold group-hover:animate-heartbeat">2</div>
              <div>
                <a href="https://www.puregym.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 hover:text-gray-600 transition-colors duration-200">PureGym</a>
                <div className="text-sm text-gray-600">1.99M members</div>
                <div className="text-xs text-blue-600">EU&apos;s 3rd largest operator</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default group">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold group-hover:animate-heartbeat">3</div>
              <div>
                <a href="https://rsggroup.com/en/" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 hover:text-amber-600 transition-colors duration-200">RSG Group</a>
                <div className="text-sm text-gray-600">1.81M members</div>
                <div className="text-xs text-gray-500">McFit, Gold&apos;s Gym brands</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Top 3 operators account for 44% of the Top 20 membership count (18.8M total)
          </p>
        </div>

        {/* Section: Top European Gym Chains */}
        <section className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-left hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.35s' }}>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center hover:scale-110 hover:rotate-3 transition-transform duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-orange-600">
                  <path d="M20.57,14.86L22,13.43L20.57,12L17,15.57L8.43,7L12,3.43L10.57,2L9.14,3.43L7.71,2L5.57,4.14L4.14,2.71L2.71,4.14L4.14,5.57L2,7.71L3.43,9.14L2,10.57L3.43,12L7,8.43L15.57,17L12,20.57L13.43,22L14.86,20.57L16.29,22L18.43,19.86L19.86,21.29L21.29,19.86L19.86,18.43L22,16.29L20.57,14.86Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Top European Gym Chains</h2>
                <p className="text-gray-600">Membership, locations, and revenue data (2024)</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold">Rank</th>
                    <th className="text-left p-3 font-semibold">Company</th>
                    <th className="text-left p-3 font-semibold">HQ</th>
                    <th className="text-left p-3 font-semibold">Members</th>
                    <th className="text-left p-3 font-semibold">Locations</th>
                    <th className="text-left p-3 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {EUROPE_GYM_CHAINS_2024.map((chain) => (
                    <tr key={chain.name} className="border-b border-gray-100 hover:bg-orange-50 hover:scale-[1.01] transition-all duration-200 cursor-default">
                      <td className="p-3">{chain.rank}</td>
                      <td className="p-3 font-medium">
                        {chain.website ? (
                          <a href={chain.website} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">{chain.name}</a>
                        ) : chain.name}
                      </td>
                      <td className="p-3 text-gray-500">{chain.country_code}</td>
                      <td className="p-3 text-orange-600 font-semibold">{formatNumber(chain.members)}</td>
                      <td className="p-3">{chain.locations.toLocaleString()}+</td>
                      <td className="p-3 text-emerald-600">{chain.revenue_eur ? formatRevenue(chain.revenue_eur) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {EUROPE_GYM_CHAINS_2024.length} chains | Total members: {formatNumber(EUROPE_GYM_CHAINS_2024.reduce((sum, c) => sum + c.members, 0))} | Basic-Fit acquired Clever Fit in Oct 2025 for €175M
            </p>
          </div>
        </section>

        {/* Section: Top European Fitness Influencers */}
        <section className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-right hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.4s' }}>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center hover:scale-110 hover:-rotate-3 transition-transform duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-pink-600">
                  <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Top European Fitness Influencers</h2>
                <p className="text-gray-600">Social media reach and follower counts (2024)</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="text-left p-3 font-semibold">Rank</th>
                    <th className="text-left p-3 font-semibold">Name</th>
                    <th className="text-left p-3 font-semibold">Country</th>
                    <th className="text-left p-3 font-semibold">Instagram</th>
                    <th className="text-left p-3 font-semibold">YouTube</th>
                    <th className="text-left p-3 font-semibold">Handle</th>
                  </tr>
                </thead>
                <tbody>
                  {EUROPE_INFLUENCERS_2024.map((influencer) => (
                    <tr key={influencer.name} className="border-b border-gray-100 hover:bg-pink-50 hover:scale-[1.01] transition-all duration-200 cursor-default">
                      <td className="p-3">{influencer.rank}</td>
                      <td className="p-3 font-medium">{influencer.name}</td>
                      <td className="p-3 text-gray-500">{influencer.country_code}</td>
                      <td className="p-3 text-pink-600 font-semibold">{formatNumber(influencer.instagram_followers)}</td>
                      <td className="p-3 text-red-500">{influencer.youtube_followers ? formatNumber(influencer.youtube_followers) : '-'}</td>
                      <td className="p-3 text-gray-500 text-xs">{influencer.handle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {EUROPE_INFLUENCERS_2024.length} influencers | Pamela Reif: Forbes "30 Under 30 DACH" #1 (2020) | Tibo InShape: France&apos;s #1 fitness YouTuber
            </p>
          </div>
        </section>

        {/* Section: Fitness Hashtag Statistics */}
        <section className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-left hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.45s' }}>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center hover:scale-110 hover:rotate-6 transition-transform duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-violet-600">
                  <path d="M5.41,21L6.12,17H2.12L2.47,15H6.47L7.53,9H3.53L3.88,7H7.88L8.59,3H10.59L9.88,7H15.88L16.59,3H18.59L17.88,7H21.88L21.53,9H17.53L16.47,15H20.47L20.12,17H16.12L15.41,21H13.41L14.12,17H8.12L7.41,21H5.41M9.47,9L8.41,15H14.41L15.47,9H9.47Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Fitness Hashtag Statistics</h2>
                <p className="text-gray-600">Instagram vs TikTok comparison (2024/2025)</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="text-left p-3 font-semibold">Rank</th>
                    <th className="text-left p-3 font-semibold">Hashtag</th>
                    <th className="text-left p-3 font-semibold">Instagram Posts</th>
                    <th className="text-left p-3 font-semibold">TikTok Views</th>
                    <th className="text-left p-3 font-semibold">TikTok Videos</th>
                    <th className="text-left p-3 font-semibold">Avg Views/Video</th>
                    <th className="text-left p-3 font-semibold">Leader</th>
                  </tr>
                </thead>
                <tbody>
                  {HASHTAG_COMPARISON_2024.map((tag) => (
                    <tr key={tag.hashtag} className="border-b border-gray-100 hover:bg-violet-50 hover:scale-[1.01] transition-all duration-200 cursor-default">
                      <td className="p-3">{tag.rank}</td>
                      <td className="p-3 font-medium text-violet-700">{tag.hashtag}</td>
                      <td className="p-3 text-pink-600 font-semibold">{formatNumber(tag.instagram_posts)}</td>
                      <td className="p-3 text-cyan-600 font-semibold">{formatNumber(tag.tiktok_views)}</td>
                      <td className="p-3">{tag.tiktok_videos ? formatNumber(tag.tiktok_videos) : '-'}</td>
                      <td className="p-3 text-emerald-600">{tag.avg_views_per_video ? formatNumber(tag.avg_views_per_video) : '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tag.platform_leader === 'TikTok' ? 'bg-cyan-100 text-cyan-700' :
                          tag.platform_leader === 'Instagram' ? 'bg-pink-100 text-pink-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {tag.platform_leader}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              #gym dominates TikTok with 547B views | #fitness leads Instagram with 563M posts | #gymhumor has highest avg views (30.6K/video)
            </p>
          </div>
        </section>

        {/* Section: TikTok Top Fitness Hashtags */}
        <section className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-right hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.5s' }}>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center hover:scale-110 hover:-rotate-3 transition-transform duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-cyan-600">
                  <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">TikTok Fitness Engagement Leaders</h2>
                <p className="text-gray-600">Highest views and engagement per video (2024)</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="text-left p-3 font-semibold">Rank</th>
                    <th className="text-left p-3 font-semibold">Hashtag</th>
                    <th className="text-left p-3 font-semibold">Total Views</th>
                    <th className="text-left p-3 font-semibold">Videos</th>
                    <th className="text-left p-3 font-semibold">Avg Views/Video</th>
                  </tr>
                </thead>
                <tbody>
                  {TIKTOK_FITNESS_HASHTAGS_2024.map((tag) => (
                    <tr key={tag.hashtag} className="border-b border-gray-100 hover:bg-cyan-50 hover:scale-[1.01] transition-all duration-200 cursor-default">
                      <td className="p-3">{tag.rank}</td>
                      <td className="p-3 font-medium text-cyan-700">{tag.hashtag}</td>
                      <td className="p-3 text-cyan-600 font-semibold">{formatNumber(tag.tiktok_views)}</td>
                      <td className="p-3">{tag.tiktok_videos ? formatNumber(tag.tiktok_videos) : '-'}</td>
                      <td className="p-3 text-emerald-600 font-semibold">{tag.avg_views_per_video ? formatNumber(tag.avg_views_per_video) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Platform-native hashtags (#GymTok, #FitTok) outperform traditional tags | #gymhumor averages 30,636 views/video | TikTok fitness content averages 9.3% engagement vs 0.55% on Instagram
            </p>
          </div>
        </section>

        {/* EU Legal Framework */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg animate-rotate-in" style={{ animationDelay: '0.4s' }}>
              <Icon path={ICONS.school} size={24} className="text-indigo-600" />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-2xl font-bold text-gray-900">EU Legal Framework</h2>
              <p className="text-gray-600">Fitness, Sports, Health Supplements & Influencer Marketing</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sports */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up group" style={{ animationDelay: '0.45s' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-green-200 transition-all duration-300">
                  <Icon path={ICONS.run} size={20} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Sports & Physical Activity</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><strong>TFEU Art. 165</strong> - EU sports competence</li>
                <li><a href="https://eur-lex.europa.eu/eli/reg/2021/817/oj/eng" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>Erasmus+ (2021/817)</strong></a> - Grassroots funding</li>
                <li>Health-enhancing physical activity</li>
              </ul>
            </div>

            {/* Supplements */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up group" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-200 transition-all duration-300">
                  <Icon path={ICONS.shield} size={20} className="text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Health & Supplements</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02006R1924-20141213" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>Reg. 1924/2006</strong></a> - Health claims pre-auth</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32011R1169" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>FIC 1169/2011</strong></a> - Mandatory labelling</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02015R2283-20210327" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>Novel Foods 2015/2283</strong></a> - New ingredients</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02017R0745-20250110" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>MDR 2017/745</strong></a> - Fitness devices</li>
              </ul>
            </div>

            {/* Consumer */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up group" style={{ animationDelay: '0.55s' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-200 transition-all duration-300">
                  <Icon path={ICONS.shield} size={20} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Consumer & Product Safety</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="https://eur-lex.europa.eu/eli/reg/2023/988/oj/eng" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>GPSR 2023/988</strong></a> - Equipment safety</li>
                <li><a href="https://europa.eu/youreurope/business/product-requirements/labels-markings/ce-marking/index_en.htm" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>CE Marking</strong></a> - Required</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02011L0083-20220528" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>Consumer Rights Dir.</strong></a> - Contracts</li>
              </ul>
            </div>

            {/* Influencer */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up group" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-pink-200 transition-all duration-300">
                  <Icon path={ICONS.earth} size={20} className="text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Influencer Marketing</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02005L0029-20220528" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>UCPD 2005/29</strong></a> - Disclose relationships</li>
                <li><a href="https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>DSA 2022/2065</strong></a> - Ad transparency</li>
                <li><a href="https://eur-lex.europa.eu/eli/dir/2018/1808/oj/eng" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>AVMSD 2018/1808</strong></a> - Clear identification</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02016R0679-20160504" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>GDPR</strong></a> - Consent for targeted ads</li>
              </ul>
            </div>

            {/* Anti-Doping */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up group" style={{ animationDelay: '0.65s' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-red-200 transition-all duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-600">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Anti-Doping</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="https://rm.coe.int/168007b0d8" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>CoE Convention (1989)</strong></a> - Obligations</li>
                <li><a href="https://www.wada-ama.org/en/what-we-do/world-anti-doping-code" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>WADA Code</strong></a> - Via federations</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02019R1148-20190711" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>Reg. 2019/1148</strong></a> - Precursors</li>
              </ul>
            </div>

            {/* Penalties */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up group" style={{ animationDelay: '0.7s' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-gray-300 transition-all duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12H14A2,2 0 0,0 12,10V8Z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Enforcement & Penalties</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02005L0029-20220528" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>UCPD:</strong></a> Up to 4% turnover</li>
                <li><a href="https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>DSA:</strong></a> Up to 6% global turnover</li>
                <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02016R0679-20160504" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>GDPR:</strong></a> Up to 20M or 4%</li>
                <li><a href="https://eur-lex.europa.eu/eli/reg/2023/988/oj/eng" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><strong>Product safety:</strong></a> Criminal liability</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="font-medium">Sources:</span>
            <a href="https://eur-lex.europa.eu/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">EUR-Lex</a> |
            <a href="https://op.europa.eu/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">EU Publications Office</a> |
            <span>European Commission DG SANTE</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {/* Join Massimino */}
          <div className="relative rounded-xl overflow-hidden min-h-[200px] group animate-fade-in-left" style={{ animationDelay: '0.75s' }}>
            {/* Video Background */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/images/background/autumn_run.mp4" type="video/mp4" />
            </video>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/70 to-brand-primary-dark/50" />
            {/* Content */}
            <div className="relative z-10 p-6 text-white h-full">
              <div className="flex gap-6 h-full">
                {/* Square logo on left */}
                <div className="flex-shrink-0 w-24 h-24 bg-white/95 backdrop-blur rounded-xl overflow-hidden flex items-center justify-center p-2 shadow-lg group-hover:animate-float">
                  <div className="relative w-full h-full">
                    <Image
                      src="/massimino_logo_word.png"
                      alt="Massimino"
                      fill
                      className="object-contain"
                      sizes="96px"
                    />
                  </div>
                </div>
                {/* Text content on right */}
                <div className="flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="text-xl font-bold mb-2 drop-shadow-md">Join Massimino</h3>
                    <p className="text-white/95 text-sm drop-shadow">
                      Access personalized training programs, track your progress, and connect with a community
                      of fitness enthusiasts.
                    </p>
                  </div>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 bg-white text-brand-primary px-6 py-3 rounded-lg font-semibold mt-4 w-fit shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 group/btn hover:animate-glow-pulse"
                  >
                    <span>Get Started Free</span>
                    <Icon path={ICONS.arrowRight} size={18} className="transform group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Beresol BV */}
          <div className="relative rounded-xl overflow-hidden min-h-[200px] group animate-fade-in-right" style={{ animationDelay: '0.8s' }}>
            {/* Video Background */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/images/background/euflag.mp4" type="video/mp4" />
            </video>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-800/70 to-blue-600/50" />
            {/* Content */}
            <div className="relative z-10 p-6 text-white h-full">
              <div className="flex gap-6 h-full">
                {/* Square logo on left */}
                <div className="flex-shrink-0 w-24 h-24 bg-white/95 backdrop-blur rounded-xl overflow-hidden flex items-center justify-center p-2 shadow-lg group-hover:animate-float">
                  <div className="relative w-full h-full">
                    <Image
                      src="/beresol-logo.png"
                      alt="Beresol BV"
                      fill
                      className="object-contain"
                      sizes="96px"
                    />
                  </div>
                </div>
                {/* Text content on right */}
                <div className="flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="text-xl font-bold mb-2 drop-shadow-md">Beresol BV</h3>
                    <p className="text-white/95 text-sm drop-shadow">
                      Stay compliant with EU fitness regulations. Comprehensive regulatory
                      intelligence for fitness businesses and influencers.
                    </p>
                  </div>
                  <a
                    href="https://beresol.eu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold mt-4 w-fit shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 group/btn hover:animate-glow-pulse"
                  >
                    <span>Visit Beresol</span>
                    <Icon path={ICONS.openNew} size={18} className="transform group-hover/btn:rotate-12 transition-transform duration-300" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom EU Policy Monitor CTA */}
        <div className="mt-8 group bg-gradient-to-r from-gray-100/50 via-gray-50/30 to-gray-100/50 border border-gray-200/50 rounded-xl p-8 text-center hover:border-blue-300/50 hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-600">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-800">Need a tailored EU policy monitor?</h4>
          </div>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            In <a href="https://beresol.eu" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200">Beresol</a>, we build custom intelligence dashboards tracking legislation, funding programs, stakeholder movements, and regulatory developments in any policy area of the European Union.
          </p>
          <a
            href="mailto:helloberesol@gmail.com?subject=Custom EU Policy Monitor Inquiry"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect width="20" height="16" x="2" y="4" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
            Get in Touch
          </a>
        </div>

        {/* Data Sources */}
        <div className="mt-12 bg-gray-100 rounded-xl p-6 animate-blur-in" style={{ animationDelay: '0.85s' }}>
          <h4 className="font-semibold text-gray-900 mb-4">Data Sources & Methodology</h4>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Primary Sources</h5>
              <ul className="space-y-1">
                <li><a href="https://www.europeactive.eu/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200">EuropeActive</a> - 2025 European Health & Fitness Market Report</li>
                <li><a href="https://www.healthandfitness.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200">Health & Fitness Association (HFA)</a> - 2025 Global Report</li>
                <li><a href="https://www.statista.com/topics/3405/fitness-industry-in-europe/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200">Statista</a> - European Fitness Statistics</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Map Technology</h5>
              <ul className="space-y-1">
                <li><a href="https://maplibre.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200">MapLibre GL JS</a> - Open-source map rendering (BSD-3)</li>
                <li><a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200">OpenStreetMap</a> - Geographic data (ODbL)</li>
                <li><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200">Natural Earth</a> - GeoJSON boundaries</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Data as of 2024. Deloitte/EuropeActive report figures. Some regional estimates based on market trends.
          </p>
        </div>
      </div>
    </main>
  );
}
