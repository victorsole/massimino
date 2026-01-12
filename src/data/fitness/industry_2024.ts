// src/data/fitness/industry_2024.ts
// Data sources: fitness_new_metrics.md and finess_hashtags.md
// Gym chains, supplement companies, influencers, and hashtag statistics
// Last updated: January 2025

import type {
  GymChainData,
  FitnessInfluencerData,
  HashtagData,
  SupplementCompanyData,
} from '@/types/fitness_data';

// ===== PAN-EUROPEAN GYM CHAINS =====
export const EUROPE_GYM_CHAINS_2024: GymChainData[] = [
  {
    rank: 1,
    name: 'Basic-Fit',
    country_code: 'NL',
    members: 4250000,
    locations: 1575,
    revenue_eur: 1200000000,
    website: 'https://www.basic-fit.com',
    year: 2024
  },
  {
    rank: 2,
    name: 'PureGym',
    country_code: 'GB',
    members: 1990000,
    locations: 600,
    revenue_eur: 695000000,
    website: 'https://www.puregym.com',
    year: 2024
  },
  {
    rank: 3,
    name: 'RSG Group (McFit)',
    country_code: 'DE',
    members: 1810000,
    locations: 230,
    revenue_eur: 650000000,
    website: 'https://www.mcfit.com',
    year: 2024
  },
  {
    rank: 4,
    name: 'David Lloyd Leisure',
    country_code: 'GB',
    members: 734000,
    locations: 137,
    revenue_eur: 1000000000,
    website: 'https://www.davidlloyd.co.uk',
    year: 2024
  },
  {
    rank: 5,
    name: 'Clever Fit',
    country_code: 'DE',
    members: 1000000,
    locations: 500,
    year: 2024
  }
];

// ===== PAN-EUROPEAN SUPPLEMENT COMPANIES =====
export const EUROPE_SUPPLEMENTS_2024: SupplementCompanyData[] = [
  {
    rank: 1,
    name: 'Myprotein',
    country_code: 'GB',
    revenue_eur: 800000000,
    website: 'https://www.myprotein.com',
    market_position: '#1 Europe by Euromonitor',
    year: 2024
  },
  {
    rank: 2,
    name: 'Bulk',
    country_code: 'GB',
    revenue_eur: 99000000,
    website: 'https://www.bulk.com',
    market_position: 'UK #2',
    year: 2024
  },
  {
    rank: 3,
    name: 'ESN / The Quality Group',
    country_code: 'DE',
    revenue_eur: 680000000,
    website: 'https://www.esn.com',
    market_position: 'German market leader',
    year: 2024
  },
  {
    rank: 4,
    name: 'Foodspring',
    country_code: 'DE',
    revenue_eur: 150000000,
    website: 'https://www.foodspring.com',
    market_position: 'DACH leader',
    year: 2024
  },
  {
    rank: 5,
    name: 'Optimum Nutrition',
    country_code: 'US',
    revenue_eur: 500000000,
    website: 'https://www.optimumnutrition.com',
    market_position: 'Global premium leader',
    year: 2024
  },
  {
    rank: 6,
    name: 'Olimp Sport Nutrition',
    country_code: 'PL',
    revenue_eur: 200000000,
    website: 'https://olimpsport.com',
    market_position: 'Polish market leader',
    year: 2024
  },
  {
    rank: 7,
    name: 'Yamamoto Nutrition',
    country_code: 'IT',
    revenue_eur: 100000000,
    website: 'https://www.yamamotonutrition.com',
    market_position: '#1 Italy by revenue',
    year: 2024
  },
  {
    rank: 8,
    name: 'HSN',
    country_code: 'ES',
    revenue_eur: 80000000,
    website: 'https://www.hsnstore.eu',
    market_position: 'Spain #1 domestic brand',
    year: 2024
  },
  {
    rank: 9,
    name: 'QNT',
    country_code: 'BE',
    revenue_eur: 60000000,
    website: 'https://www.qntsport.com',
    market_position: 'Belgium leader, 35+ years',
    year: 2024
  },
  {
    rank: 10,
    name: 'Grenade',
    country_code: 'GB',
    revenue_eur: 96000000,
    website: 'https://www.grenade.com',
    market_position: '#1 protein bar UK since 2016',
    year: 2024
  }
];

