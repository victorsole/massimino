// src/data/fitness/sport_europe.ts
//
// Sport in Europe: who plays, who works, who wins.
// Built from the source datasets behind the data.europa.eu data story of 27 October 2026
// (https://data.europa.eu/en/publications/datastories/sport-europe-who-plays-who-works-who-wins).
// Every figure below is computed from the published source files, not copied from the story.
//
// participation  Special Eurobarometer 525 "Sport and physical activity" (EB 97.3),
//                fieldwork 19 April to 16 May 2022, EU27 only. Volume A (country) and
//                Volume C (country by gender), weighted counts. data.europa.eu dataset
//                s2668_97_3_sp525_eng.
//                regular_pct  = QB1R "regularly" + "with some regularity" (exercise or play
//                               sport at least once a week)
//                never_pct    = QB1R "never"
//                fitness_centre_member_pct     = QB15 member of a health or fitness centre
//                                                (share of all adults)
//                trains_at_fitness_centre_pct  = QB10 "at a health or fitness centre"
//                                                (share of adults who are active at all)
//                barrier_no_time_pct           = QB14 "you do not have the time"
// employment     Eurostat sprt_emp_sex (employed persons in sport, thousands and % of total
//                employment) and sprt_emp_age (15-29 share), 2025, updated 25 July 2026.
//                low_reliability marks Eurostat flag "u". Youth share left null when the
//                15-29 count is flagged "u" or missing.
// olympics       Paris 2024 Olympic medals, data.education.gouv.fr dataset
//                paris-2024-results-medals-oly-eng (1,044 medal records). Great Britain
//                is mapped to GB. per_million uses Eurostat tps00001 population on
//                1 January 2024 (updated 27 October 2026).
// Retrieved: 18 November 2026.

export interface SportCountry {
  iso_code: string; // 2-letter, aligned with the gym dataset (GR, GB)
  name: string;
  eu: boolean;
  population: number | null;
  participation: {
    regular_pct: number;
    men_pct: number;
    women_pct: number;
    never_pct: number;
    fitness_centre_member_pct: number;
    trains_at_fitness_centre_pct: number;
    barrier_no_time_pct: number;
  } | null;
  employment: {
    jobs_thousands: number;
    share_pct: number;
    share_2011_pct: number | null;
    youth_share_pct: number | null;
    low_reliability: boolean;
  } | null;
  olympics: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
    per_million: number | null;
  };
}

export const SPORT_EUROPE_META = {
  story_url: 'https://data.europa.eu/en/publications/datastories/sport-europe-who-plays-who-works-who-wins',
  story_date: '27 October 2026',
  retrieved: '18 November 2026',
  participation: {
    label: 'Special Eurobarometer 525 (2022)',
    url: 'https://europa.eu/eurobarometer/surveys/detail/2668',
    year: 2022,
    eu27_regular_pct: 38.4,
    eu27_men_pct: 42.5,
    eu27_women_pct: 34.5,
    eu27_never_pct: 44.7,
    eu27_fitness_centre_member_pct: 12.1,
    eu27_trains_at_fitness_centre_pct: 13.2,
    eu27_barrier_no_time_pct: 40.7,
    eu27_barrier_no_motivation_pct: 24.8,
    eu27_barrier_cost_pct: 9.5,
  },
  employment: {
    label: 'Eurostat sprt_emp_sex (2025)',
    url: 'https://ec.europa.eu/eurostat/databrowser/view/sprt_emp_sex/default/table?lang=en',
    year: 2025,
    eu27_jobs_thousands: 1797.9,
    eu27_share_pct: 0.86,
    eu27_share_2011_pct: 0.6,
    eu27_youth_share_pct: 36.2,
  },
  olympics: {
    label: 'Paris 2024 medal table',
    url: 'https://data.education.gouv.fr/explore/assets/paris-2024-results-medals-oly-eng/',
    eu27_total: 309,
    // Europe as a whole, as stated in the data story
    europe_total: 414,
  },
} as const;

