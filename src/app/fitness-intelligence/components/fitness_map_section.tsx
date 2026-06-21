'use client';

import { useState } from 'react';
import type { CountryFitnessData } from '@/types/fitness_data';
import { EuropeMap } from './europe_map';
import { CountryDetailPanel } from './country_detail_panel';

interface FitnessMapSectionProps {
  data: CountryFitnessData[];
  totalMarketEur: number;
}

export function FitnessMapSection({ data, totalMarketEur }: FitnessMapSectionProps) {
  const [selected, setSelected] = useState<CountryFitnessData | null>(null);

  return (
    <div className="relative">
      <EuropeMap data={data} onCountrySelect={setSelected} />

      {/* Hint */}
      <div className="pointer-events-none absolute left-1/2 top-4 z-20 hidden -translate-x-1/2 rounded-full bg-brand-primary/90 px-3 py-1.5 text-xs font-medium text-white shadow-sm sm:block">
        Click a country for detail
      </div>

      <CountryDetailPanel
        country={selected}
        onClose={() => setSelected(null)}
        totalMarketEur={totalMarketEur}
      />
    </div>
  );
}
