# Fitness Intelligence

## Interactive Maps for Massimino

**Version:** 1.0  
**Status:** Development  
**Implementation:** Claude Code  
**Stack:** Next.js 15 + TypeScript + MapLibre GL JS + OpenStreetMap

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [MapLibre GL JS](#maplibre-gl-js)
4. [OpenStreetMap Integration](#openstreetmap-integration)
5. [Data Layer](#data-layer)
6. [Map Components](#map-components)
7. [Social Media Export](#social-media-export)
8. [Map Content Ideas](#map-content-ideas)
9. [Project Structure](#project-structure)
10. [Implementation Guide](#implementation-guide)
11. [Resources](#resources)

---

## Overview

**Fitness Intelligence** is Massimino's interactive data visualization feature that displays European fitness industry data on dynamic, explorable maps. All maps are fully interactive—users can zoom, pan, hover for details, and filter by metrics.

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Choropleth Maps** | Color-coded countries/regions by fitness metrics |
| **Gym Locator** | Real-time gym locations from OpenStreetMap |
| **Trainer Heatmaps** | Density visualization of certified trainers |
| **Safety Overlay** | Massimino SafeSpace certified locations |
| **Social Export** | One-click screenshot for LinkedIn/Instagram |

### Why Interactive Maps?

- Engages users longer than static images
- Allows personalized exploration (zoom to your city)
- Positions Massimino as a data-driven platform
- Generates shareable content for social media
- Scales with new data without redesign

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FITNESS INTELLIGENCE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      FRONTEND                               │ │
│  │  Next.js 15 + React + TypeScript                           │ │
│  │  ├── MapLibre GL JS (WebGL map rendering)                  │ │
│  │  ├── React Map GL (React bindings)                         │ │
│  │  └── Tailwind CSS (UI styling)                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      DATA LAYER                             │ │
│  │  ├── GeoJSON (country/region boundaries)                   │ │
│  │  ├── OpenStreetMap Overpass API (gym locations)            │ │
│  │  ├── PostgreSQL + PostGIS (spatial queries)                │ │
│  │  └── Prisma ORM (database access)                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     TILE SERVERS                            │ │
│  │  ├── OpenStreetMap (base map tiles)                        │ │
│  │  ├── MapTiler (styled tiles, free tier)                    │ │
│  │  └── Self-hosted (future, unlimited)                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     EXPORT LAYER                            │ │
│  │  ├── html-to-image (map screenshots)                       │ │
│  │  ├── Sharp (image processing/optimization)                 │ │
│  │  └── Social templates (LinkedIn/Instagram dimensions)      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## MapLibre GL JS

### Why MapLibre?

| Benefit | Description |
|---------|-------------|
| **Open Source** | BSD-3 license, no vendor lock-in |
| **No API Key Required** | Works with free tile servers |
| **High Performance** | WebGL rendering, smooth 60fps |
| **Full Customization** | Style every map element |
| **Active Community** | Fork of Mapbox GL JS with ongoing development |

### Repository & Documentation

| Resource | URL |
|----------|-----|
| GitHub | https://github.com/maplibre/maplibre-gl-js |
| Documentation | https://maplibre.org/maplibre-gl-js/docs/ |
| Examples | https://maplibre.org/maplibre-gl-js/docs/examples/ |
| Style Specification | https://maplibre.org/maplibre-style-spec/ |
| React Integration | https://visgl.github.io/react-map-gl/ |

### Installation

```bash
npm install maplibre-gl react-map-gl
```

### Basic Configuration

```typescript
// lib/map_config.ts

export const MAP_CONFIG = {
  // Free demo tiles for development
  style: 'https://demotiles.maplibre.org/style.json',
  
  // Or use MapTiler for production styling:
  // style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
  
  defaultView: {
    longitude: 10,
    latitude: 50,
    zoom: 4
  },
  
  bounds: {
    europe: [[-25, 34], [45, 72]]  // SW, NE corners
  },
  
  // Massimino brand colors for map elements
  colors: {
    primary: '#2563eb',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444'
  }
};
```

### Tile Server Options

| Provider | Free Tier | Best For |
|----------|-----------|----------|
| MapLibre Demo Tiles | Unlimited | Development only |
| MapTiler | 100K tiles/month | Production start |
| Stadia Maps | 200K tiles/month | Alternative option |
| OpenMapTiles (self-hosted) | Unlimited | Scale/privacy |

---

## OpenStreetMap Integration

### Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| GitHub Organization | https://github.com/openstreetmap | Core repositories |
| Topic Collection | https://github.com/topics/openstreetmap | Community tools |
| Overpass Turbo | https://overpass-turbo.eu/ | Query builder/tester |
| Overpass API Wiki | https://wiki.openstreetmap.org/wiki/Overpass_API | Documentation |
| TagInfo | https://taginfo.openstreetmap.org/ | Tag statistics |
| Nominatim | https://nominatim.openstreetmap.org/ | Geocoding API |

### Relevant OSM Tags for Fitness

| Tag | Description | Global Count |
|-----|-------------|--------------|
| `leisure=fitness_centre` | Gyms and fitness centers | 150K+ |
| `leisure=sports_centre` | Sports facilities | 80K+ |
| `sport=fitness` | Fitness-specific venues | 50K+ |
| `sport=gym` | Alternative gym tag | 30K+ |
| `amenity=gym` | Legacy gym tag | 10K+ |

### Overpass API Queries

**Fetch all gyms in Belgium:**

```
[out:json][timeout:60];
area["ISO3166-1"="BE"]->.searchArea;
(
  node["leisure"="fitness_centre"](area.searchArea);
  way["leisure"="fitness_centre"](area.searchArea);
  node["leisure"="sports_centre"]["sport"="fitness"](area.searchArea);
  way["leisure"="sports_centre"]["sport"="fitness"](area.searchArea);
);
out body;
>;
out skel qt;
```

**Fetch gyms within bounding box:**

```
[out:json][timeout:30];
(
  node["leisure"="fitness_centre"](50.5,3.0,51.5,6.0);
  way["leisure"="fitness_centre"](50.5,3.0,51.5,6.0);
);
out body;
>;
out skel qt;
```

**Fetch gyms by brand (Basic-Fit):**

```
[out:json][timeout:60];
area["ISO3166-1"="BE"]->.searchArea;
(
  node["leisure"="fitness_centre"]["brand"="Basic-Fit"](area.searchArea);
  way["leisure"="fitness_centre"]["brand"="Basic-Fit"](area.searchArea);
);
out body;
>;
out skel qt;
```

### OSM Service Implementation

```typescript
// lib/osm_service.ts

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

export interface OsmGym {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    brand?: string;
    opening_hours?: string;
    website?: string;
    phone?: string;
    'addr:street'?: string;
    'addr:city'?: string;
  };
}

export async function fetchGymsInBounds(
  south: number,
  west: number,
  north: number,
  east: number
): Promise<OsmGym[]> {
  const query = `
    [out:json][timeout:30];
    (
      node["leisure"="fitness_centre"](${south},${west},${north},${east});
      way["leisure"="fitness_centre"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;
  `;

  const response = await fetch(OVERPASS_API, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const data = await response.json();
  
  return data.elements
    .filter((el: any) => el.type === 'node' && el.lat && el.lon)
    .map((el: any) => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      tags: el.tags || {}
    }));
}

export async function fetchGymsInCountry(isoCode: string): Promise<OsmGym[]> {
  const query = `
    [out:json][timeout:120];
    area["ISO3166-1"="${isoCode}"]->.searchArea;
    (
      node["leisure"="fitness_centre"](area.searchArea);
      way["leisure"="fitness_centre"](area.searchArea);
    );
    out body;
    >;
    out skel qt;
  `;

  const response = await fetch(OVERPASS_API, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const data = await response.json();
  
  return data.elements
    .filter((el: any) => el.type === 'node' && el.lat && el.lon)
    .map((el: any) => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      tags: el.tags || {}
    }));
}

export async function fetchGymsByBrand(
  isoCode: string,
  brand: string
): Promise<OsmGym[]> {
  const query = `
    [out:json][timeout:60];
    area["ISO3166-1"="${isoCode}"]->.searchArea;
    (
      node["leisure"="fitness_centre"]["brand"="${brand}"](area.searchArea);
      way["leisure"="fitness_centre"]["brand"="${brand}"](area.searchArea);
    );
    out body;
    >;
    out skel qt;
  `;

  const response = await fetch(OVERPASS_API, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const data = await response.json();
  
  return data.elements
    .filter((el: any) => el.type === 'node' && el.lat && el.lon)
    .map((el: any) => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      tags: el.tags || {}
    }));
}
```

### Convert OSM to GeoJSON

```typescript
// lib/geojson_utils.ts

import type { FeatureCollection, Point } from 'geojson';
import type { OsmGym } from './osm_service';

export function osmToGeoJSON(gyms: OsmGym[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: gyms.map(gym => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [gym.lon, gym.lat]
      },
      properties: {
        id: gym.id,
        name: gym.tags.name || 'Unknown Gym',
        brand: gym.tags.brand || null,
        opening_hours: gym.tags.opening_hours || null,
        website: gym.tags.website || null,
        phone: gym.tags.phone || null,
        address: [
          gym.tags['addr:street'],
          gym.tags['addr:city']
        ].filter(Boolean).join(', ') || null,
        osm_id: `node/${gym.id}`,
        osm_url: `https://www.openstreetmap.org/node/${gym.id}`
      }
    }))
  };
}
```

---

## Data Layer

### TypeScript Types

```typescript
// types/fitness_data.ts

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
```

### Sample Data

```typescript
// data/fitness/europe_2024.ts

import type { CountryFitnessData } from '@/types/fitness_data';

export const EUROPE_FITNESS_DATA_2024: CountryFitnessData[] = [
  // ===== NORDIC COUNTRIES =====
  {
    iso_code: 'SE',
    name: 'Sweden',
    market_size_eur: 900000000,
    members_millions: 2.2,
    penetration_rate: 21.6,
    growth_cagr: 6.0,
    clubs_count: 700,
    trainers_count: 12000,
    top_chains: ['SATS', 'Nordic Wellness', 'Friskis&Svettis'],
    year: 2024
  },
  {
    iso_code: 'NO',
    name: 'Norway',
    market_size_eur: 700000000,
    members_millions: 1.2,
    penetration_rate: 21.4,
    growth_cagr: 5.5,
    clubs_count: 550,
    trainers_count: 8000,
    top_chains: ['SATS', 'Evo Fitness', 'Treningshansen'],
    year: 2024
  },
  {
    iso_code: 'DK',
    name: 'Denmark',
    market_size_eur: 500000000,
    members_millions: 0.9,
    penetration_rate: 15.0,
    growth_cagr: 6.5,
    clubs_count: 450,
    trainers_count: 6000,
    top_chains: ['PureGym', 'Fitness World', 'Loop Fitness'],
    year: 2024
  },
  {
    iso_code: 'FI',
    name: 'Finland',
    market_size_eur: 400000000,
    members_millions: 0.8,
    penetration_rate: 15.0,
    growth_cagr: 6.0,
    clubs_count: 400,
    trainers_count: 5000,
    top_chains: ['SATS', 'Elixia', 'Fitness24Seven'],
    year: 2024
  },
  {
    iso_code: 'IS',
    name: 'Iceland',
    market_size_eur: 50000000,
    members_millions: 0.07,
    penetration_rate: 18.0,
    growth_cagr: 5.0,
    clubs_count: 60,
    trainers_count: 600,
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
    growth_cagr: 9.0,
    clubs_count: 7500,
    trainers_count: 65000,
    top_chains: ['PureGym', 'The Gym Group', 'David Lloyd'],
    year: 2024
  },
  {
    iso_code: 'IE',
    name: 'Ireland',
    market_size_eur: 400000000,
    members_millions: 0.6,
    penetration_rate: 12.0,
    growth_cagr: 8.0,
    clubs_count: 350,
    trainers_count: 4000,
    top_chains: ['Flyefit', 'Ben Dunne Gyms', 'West Wood Club'],
    year: 2024
  },

  // ===== WESTERN EUROPE =====
  {
    iso_code: 'DE',
    name: 'Germany',
    market_size_eur: 5800000000,
    members_millions: 11.7,
    penetration_rate: 13.6,
    growth_cagr: 8.4,
    clubs_count: 9111,
    trainers_count: 88000,
    top_chains: ['RSG Group', 'Clever fit', 'FitX'],
    year: 2024
  },
  {
    iso_code: 'FR',
    name: 'France',
    market_size_eur: 4300000000,
    members_millions: 6.0,
    penetration_rate: 8.9,
    growth_cagr: 9.6,
    clubs_count: 6500,
    trainers_count: 45000,
    top_chains: ['Basic-Fit', 'Fitness Park', 'Neoness'],
    year: 2024
  },
  {
    iso_code: 'NL',
    name: 'Netherlands',
    market_size_eur: 1700000000,
    members_millions: 3.4,
    penetration_rate: 16.7,
    growth_cagr: 6.5,
    clubs_count: 1900,
    trainers_count: 18000,
    top_chains: ['Basic-Fit', 'TrainMore', 'Fit For Free'],
    year: 2024
  },
  {
    iso_code: 'BE',
    name: 'Belgium',
    market_size_eur: 500000000,
    members_millions: 1.2,
    penetration_rate: 10.5,
    growth_cagr: 7.8,
    clubs_count: 320,
    trainers_count: 8000,
    top_chains: ['Basic-Fit', 'Jims'],
    year: 2024
  },
  {
    iso_code: 'LU',
    name: 'Luxembourg',
    market_size_eur: 117000000,
    members_millions: 0.09,
    penetration_rate: 14.0,
    growth_cagr: 8.3,
    clubs_count: 60,
    trainers_count: 800,
    top_chains: ['Fitness First', 'Basic-Fit'],
    year: 2024
  },

  // ===== CENTRAL EUROPE =====
  {
    iso_code: 'CH',
    name: 'Switzerland',
    market_size_eur: 1500000000,
    members_millions: 1.3,
    penetration_rate: 14.9,
    growth_cagr: 5.0,
    clubs_count: 800,
    trainers_count: 10000,
    top_chains: ['Migros Fitnesspark', 'Activ Fitness', 'Update Fitness'],
    year: 2024
  },
  {
    iso_code: 'AT',
    name: 'Austria',
    market_size_eur: 700000000,
    members_millions: 1.2,
    penetration_rate: 13.9,
    growth_cagr: 7.0,
    clubs_count: 700,
    trainers_count: 8000,
    top_chains: ['LifeFit Group', 'John Harris', 'McFit'],
    year: 2024
  },
  {
    iso_code: 'PL',
    name: 'Poland',
    market_size_eur: 1000000000,
    members_millions: 3.0,
    penetration_rate: 8.0,
    growth_cagr: 9.0,
    clubs_count: 3500,
    trainers_count: 25000,
    top_chains: ['Benefit Systems', 'CityFit', 'Zdrofit'],
    year: 2024
  },
  {
    iso_code: 'CZ',
    name: 'Czech Republic',
    market_size_eur: 300000000,
    members_millions: 0.45,
    penetration_rate: 4.2,
    growth_cagr: 8.0,
    clubs_count: 800,
    trainers_count: 6000,
    top_chains: ['Fitness Project', 'John Reed', 'Form Factory'],
    year: 2024
  },
  {
    iso_code: 'SK',
    name: 'Slovakia',
    market_size_eur: 120000000,
    members_millions: 0.27,
    penetration_rate: 5.0,
    growth_cagr: 7.5,
    clubs_count: 350,
    trainers_count: 3000,
    top_chains: ['Golem Club', 'Fitinn', 'X-Fitness'],
    year: 2024
  },
  {
    iso_code: 'HU',
    name: 'Hungary',
    market_size_eur: 200000000,
    members_millions: 0.27,
    penetration_rate: 2.8,
    growth_cagr: 9.0,
    clubs_count: 500,
    trainers_count: 4000,
    top_chains: ['Life1 Fitness', 'All You Can Move'],
    year: 2024
  },

  // ===== SOUTHERN EUROPE =====
  {
    iso_code: 'ES',
    name: 'Spain',
    market_size_eur: 2600000000,
    members_millions: 6.2,
    penetration_rate: 13.0,
    growth_cagr: 8.5,
    clubs_count: 4800,
    trainers_count: 38000,
    top_chains: ['Basic-Fit', 'Vivagym', 'AltaFit'],
    year: 2024
  },
  {
    iso_code: 'PT',
    name: 'Portugal',
    market_size_eur: 350000000,
    members_millions: 0.8,
    penetration_rate: 7.8,
    growth_cagr: 8.0,
    clubs_count: 650,
    trainers_count: 5500,
    top_chains: ['Holmes Place', 'Fitness Hut', 'Solinca'],
    year: 2024
  },
  {
    iso_code: 'IT',
    name: 'Italy',
    market_size_eur: 2200000000,
    members_millions: 5.3,
    penetration_rate: 9.0,
    growth_cagr: 8.0,
    clubs_count: 7000,
    trainers_count: 45000,
    top_chains: ['Anytime Fitness', 'McFit', 'Virgin Active'],
    year: 2024
  },
  {
    iso_code: 'GR',
    name: 'Greece',
    market_size_eur: 450000000,
    members_millions: 0.8,
    penetration_rate: 8.0,
    growth_cagr: 8.5,
    clubs_count: 600,
    trainers_count: 5000,
    top_chains: ['Holmes Place', 'Curves', 'Body Control'],
    year: 2024
  },
  {
    iso_code: 'MT',
    name: 'Malta',
    market_size_eur: 35000000,
    members_millions: 0.045,
    penetration_rate: 9.0,
    growth_cagr: 7.0,
    clubs_count: 40,
    trainers_count: 400,
    top_chains: ['Tigne Fitness', 'Cynergi Health'],
    year: 2024
  },
  {
    iso_code: 'CY',
    name: 'Cyprus',
    market_size_eur: 60000000,
    members_millions: 0.07,
    penetration_rate: 8.0,
    growth_cagr: 7.5,
    clubs_count: 80,
    trainers_count: 600,
    top_chains: ['Oxygen Gym', 'Virgin Active'],
    year: 2024
  },

  // ===== BALKANS =====
  {
    iso_code: 'SI',
    name: 'Slovenia',
    market_size_eur: 80000000,
    members_millions: 0.11,
    penetration_rate: 5.5,
    growth_cagr: 7.5,
    clubs_count: 150,
    trainers_count: 1200,
    top_chains: ['Fitinn', 'ABS Fitness', 'Activity'],
    year: 2024
  },
  {
    iso_code: 'HR',
    name: 'Croatia',
    market_size_eur: 100000000,
    members_millions: 0.18,
    penetration_rate: 4.5,
    growth_cagr: 8.0,
    clubs_count: 250,
    trainers_count: 2000,
    top_chains: ['Fitness First', 'Gyms4You'],
    year: 2024
  },
  {
    iso_code: 'RS',
    name: 'Serbia',
    market_size_eur: 80000000,
    members_millions: 0.24,
    penetration_rate: 3.5,
    growth_cagr: 9.0,
    clubs_count: 300,
    trainers_count: 2500,
    top_chains: ['Fit Zone', 'Puls Sport'],
    year: 2024
  },
  {
    iso_code: 'BA',
    name: 'Bosnia and Herzegovina',
    market_size_eur: 30000000,
    members_millions: 0.1,
    penetration_rate: 3.0,
    growth_cagr: 8.0,
    clubs_count: 150,
    trainers_count: 1000,
    top_chains: ['Gym Factory', 'Fitness One'],
    year: 2024
  },
  {
    iso_code: 'ME',
    name: 'Montenegro',
    market_size_eur: 15000000,
    members_millions: 0.02,
    penetration_rate: 3.0,
    growth_cagr: 8.5,
    clubs_count: 50,
    trainers_count: 400,
    top_chains: ['Gym Pro', 'Fit Life'],
    year: 2024
  },
  {
    iso_code: 'AL',
    name: 'Albania',
    market_size_eur: 25000000,
    members_millions: 0.07,
    penetration_rate: 2.5,
    growth_cagr: 10.0,
    clubs_count: 120,
    trainers_count: 800,
    top_chains: ['Metropol Gym', 'CrossFit Tirana'],
    year: 2024
  },
  {
    iso_code: 'MK',
    name: 'North Macedonia',
    market_size_eur: 20000000,
    members_millions: 0.06,
    penetration_rate: 3.0,
    growth_cagr: 8.0,
    clubs_count: 100,
    trainers_count: 700,
    top_chains: ['Fit Factory', 'Pro Gym'],
    year: 2024
  },
  {
    iso_code: 'BG',
    name: 'Bulgaria',
    market_size_eur: 120000000,
    members_millions: 0.27,
    penetration_rate: 4.0,
    growth_cagr: 9.0,
    clubs_count: 400,
    trainers_count: 3000,
    top_chains: ['MultiSport', 'Next Level', 'Pulse Fitness'],
    year: 2024
  },
  {
    iso_code: 'RO',
    name: 'Romania',
    market_size_eur: 250000000,
    members_millions: 0.76,
    penetration_rate: 4.0,
    growth_cagr: 10.0,
    clubs_count: 600,
    trainers_count: 5000,
    top_chains: ['World Class', '7Card', 'Smartfit'],
    year: 2024
  },

  // ===== BALTIC STATES =====
  {
    iso_code: 'EE',
    name: 'Estonia',
    market_size_eur: 70000000,
    members_millions: 0.12,
    penetration_rate: 9.0,
    growth_cagr: 7.0,
    clubs_count: 120,
    trainers_count: 1000,
    top_chains: ['MyFitness', 'Reval Sport', 'Sportland Fitness'],
    year: 2024
  },
  {
    iso_code: 'LV',
    name: 'Latvia',
    market_size_eur: 60000000,
    members_millions: 0.13,
    penetration_rate: 7.0,
    growth_cagr: 7.5,
    clubs_count: 130,
    trainers_count: 1100,
    top_chains: ['MyFitness', 'Lemon Gym', 'O2 Gym'],
    year: 2024
  },
  {
    iso_code: 'LT',
    name: 'Lithuania',
    market_size_eur: 80000000,
    members_millions: 0.17,
    penetration_rate: 6.0,
    growth_cagr: 8.0,
    clubs_count: 180,
    trainers_count: 1500,
    top_chains: ['MyFitness', 'Lemon Gym', 'Impuls'],
    year: 2024
  },

  // ===== EASTERN EUROPE =====
  {
    iso_code: 'UA',
    name: 'Ukraine',
    market_size_eur: 300000000,
    members_millions: 1.2,
    penetration_rate: 2.9,
    growth_cagr: 6.0,
    clubs_count: 2000,
    trainers_count: 15000,
    top_chains: ['Sport Life', 'Sportpalace', 'FitCurves'],
    year: 2024
  },
  {
    iso_code: 'MD',
    name: 'Moldova',
    market_size_eur: 15000000,
    members_millions: 0.05,
    penetration_rate: 2.0,
    growth_cagr: 8.0,
    clubs_count: 80,
    trainers_count: 600,
    top_chains: ['Oxygen Gym', 'Grand Fitness'],
    year: 2024
  },

  // ===== TURKEY (European part) =====
  {
    iso_code: 'TR',
    name: 'Turkey',
    market_size_eur: 800000000,
    members_millions: 2.2,
    penetration_rate: 2.6,
    growth_cagr: 11.0,
    clubs_count: 3500,
    trainers_count: 25000,
    top_chains: ['MAC', 'Goldengym', 'Mars Athletic'],
    year: 2024
  }
];
```

### Merge Data with GeoJSON

```typescript
// lib/data_transforms.ts

import type { FeatureCollection, Feature, Polygon } from 'geojson';
import type { CountryFitnessData, FitnessMetric } from '@/types/fitness_data';

export function mergeDataWithGeoJSON(
  geoJSON: FeatureCollection<Polygon>,
  fitnessData: CountryFitnessData[],
  metric: FitnessMetric
): FeatureCollection<Polygon> {
  const dataMap = new Map(
    fitnessData.map(d => [d.iso_code, d])
  );

  return {
    type: 'FeatureCollection',
    features: geoJSON.features.map(feature => {
      const isoCode = feature.properties?.iso_a2 || feature.properties?.ISO_A2;
      const countryData = dataMap.get(isoCode);

      return {
        ...feature,
        properties: {
          ...feature.properties,
          fitness_data: countryData || null,
          metric_value: countryData ? countryData[metric] : null
        }
      };
    })
  };
}

export function getMetricBounds(
  data: CountryFitnessData[],
  metric: FitnessMetric
): { min: number; max: number } {
  const values = data.map(d => d[metric] as number).filter(v => v != null);
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}
```

---

## Map Components

### Main Fitness Map

```typescript
// components/maps/fitness_map.tsx

'use client';

import { useState, useCallback, useRef } from 'react';
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { FeatureCollection, Polygon } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MAP_CONFIG } from '@/lib/map_config';
import { MapLegend } from './map_legend';
import { MapTooltip } from './map_tooltip';
import { MapExport } from './map_export';
import { MetricSelector } from './metric_selector';
import type { FitnessMetric, CountryFitnessData } from '@/types/fitness_data';

interface FitnessMapProps {
  data: FeatureCollection<Polygon>;
  metric: FitnessMetric;
  onMetricChange: (metric: FitnessMetric) => void;
  title?: string;
}

export function FitnessMap({ data, metric, onMetricChange, title }: FitnessMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    longitude: number;
    latitude: number;
    properties: CountryFitnessData | null;
  } | null>(null);

  const onHover = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (feature && feature.properties?.fitness_data) {
      setHoverInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        properties: JSON.parse(feature.properties.fitness_data)
      });
    } else {
      setHoverInfo(null);
    }
  }, []);

  const colorScale = getColorScale(metric);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-gray-200">
      <Map
        ref={mapRef}
        initialViewState={MAP_CONFIG.defaultView}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_CONFIG.style}
        interactiveLayerIds={['countries-fill']}
        onMouseMove={onHover}
        onMouseLeave={() => setHoverInfo(null)}
      >
        <NavigationControl position="top-right" />
        
        <Source id="countries" type="geojson" data={data}>
          <Layer
            id="countries-fill"
            type="fill"
            paint={{
              'fill-color': [
                'case',
                ['!=', ['get', 'metric_value'], null],
                [
                  'interpolate',
                  ['linear'],
                  ['get', 'metric_value'],
                  colorScale.min, colorScale.minColor,
                  colorScale.max, colorScale.maxColor
                ],
                '#e5e7eb'
              ],
              'fill-opacity': 0.8
            }}
          />
          <Layer
            id="countries-outline"
            type="line"
            paint={{
              'line-color': '#374151',
              'line-width': 1
            }}
          />
          <Layer
            id="countries-highlight"
            type="line"
            paint={{
              'line-color': '#2563eb',
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                3,
                0
              ]
            }}
          />
        </Source>

        {hoverInfo && hoverInfo.properties && (
          <Popup
            longitude={hoverInfo.longitude}
            latitude={hoverInfo.latitude}
            anchor="bottom"
            closeButton={false}
            className="z-50"
          >
            <MapTooltip data={hoverInfo.properties} metric={metric} />
          </Popup>
        )}
      </Map>

      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 z-10">
        <MetricSelector value={metric} onChange={onMetricChange} />
      </div>

      <div className="absolute bottom-4 left-4 z-10">
        <MapLegend metric={metric} colorScale={colorScale} />
      </div>

      <div className="absolute top-4 right-16 z-10">
        <MapExport mapRef={mapRef} title={title} />
      </div>
    </div>
  );
}