// ===== PAN-EUROPEAN FITNESS INFLUENCERS =====
export const EUROPE_INFLUENCERS_2024: FitnessInfluencerData[] = [
  {
    rank: 1,
    name: 'Pamela Reif',
    country_code: 'DE',
    instagram_followers: 9100000,
    youtube_followers: 10200000,
    handle: '@pamela_rf',
    specialty: 'Home workouts, HIIT',
    year: 2024
  },
  {
    rank: 2,
    name: 'Tibo InShape',
    country_code: 'FR',
    instagram_followers: 14600000,
    youtube_followers: 26900000,
    handle: '@tiboinshape',
    specialty: 'Fitness, comedy',
    year: 2024
  },
  {
    rank: 3,
    name: 'Joe Wicks',
    country_code: 'GB',
    instagram_followers: 4700000,
    youtube_followers: 2800000,
    handle: '@thebodycoach',
    specialty: 'HIIT, nutrition',
    year: 2024
  },
  {
    rank: 4,
    name: 'Anna Lewandowska',
    country_code: 'PL',
    instagram_followers: 5700000,
    handle: '@annalewandowskahpba',
    specialty: 'Healthy Plan by Ann founder',
    year: 2024
  },
  {
    rank: 5,
    name: 'Tom Daley',
    country_code: 'GB',
    instagram_followers: 3900000,
    handle: '@tomdaley',
    specialty: 'Olympic diving, fitness',
    year: 2024
  },
  {
    rank: 6,
    name: 'Lisa Migliorini',
    country_code: 'IT',
    instagram_followers: 3000000,
    tiktok_followers: 2500000,
    handle: '@thefashionjogger',
    specialty: 'Running, fitness fashion',
    year: 2024
  },
  {
    rank: 7,
    name: 'Krissy Cela',
    country_code: 'GB',
    instagram_followers: 2200000,
    youtube_followers: 2400000,
    handle: '@krissycela',
    specialty: 'Strength training, EvolveYou',
    year: 2024
  },
  {
    rank: 8,
    name: 'Ryan Terry',
    country_code: 'GB',
    instagram_followers: 2500000,
    handle: '@ryanjterry',
    specialty: '2023 Mr Olympia Men\'s Physique',
    year: 2024
  },
  {
    rank: 9,
    name: 'Sophie van Oostenbrugge',
    country_code: 'NL',
    instagram_followers: 2400000,
    youtube_followers: 1600000,
    handle: '@gainsbybrains',
    specialty: 'Gainsbybrains App founder',
    year: 2024
  },
  {
    rank: 10,
    name: 'Gemma Atkinson',
    country_code: 'GB',
    instagram_followers: 2100000,
    handle: '@glouiseatkinson',
    specialty: 'Strength, family fitness',
    year: 2024
  },
  {
    rank: 11,
    name: 'Patry Jordan',
    country_code: 'ES',
    instagram_followers: 2200000,
    youtube_followers: 13200000,
    handle: '@gymvirtual_com',
    specialty: 'Home fitness pioneer',
    year: 2024
  },
  {
    rank: 12,
    name: 'Zubalenok',
    country_code: 'HR',
    instagram_followers: 2100000,
    handle: '@zubalenok',
    specialty: 'Handstands, mobility',
    year: 2024
  },
  {
    rank: 13,
    name: 'Rico Verhoeven',
    country_code: 'NL',
    instagram_followers: 2000000,
    handle: '@ricoverhoeven',
    specialty: '12-year Glory Heavyweight Champion',
    year: 2024
  },
  {
    rank: 14,
    name: 'Sascha Huber',
    country_code: 'DE',
    youtube_followers: 2000000,
    instagram_followers: 500000,
    handle: '@sascha_huber_official',
    specialty: 'Fitness challenges',
    year: 2024
  },
  {
    rank: 15,
    name: 'Ewa Chodakowska',
    country_code: 'PL',
    instagram_followers: 2000000,
    handle: '@chodakowskaewa',
    specialty: 'BeDiet, BeActive pioneer',
    year: 2024
  }
];

