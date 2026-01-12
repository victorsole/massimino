// src/types/fitness_data.ts

export interface CountryFitnessData {
  iso_code: string;           // "BE", "DE", "FR", "PT"
  name: string;               // "Belgium"
  market_size_eur: number;    // 500000000 (€500M)
  members_millions: number;   // 1.2
  penetration_rate: number;   // 10.5 (percentage)
  growth_cagr: number;        // 8.4 (percentage)
  clubs_count: number;        // 1500
  trainers_count: number;     // 12000
  top_chains: string[];       // ["Basic-Fit", "Jims"]
  year: number;               // 2024
}

export interface GymLocation {
  id: string;
  osm_id?: string;
  name: string;
  brand?: string;
  latitude: number;
  longitude: number;
  country_code: string;
  city?: string;
  massimino_verified: boolean;
  safety_certified: boolean;
  rating?: number;
  trainer_count?: number;
}

export interface TrainerLocation {
  id: string;
  latitude: number;
  longitude: number;
  country_code: string;
  certifications: string[];   // ["NASM", "ACE"]
  specializations: string[];  // ["strength", "yoga"]
  massimino_verified: boolean;
}

export type FitnessMetric =
  | 'penetration_rate'
  | 'market_size_eur'
  | 'members_millions'
  | 'growth_cagr'
  | 'clubs_count'
  | 'trainers_count';

// European market totals (2024)
export const EUROPE_TOTALS = {
  total_members: 71600000,    // 71.6M
  total_market_eur: 36000000000, // €36B
  total_clubs: 64550,
  average_penetration: 8.9,
  cagr_2024_2031: 8.2,
  year: 2024
};

// ===== NEW METRICS TYPES =====

export interface GymChainData {
  rank: number;
  name: string;
  country_code: string;       // "NL", "GB", "DE"
  members: number;            // In actual numbers (e.g., 4250000)
  locations: number;
  revenue_eur?: number;       // In EUR (e.g., 1200000000 for €1.2B)
  website?: string;
  year: number;
}

export interface SupplementCompanyData {
  rank: number;
  name: string;
  country_code: string;
  revenue_eur?: number;       // In EUR where available
  website?: string;
  market_position?: string;
  year: number;
}

export interface FitnessInfluencerData {
  rank: number;
  name: string;
  country_code: string;
  instagram_followers: number;   // In actual numbers
  youtube_followers?: number;    // In actual numbers
  tiktok_followers?: number;     // In actual numbers
  handle: string;
  specialty: string;
  year: number;
}

export interface HashtagData {
  rank: number;
  hashtag: string;
  instagram_posts: number;       // Total posts
  tiktok_views: number;          // Total views in billions (stored as actual number)
  tiktok_videos?: number;        // Total videos
  avg_views_per_video?: number;  // Average views per video
  platform_leader: 'Instagram' | 'TikTok' | 'Balanced';
  year: number;
}

export interface CountryGymChainData {
  country_code: string;
  country_name: string;
  gym_chains: GymChainData[];
  supplement_companies: SupplementCompanyData[];
  influencers: FitnessInfluencerData[];
}
