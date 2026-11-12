'use client';

import { useState } from 'react';
import type { CountryFitnessData } from '@/types/fitness_data';
import { EuropeMap, type MetricType } from './europe_map';
import { CountryDetailPanel } from './country_detail_panel';

interface FitnessMapSectionProps {
  data: CountryFitnessData[];
  totalMarketEur: number;
}

// Section title follows the metric chosen in the map's selector
const MAP_TITLES: Record<MetricType, string> = {
  penetration: 'Gym penetration across Europe',
  market: 'Fitness market size across Europe',
  members: 'Gym members across Europe',
  growth: 'Membership growth across Europe',
};

export function FitnessMapSection({ data, totalMarketEur }: FitnessMapSectionProps) {
  const [selected, setSelected] = useState<CountryFitnessData | null>(null);
  const [metric, setMetric] = useState<MetricType>('penetration');

  return (
    <div>
      <h2 className="mb-6 font-display text-2xl font-bold tracking-tight text-brand-primary sm:text-3xl" aria-live="polite">
        {MAP_TITLES[metric]}
      </h2>

      <div className="relative overflow-hidden rounded-card bg-white shadow-soft">
        <EuropeMap
          data={data}
          onCountrySelect={setSelected}
          onMetricChange={setMetric}
          containerClassName="fi-map-h w-full"
        />

        {/* Hint */}
        <div className="pointer-events-none absolute left-1/2 top-4 z-20 hidden -translate-x-1/2 rounded-full bg-brand-primary/90 px-3 py-1.5 text-xs font-medium text-white shadow-sm md:block">
          Click a country for detail
        </div>

        <CountryDetailPanel
          country={selected}
          onClose={() => setSelected(null)}
          totalMarketEur={totalMarketEur}
        />
      </div>
    </div>
  );
}