// ===== COUNTRY-SPECIFIC GYM CHAINS =====
export const UK_GYM_CHAINS_2024: GymChainData[] = [
  { rank: 1, name: 'PureGym', country_code: 'GB', members: 1900000, locations: 400, website: 'https://www.puregym.com', year: 2024 },
  { rank: 2, name: 'The Gym Group', country_code: 'GB', members: 891000, locations: 245, revenue_eur: 270000000, website: 'https://www.thegymgroup.com', year: 2024 },
  { rank: 3, name: 'David Lloyd Clubs', country_code: 'GB', members: 800000, locations: 103, website: 'https://www.davidlloyd.co.uk', year: 2024 },
  { rank: 4, name: 'Nuffield Health', country_code: 'GB', members: 500000, locations: 110, website: 'https://www.nuffieldhealth.com', year: 2024 },
  { rank: 5, name: 'Anytime Fitness UK', country_code: 'GB', members: 400000, locations: 185, website: 'https://www.anytimefitness.co.uk', year: 2024 }
];

export const GERMANY_GYM_CHAINS_2024: GymChainData[] = [
  { rank: 1, name: 'RSG Group (McFit)', country_code: 'DE', members: 1400000, locations: 200, website: 'https://www.mcfit.com', year: 2024 },
  { rank: 2, name: 'FitX', country_code: 'DE', members: 1000000, locations: 105, website: 'https://www.fitx.de', year: 2024 },
  { rank: 3, name: 'Clever Fit', country_code: 'DE', members: 800000, locations: 434, website: 'https://www.clever-fit.com', year: 2024 },
  { rank: 4, name: 'EASYFITNESS', country_code: 'DE', members: 450000, locations: 200, website: 'https://www.easyfitness.de', year: 2024 },
  { rank: 5, name: 'BestFit Group', country_code: 'DE', members: 400000, locations: 150, website: 'https://www.all-inclusive-fitness.de', year: 2024 }
];

export const FRANCE_GYM_CHAINS_2024: GymChainData[] = [
  { rank: 1, name: 'Basic-Fit France', country_code: 'FR', members: 2500000, locations: 880, revenue_eur: 505000000, website: 'https://www.basic-fit.com/fr-fr', year: 2024 },
  { rank: 2, name: 'Fitness Park', country_code: 'FR', members: 800000, locations: 291, revenue_eur: 95000000, website: 'https://www.fitnesspark.fr', year: 2024 },
  { rank: 3, name: "L'Orange Bleue", country_code: 'FR', members: 600000, locations: 400, website: 'https://www.lorangebleue.fr', year: 2024 },
  { rank: 4, name: 'KeepCool', country_code: 'FR', members: 400000, locations: 285, website: 'https://www.keepcool.fr', year: 2024 },
  { rank: 5, name: "L'Appart Fitness", country_code: 'FR', members: 300000, locations: 200, website: 'https://www.lappart.fitness', year: 2024 }
];

export const SPAIN_GYM_CHAINS_2024: GymChainData[] = [
  { rank: 1, name: 'Forus', country_code: 'ES', members: 500000, locations: 100, revenue_eur: 120000000, website: 'https://www.forus.es', year: 2024 },
  { rank: 2, name: 'Vivagym/Altafit', country_code: 'ES', members: 500000, locations: 207, revenue_eur: 120000000, website: 'https://www.vivagym.es', year: 2024 },
  { rank: 3, name: 'Basic-Fit Spain', country_code: 'ES', members: 600000, locations: 209, revenue_eur: 141200000, website: 'https://www.basic-fit.com/es-es', year: 2024 },
  { rank: 4, name: 'GO fit', country_code: 'ES', members: 300000, locations: 50, revenue_eur: 77000000, website: 'https://www.go-fit.es', year: 2024 },
  { rank: 5, name: 'Synergym', country_code: 'ES', members: 200000, locations: 60, revenue_eur: 40000000, website: 'https://www.synergym.es', year: 2024 }
];

