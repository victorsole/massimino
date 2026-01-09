// src/data/fitness/europe_2024.ts
// Data sources: EuropeActive/Deloitte European Health & Fitness Market Report 2025 (2024 data),
// Statista, Health & Fitness Association, and industry reports.
// Last updated: January 2025

import type { CountryFitnessData } from '@/types/fitness_data';

export const EUROPE_FITNESS_DATA_2024: CountryFitnessData[] = [
  // ===== NORDIC COUNTRIES (Highest penetration in Europe) =====
  {
    iso_code: 'SE',
    name: 'Sweden',
    market_size_eur: 1100000000,
    members_millions: 2.25,
    penetration_rate: 21.6,
    growth_cagr: 5.8,
    clubs_count: 750,
    trainers_count: 12000,
    top_chains: ['SATS', 'Nordic Wellness', 'Friskis&Svettis'],
    year: 2024
  },
  {
    iso_code: 'NO',
    name: 'Norway',
    market_size_eur: 850000000,
    members_millions: 1.18,
    penetration_rate: 21.4,
    growth_cagr: 5.2,
    clubs_count: 600,
    trainers_count: 8500,
    top_chains: ['SATS', 'Evo Fitness', 'Treningshansen'],
    year: 2024
  },
  {
    iso_code: 'DK',
    name: 'Denmark',
    market_size_eur: 620000000,
    members_millions: 1.08,
    penetration_rate: 18.3,
    growth_cagr: 6.2,
    clubs_count: 520,
    trainers_count: 6500,
    top_chains: ['Fitness World', 'PureGym', 'Loop Fitness'],
    year: 2024
  },
  {
    iso_code: 'FI',
    name: 'Finland',
    market_size_eur: 520000000,
    members_millions: 0.85,
    penetration_rate: 15.3,
    growth_cagr: 5.8,
    clubs_count: 450,
    trainers_count: 5200,
    top_chains: ['SATS', 'Elixia', 'Fitness24Seven'],
    year: 2024
  },
  {
    iso_code: 'IS',
    name: 'Iceland',
    market_size_eur: 65000000,
    members_millions: 0.068,
    penetration_rate: 17.8,
    growth_cagr: 4.8,
    clubs_count: 65,
    trainers_count: 650,
    top_chains: ['World Class', 'Jakaból', 'CrossFit Reykjavik'],
    year: 2024
  },

  // ===== BRITISH ISLES =====
  {
    iso_code: 'GB',
    name: 'United Kingdom',
    market_size_eur: 6700000000,
    members_millions: 11.5,
    penetration_rate: 16.9,
    growth_cagr: 6.1,
    clubs_count: 7600,
    trainers_count: 68000,
    top_chains: ['PureGym', 'The Gym Group', 'David Lloyd'],
    year: 2024
  },
  {
    iso_code: 'IE',
    name: 'Ireland',
    market_size_eur: 480000000,
    members_millions: 0.62,
    penetration_rate: 12.2,
    growth_cagr: 7.5,
    clubs_count: 380,
    trainers_count: 4200,
    top_chains: ['Flyefit', 'Ben Dunne Gyms', 'West Wood Club'],
    year: 2024
  },

  // ===== WESTERN EUROPE =====
  {
    iso_code: 'DE',
    name: 'Germany',
    market_size_eur: 5800000000,
    members_millions: 11.7,
    penetration_rate: 13.8,
    growth_cagr: 3.6,
    clubs_count: 9127,
    trainers_count: 88000,
    top_chains: ['RSG Group', 'Clever fit', 'FitX'],
    year: 2024
  },
  {
    iso_code: 'FR',
    name: 'France',
    market_size_eur: 3200000000,
    members_millions: 6.8,
    penetration_rate: 10.1,
    growth_cagr: 8.2,
    clubs_count: 6200,
    trainers_count: 48000,
    top_chains: ['Basic-Fit', 'Fitness Park', 'Neoness'],
    year: 2024
  },
  {
    iso_code: 'NL',
    name: 'Netherlands',
    market_size_eur: 1850000000,
    members_millions: 3.0,
    penetration_rate: 16.7,
    growth_cagr: 5.8,
    clubs_count: 2100,
    trainers_count: 19000,
    top_chains: ['Basic-Fit', 'TrainMore', 'Fit For Free'],
    year: 2024
  },
  {
    iso_code: 'BE',
    name: 'Belgium',
    market_size_eur: 680000000,
    members_millions: 1.35,
    penetration_rate: 11.6,
    growth_cagr: 7.2,
    clubs_count: 580,
    trainers_count: 8500,
    top_chains: ['Basic-Fit', 'Jims', 'Fitness Park'],
    year: 2024
  },
  {
    iso_code: 'LU',
    name: 'Luxembourg',
    market_size_eur: 125000000,
    members_millions: 0.092,
    penetration_rate: 14.2,
    growth_cagr: 6.5,
    clubs_count: 72,
    trainers_count: 850,
    top_chains: ['Fitness First', 'Basic-Fit', 'Les Mills'],
    year: 2024
  },

  // ===== CENTRAL EUROPE =====
  {
    iso_code: 'CH',
    name: 'Switzerland',
    market_size_eur: 1650000000,
    members_millions: 1.35,
    penetration_rate: 15.4,
    growth_cagr: 4.8,
    clubs_count: 850,
    trainers_count: 10500,
    top_chains: ['Migros Fitnesspark', 'Activ Fitness', 'Update Fitness'],
    year: 2024
  },
  {
    iso_code: 'AT',
    name: 'Austria',
    market_size_eur: 780000000,
    members_millions: 1.28,
    penetration_rate: 13.9,
    growth_cagr: 6.8,
    clubs_count: 750,
    trainers_count: 8500,
    top_chains: ['LifeFit Group', 'John Harris', 'McFit'],
    year: 2024
  },
  {
    iso_code: 'PL',
    name: 'Poland',
    market_size_eur: 1150000000,
    members_millions: 3.2,
    penetration_rate: 8.4,
    growth_cagr: 9.2,
    clubs_count: 3800,
    trainers_count: 28000,
    top_chains: ['Benefit Systems', 'CityFit', 'Zdrofit'],
    year: 2024
  },
  {
    iso_code: 'CZ',
    name: 'Czech Republic',
    market_size_eur: 380000000,
    members_millions: 0.72,
    penetration_rate: 6.7,
    growth_cagr: 8.5,
    clubs_count: 950,
    trainers_count: 7000,
    top_chains: ['Fitness Project', 'John Reed', 'Form Factory'],
    year: 2024
  },
  {
    iso_code: 'SK',
    name: 'Slovakia',
    market_size_eur: 145000000,
    members_millions: 0.32,
    penetration_rate: 5.8,
    growth_cagr: 7.8,
    clubs_count: 420,
    trainers_count: 3500,
    top_chains: ['Golem Club', 'Fitinn', 'X-Fitness'],
    year: 2024
  },
  {
    iso_code: 'HU',
    name: 'Hungary',
    market_size_eur: 280000000,
    members_millions: 0.58,
    penetration_rate: 5.9,
    growth_cagr: 9.5,
    clubs_count: 650,
    trainers_count: 5000,
    top_chains: ['Life1 Fitness', 'All You Can Move', 'Fitness Force'],
    year: 2024
  },

  // ===== SOUTHERN EUROPE =====
  {
    iso_code: 'ES',
    name: 'Spain',
    market_size_eur: 2600000000,
    members_millions: 6.2,
    penetration_rate: 13.0,
    growth_cagr: 8.7,
    clubs_count: 4950,
    trainers_count: 42000,
    top_chains: ['Basic-Fit', 'Vivagym', 'AltaFit'],
    year: 2024
  },
  {
    iso_code: 'PT',
    name: 'Portugal',
    market_size_eur: 420000000,
    members_millions: 0.92,
    penetration_rate: 8.9,
    growth_cagr: 8.2,
    clubs_count: 720,
    trainers_count: 6200,
    top_chains: ['Holmes Place', 'Fitness Hut', 'Solinca'],
    year: 2024
  },
  {
    iso_code: 'IT',
    name: 'Italy',
    market_size_eur: 2400000000,
    members_millions: 5.5,
    penetration_rate: 9.3,
    growth_cagr: 7.8,
    clubs_count: 7200,
    trainers_count: 48000,
    top_chains: ['Anytime Fitness', 'McFit', 'Virgin Active'],
    year: 2024
  },
  {
    iso_code: 'GR',
    name: 'Greece',
    market_size_eur: 380000000,
    members_millions: 0.78,
    penetration_rate: 7.4,
    growth_cagr: 8.8,
    clubs_count: 680,
    trainers_count: 5500,
    top_chains: ['Holmes Place', 'Curves', 'Body Control'],
    year: 2024
  },
  {
    iso_code: 'MT',
    name: 'Malta',
    market_size_eur: 42000000,
    members_millions: 0.048,
    penetration_rate: 9.2,
    growth_cagr: 6.8,
    clubs_count: 48,
    trainers_count: 450,
    top_chains: ['Tigne Fitness', 'Cynergi Health', 'Powerhouse'],
    year: 2024
  },
  {
    iso_code: 'CY',
    name: 'Cyprus',
    market_size_eur: 72000000,
    members_millions: 0.082,
    penetration_rate: 9.1,
    growth_cagr: 7.2,
    clubs_count: 95,
    trainers_count: 720,
    top_chains: ['Oxygen Gym', 'Virgin Active', 'CrossFit Limassol'],
    year: 2024
  },

  // ===== BALKANS =====
  {
    iso_code: 'SI',
    name: 'Slovenia',
    market_size_eur: 95000000,
    members_millions: 0.13,
    penetration_rate: 6.1,
    growth_cagr: 7.5,
    clubs_count: 180,
    trainers_count: 1400,
    top_chains: ['Fitinn', 'ABS Fitness', 'Activity'],
    year: 2024
  },
  {
    iso_code: 'HR',
    name: 'Croatia',
    market_size_eur: 125000000,
    members_millions: 0.2,
    penetration_rate: 5.2,
    growth_cagr: 8.2,
    clubs_count: 320,
    trainers_count: 2400,
    top_chains: ['Fitness First', 'Gyms4You', 'World Class'],
    year: 2024
  },
  {
    iso_code: 'RS',
    name: 'Serbia',
    market_size_eur: 105000000,
    members_millions: 0.28,
    penetration_rate: 4.1,
    growth_cagr: 9.5,
    clubs_count: 380,
    trainers_count: 2800,
    top_chains: ['Fit Zone', 'Puls Sport', 'MrFit'],
    year: 2024
  },
  {
    iso_code: 'BA',
    name: 'Bosnia and Herzegovina',
    market_size_eur: 42000000,
    members_millions: 0.12,
    penetration_rate: 3.6,
    growth_cagr: 8.5,
    clubs_count: 190,
    trainers_count: 1200,
    top_chains: ['Gym Factory', 'Fitness One', 'Gold Gym'],
    year: 2024
  },
  {
    iso_code: 'ME',
    name: 'Montenegro',
    market_size_eur: 18000000,
    members_millions: 0.025,
    penetration_rate: 4.0,
    growth_cagr: 8.8,
    clubs_count: 65,
    trainers_count: 480,
    top_chains: ['Gym Pro', 'Fit Life', 'CrossFit Podgorica'],
    year: 2024
  },
  {
    iso_code: 'AL',
    name: 'Albania',
    market_size_eur: 32000000,
    members_millions: 0.085,
    penetration_rate: 3.0,
    growth_cagr: 10.5,
    clubs_count: 150,
    trainers_count: 950,
    top_chains: ['Metropol Gym', 'CrossFit Tirana', 'Fitness Zone'],
    year: 2024
  },
  {
    iso_code: 'MK',
    name: 'North Macedonia',
    market_size_eur: 28000000,
    members_millions: 0.072,
    penetration_rate: 3.4,
    growth_cagr: 8.8,
    clubs_count: 135,
    trainers_count: 850,
    top_chains: ['Fit Factory', 'Pro Gym', 'CrossFit Skopje'],
    year: 2024
  },
  {
    iso_code: 'XK',
    name: 'Kosovo',
    market_size_eur: 22000000,
    members_millions: 0.055,
    penetration_rate: 3.0,
    growth_cagr: 11.0,
    clubs_count: 95,
    trainers_count: 620,
    top_chains: ['Fitness Zone', 'Pro Gym', 'Active Life'],
    year: 2024
  },
  {
    iso_code: 'BG',
    name: 'Bulgaria',
    market_size_eur: 155000000,
    members_millions: 0.32,
    penetration_rate: 4.6,
    growth_cagr: 9.2,
    clubs_count: 480,
    trainers_count: 3500,
    top_chains: ['MultiSport', 'Next Level', 'Pulse Fitness'],
    year: 2024
  },
  {
    iso_code: 'RO',
    name: 'Romania',
    market_size_eur: 320000000,
    members_millions: 0.88,
    penetration_rate: 4.6,
    growth_cagr: 10.2,
    clubs_count: 720,
    trainers_count: 5800,
    top_chains: ['World Class', '7Card', 'Smartfit'],
    year: 2024
  },

  // ===== BALTIC STATES =====
  {
    iso_code: 'EE',
    name: 'Estonia',
    market_size_eur: 85000000,
    members_millions: 0.135,
    penetration_rate: 10.1,
    growth_cagr: 6.8,
    clubs_count: 145,
    trainers_count: 1150,
    top_chains: ['MyFitness', 'Reval Sport', 'Sportland Fitness'],
    year: 2024
  },
  {
    iso_code: 'LV',
    name: 'Latvia',
    market_size_eur: 72000000,
    members_millions: 0.145,
    penetration_rate: 7.6,
    growth_cagr: 7.2,
    clubs_count: 155,
    trainers_count: 1250,
    top_chains: ['MyFitness', 'Lemon Gym', 'O2 Gym'],
    year: 2024
  },
  {
    iso_code: 'LT',
    name: 'Lithuania',
    market_size_eur: 98000000,
    members_millions: 0.195,
    penetration_rate: 6.9,
    growth_cagr: 7.8,
    clubs_count: 215,
    trainers_count: 1700,
    top_chains: ['MyFitness', 'Lemon Gym', 'Impuls'],
    year: 2024
  },

  // ===== EASTERN EUROPE =====
  {
    iso_code: 'UA',
    name: 'Ukraine',
    market_size_eur: 280000000,
    members_millions: 1.1,
    penetration_rate: 2.8,
    growth_cagr: 4.5,
    clubs_count: 1800,
    trainers_count: 14000,
    top_chains: ['Sport Life', 'Sportpalace', 'FitCurves'],
    year: 2024
  },
  {
    iso_code: 'MD',
    name: 'Moldova',
    market_size_eur: 18000000,
    members_millions: 0.058,
    penetration_rate: 2.2,
    growth_cagr: 8.5,
    clubs_count: 95,
    trainers_count: 680,
    top_chains: ['Oxygen Gym', 'Grand Fitness', 'FitZone'],
    year: 2024
  },
  {
    iso_code: 'BY',
    name: 'Belarus',
    market_size_eur: 85000000,
    members_millions: 0.22,
    penetration_rate: 2.3,
    growth_cagr: 5.5,
    clubs_count: 280,
    trainers_count: 2200,
    top_chains: ['World Class', 'Fitness House', 'Sport Life'],
    year: 2024
  },

  // ===== TURKEY (Transcontinental) =====
  {
    iso_code: 'TR',
    name: 'Turkey',
    market_size_eur: 950000000,
    members_millions: 2.1,
    penetration_rate: 2.4,
    growth_cagr: 11.5,
    clubs_count: 4200,
    trainers_count: 32000,
    top_chains: ['MAC', 'Goldengym', 'Mars Athletic'],
    year: 2024
  }
];

// Helper function to get data by ISO code
export function getCountryData(isoCode: string): CountryFitnessData | undefined {
  return EUROPE_FITNESS_DATA_2024.find(c => c.iso_code === isoCode);
}

// Get top countries by a specific metric
export function getTopCountries(metric: keyof CountryFitnessData, limit: number = 10): CountryFitnessData[] {
  return [...EUROPE_FITNESS_DATA_2024]
    .sort((a, b) => (b[metric] as number) - (a[metric] as number))
    .slice(0, limit);
}

// Get countries sorted by penetration rate
export function getByPenetrationRate(): CountryFitnessData[] {
  return getTopCountries('penetration_rate', EUROPE_FITNESS_DATA_2024.length);
}

// Get countries sorted by market size
export function getByMarketSize(): CountryFitnessData[] {
  return getTopCountries('market_size_eur', EUROPE_FITNESS_DATA_2024.length);
}

// Get countries sorted by growth rate
export function getByGrowthRate(): CountryFitnessData[] {
  return getTopCountries('growth_cagr', EUROPE_FITNESS_DATA_2024.length);
}

// Get all countries (for displaying in tables)
export function getAllCountries(): CountryFitnessData[] {
  return [...EUROPE_FITNESS_DATA_2024];
}