// Color scale definitions
interface ColorScale {
  min: number;
  max: number;
  minColor: string;
  maxColor: string;
}

function getColorScale(metric: FitnessMetric): ColorScale {
  const scales: Record<FitnessMetric, ColorScale> = {
    penetration_rate: { min: 0, max: 25, minColor: '#f7fbff', maxColor: '#08519c' },
    market_size_eur: { min: 0, max: 6000000000, minColor: '#f7fcf5', maxColor: '#00441b' },
    members_millions: { min: 0, max: 12, minColor: '#fff5eb', maxColor: '#7f2704' },
    growth_cagr: { min: 0, max: 15, minColor: '#ffffd9', maxColor: '#081d58' },
    clubs_count: { min: 0, max: 10000, minColor: '#fcfbfd', maxColor: '#3f007d' },
    trainers_count: { min: 0, max: 100000, minColor: '#fff7ec', maxColor: '#7f0000' }
  };
  return scales[metric];
}
```

### Metric Selector

```typescript
// components/maps/metric_selector.tsx

import type { FitnessMetric } from '@/types/fitness_data';

interface MetricSelectorProps {
  value: FitnessMetric;
  onChange: (metric: FitnessMetric) => void;
}

const METRICS: { value: FitnessMetric; label: string; icon: string }[] = [
  { value: 'penetration_rate', label: 'Gym Penetration', icon: '📊' },
  { value: 'market_size_eur', label: 'Market Size (€)', icon: '💰' },
  { value: 'members_millions', label: 'Total Members', icon: '👥' },
  { value: 'growth_cagr', label: 'Growth Rate', icon: '📈' },
  { value: 'clubs_count', label: 'Number of Gyms', icon: '🏋️' },
  { value: 'trainers_count', label: 'Personal Trainers', icon: '💪' }
];