export const SPORT_EUROPE: SportCountry[] = [
  { iso_code: 'AT', name: 'Austria', eu: true, population: 9158750, participation: { regular_pct: 41.6, men_pct: 45.7, women_pct: 37.8, never_pct: 35.1, fitness_centre_member_pct: 18.7, trains_at_fitness_centre_pct: 21.2, barrier_no_time_pct: 32.1 }, employment: { jobs_thousands: 28.2, share_pct: 0.63, share_2011_pct: 0.62, youth_share_pct: 32.3, low_reliability: false }, olympics: { gold: 2, silver: 0, bronze: 3, total: 5, per_million: 0.55 } },
  { iso_code: 'BE', name: 'Belgium', eu: true, population: 11817096, participation: { regular_pct: 42.5, men_pct: 43.9, women_pct: 41.2, never_pct: 28.3, fitness_centre_member_pct: 13.9, trains_at_fitness_centre_pct: 10.9, barrier_no_time_pct: 39.8 }, employment: { jobs_thousands: 39.2, share_pct: 0.76, share_2011_pct: 0.52, youth_share_pct: 41.6, low_reliability: false }, olympics: { gold: 3, silver: 1, bronze: 6, total: 10, per_million: 0.85 } },
  { iso_code: 'BG', name: 'Bulgaria', eu: true, population: 6445481, participation: { regular_pct: 20.8, men_pct: 23.8, women_pct: 17.8, never_pct: 60.7, fitness_centre_member_pct: 9.1, trains_at_fitness_centre_pct: 12.5, barrier_no_time_pct: 43.8 }, employment: { jobs_thousands: 13.4, share_pct: 0.46, share_2011_pct: 0.34, youth_share_pct: null, low_reliability: false }, olympics: { gold: 3, silver: 1, bronze: 3, total: 7, per_million: 1.09 } },
  { iso_code: 'HR', name: 'Croatia', eu: true, population: 3861967, participation: { regular_pct: 29.5, men_pct: 35.2, women_pct: 24.2, never_pct: 40.3, fitness_centre_member_pct: 14.5, trains_at_fitness_centre_pct: 8.9, barrier_no_time_pct: 42 }, employment: { jobs_thousands: 9.2, share_pct: 0.54, share_2011_pct: 0.24, youth_share_pct: null, low_reliability: true }, olympics: { gold: 2, silver: 2, bronze: 3, total: 7, per_million: 1.81 } },
  { iso_code: 'CY', name: 'Cyprus', eu: true, population: 966365, participation: { regular_pct: 40.2, men_pct: 42, women_pct: 38.5, never_pct: 45.7, fitness_centre_member_pct: 15.7, trains_at_fitness_centre_pct: 27.5, barrier_no_time_pct: 52.9 }, employment: { jobs_thousands: 4.4, share_pct: 0.88, share_2011_pct: 0.8, youth_share_pct: null, low_reliability: false }, olympics: { gold: 0, silver: 1, bronze: 0, total: 1, per_million: 1.03 } },
  { iso_code: 'CZ', name: 'Czechia', eu: true, population: 10900555, participation: { regular_pct: 44, men_pct: 46.2, women_pct: 41.9, never_pct: 26, fitness_centre_member_pct: 10.8, trains_at_fitness_centre_pct: 9.4, barrier_no_time_pct: 46.3 }, employment: { jobs_thousands: 34.4, share_pct: 0.65, share_2011_pct: 0.53, youth_share_pct: 24.1, low_reliability: false }, olympics: { gold: 3, silver: 0, bronze: 2, total: 5, per_million: 0.46 } },
  { iso_code: 'DK', name: 'Denmark', eu: true, population: 5961249, participation: { regular_pct: 59.1, men_pct: 59.6, women_pct: 58.7, never_pct: 19.4, fitness_centre_member_pct: 25.5, trains_at_fitness_centre_pct: 25.8, barrier_no_time_pct: 45.2 }, employment: { jobs_thousands: 40.3, share_pct: 1.3, share_2011_pct: 0.97, youth_share_pct: 50.6, low_reliability: false }, olympics: { gold: 2, silver: 2, bronze: 5, total: 9, per_million: 1.51 } },
  { iso_code: 'EE', name: 'Estonia', eu: true, population: 1374687, participation: { regular_pct: 41.8, men_pct: 48.3, women_pct: 36.4, never_pct: 30.2, fitness_centre_member_pct: 15.7, trains_at_fitness_centre_pct: 12.9, barrier_no_time_pct: 39.7 }, employment: { jobs_thousands: 5.2, share_pct: 0.74, share_2011_pct: 0.56, youth_share_pct: null, low_reliability: false }, olympics: { gold: 0, silver: 0, bronze: 0, total: 0, per_million: 0 } },
  { iso_code: 'FI', name: 'Finland', eu: true, population: 5603851, participation: { regular_pct: 71, men_pct: 71.5, women_pct: 70.2, never_pct: 8, fitness_centre_member_pct: 14.5, trains_at_fitness_centre_pct: 21.5, barrier_no_time_pct: 35.4 }, employment: { jobs_thousands: 32.6, share_pct: 1.25, share_2011_pct: 0.95, youth_share_pct: 53.4, low_reliability: false }, olympics: { gold: 0, silver: 0, bronze: 0, total: 0, per_million: 0 } },
  { iso_code: 'FR', name: 'France', eu: true, population: 68669303, participation: { regular_pct: 41.5, men_pct: 45.3, women_pct: 38.1, never_pct: 44.7, fitness_centre_member_pct: 5.8, trains_at_fitness_centre_pct: 6.3, barrier_no_time_pct: 36.6 }, employment: { jobs_thousands: 340.3, share_pct: 1.16, share_2011_pct: 1.08, youth_share_pct: 31.1, low_reliability: false }, olympics: { gold: 16, silver: 26, bronze: 22, total: 64, per_million: 0.93 } },
  { iso_code: 'DE', name: 'Germany', eu: true, population: 83456045, participation: { regular_pct: 43.1, men_pct: 46.2, women_pct: 40, never_pct: 32.2, fitness_centre_member_pct: 13, trains_at_fitness_centre_pct: 12.6, barrier_no_time_pct: 37.4 }, employment: { jobs_thousands: 289.9, share_pct: 0.68, share_2011_pct: 0.45, youth_share_pct: 36.4, low_reliability: false }, olympics: { gold: 12, silver: 13, bronze: 8, total: 33, per_million: 0.4 } },
  { iso_code: 'GR', name: 'Greece', eu: true, population: 10375764, participation: { regular_pct: 23, men_pct: 27, women_pct: 19.1, never_pct: 68.4, fitness_centre_member_pct: 12.6, trains_at_fitness_centre_pct: 25.1, barrier_no_time_pct: 46.3 }, employment: { jobs_thousands: 34.7, share_pct: 0.8, share_2011_pct: 0.31, youth_share_pct: 29.4, low_reliability: false }, olympics: { gold: 1, silver: 1, bronze: 6, total: 8, per_million: 0.77 } },
  { iso_code: 'HU', name: 'Hungary', eu: true, population: 9584627, participation: { regular_pct: 26, men_pct: 28.7, women_pct: 23.7, never_pct: 59.2, fitness_centre_member_pct: 8.9, trains_at_fitness_centre_pct: 8.3, barrier_no_time_pct: 44 }, employment: { jobs_thousands: 28.1, share_pct: 0.6, share_2011_pct: 0.29, youth_share_pct: 19.9, low_reliability: false }, olympics: { gold: 6, silver: 7, bronze: 6, total: 19, per_million: 1.98 } },
  { iso_code: 'IE', name: 'Ireland', eu: true, population: 5351681, participation: { regular_pct: 54.4, men_pct: 60.9, women_pct: 48.2, never_pct: 34.9, fitness_centre_member_pct: 20, trains_at_fitness_centre_pct: 15.9, barrier_no_time_pct: 44.5 }, employment: { jobs_thousands: 25.6, share_pct: 0.91, share_2011_pct: 1.01, youth_share_pct: 42.2, low_reliability: false }, olympics: { gold: 4, silver: 0, bronze: 3, total: 7, per_million: 1.31 } },
  { iso_code: 'IT', name: 'Italy', eu: true, population: 58971230, participation: { regular_pct: 33.4, men_pct: 37.3, women_pct: 29.7, never_pct: 56.2, fitness_centre_member_pct: 10.9, trains_at_fitness_centre_pct: 11.9, barrier_no_time_pct: 39.5 }, employment: { jobs_thousands: 209.3, share_pct: 0.87, share_2011_pct: 0.46, youth_share_pct: 27.5, low_reliability: false }, olympics: { gold: 12, silver: 13, bronze: 15, total: 40, per_million: 0.68 } },
  { iso_code: 'LV', name: 'Latvia', eu: true, population: 1878575, participation: { regular_pct: 38.9, men_pct: 40.4, women_pct: 37.6, never_pct: 33.5, fitness_centre_member_pct: 6.8, trains_at_fitness_centre_pct: 4.9, barrier_no_time_pct: 41.8 }, employment: { jobs_thousands: 5.4, share_pct: 0.6, share_2011_pct: 0.53, youth_share_pct: null, low_reliability: false }, olympics: { gold: 0, silver: 0, bronze: 0, total: 0, per_million: 0 } },
  { iso_code: 'LT', name: 'Lithuania', eu: true, population: 2885891, participation: { regular_pct: 32, men_pct: 35.3, women_pct: 29.5, never_pct: 52.4, fitness_centre_member_pct: 1.8, trains_at_fitness_centre_pct: 0.8, barrier_no_time_pct: 44.1 }, employment: { jobs_thousands: 10.4, share_pct: 0.71, share_2011_pct: 0.42, youth_share_pct: null, low_reliability: false }, olympics: { gold: 0, silver: 2, bronze: 2, total: 4, per_million: 1.39 } },
  { iso_code: 'LU', name: 'Luxembourg', eu: true, population: 672050, participation: { regular_pct: 62.5, men_pct: 62, women_pct: 62.7, never_pct: 20.9, fitness_centre_member_pct: 15.5, trains_at_fitness_centre_pct: 11.9, barrier_no_time_pct: 38.8 }, employment: null, olympics: { gold: 0, silver: 0, bronze: 0, total: 0, per_million: 0 } },
  { iso_code: 'MT', name: 'Malta', eu: true, population: 563443, participation: { regular_pct: 31.7, men_pct: 36.8, women_pct: 26, never_pct: 31.7, fitness_centre_member_pct: 9.5, trains_at_fitness_centre_pct: 10, barrier_no_time_pct: 48.6 }, employment: { jobs_thousands: 1.7, share_pct: 0.52, share_2011_pct: 0.39, youth_share_pct: null, low_reliability: false }, olympics: { gold: 0, silver: 0, bronze: 0, total: 0, per_million: 0 } },
  { iso_code: 'NL', name: 'Netherlands', eu: true, population: 17942942, participation: { regular_pct: 59.9, men_pct: 60.7, women_pct: 59.1, never_pct: 24.9, fitness_centre_member_pct: 28.7, trains_at_fitness_centre_pct: 19.3, barrier_no_time_pct: 42.4 }, employment: { jobs_thousands: 102.4, share_pct: 1.03, share_2011_pct: 0.77, youth_share_pct: 45.5, low_reliability: false }, olympics: { gold: 15, silver: 7, bronze: 12, total: 34, per_million: 1.89 } },
  { iso_code: 'PL', name: 'Poland', eu: true, population: 36620970, participation: { regular_pct: 22.8, men_pct: 30.6, women_pct: 15.6, never_pct: 64.6, fitness_centre_member_pct: 8.7, trains_at_fitness_centre_pct: 7.4, barrier_no_time_pct: 46.2 }, employment: { jobs_thousands: 89.4, share_pct: 0.52, share_2011_pct: 0.29, youth_share_pct: 35.2, low_reliability: false }, olympics: { gold: 1, silver: 4, bronze: 5, total: 10, per_million: 0.27 } },
  { iso_code: 'PT', name: 'Portugal', eu: true, population: 11204347, participation: { regular_pct: 22.2, men_pct: 24.8, women_pct: 19.9, never_pct: 73, fitness_centre_member_pct: 10, trains_at_fitness_centre_pct: 30.5, barrier_no_time_pct: 43.8 }, employment: { jobs_thousands: 53, share_pct: 1, share_2011_pct: 0.51, youth_share_pct: 43.6, low_reliability: false }, olympics: { gold: 1, silver: 2, bronze: 1, total: 4, per_million: 0.36 } },
  { iso_code: 'RO', name: 'Romania', eu: true, population: 19067576, participation: { regular_pct: 19.6, men_pct: 22, women_pct: 17.3, never_pct: 62.4, fitness_centre_member_pct: 6.3, trains_at_fitness_centre_pct: 8.8, barrier_no_time_pct: 37.8 }, employment: { jobs_thousands: 17.2, share_pct: 0.22, share_2011_pct: 0.13, youth_share_pct: null, low_reliability: false }, olympics: { gold: 3, silver: 4, bronze: 2, total: 9, per_million: 0.47 } },
  { iso_code: 'SK', name: 'Slovakia', eu: true, population: 5424687, participation: { regular_pct: 34.3, men_pct: 41.2, women_pct: 28.2, never_pct: 43.2, fitness_centre_member_pct: 10.2, trains_at_fitness_centre_pct: 10.4, barrier_no_time_pct: 46.6 }, employment: { jobs_thousands: 15.7, share_pct: 0.6, share_2011_pct: 0.3, youth_share_pct: null, low_reliability: false }, olympics: { gold: 0, silver: 0, bronze: 1, total: 1, per_million: 0.18 } },
  { iso_code: 'SI', name: 'Slovenia', eu: true, population: 2123949, participation: { regular_pct: 52.5, men_pct: 55.9, women_pct: 48.9, never_pct: 24.5, fitness_centre_member_pct: 7.4, trains_at_fitness_centre_pct: 4.9, barrier_no_time_pct: 41 }, employment: { jobs_thousands: 9.9, share_pct: 0.99, share_2011_pct: 0.55, youth_share_pct: null, low_reliability: false }, olympics: { gold: 2, silver: 1, bronze: 0, total: 3, per_million: 1.41 } },
  { iso_code: 'ES', name: 'Spain', eu: true, population: 48619695, participation: { regular_pct: 41.7, men_pct: 49.3, women_pct: 35, never_pct: 46.9, fitness_centre_member_pct: 13.5, trains_at_fitness_centre_pct: 18.9, barrier_no_time_pct: 45.5 }, employment: { jobs_thousands: 267.3, share_pct: 1.2, share_2011_pct: 0.8, youth_share_pct: 44.5, low_reliability: false }, olympics: { gold: 5, silver: 4, bronze: 9, total: 18, per_million: 0.37 } },
  { iso_code: 'SE', name: 'Sweden', eu: true, population: 10551707, participation: { regular_pct: 59.3, men_pct: 60.8, women_pct: 58.3, never_pct: 11.9, fitness_centre_member_pct: 34.6, trains_at_fitness_centre_pct: 30.8, barrier_no_time_pct: 40.7 }, employment: { jobs_thousands: 84.9, share_pct: 1.59, share_2011_pct: 1.25, youth_share_pct: 46.8, low_reliability: false }, olympics: { gold: 4, silver: 4, bronze: 3, total: 11, per_million: 1.04 } },
  { iso_code: 'NO', name: 'Norway', eu: false, population: 5550203, participation: null, employment: { jobs_thousands: 30, share_pct: 1.02, share_2011_pct: 0.77, youth_share_pct: 55, low_reliability: false }, olympics: { gold: 4, silver: 1, bronze: 3, total: 8, per_million: 1.44 } },
  { iso_code: 'CH', name: 'Switzerland', eu: false, population: 8962258, participation: null, employment: { jobs_thousands: 50.8, share_pct: 1.04, share_2011_pct: 0.88, youth_share_pct: 30.7, low_reliability: false }, olympics: { gold: 1, silver: 2, bronze: 5, total: 8, per_million: 0.89 } },
  { iso_code: 'GB', name: 'United Kingdom', eu: false, population: 68903810, participation: null, employment: null, olympics: { gold: 14, silver: 22, bronze: 29, total: 65, per_million: 0.94 } },
  { iso_code: 'IS', name: 'Iceland', eu: false, population: 383567, participation: null, employment: { jobs_thousands: 5.6, share_pct: 2.46, share_2011_pct: 2.05, youth_share_pct: 48.2, low_reliability: false }, olympics: { gold: 0, silver: 0, bronze: 0, total: 0, per_million: 0 } },
  { iso_code: 'RS', name: 'Serbia', eu: false, population: 6605168, participation: null, employment: { jobs_thousands: 18.5, share_pct: 0.65, share_2011_pct: 0.3, youth_share_pct: 25.4, low_reliability: false }, olympics: { gold: 3, silver: 1, bronze: 1, total: 5, per_million: 0.76 } },
  { iso_code: 'TR', name: 'Türkiye', eu: false, population: 85372377, participation: null, employment: { jobs_thousands: 124.3, share_pct: 0.38, share_2011_pct: 0.21, youth_share_pct: 44.8, low_reliability: false }, olympics: { gold: 0, silver: 3, bronze: 5, total: 8, per_million: 0.09 } },
  { iso_code: 'UA', name: 'Ukraine', eu: false, population: null, participation: null, employment: null, olympics: { gold: 3, silver: 5, bronze: 4, total: 12, per_million: null } },
  { iso_code: 'ME', name: 'Montenegro', eu: false, population: 623680, participation: null, employment: null, olympics: { gold: 0, silver: 0, bronze: 0, total: 0, per_million: 0 } },
  { iso_code: 'MK', name: 'North Macedonia', eu: false, population: 1826247, participation: null, employment: { jobs_thousands: 2.4, share_pct: 0.34, share_2011_pct: 0.08, youth_share_pct: null, low_reliability: false }, olympics: { gold: 0, silver: 0, bronze: 0, total: 0, per_million: 0 } },
  { iso_code: 'BA', name: 'Bosnia and Herzegovina', eu: false, population: 3417089, participation: null, employment: { jobs_thousands: 4, share_pct: 0.32, share_2011_pct: null, youth_share_pct: null, low_reliability: false }, olympics: { gold: 0, silver: 0, bronze: 0, total: 0, per_million: 0 } },
  { iso_code: 'AL', name: 'Albania', eu: false, population: 2390942, participation: null, employment: null, olympics: { gold: 0, silver: 0, bronze: 2, total: 2, per_million: 0.84 } },
  { iso_code: 'GE', name: 'Georgia', eu: false, population: 3694608, participation: null, employment: null, olympics: { gold: 3, silver: 3, bronze: 1, total: 7, per_million: 1.89 } },
  { iso_code: 'MD', name: 'Moldova', eu: false, population: 2423287, participation: null, employment: null, olympics: { gold: 0, silver: 1, bronze: 3, total: 4, per_million: 1.65 } },
  { iso_code: 'XK', name: 'Kosovo', eu: false, population: null, participation: null, employment: null, olympics: { gold: 0, silver: 1, bronze: 1, total: 2, per_million: null } },
  { iso_code: 'AM', name: 'Armenia', eu: false, population: 2991201, participation: null, employment: null, olympics: { gold: 0, silver: 3, bronze: 1, total: 4, per_million: 1.34 } },
  { iso_code: 'AZ', name: 'Azerbaijan', eu: false, population: 10180770, participation: null, employment: null, olympics: { gold: 2, silver: 2, bronze: 3, total: 7, per_million: 0.69 } },
];

