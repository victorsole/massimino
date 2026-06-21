// src/data/fitness/eurostat_activity.ts
//
// Official EU physical-activity data, retrieved live through the Massimino Fitness
// open-data API (Brubru / beresol.eu), which proxies Eurostat JSON-stat series.
//
// Dataset:  hlth_ehis_pe9e - "Performing health-enhancing physical activity (EHIS)"
// Filter:   physact = MV_AERO_MSC (aerobic AND muscle-strengthening, the full WHO
//           guideline), sex = Total, age = Total, education = All levels.
// Meaning:  share of the adult population that meets the WHO recommendation for
//           weekly aerobic and muscle-strengthening activity.
// Wave:     European Health Interview Survey 2019 (latest available; UK is 2014).
// Source:   Eurostat (ec.europa.eu/eurostat), dataset last updated 2024-01-03.
// Retrieved: 2026-06-21 via https://brubru-production.up.railway.app/api/v2/open-data/eurostat-series

export interface ActivityDatum {
  iso_code: string; // 2-letter code aligned to the gym dataset (EL→GR, UK→GB)
  name: string;
  activity_pct: number; // % meeting the full WHO aerobic+muscle guideline
  year: number;
}

export const EUROSTAT_ACTIVITY_META = {
  dataset_code: 'hlth_ehis_pe9e',
  dataset_name: 'Performing health-enhancing physical activity (EHIS)',
  indicator: 'Aerobic and muscle-strengthening (full WHO guideline)',
  eu27_average: 13.6,
  eu27_year: 2019,
  source: 'Eurostat',
  source_updated: '2024-01-03',
  retrieved: '2026-06-21',
  api: 'Massimino Fitness open-data API (beresol.eu)',
  public_url: 'https://ec.europa.eu/eurostat/databrowser/view/hlth_ehis_pe9e/default/table?lang=en',
} as const;

export const EUROSTAT_ACTIVITY: ActivityDatum[] = [
  { iso_code: 'IS', name: 'Iceland', activity_pct: 41.3, year: 2019 },
  { iso_code: 'SE', name: 'Sweden', activity_pct: 32.4, year: 2019 },
  { iso_code: 'FI', name: 'Finland', activity_pct: 28.5, year: 2019 },
  { iso_code: 'DK', name: 'Denmark', activity_pct: 27.5, year: 2019 },
  { iso_code: 'DE', name: 'Germany', activity_pct: 26.7, year: 2019 },
  { iso_code: 'NO', name: 'Norway', activity_pct: 24.7, year: 2019 },
  { iso_code: 'AT', name: 'Austria', activity_pct: 21.7, year: 2019 },
  { iso_code: 'LU', name: 'Luxembourg', activity_pct: 20.7, year: 2019 },
  { iso_code: 'NL', name: 'Netherlands', activity_pct: 17.1, year: 2019 },
  { iso_code: 'HU', name: 'Hungary', activity_pct: 16.4, year: 2019 },
  { iso_code: 'IE', name: 'Ireland', activity_pct: 16.1, year: 2019 },
  { iso_code: 'GB', name: 'United Kingdom', activity_pct: 14.0, year: 2014 },
  { iso_code: 'SI', name: 'Slovenia', activity_pct: 13.5, year: 2019 },
  { iso_code: 'ES', name: 'Spain', activity_pct: 13.0, year: 2019 },
  { iso_code: 'LT', name: 'Lithuania', activity_pct: 11.4, year: 2019 },
  { iso_code: 'FR', name: 'France', activity_pct: 10.0, year: 2019 },
  { iso_code: 'SK', name: 'Slovakia', activity_pct: 9.9, year: 2019 },
  { iso_code: 'EE', name: 'Estonia', activity_pct: 9.8, year: 2019 },
  { iso_code: 'HR', name: 'Croatia', activity_pct: 9.6, year: 2019 },
  { iso_code: 'LV', name: 'Latvia', activity_pct: 9.6, year: 2019 },
  { iso_code: 'IT', name: 'Italy', activity_pct: 8.2, year: 2019 },
  { iso_code: 'GR', name: 'Greece', activity_pct: 7.5, year: 2019 },
  { iso_code: 'CZ', name: 'Czechia', activity_pct: 7.3, year: 2019 },
  { iso_code: 'PT', name: 'Portugal', activity_pct: 7.2, year: 2019 },
  { iso_code: 'PL', name: 'Poland', activity_pct: 6.4, year: 2019 },
  { iso_code: 'MT', name: 'Malta', activity_pct: 6.0, year: 2019 },
  { iso_code: 'BG', name: 'Bulgaria', activity_pct: 5.9, year: 2019 },
  { iso_code: 'BE', name: 'Belgium', activity_pct: 5.6, year: 2019 },
  { iso_code: 'CY', name: 'Cyprus', activity_pct: 5.5, year: 2019 },
  { iso_code: 'RS', name: 'Serbia', activity_pct: 4.0, year: 2019 },
  { iso_code: 'RO', name: 'Romania', activity_pct: 1.7, year: 2019 },
  { iso_code: 'TR', name: 'Turkey', activity_pct: 1.2, year: 2019 },
];