export function MetricSelector({ value, onChange }: MetricSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FitnessMetric)}
      className="bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      {METRICS.map(m => (
        <option key={m.value} value={m.value}>
          {m.icon} {m.label}
        </option>
      ))}
    </select>
  );
}
```

### Map Legend

```typescript
// components/maps/map_legend.tsx

import type { FitnessMetric } from '@/types/fitness_data';

interface ColorScale {
  min: number;
  max: number;
  minColor: string;
  maxColor: string;
}

interface MapLegendProps {
  metric: FitnessMetric;
  colorScale: ColorScale;
}

export function MapLegend({ metric, colorScale }: MapLegendProps) {
  const labels = getMetricLabels(metric);
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 min-w-[200px]">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        {labels.title}
      </h4>
      
      <div 
        className="h-4 w-full rounded"
        style={{
          background: `linear-gradient(to right, ${colorScale.minColor}, ${colorScale.maxColor})`
        }}
      />
      
      <div className="flex justify-between mt-1 text-xs text-gray-600">
        <span>{formatValue(colorScale.min, metric)}</span>
        <span>{formatValue(colorScale.max, metric)}</span>
      </div>
      
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <div className="w-4 h-4 bg-gray-200 rounded border" />
        <span>No data available</span>
      </div>
    </div>
  );
}