/** EU27 employment in sport, 2011 to 2025 (Eurostat sprt_emp_sex) */
export const EU_SPORT_EMPLOYMENT_SERIES: { year: number; jobs_thousands: number; share_pct: number }[] = [
  { year: 2011, jobs_thousands: 1118.5, share_pct: 0.6 },
  { year: 2012, jobs_thousands: 1159.5, share_pct: 0.62 },
  { year: 2013, jobs_thousands: 1141.2, share_pct: 0.62 },
  { year: 2014, jobs_thousands: 1173.3, share_pct: 0.63 },
  { year: 2015, jobs_thousands: 1210.5, share_pct: 0.64 },
  { year: 2016, jobs_thousands: 1260.9, share_pct: 0.65 },
  { year: 2017, jobs_thousands: 1291.9, share_pct: 0.66 },
  { year: 2018, jobs_thousands: 1321.5, share_pct: 0.67 },
  { year: 2019, jobs_thousands: 1370.3, share_pct: 0.69 },
  { year: 2020, jobs_thousands: 1315.2, share_pct: 0.67 },
  { year: 2021, jobs_thousands: 1371.9, share_pct: 0.69 },
  { year: 2022, jobs_thousands: 1519, share_pct: 0.75 },
  { year: 2023, jobs_thousands: 1551.6, share_pct: 0.75 },
  { year: 2024, jobs_thousands: 1651.5, share_pct: 0.79 },
  { year: 2025, jobs_thousands: 1797.9, share_pct: 0.86 },
];
