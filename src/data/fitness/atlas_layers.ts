// src/data/fitness/atlas_layers.ts
//
// Layer catalogue for the Sport Europe atlas on /fitness-intelligence.
// Joins the four sourced datasets by ISO code into one attribute table, the way a GIS
// joins attribute data to boundaries. No figure is created here: every value is read
// from the files named in each layer's `source`.

import { EUROPE_FITNESS_DATA_2024 } from './europe_2024';
import { EUROSTAT_ACTIVITY, EUROSTAT_ACTIVITY_META } from './eurostat_activity';
import { SPORT_EUROPE, SPORT_EUROPE_META } from './sport_europe';
import { EUROPE_TOTALS } from '@/types/fitness_data';

export type ThemeId = 'market' | 'participation' | 'health' | 'workforce' | 'olympics';

export interface AtlasTheme {
  id: ThemeId;
  label: string;
  /** Five-class sequential ramp, light to dark (ColorBrewer-derived, colour-blind safe) */
  ramp: [string, string, string, string, string];
  /** Accent used for symbols and highlights */
  accent: string;
}

export const ATLAS_THEMES: AtlasTheme[] = [
  { id: 'market', label: 'Gym market', ramp: ['#e0e9ef', '#a9c1d1', '#6489a3', '#2b5069', '#16303f'], accent: '#2b5069' },
  { id: 'participation', label: 'Sport participation', ramp: ['#d5f0ee', '#9bd8d2', '#4fb3ab', '#1f8a82', '#0f5c57'], accent: '#1f8a82' },
  { id: 'health', label: 'Health', ramp: ['#e5f5e0', '#a1d99b', '#74c476', '#31a354', '#006d2c'], accent: '#31a354' },
  { id: 'workforce', label: 'Sport workforce', ramp: ['#fee6ce', '#fdae6b', '#f16913', '#c2410c', '#7f2704'], accent: '#c2410c' },
  { id: 'olympics', label: 'Paris 2024', ramp: ['#efedf5', '#c4c1df', '#9e9ac8', '#6a51a3', '#3f007d'], accent: '#6a51a3' },
];

export interface AtlasSource {
  name: string;
  url: string;
  year: string;
  licence: string;
}

const SRC = {
  market: {
    name: 'EuropeActive/Deloitte European Health & Fitness Market Report 2026, national bodies',
    url: 'https://www.europeactive.eu/',
    year: 'FY2024 to FY2025',
    licence: 'Figures quoted from published reports',
  },
  eb525: {
    name: 'Special Eurobarometer 525: Sport and physical activity',
    url: SPORT_EUROPE_META.participation.url,
    year: '2022 fieldwork',
    licence: '© European Union, reuse authorised (Decision 2011/833/EU)',
  },
  ehis: {
    name: `Eurostat ${EUROSTAT_ACTIVITY_META.dataset_code} (EHIS)`,
    url: EUROSTAT_ACTIVITY_META.public_url,
    year: '2019 wave (UK 2014)',
    licence: 'Eurostat, CC BY 4.0',
  },
  employment: {
    name: 'Eurostat sprt_emp_sex and sprt_emp_age',
    url: SPORT_EUROPE_META.employment.url,
    year: '2025',
    licence: 'Eurostat, CC BY 4.0',
  },
  olympics: {
    name: 'Paris 2024 medal results (data.education.gouv.fr) and Eurostat tps00001 population',
    url: SPORT_EUROPE_META.olympics.url,
    year: '2024',
    licence: 'Licence Ouverte / Eurostat CC BY 4.0',
  },
} satisfies Record<string, AtlasSource>;

/** One row of the joined attribute table */
export interface AtlasRecord {
  iso_code: string;
  name: string;
  eu: boolean;
  values: Partial<Record<string, number>>;
}

export interface AtlasLayer {
  id: string;
  theme: ThemeId;
  label: string;
  /** Short question the layer answers, shown under the legend */
  question: string;
  unit: string;
  /** rate layers draw as choropleth fills; count layers draw as proportional symbols */
  kind: 'rate' | 'count';
  decimals: number;
  /** Comparison value shown in the identify panel */
  reference?: { label: string; value: number };
  note?: string;
  source: AtlasSource;
}

