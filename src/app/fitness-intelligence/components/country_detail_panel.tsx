'use client';

import { useEffect } from 'react';
import type { CountryFitnessData } from '@/types/fitness_data';
import {
  getGymChainsByCountry,
  getInfluencersByCountry,
  formatNumber,
  formatRevenue,
} from '@/data/fitness/industry_2024';

/** Convert a 2-letter ISO code to its flag emoji. */
function flagEmoji(iso: string): string {
  if (iso.length !== 2) return '';
  const codePoints = iso
    .toUpperCase()
    .split('')
    .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg bg-brand-secondary p-3">
      <div className={`text-lg font-bold ${accent}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

interface CountryDetailPanelProps {
  country: CountryFitnessData | null;
  onClose: () => void;
  totalMarketEur: number;
}

export function CountryDetailPanel({ country, onClose, totalMarketEur }: CountryDetailPanelProps) {
  // Close on Escape
  useEffect(() => {
    if (!country) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [country, onClose]);

  if (!country) return null;

  const chains = getGymChainsByCountry(country.iso_code);
  const influencers = getInfluencersByCountry(country.iso_code);
  const marketShare = ((country.market_size_eur / totalMarketEur) * 100).toFixed(1);

  return (
    <>
      {/* Backdrop (mobile / overlay) */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:absolute lg:bg-black/10"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${country.name} fitness market detail`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl animate-fade-in-right lg:absolute lg:inset-y-0 lg:rounded-r-xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-100 bg-brand-primary p-5 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">{flagEmoji(country.iso_code)}</span>
              <h3 className="text-xl font-bold">{country.name}</h3>
            </div>
            <p className="mt-1 text-sm text-white/80">
              {country.iso_code} · {country.clubs_count.toLocaleString()} clubs · {marketShare}% of EU market
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close detail panel"
            className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-5">
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Penetration rate" value={`${country.penetration_rate}%`} accent="text-brand-primary" />
            <Stat label="Members" value={`${country.members_millions.toFixed(2)}M`} accent="text-orange-600" />
            <Stat
              label="Market size"
              value={
                country.market_size_eur >= 1e9
                  ? `€${(country.market_size_eur / 1e9).toFixed(1)}B`
                  : `€${(country.market_size_eur / 1e6).toFixed(0)}M`
              }
              accent="text-emerald-600"
            />
            <Stat label="Growth (CAGR)" value={`${country.growth_cagr}%`} accent="text-purple-600" />
          </div>

          {/* Top chains from the country dataset */}
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Leading chains
            </h4>
            <div className="flex flex-wrap gap-2">
              {country.top_chains.map((chain) => (
                <span
                  key={chain}
                  className="rounded-full bg-brand-primary/10 px-3 py-1 text-sm font-medium text-brand-primary"
                >
                  {chain}
                </span>
              ))}
            </div>
          </div>

          {/* Per-country chain breakdown (where available) */}
          {chains.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Chain breakdown
              </h4>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100">
                {chains.map((chain) => (
                  <li key={chain.name} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <div className="min-w-0">
                      {chain.website ? (
                        <a
                          href={chain.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-brand-primary hover:underline"
                        >
                          {chain.name}
                        </a>
                      ) : (
                        <span className="font-medium text-gray-900">{chain.name}</span>
                      )}
                      <div className="text-xs text-gray-500">
                        {chain.locations.toLocaleString()} locations
                        {chain.revenue_eur ? ` · ${formatRevenue(chain.revenue_eur)}` : ''}
                      </div>
                    </div>
                    <span className="whitespace-nowrap font-semibold text-orange-600">
                      {formatNumber(chain.members)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Local influencers (where available) */}
          {influencers.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Top creators
              </h4>
              <ul className="space-y-2">
                {influencers.map((inf) => (
                  <li key={inf.name} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900">{inf.name}</span>
                      <div className="truncate text-xs text-gray-500">{inf.handle} · {inf.specialty}</div>
                    </div>
                    <span className="whitespace-nowrap font-semibold text-pink-600">
                      {formatNumber(inf.instagram_followers)} IG
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {chains.length === 0 && influencers.length === 0 && (
            <p className="text-sm text-gray-400">
              Detailed chain and creator breakdowns are not yet available for {country.name}.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