export const ITALY_GYM_CHAINS_2024: GymChainData[] = [
  { rank: 1, name: 'FitActive', country_code: 'IT', members: 400000, locations: 150, website: 'https://www.fitactive.it', year: 2024 },
  { rank: 2, name: 'Virgin Active Italy', country_code: 'IT', members: 160000, locations: 40, website: 'https://www.virginactive.it', year: 2024 },
  { rank: 3, name: 'McFit Italy', country_code: 'IT', members: 170000, locations: 42, website: 'https://www.mcfit.com/it', year: 2024 },
  { rank: 4, name: 'Anytime Fitness Italy', country_code: 'IT', members: 100000, locations: 80, website: 'https://www.anytimefitness.it', year: 2024 },
  { rank: 5, name: 'GetFIT', country_code: 'IT', members: 50000, locations: 15, website: 'https://www.getfit.it', year: 2024 }
];

export const POLAND_GYM_CHAINS_2024: GymChainData[] = [
  { rank: 1, name: 'Benefit Systems/Zdrofit', country_code: 'PL', members: 800000, locations: 257, website: 'https://zdrofit.pl', year: 2024 },
  { rank: 2, name: 'Calypso Fitness', country_code: 'PL', members: 200000, locations: 50, website: 'https://www.calypso.com.pl', year: 2024 },
  { rank: 3, name: 'Just Gym', country_code: 'PL', members: 100000, locations: 33, website: 'https://justgym.pl', year: 2024 },
  { rank: 4, name: 'CityFit', country_code: 'PL', members: 80000, locations: 30, website: 'https://cityfit.pl', year: 2024 },
  { rank: 5, name: 'McFit Poland', country_code: 'PL', members: 60000, locations: 14, website: 'https://www.mcfit.com.pl', year: 2024 }
];

export const NETHERLANDS_GYM_CHAINS_2024: GymChainData[] = [
  { rank: 1, name: 'Basic-Fit', country_code: 'NL', members: 1200000, locations: 248, website: 'https://www.basic-fit.com/en-nl', year: 2024 },
  { rank: 2, name: 'SportCity/Fit For Free', country_code: 'NL', members: 400000, locations: 115, website: 'https://www.sportcity.nl', year: 2024 },
  { rank: 3, name: 'TrainMore', country_code: 'NL', members: 80000, locations: 26, website: 'https://www.trainmore.nl', year: 2024 },
  { rank: 4, name: 'Anytime Fitness NL', country_code: 'NL', members: 60000, locations: 60, website: 'https://www.anytimefitness.nl', year: 2024 },
  { rank: 5, name: 'David Lloyd/HealthCity', country_code: 'NL', members: 40000, locations: 6, website: 'https://www.davidlloyd.nl', year: 2024 }
];

export const BELGIUM_GYM_CHAINS_2024: GymChainData[] = [
  { rank: 1, name: 'Basic-Fit Belgium', country_code: 'BE', members: 500000, locations: 170, website: 'https://www.basic-fit.com/en-be', year: 2024 },
  { rank: 2, name: 'Jims', country_code: 'BE', members: 200000, locations: 77, website: 'https://www.jims.be', year: 2024 },
  { rank: 3, name: 'Aspria', country_code: 'BE', members: 30000, locations: 3, website: 'https://www.aspria.com', year: 2024 },
  { rank: 4, name: 'David Lloyd Belgium', country_code: 'BE', members: 25000, locations: 3, website: 'https://www.davidlloyd.be', year: 2024 },
  { rank: 5, name: 'HealthCity Belgium', country_code: 'BE', members: 20000, locations: 10, website: 'https://healthcity.be', year: 2024 }
];

export const GREECE_GYM_CHAINS_2024: GymChainData[] = [
  { rank: 1, name: 'Alterlife', country_code: 'GR', members: 150000, locations: 90, website: 'https://alterlife.gr', year: 2024 },
  { rank: 2, name: 'Holmes Place Greece', country_code: 'GR', members: 50000, locations: 3, website: 'https://www.holmesplace.gr', year: 2024 },
  { rank: 3, name: 'Yava Fitness', country_code: 'GR', members: 40000, locations: 15, website: 'https://www.yava.gr', year: 2024 },
  { rank: 4, name: 'Golden Gym', country_code: 'GR', members: 20000, locations: 8, year: 2024 },
  { rank: 5, name: 'X-Treme Stores', country_code: 'GR', members: 15000, locations: 57, website: 'https://www.xtr.gr', year: 2024 }
];