export const ATLAS_LAYERS: AtlasLayer[] = [
  // Gym market
  {
    id: 'penetration', theme: 'market', label: 'Gym penetration', unit: '%', kind: 'rate', decimals: 1,
    question: 'What share of the population holds a gym membership?',
    reference: { label: 'Europe average', value: EUROPE_TOTALS.average_penetration },
    note: 'Per-country figures blend FY2024 and FY2025; some smaller markets are estimates.',
    source: SRC.market,
  },
  {
    id: 'cagr', theme: 'market', label: 'Projected membership growth (CAGR)', unit: '%', kind: 'rate', decimals: 1,
    question: 'Where is gym membership expected to grow fastest?',
    source: SRC.market,
  },
  {
    id: 'members', theme: 'market', label: 'Gym members', unit: 'M', kind: 'count', decimals: 2,
    question: 'How many people hold a gym membership?',
    source: SRC.market,
  },
  {
    id: 'market_size', theme: 'market', label: 'Market size', unit: '€M', kind: 'count', decimals: 0,
    question: 'How big is each national fitness market?',
    source: SRC.market,
  },
  // Sport participation (Eurobarometer 525)
  {
    id: 'regular_sport', theme: 'participation', label: 'Exercise at least weekly', unit: '%', kind: 'rate', decimals: 1,
    question: 'What share of adults exercise or play sport at least once a week?',
    reference: { label: 'EU27', value: SPORT_EUROPE_META.participation.eu27_regular_pct },
    source: SRC.eb525,
  },
  {
    id: 'never', theme: 'participation', label: 'Never exercise', unit: '%', kind: 'rate', decimals: 1,
    question: 'What share of adults never exercise or play sport?',
    reference: { label: 'EU27', value: SPORT_EUROPE_META.participation.eu27_never_pct },
    source: SRC.eb525,
  },
  {
    id: 'gender_gap', theme: 'participation', label: 'Gender gap in weekly exercise', unit: 'pts', kind: 'rate', decimals: 1,
    question: 'How many points more likely are men than women to exercise weekly?',
    reference: {
      label: 'EU27',
      value: Math.round((SPORT_EUROPE_META.participation.eu27_men_pct - SPORT_EUROPE_META.participation.eu27_women_pct) * 10) / 10,
    },
    note: 'Men minus women. A negative value means women are more active.',
    source: SRC.eb525,
  },
  {
    id: 'fitness_member', theme: 'participation', label: 'Fitness centre members (survey)', unit: '%', kind: 'rate', decimals: 1,
    question: 'What share of adults say they belong to a health or fitness centre?',
    reference: { label: 'EU27', value: SPORT_EUROPE_META.participation.eu27_fitness_centre_member_pct },
    note: 'Self-reported in a survey, so it differs from industry membership counts.',
    source: SRC.eb525,
  },
  {
    id: 'trains_at_fc', theme: 'participation', label: 'Active people training in a gym', unit: '%', kind: 'rate', decimals: 1,
    question: 'Of adults who are physically active, how many do it in a health or fitness centre?',
    reference: { label: 'EU27', value: SPORT_EUROPE_META.participation.eu27_trains_at_fitness_centre_pct },
    source: SRC.eb525,
  },
  {
    id: 'no_time', theme: 'participation', label: '"No time" as main barrier', unit: '%', kind: 'rate', decimals: 1,
    question: 'What share of adults say lack of time stops them doing more sport?',
    reference: { label: 'EU27', value: SPORT_EUROPE_META.participation.eu27_barrier_no_time_pct },
    source: SRC.eb525,
  },
  // Health
  {
    id: 'who_guideline', theme: 'health', label: 'Meet the WHO activity guideline', unit: '%', kind: 'rate', decimals: 1,
    question: 'What share of adults meet the WHO aerobic and muscle-strengthening guideline?',
    reference: { label: 'EU27', value: EUROSTAT_ACTIVITY_META.eu27_average },
    source: SRC.ehis,
  },
  // Sport workforce
  {
    id: 'sport_emp_share', theme: 'workforce', label: 'Sport jobs, share of employment', unit: '%', kind: 'rate', decimals: 2,
    question: 'What share of all jobs are in sport (coaches, instructors, managers)?',
    reference: { label: 'EU27', value: SPORT_EUROPE_META.employment.eu27_share_pct },
    source: SRC.employment,
  },
  {
    id: 'sport_emp_change', theme: 'workforce', label: 'Change in sport job share since 2011', unit: 'pts', kind: 'rate', decimals: 2,
    question: 'How much has the sport share of employment grown since 2011?',
    reference: {
      label: 'EU27',
      value: Math.round((SPORT_EUROPE_META.employment.eu27_share_pct - SPORT_EUROPE_META.employment.eu27_share_2011_pct) * 100) / 100,
    },
    source: SRC.employment,
  },
  {
    id: 'youth_share', theme: 'workforce', label: 'Sport workers aged 15 to 29', unit: '%', kind: 'rate', decimals: 1,
    question: 'What share of the sport workforce is aged 15 to 29?',
    reference: { label: 'EU27', value: SPORT_EUROPE_META.employment.eu27_youth_share_pct },
    note: 'Left blank where Eurostat flags the youth count as low reliability.',
    source: SRC.employment,
  },
  {
    id: 'sport_jobs', theme: 'workforce', label: 'Sport jobs', unit: 'k', kind: 'count', decimals: 1,
    question: 'How many people work in sport?',
    source: SRC.employment,
  },
  // Paris 2024
  {
    id: 'medals_per_million', theme: 'olympics', label: 'Medals per million people', unit: '', kind: 'rate', decimals: 2,
    question: 'Which countries won the most Paris 2024 medals for their size?',
    reference: {
      label: 'EU27',
      value: Math.round((SPORT_EUROPE_META.olympics.eu27_total / 450.05) * 100) / 100,
    },
    source: SRC.olympics,
  },
  {
    id: 'medals', theme: 'olympics', label: 'Olympic medals', unit: '', kind: 'count', decimals: 0,
    question: 'How many medals did each country win at Paris 2024?',
    source: SRC.olympics,
  },
];