function getMetricLabels(metric: FitnessMetric): { title: string } {
  const labels: Record<FitnessMetric, { title: string }> = {
    penetration_rate: { title: 'Gym Penetration Rate (%)' },
    market_size_eur: { title: 'Market Size' },
    members_millions: { title: 'Gym Members (millions)' },
    growth_cagr: { title: 'Annual Growth Rate (%)' },
    clubs_count: { title: 'Number of Fitness Clubs' },
    trainers_count: { title: 'Personal Trainers' }
  };
  return labels[metric];
}

function formatValue(value: number, metric: FitnessMetric): string {
  switch (metric) {
    case 'market_size_eur':
      return value >= 1000000000 
        ? `€${(value / 1000000000).toFixed(1)}B`
        : `€${(value / 1000000).toFixed(0)}M`;
    case 'penetration_rate':
    case 'growth_cagr':
      return `${value}%`;
    case 'members_millions':
      return `${value}M`;
    default:
      return value.toLocaleString();
  }
}
```

### Map Tooltip

```typescript
// components/maps/map_tooltip.tsx

import type { FitnessMetric, CountryFitnessData } from '@/types/fitness_data';

interface MapTooltipProps {
  data: CountryFitnessData | null;
  metric: FitnessMetric;
}

export function MapTooltip({ data, metric }: MapTooltipProps) {
  if (!data) return null;

  return (
    <div className="min-w-[220px] p-1">
      <h3 className="font-bold text-lg text-gray-900 border-b pb-2 mb-2">
        {data.name}
      </h3>
      
      <div className="space-y-1 text-sm">
        <DataRow 
          label="Market Size" 
          value={`€${(data.market_size_eur / 1000000000).toFixed(1)}B`}
          highlight={metric === 'market_size_eur'}
        />
        <DataRow 
          label="Members" 
          value={`${data.members_millions}M`}
          highlight={metric === 'members_millions'}
        />
        <DataRow 
          label="Penetration" 
          value={`${data.penetration_rate}%`}
          highlight={metric === 'penetration_rate'}
        />
        <DataRow 
          label="Growth" 
          value={`${data.growth_cagr}%`}
          highlight={metric === 'growth_cagr'}
        />
        <DataRow 
          label="Gyms" 
          value={data.clubs_count.toLocaleString()}
          highlight={metric === 'clubs_count'}
        />
        <DataRow 
          label="Trainers" 
          value={data.trainers_count.toLocaleString()}
          highlight={metric === 'trainers_count'}
        />
      </div>

      {data.top_chains.length > 0 && (
        <div className="mt-3 pt-2 border-t">
          <span className="text-xs text-gray-500">Top Chains: </span>
          <span className="text-xs font-medium">{data.top_chains.join(', ')}</span>
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value, highlight }: { 
  label: string; 
  value: string; 
  highlight: boolean;
}) {
  return (
    <div className={`flex justify-between ${highlight ? 'font-semibold text-blue-600' : 'text-gray-700'}`}>
      <span>{label}:</span>
      <span>{value}</span>
    </div>
  );
}
```

### Gym Markers Layer

```typescript
// components/maps/gym_markers.tsx

'use client';

import { Source, Layer } from 'react-map-gl/maplibre';
import type { FeatureCollection, Point } from 'geojson';

interface GymMarkersProps {
  data: FeatureCollection<Point>;
  visible: boolean;
}

export function GymMarkers({ data, visible }: GymMarkersProps) {
  if (!visible || data.features.length === 0) return null;

  return (
    <Source 
      id="gyms" 
      type="geojson" 
      data={data}
      cluster={true}
      clusterMaxZoom={14}
      clusterRadius={50}
    >
      {/* Clustered points */}
      <Layer
        id="gym-clusters"
        type="circle"
        filter={['has', 'point_count']}
        paint={{
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',    // < 10 gyms
            10, '#f1f075', // 10-50 gyms
            50, '#f28cb1'  // > 50 gyms
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            15,
            10, 20,
            50, 25
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }}
      />

      {/* Cluster count */}
      <Layer
        id="gym-cluster-count"
        type="symbol"
        filter={['has', 'point_count']}
        layout={{
          'text-field': '{point_count_abbreviated}',
          'text-size': 12
        }}
        paint={{
          'text-color': '#333'
        }}
      />

      {/* Individual gym points */}
      <Layer
        id="gym-points"
        type="circle"
        filter={['!', ['has', 'point_count']]}
        paint={{
          'circle-color': '#2563eb',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }}
      />
    </Source>
  );
}
```

---

## Social Media Export

### Export Component

```typescript
// components/maps/map_export.tsx

'use client';

import { useState } from 'react';
import { toPng } from 'html-to-image';
import type { MapRef } from 'react-map-gl/maplibre';

interface MapExportProps {
  mapRef: React.RefObject<MapRef>;
  title?: string;
}

type ExportFormat = 'instagram_square' | 'instagram_portrait' | 'linkedin';

const EXPORT_DIMENSIONS: Record<ExportFormat, { width: number; height: number; label: string }> = {
  instagram_square: { width: 1080, height: 1080, label: 'Instagram Square (1:1)' },
  instagram_portrait: { width: 1080, height: 1350, label: 'Instagram Portrait (4:5)' },
  linkedin: { width: 1200, height: 627, label: 'LinkedIn Post' }
};

export function MapExport({ mapRef, title }: MapExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const exportMap = async (format: ExportFormat) => {
    if (!mapRef.current) return;
    
    setIsExporting(true);
    
    try {
      const mapContainer = mapRef.current.getContainer();
      const { width, height, label } = EXPORT_DIMENSIONS[format];
      
      const dataUrl = await toPng(mapContainer, {
        width,
        height,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        backgroundColor: '#ffffff'
      });

      const link = document.createElement('a');
      const fileName = title 
        ? `massimino-${title.toLowerCase().replace(/\s+/g, '-')}-${format}.png`
        : `massimino-fitness-map-${format}-${Date.now()}.png`;
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="bg-blue-600 text-white rounded-lg px-4 py-2 shadow-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {isExporting ? (
          <>
            <span className="animate-spin">⏳</span>
            Exporting...
          </>
        ) : (
          <>
            📤 Export
          </>
        )}
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
            Export Format
          </div>
          {Object.entries(EXPORT_DIMENSIONS).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => exportMap(key as ExportFormat)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              {key.includes('instagram') ? '📸' : '💼'} {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Server-Side Export with Branding

```typescript
// app/api/export-map/route.ts

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

interface ExportRequest {
  imageData: string;
  format: 'instagram_square' | 'instagram_portrait' | 'linkedin';
  title: string;
  source: string;
}

const DIMENSIONS = {
  instagram_square: { width: 1080, height: 1080 },
  instagram_portrait: { width: 1080, height: 1350 },
  linkedin: { width: 1200, height: 627 }
};

export async function POST(request: NextRequest) {
  try {
    const { imageData, format, title, source }: ExportRequest = await request.json();
    
    const { width, height } = DIMENSIONS[format];
    const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
    
    // Load Massimino logo
    const logoPath = path.join(process.cwd(), 'public', 'images', 'massimino-logo.png');
    let logoComposite = [];
    
    try {
      const logoBuffer = await fs.readFile(logoPath);
      const resizedLogo = await sharp(logoBuffer).resize(120, 40).toBuffer();
      logoComposite.push({
        input: resizedLogo,
        top: 20,
        left: 20
      });
    } catch {
      // Logo not found, skip
    }
    
    // Create title/source overlay
    const overlayHeight = 70;
    const textOverlay = Buffer.from(`
      <svg width="${width}" height="${overlayHeight}">
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)"/>
        <text x="20" y="28" font-family="system-ui, sans-serif" font-size="20" fill="white" font-weight="bold">
          ${escapeXml(title)}
        </text>
        <text x="20" y="52" font-family="system-ui, sans-serif" font-size="12" fill="#999">
          Source: ${escapeXml(source)} | massimino.fitness
        </text>
      </svg>
    `);

    const result = await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover' })
      .composite([
        ...logoComposite,
        {
          input: textOverlay,
          top: height - overlayHeight,
          left: 0
        }
      ])
      .png({ quality: 90 })
      .toBuffer();

    return new NextResponse(result, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="massimino-${format}-${Date.now()}.png"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

---

## Map Content Ideas

### Choropleth Maps

| ID | Title | Metric | Hook |
|----|-------|--------|------|
| FI-001 | Where Europeans Work Out | penetration_rate | Sweden leads at 21% |
| FI-002 | The €36 Billion Market | market_size_eur | Germany: €5.2B alone |
| FI-003 | Fitness Nation Rankings | members_millions | 71.6M total members |
| FI-004 | Fastest Growing Markets | growth_cagr | France: 9.6% CAGR |
| FI-005 | Gym Density Map | clubs_count | 9,111 gyms in Germany |
| FI-006 | Find Your Trainer | trainers_count | 88K trainers in Germany |

### Point Maps (OSM Data)

| ID | Title | Query Filter |
|----|-------|--------------|
| FI-101 | Every Gym in Belgium | country=BE |
| FI-102 | Basic-Fit Empire | brand=Basic-Fit |
| FI-103 | Jims Locations | brand=Jims |
| FI-104 | 24/7 Gyms | opening_hours=24/7 |

### Massimino Data (Future)

| ID | Title | Source |
|----|-------|--------|
| FI-201 | Certified Trainer Density | Massimino registrations |
| FI-202 | SafeSpace Certified Gyms | Massimino verification |
| FI-203 | Community Activity | Massimino engagement |

---

## Project Structure

```
massimino/
├── src/
│   ├── app/
│   │   ├── fitness-intelligence/
│   │   │   ├── page.tsx              # Main dashboard
│   │   │   ├── explorer/
│   │   │   │   └── page.tsx          # Interactive explorer
│   │   │   └── loading.tsx           # Loading state
│   │   └── api/
│   │       ├── fitness-data/
│   │       │   └── route.ts          # Fitness data API
│   │       ├── osm-gyms/
│   │       │   └── route.ts          # OSM proxy API
│   │       └── export-map/
│   │           └── route.ts          # Image export API
│   │
│   ├── components/
│   │   └── maps/
│   │       ├── fitness_map.tsx       # Main map component
│   │       ├── gym_markers.tsx       # OSM gym points
│   │       ├── map_legend.tsx        # Dynamic legend
│   │       ├── map_tooltip.tsx       # Hover popup
│   │       ├── map_export.tsx        # Export button
│   │       └── metric_selector.tsx   # Metric dropdown
│   │
│   ├── lib/
│   │   ├── map_config.ts             # Map settings
│   │   ├── osm_service.ts            # Overpass API client
│   │   ├── geojson_utils.ts          # GeoJSON helpers
│   │   └── data_transforms.ts        # Data processing
│   │
│   ├── data/
│   │   ├── geojson/
│   │   │   └── europe_countries.json # Country boundaries
│   │   └── fitness/
│   │       └── europe_2024.ts        # Market statistics
│   │
│   └── types/
│       └── fitness_data.ts           # TypeScript types
│
├── public/
│   └── images/
│       └── massimino-logo.png        # Brand assets
│
└── .env.local                        # Environment variables
```

---

## Implementation Guide

### Dependencies

```bash
# Core mapping
npm install maplibre-gl react-map-gl

# GeoJSON utilities
npm install @turf/turf

# Image export
npm install html-to-image sharp
```

### Environment Variables

```env
# .env.local

# MapTiler (optional, for styled tiles)
NEXT_PUBLIC_MAPTILER_KEY=your_key_here

# Map style URL
NEXT_PUBLIC_MAP_STYLE=https://demotiles.maplibre.org/style.json

# Overpass API (default public, or self-hosted)
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
```

### Implementation Phases

| Phase | Duration | Tasks |
|-------|----------|-------|
| 1. Foundation | Week 1 | MapLibre setup, GeoJSON boundaries, basic choropleth |
| 2. Data Layer | Week 2 | Fitness data, metric selector, legend, tooltips |
| 3. OSM Integration | Week 3 | Overpass queries, gym markers, clustering |
| 4. Export | Week 4 | Screenshot generation, social media formats, branding |
| 5. Polish | Week 5 | Performance, mobile, error handling, docs |

---

## Resources

### MapLibre

| Resource | URL |
|----------|-----|
| GitHub | https://github.com/maplibre/maplibre-gl-js |
| Documentation | https://maplibre.org/maplibre-gl-js/docs/ |
| Examples | https://maplibre.org/maplibre-gl-js/docs/examples/ |
| Style Spec | https://maplibre.org/maplibre-style-spec/ |
| React Map GL | https://visgl.github.io/react-map-gl/ |

### OpenStreetMap

| Resource | URL |
|----------|-----|
| GitHub | https://github.com/openstreetmap |
| Topics | https://github.com/topics/openstreetmap |
| Overpass Turbo | https://overpass-turbo.eu/ |
| Overpass Wiki | https://wiki.openstreetmap.org/wiki/Overpass_API |
| TagInfo | https://taginfo.openstreetmap.org/ |
| Nominatim | https://nominatim.openstreetmap.org/ |

### Data Sources

| Source | URL |
|--------|-----|
| Natural Earth (GeoJSON) | https://www.naturalearthdata.com/ |
| EuropeActive | https://www.europeactive.eu/ |
| Eurostat | https://ec.europa.eu/eurostat |

---

## License

- MapLibre GL JS: BSD-3-Clause
- OpenStreetMap data: ODbL (© OpenStreetMap contributors)
- Massimino Fitness Intelligence: Proprietary

---

## EU Legal Framework for Fitness, Sports, Health Supplements & Influencer Marketing

*Analysis based on EU legislation archive (LEG_2025-11)*

This section provides a comprehensive overview of EU laws relevant to the fitness industry, including sports, health/fitness supplements, and influencer marketing regulations.

---

### 1. Sports & Physical Activity

| Law | Type | Summary |
|-----|------|---------|
| **Treaty on the Functioning of the EU (TFEU), Article 165** | Treaty | Establishes EU competence in sports; promotes fairness, openness, and protection of physical/moral integrity of sportspersons. |
| **Council Recommendation on promoting health-enhancing physical activity** | Recommendation | Encourages Member States to develop national policies promoting physical activity across sectors. |
| **Regulation (EU) 2021/817 - Erasmus+ Programme** | Regulation | Includes sport as a key action area; funds grassroots sports projects, exchanges, and capacity building in sport organisations. |

---

### 2. Health & Fitness Supplements

| Law | Type | Summary |
|-----|------|---------|
| **Regulation (EC) No 1924/2006** | Regulation | Core law on nutrition and health claims on foods. All health claims on supplements must be scientifically substantiated and pre-authorised. Prohibits disease prevention/treatment claims unless specifically approved. |
| **Regulation (EU) No 1169/2011** | Regulation | Food Information to Consumers (FIC). Mandatory labelling requirements including ingredients, allergens, nutritional information, and origin for all food products including supplements. |
| **Directive 2002/46/EC** | Directive | Harmonises rules on food supplements (vitamins, minerals). Establishes positive lists of permitted substances and purity criteria. |
| **Regulation (EC) No 258/97 & Regulation (EU) 2015/2283** | Regulation | Novel Foods Regulation. New ingredients in supplements (e.g., new protein sources, botanical extracts) require pre-market authorisation. |
| **Directive 2009/54/EC** | Directive | Natural Mineral Waters. Regulates labelling and marketing of mineral waters, relevant for sports hydration products. |
| **Directive 2012/12/EU** | Directive | Fruit Juices Directive. Composition and labelling rules; prohibits added sugars in products marketed as fruit juice. |
| **Regulation (EU) No 432/2012** | Regulation | Establishes list of permitted health claims that can be made on foods (e.g., "contributes to normal muscle function" for magnesium). |
| **Regulation (EU) 2017/745** | Regulation | Medical Devices Regulation (MDR). Fitness devices making health claims may fall under this; stricter requirements for devices measuring health parameters. |

---

### 3. Influencer Marketing & Commercial Communications

| Law | Type | Summary |
|-----|------|---------|
| **Directive 2005/29/EC** | Directive | Unfair Commercial Practices Directive (UCPD). Core consumer protection law; prohibits misleading actions/omissions. Influencers must clearly disclose commercial relationships. Hidden advertising is a prohibited practice. |
| **Directive 2010/13/EU (as amended by Directive 2018/1808)** | Directive | Audiovisual Media Services Directive (AVMSD). Covers advertising on TV, streaming, and video-sharing platforms. Requires clear identification of commercial content; protects minors from harmful advertising. |
| **Regulation (EU) 2022/2065** | Regulation | Digital Services Act (DSA). Major new law for online platforms. Requires transparency in advertising, prohibition of certain targeted ads to minors, and traceability of traders. Platforms must label all advertising as such. |
| **Directive 2011/83/EU** | Directive | Consumer Rights Directive. Pre-contractual information requirements for online sales; applies to products sold via influencer links. |
| **Regulation (EU) 2024/900** | Regulation | Political Advertising Transparency. Requires clear labelling and sponsor identification for political ads online; includes influencer-style political content. |
| **Regulation (EU) 2016/679** | Regulation | General Data Protection Regulation (GDPR). Regulates use of personal data in targeted advertising; requires consent for behavioural advertising. |

---

### 4. Consumer Protection & Product Safety

| Law | Type | Summary |
|-----|------|---------|
| **Regulation (EU) 2023/988** | Regulation | General Product Safety Regulation (GPSR). Replaces General Product Safety Directive. All consumer products (including fitness equipment) must be safe. Includes online marketplace obligations. |
| **Directive 2001/95/EC** (replaced by GPSR) | Directive | General Product Safety Directive. Historical framework ensuring consumer products on EU market are safe. |
| **Regulation (EC) No 765/2008** | Regulation | Market surveillance and CE marking requirements. Fitness equipment must comply with relevant EU standards. |

---

### 5. Anti-Doping (Sport-specific)

| Law | Type | Summary |
|-----|------|---------|
| **Council of Europe Anti-Doping Convention (1989)** | International Convention | EU Member States are signatories. Requires domestic anti-doping legislation and cooperation. |
| **World Anti-Doping Code (WADA)** | International Standard | Not EU law but implemented across EU via national federations and Council of Europe conventions. |
| **Regulation (EU) 2019/1148** | Regulation | Precursors of explosives. Restricts access to certain chemicals that could be misused; some overlap with substances used in illicit supplement manufacturing. |

---

### Key Compliance Points for Fitness Industry

#### For Supplement Manufacturers:
1. All health claims must be from the authorised list (Reg. 432/2012)
2. Novel ingredients require pre-market approval
3. Labelling must comply with FIC Regulation (allergens, nutrition facts)
4. No disease prevention/treatment claims without authorisation

#### For Fitness Influencers:
1. Must clearly disclose sponsored content (#ad, #sponsored)
2. Cannot make unsubstantiated health claims about products
3. Subject to UCPD - misleading omissions are prohibited
4. Platforms (under DSA) must ensure ad transparency

#### For Fitness Equipment Sellers:
1. Products must comply with GPSR safety requirements
2. CE marking required where applicable
3. Online marketplaces have new obligations under DSA
4. Product recalls must be reported to RAPEX/Safety Gate

#### For Gym/Fitness Service Providers:
1. Consumer Rights Directive applies to membership contracts
2. Must provide clear pre-contractual information
3. GDPR applies to member data processing
4. Service advertising must not be misleading (UCPD)

---

### Enforcement & Penalties

- **UCPD violations**: Fines up to 4% of annual turnover in some Member States
- **DSA violations**: Up to 6% of global annual turnover for platform non-compliance
- **GDPR violations**: Up to €20M or 4% of global turnover
- **Health claims violations**: Product withdrawal, fines varying by Member State
- **Product safety violations**: Market withdrawal, recalls, criminal liability possible

---

### Sources

| Source | Reference |
|--------|-----------|
| EUR-Lex | https://eur-lex.europa.eu/ |
| EU Publications Office | https://op.europa.eu/ |
| LEG Archive 2025-11 | Local analysis of EU legislative corpus |
| European Commission DG SANTE | Food safety and health claims guidance |
| European Consumer Centre Network | Consumer rights enforcement |

---