// ===== HASHTAG DATA =====
export const HASHTAG_COMPARISON_2024: HashtagData[] = [
  { rank: 1, hashtag: '#gym', instagram_posts: 303000000, tiktok_views: 547100000000, tiktok_videos: 56900000, avg_views_per_video: 9600, platform_leader: 'TikTok', year: 2024 },
  { rank: 2, hashtag: '#fitness', instagram_posts: 563000000, tiktok_views: 377000000000, tiktok_videos: 30700000, avg_views_per_video: 12279, platform_leader: 'Balanced', year: 2024 },
  { rank: 3, hashtag: '#workout', instagram_posts: 238000000, tiktok_views: 165700000000, tiktok_videos: 16900000, avg_views_per_video: 9813, platform_leader: 'Balanced', year: 2024 },
  { rank: 4, hashtag: '#bodybuilding', instagram_posts: 149000000, tiktok_views: 119700000000, tiktok_videos: 8700000, avg_views_per_video: 13507, platform_leader: 'Balanced', year: 2024 },
  { rank: 5, hashtag: '#yoga', instagram_posts: 129000000, tiktok_views: 35000000000, tiktok_videos: 4700000, avg_views_per_video: 7400, platform_leader: 'Instagram', year: 2024 },
  { rank: 6, hashtag: '#fitnessmotivation', instagram_posts: 98900000, tiktok_views: 52300000000, tiktok_videos: 7000000, avg_views_per_video: 7507, platform_leader: 'Balanced', year: 2024 },
  { rank: 7, hashtag: '#gymlife', instagram_posts: 98900000, tiktok_views: 46700000000, tiktok_videos: 6100000, avg_views_per_video: 7654, platform_leader: 'Balanced', year: 2024 },
  { rank: 8, hashtag: '#crossfit', instagram_posts: 76600000, tiktok_views: 15100000000, tiktok_videos: 2700000, avg_views_per_video: 5593, platform_leader: 'Instagram', year: 2024 },
  { rank: 9, hashtag: '#gymrat', instagram_posts: 37900000, tiktok_views: 69100000000, tiktok_videos: 6000000, avg_views_per_video: 11491, platform_leader: 'TikTok', year: 2024 },
  { rank: 10, hashtag: '#personaltrainer', instagram_posts: 60600000, tiktok_views: 9000000000, tiktok_videos: 2000000, avg_views_per_video: 4500, platform_leader: 'Instagram', year: 2024 },
  { rank: 11, hashtag: '#fitfam', instagram_posts: 50000000, tiktok_views: 52000000000, tiktok_videos: 5000000, avg_views_per_video: 10400, platform_leader: 'TikTok', year: 2024 },
  { rank: 12, hashtag: '#gymbro', instagram_posts: 2830000, tiktok_views: 30500000000, tiktok_videos: 1700000, avg_views_per_video: 18417, platform_leader: 'TikTok', year: 2024 },
  { rank: 13, hashtag: '#legday', instagram_posts: 17500000, tiktok_views: 25500000000, tiktok_videos: 2400000, avg_views_per_video: 10625, platform_leader: 'TikTok', year: 2024 },
  { rank: 14, hashtag: '#pilates', instagram_posts: 17500000, tiktok_views: 7500000000, tiktok_videos: 726800, avg_views_per_video: 10319, platform_leader: 'Instagram', year: 2024 },
  { rank: 15, hashtag: '#strengthtraining', instagram_posts: 17400000, tiktok_views: 3500000000, tiktok_videos: 750000, avg_views_per_video: 4667, platform_leader: 'Instagram', year: 2024 },
  { rank: 16, hashtag: '#cardio', instagram_posts: 12500000, tiktok_views: 7500000000, tiktok_videos: 1500000, avg_views_per_video: 5000, platform_leader: 'Balanced', year: 2024 },
  { rank: 17, hashtag: '#gains', instagram_posts: 10000000, tiktok_views: 3000000000, tiktok_videos: 750000, avg_views_per_video: 4000, platform_leader: 'Instagram', year: 2024 },
  { rank: 18, hashtag: '#lifting', instagram_posts: 9000000, tiktok_views: 4000000000, tiktok_videos: 800000, avg_views_per_video: 5000, platform_leader: 'Balanced', year: 2024 },
  { rank: 19, hashtag: '#homeworkout', instagram_posts: 5670000, tiktok_views: 4000000000, tiktok_videos: 1000000, avg_views_per_video: 4000, platform_leader: 'Balanced', year: 2024 },
  { rank: 20, hashtag: '#chestday', instagram_posts: 4000000, tiktok_views: 750000000, tiktok_videos: 300000, avg_views_per_video: 2500, platform_leader: 'Instagram', year: 2024 }
];