export const LAYER_BY_ID = new Map(ATLAS_LAYERS.map((l) => [l.id, l]));
export const THEME_BY_ID = new Map(ATLAS_THEMES.map((t) => [t.id, t]));

function buildRecords(): AtlasRecord[] {
  const byIso = new Map<string, AtlasRecord>();
  const row = (iso: string, name: string, eu = false) => {
    let r = byIso.get(iso);
    if (!r) {
      r = { iso_code: iso, name, eu, values: {} };
      byIso.set(iso, r);
    }
    if (eu) r.eu = true;
    return r;
  };

  for (const c of EUROPE_FITNESS_DATA_2024) {
    const r = row(c.iso_code, c.name);
    r.values.penetration = c.penetration_rate;
    r.values.cagr = c.growth_cagr;
    r.values.members = c.members_millions;
    r.values.market_size = Math.round(c.market_size_eur / 1e6);
  }

  for (const a of EUROSTAT_ACTIVITY) {
    row(a.iso_code, a.name).values.who_guideline = a.activity_pct;
  }

  for (const s of SPORT_EUROPE) {
    const r = row(s.iso_code, s.name, s.eu);
    r.name = s.name; // Eurostat naming
    if (s.participation) {
      const p = s.participation;
      r.values.regular_sport = p.regular_pct;
      r.values.never = p.never_pct;
      r.values.gender_gap = Math.round((p.men_pct - p.women_pct) * 10) / 10;
      r.values.fitness_member = p.fitness_centre_member_pct;
      r.values.trains_at_fc = p.trains_at_fitness_centre_pct;
      r.values.no_time = p.barrier_no_time_pct;
    }
    if (s.employment) {
      const e = s.employment;
      r.values.sport_emp_share = e.share_pct;
      r.values.sport_jobs = e.jobs_thousands;
      if (e.share_2011_pct != null) r.values.sport_emp_change = Math.round((e.share_pct - e.share_2011_pct) * 100) / 100;
      if (e.youth_share_pct != null) r.values.youth_share = e.youth_share_pct;
    }
    // Only record medals for countries that competed in the source table; zero is a real value for EU members
    if (s.olympics.total > 0 || s.eu) {
      r.values.medals = s.olympics.total;
      if (s.olympics.per_million != null) r.values.medals_per_million = s.olympics.per_million;
    }
  }

  return [...byIso.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const ATLAS_RECORDS: AtlasRecord[] = buildRecords();