// TikTok-specific top hashtags (by engagement)
export const TIKTOK_FITNESS_HASHTAGS_2024: HashtagData[] = [
  { rank: 1, hashtag: '#gym', instagram_posts: 303000000, tiktok_views: 547100000000, tiktok_videos: 56900000, avg_views_per_video: 9600, platform_leader: 'TikTok', year: 2024 },
  { rank: 2, hashtag: '#fitness', instagram_posts: 563000000, tiktok_views: 377000000000, tiktok_videos: 30700000, avg_views_per_video: 12279, platform_leader: 'Balanced', year: 2024 },
  { rank: 3, hashtag: '#GymTok', instagram_posts: 0, tiktok_views: 343200000000, tiktok_videos: 20900000, avg_views_per_video: 16421, platform_leader: 'TikTok', year: 2024 },
  { rank: 4, hashtag: '#workout', instagram_posts: 238000000, tiktok_views: 165700000000, tiktok_videos: 16900000, avg_views_per_video: 9813, platform_leader: 'Balanced', year: 2024 },
  { rank: 5, hashtag: '#bodybuilding', instagram_posts: 149000000, tiktok_views: 119700000000, tiktok_videos: 8700000, avg_views_per_video: 13507, platform_leader: 'Balanced', year: 2024 },
  { rank: 6, hashtag: '#weightloss', instagram_posts: 50000000, tiktok_views: 100500000000, tiktok_videos: 7000000, avg_views_per_video: 14357, platform_leader: 'TikTok', year: 2024 },
  { rank: 7, hashtag: '#gymmotivation', instagram_posts: 40000000, tiktok_views: 98000000000, tiktok_videos: 11000000, avg_views_per_video: 8909, platform_leader: 'TikTok', year: 2024 },
  { rank: 8, hashtag: '#transformation', instagram_posts: 45000000, tiktok_views: 90400000000, tiktok_videos: 7700000, avg_views_per_video: 11740, platform_leader: 'TikTok', year: 2024 },
  { rank: 9, hashtag: '#gymrat', instagram_posts: 37900000, tiktok_views: 69100000000, tiktok_videos: 6000000, avg_views_per_video: 11491, platform_leader: 'TikTok', year: 2024 },
  { rank: 10, hashtag: '#fittok', instagram_posts: 5000000, tiktok_views: 61100000000, tiktok_videos: 3700000, avg_views_per_video: 16514, platform_leader: 'TikTok', year: 2024 },
  { rank: 11, hashtag: '#gymgirl', instagram_posts: 15000000, tiktok_views: 39400000000, tiktok_videos: 2700000, avg_views_per_video: 14593, platform_leader: 'TikTok', year: 2024 },
  { rank: 12, hashtag: '#gymhumor', instagram_posts: 3000000, tiktok_views: 33700000000, tiktok_videos: 1100000, avg_views_per_video: 30636, platform_leader: 'TikTok', year: 2024 }
];

// Instagram-specific top hashtags (by post volume)
export const INSTAGRAM_FITNESS_HASHTAGS_2024: HashtagData[] = [
  { rank: 1, hashtag: '#fitness', instagram_posts: 563000000, tiktok_views: 377000000000, tiktok_videos: 30700000, avg_views_per_video: 12279, platform_leader: 'Balanced', year: 2024 },
  { rank: 2, hashtag: '#gym', instagram_posts: 303000000, tiktok_views: 547100000000, tiktok_videos: 56900000, avg_views_per_video: 9600, platform_leader: 'TikTok', year: 2024 },
  { rank: 3, hashtag: '#workout', instagram_posts: 238000000, tiktok_views: 165700000000, tiktok_videos: 16900000, avg_views_per_video: 9813, platform_leader: 'Balanced', year: 2024 },
  { rank: 4, hashtag: '#bodybuilding', instagram_posts: 149000000, tiktok_views: 119700000000, tiktok_videos: 8700000, avg_views_per_video: 13507, platform_leader: 'Balanced', year: 2024 },
  { rank: 5, hashtag: '#yoga', instagram_posts: 129000000, tiktok_views: 35000000000, tiktok_videos: 4700000, avg_views_per_video: 7400, platform_leader: 'Instagram', year: 2024 },
  { rank: 6, hashtag: '#running', instagram_posts: 99400000, tiktok_views: 30000000000, tiktok_videos: 4000000, avg_views_per_video: 7500, platform_leader: 'Instagram', year: 2024 },
  { rank: 7, hashtag: '#gymlife', instagram_posts: 98900000, tiktok_views: 46700000000, tiktok_videos: 6100000, avg_views_per_video: 7654, platform_leader: 'Balanced', year: 2024 },
  { rank: 8, hashtag: '#fitnessmotivation', instagram_posts: 98900000, tiktok_views: 52300000000, tiktok_videos: 7000000, avg_views_per_video: 7507, platform_leader: 'Balanced', year: 2024 },
  { rank: 9, hashtag: '#hiking', instagram_posts: 88700000, tiktok_views: 20000000000, tiktok_videos: 3000000, avg_views_per_video: 6667, platform_leader: 'Instagram', year: 2024 },
  { rank: 10, hashtag: '#crossfit', instagram_posts: 76600000, tiktok_views: 15100000000, tiktok_videos: 2700000, avg_views_per_video: 5593, platform_leader: 'Instagram', year: 2024 },
  { rank: 11, hashtag: '#fitnessmodel', instagram_posts: 66600000, tiktok_views: 10000000000, tiktok_videos: 1500000, avg_views_per_video: 6667, platform_leader: 'Instagram', year: 2024 },
  { rank: 12, hashtag: '#personaltrainer', instagram_posts: 60600000, tiktok_views: 9000000000, tiktok_videos: 2000000, avg_views_per_video: 4500, platform_leader: 'Instagram', year: 2024 }
];

// Helper functions
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function formatRevenue(eur: number): string {
  if (eur >= 1000000000) {
    return `€${(eur / 1000000000).toFixed(2)}B`;
  }
  return `€${(eur / 1000000).toFixed(0)}M`;
}

export function getGymChainsByCountry(countryCode: string): GymChainData[] {
  switch (countryCode) {
    case 'GB': return UK_GYM_CHAINS_2024;
    case 'DE': return GERMANY_GYM_CHAINS_2024;
    case 'FR': return FRANCE_GYM_CHAINS_2024;
    case 'ES': return SPAIN_GYM_CHAINS_2024;
    case 'IT': return ITALY_GYM_CHAINS_2024;
    case 'PL': return POLAND_GYM_CHAINS_2024;
    case 'NL': return NETHERLANDS_GYM_CHAINS_2024;
    case 'BE': return BELGIUM_GYM_CHAINS_2024;
    case 'GR': return GREECE_GYM_CHAINS_2024;
    default: return [];
  }
}

export function getInfluencersByCountry(countryCode: string): FitnessInfluencerData[] {
  return EUROPE_INFLUENCERS_2024.filter(i => i.country_code === countryCode);
}

export function getTopInfluencersByFollowers(limit: number = 10): FitnessInfluencerData[] {
  return [...EUROPE_INFLUENCERS_2024]
    .sort((a, b) => {
      const aTotal = a.instagram_followers + (a.youtube_followers || 0) + (a.tiktok_followers || 0);
      const bTotal = b.instagram_followers + (b.youtube_followers || 0) + (b.tiktok_followers || 0);
      return bTotal - aTotal;
    })
    .slice(0, limit);
}

export function getHashtagsByViews(limit: number = 20): HashtagData[] {
  return [...HASHTAG_COMPARISON_2024]
    .sort((a, b) => b.tiktok_views - a.tiktok_views)
    .slice(0, limit);
}

export function getHashtagsByPosts(limit: number = 20): HashtagData[] {
  return [...HASHTAG_COMPARISON_2024]
    .sort((a, b) => b.instagram_posts - a.instagram_posts)
    .slice(0, limit);
}
