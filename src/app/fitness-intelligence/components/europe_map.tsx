'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { CountryFitnessData } from '@/types/fitness_data';

export type MetricType = 'penetration' | 'market' | 'members' | 'growth';

interface EuropeMapProps {
  data: CountryFitnessData[];
  onCountrySelect?: (country: CountryFitnessData) => void;
  /** Called when the metric selector changes, so the page can retitle the map */
  onMetricChange?: (metric: MetricType) => void;
  /** Classes for the map canvas (height); defaults to the original fixed height */
  containerClassName?: string;
}

// Country centroids for markers
const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  // Nordic [lng, lat]
  SE: [18.6435, 62.1983], // Sweden
  NO: [8.4689, 60.4720],  // Norway
  DK: [9.5018, 56.2639],  // Denmark
  FI: [25.7482, 61.9241], // Finland
  IS: [-19.0208, 64.9631], // Iceland
  // British Isles
  GB: [-3.4360, 55.3781], // UK
  IE: [-8.2439, 53.4129], // Ireland
  // Western Europe
  DE: [10.4515, 51.1657], // Germany
  FR: [2.2137, 46.2276],  // France
  NL: [5.2913, 52.1326],  // Netherlands
  BE: [4.4699, 50.5039],  // Belgium
  LU: [6.1296, 49.8153],  // Luxembourg
  // Central Europe
  CH: [8.2275, 46.8182],  // Switzerland
  AT: [14.5501, 47.5162], // Austria
  PL: [19.1451, 51.9194], // Poland
  CZ: [15.4729, 49.8175], // Czech Republic
  SK: [19.6990, 48.6690], // Slovakia
  HU: [19.5033, 47.1625], // Hungary
  // Southern Europe
  ES: [-3.7038, 40.4168], // Spain
  PT: [-8.2245, 39.3999], // Portugal
  IT: [12.5674, 41.8719], // Italy
  GR: [21.8243, 39.0742], // Greece
  MT: [14.3754, 35.9375], // Malta
  CY: [33.4299, 35.1264], // Cyprus
  // Balkans
  SI: [14.9955, 46.1512], // Slovenia
  HR: [15.2000, 45.1000], // Croatia
  RS: [21.0059, 44.0165], // Serbia
  BA: [17.6791, 43.9159], // Bosnia
  ME: [19.3744, 42.7087], // Montenegro
  AL: [20.1683, 41.1533], // Albania
  MK: [21.7453, 41.5124], // North Macedonia
  XK: [20.9020, 42.6026], // Kosovo
  BG: [25.4858, 42.7339], // Bulgaria
  RO: [24.9668, 45.9432], // Romania
  // Baltic
  EE: [25.0136, 58.5953], // Estonia
  LV: [24.6032, 56.8796], // Latvia
  LT: [23.8813, 55.1694], // Lithuania
  // Eastern Europe
  UA: [31.1656, 48.3794], // Ukraine
  MD: [28.3699, 47.4116], // Moldova
  BY: [27.9534, 53.7098], // Belarus
  TR: [35.2433, 38.9637], // Turkey
};

// Metric configurations
const METRIC_CONFIG: Record<MetricType, {
  label: string;
  getValue: (d: CountryFitnessData) => number;
  getColor: (value: number) => string;
  format: (value: number) => string;
  legendMin: string;
  legendMid: string;
  legendMax: string;
  colorScale: string[];
}> = {
  penetration: {
    label: 'Gym Penetration Rate',
    getValue: (d) => d.penetration_rate,
    getColor: (rate) => {
      if (rate >= 20) return '#1e3d52'; // petrol-800
      if (rate >= 17) return '#24475d'; // petrol-700
      if (rate >= 14) return '#2b5069'; // petrol-600
      if (rate >= 11) return '#3d6a85'; // petrol-500
      if (rate >= 8) return '#6489a3';  // petrol-400
      if (rate >= 5) return '#94b2c6';  // petrol-300
      return '#e0e9ef'; // petrol-100
    },
    format: (v) => `${v}%`,
    legendMin: '<5%',
    legendMid: '8.9% avg',
    legendMax: '22%+',
    colorScale: ['bg-blue-100', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'bg-blue-800'],
  },
  market: {
    label: 'Market Size (EUR)',
    getValue: (d) => d.market_size_eur,
    getColor: (size) => {
      if (size >= 5000000000) return '#065f46'; // emerald-800
      if (size >= 2000000000) return '#047857'; // emerald-700
      if (size >= 1000000000) return '#059669'; // emerald-600
      if (size >= 500000000) return '#10b981';  // emerald-500
      if (size >= 200000000) return '#34d399';  // emerald-400
      if (size >= 100000000) return '#6ee7b7';  // emerald-300
      return '#d1fae5'; // emerald-100
    },
    format: (v) => v >= 1000000000 ? `€${(v / 1000000000).toFixed(1)}B` : `€${(v / 1000000).toFixed(0)}M`,
    legendMin: '<€100M',
    legendMid: '€1B',
    legendMax: '€5B+',
    colorScale: ['bg-emerald-100', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600', 'bg-emerald-700', 'bg-emerald-800'],
  },
  members: {
    label: 'Total Members',
    getValue: (d) => d.members_millions,
    getColor: (members) => {
      if (members >= 10) return '#7c2d12';  // orange-800
      if (members >= 7) return '#9a3412';   // orange-700
      if (members >= 5) return '#c2410c';   // orange-600
      if (members >= 3) return '#ea580c';   // orange-500
      if (members >= 1.5) return '#f97316'; // orange-400
      if (members >= 0.5) return '#fdba74'; // orange-300
      return '#ffedd5'; // orange-100
    },
    format: (v) => `${v.toFixed(1)}M`,
    legendMin: '<0.5M',
    legendMid: '3M',
    legendMax: '10M+',
    colorScale: ['bg-orange-100', 'bg-orange-300', 'bg-orange-400', 'bg-orange-500', 'bg-orange-600', 'bg-orange-700', 'bg-orange-800'],
  },
  growth: {
    label: 'Growth Rate (CAGR)',
    getValue: (d) => d.growth_cagr,
    getColor: (cagr) => {
      if (cagr >= 10) return '#581c87'; // purple-800
      if (cagr >= 9) return '#6b21a8';  // purple-700
      if (cagr >= 8) return '#7c3aed';  // purple-600
      if (cagr >= 7) return '#8b5cf6';  // purple-500
      if (cagr >= 6) return '#a78bfa';  // purple-400
      if (cagr >= 5) return '#c4b5fd';  // purple-300
      return '#ede9fe'; // purple-100
    },
    format: (v) => `${v}%`,
    legendMin: '<5%',
    legendMid: '7%',
    legendMax: '10%+',
    colorScale: ['bg-purple-100', 'bg-purple-300', 'bg-purple-400', 'bg-purple-500', 'bg-purple-600', 'bg-purple-700', 'bg-purple-800'],
  },
};

// Whole of Europe, from Iceland and Portugal to the Urals foothills and Cyprus
const EUROPE_BOUNDS: [[number, number], [number, number]] = [[-25, 34], [42, 71]];

export function EuropeMap({ data, onCountrySelect, onMetricChange, containerClassName }: EuropeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const markerElementsRef = useRef<Map<string, { content: HTMLDivElement; data: CountryFitnessData }>>(new Map());
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const metricRef = useRef<MetricType>('penetration'); // Ref to track current metric for event handlers
  const onSelectRef = useRef(onCountrySelect);
  onSelectRef.current = onCountrySelect;
  const [isLoaded, setIsLoaded] = useState(false);
  const [metric, setMetric] = useState<MetricType>('penetration');

  // Keep ref in sync with state
  metricRef.current = metric;

  // Memoize dataMap to prevent unnecessary re-renders
  const dataMap = useMemo(() => new Map(data.map(d => [d.iso_code, d])), [data]);
  const config = METRIC_CONFIG[metric];

  // Function to create markers with a specific metric's colors
  const createMarkers = useCallback((metricType: MetricType) => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    markerElementsRef.current.clear();

    const currentConfig = METRIC_CONFIG[metricType];

    Object.entries(COUNTRY_CENTROIDS).forEach(([isoCode, coords]) => {
      const countryData = dataMap.get(isoCode);
      if (!countryData || !map.current) return;

      const value = currentConfig.getValue(countryData);
      const color = currentConfig.getColor(value);

      // Create wrapper element for MapLibre
      const wrapper = document.createElement('div');
      wrapper.className = 'country-marker-wrapper';
      wrapper.style.cssText = `width: 32px; height: 32px; cursor: pointer;`;

      // Create inner content element
      const content = document.createElement('div');
      content.className = 'country-marker-content';
      content.dataset.isoCode = isoCode;
      content.style.cssText = `
        width: 100%;
        height: 100%;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 600;
        color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        transform-origin: center center;
      `;
      content.textContent = isoCode;
      wrapper.appendChild(content);

      // Store reference
      markerElementsRef.current.set(isoCode, { content, data: countryData });

      // Hover effects
      wrapper.addEventListener('mouseenter', () => {
        content.style.transform = 'scale(1.2)';
        content.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        if (popupRef.current && map.current) {
          popupRef.current
            .setLngLat(coords)
            .setHTML(createPopupContent(countryData, metricRef.current))
            .addTo(map.current);
        }
      });

      wrapper.addEventListener('mouseleave', () => {
        content.style.transform = 'scale(1)';
        content.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        if (popupRef.current) {
          popupRef.current.remove();
        }
      });

      // Click opens the country detail panel
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectRef.current?.(countryData);
      });

      // Create and add marker
      const marker = new maplibregl.Marker({ element: wrapper, anchor: 'center' })
        .setLngLat(coords)
        .addTo(map.current);

      markersRef.current.push(marker);
    });
  }, [dataMap]);

  const createPopupContent = useCallback((country: CountryFitnessData, activeMetric: MetricType) => {
    const highlightClass = (m: MetricType) => m === activeMetric ? 'font-semibold text-blue-600' : '';
    return `
      <div class="p-2 min-w-[180px]">
        <h4 class="font-bold text-gray-900 text-sm mb-1">${country.name}</h4>
        <div class="text-xs text-gray-600 ${highlightClass('penetration')}">
          Penetration: ${country.penetration_rate}%
        </div>
        <div class="text-xs text-gray-600 ${highlightClass('members')}">
          Members: ${country.members_millions.toFixed(2)}M
        </div>
        <div class="text-xs text-gray-600 ${highlightClass('market')}">
          Market: €${(country.market_size_eur / 1000000).toFixed(0)}M
        </div>
        <div class="text-xs text-gray-600 ${highlightClass('growth')}">
          CAGR: ${country.growth_cagr}%
        </div>
        <div class="text-xs text-gray-500 mt-1">
          ${country.top_chains.slice(0, 2).join(', ')}
        </div>
      </div>
    `;
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      // Fit the whole of Europe on load, whatever the canvas size
      bounds: EUROPE_BOUNDS,
      fitBoundsOptions: { padding: 16 },
      minZoom: 1,
      // On touch screens one finger scrolls the page and two fingers move the map
      cooperativeGestures: typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
      maxZoom: 8,
      // Pan limit around Europe; wide enough that the whole-Europe fit is never forced to zoom in
      maxBounds: [[-60, 20], [85, 80]]
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Create popup
    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15
    });

    map.current.on('load', () => {
      setIsLoaded(true);
      // Refit once the canvas has its final size so the whole of Europe shows
      map.current?.resize();
      const narrow = (mapContainer.current?.clientWidth ?? 1024) < 640;
      // Leave room for the metric selector (top) and the legend (bottom)
      map.current?.fitBounds(EUROPE_BOUNDS, {
        padding: narrow ? { top: 60, bottom: 96, left: 8, right: 8 } : { top: 64, bottom: 24, left: 24, right: 24 },
        duration: 0,
      });
      // Create initial markers with default metric
      createMarkers('penetration');
    });

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      markerElementsRef.current.clear();
      if (popupRef.current) {
        popupRef.current.remove();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="relative">
      {/* Metric Selector */}
      <div className="absolute top-4 left-4 z-20">
        <select
          value={metric}
          onChange={(e) => {
            const newMetric = e.target.value as MetricType;
            setMetric(newMetric);
            // Recreate all markers with the new metric's colors
            createMarkers(newMetric);
            onMetricChange?.(newMetric);
          }}
          aria-label="Map metric"
          className="max-w-[calc(100vw-7rem)] rounded-field border border-brand-primary/15 bg-brand-secondary px-4 py-2 text-sm font-medium text-brand-primary shadow-soft focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          <option value="penetration">Gym Penetration Rate</option>
          <option value="market">Market Size (EUR)</option>
          <option value="members">Total Members</option>
          <option value="growth">Growth Rate (CAGR)</option>
        </select>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainer}
        className={containerClassName ?? 'w-full h-[500px] md:h-[600px]'}
        style={containerClassName ? undefined : { minHeight: '500px' }}
      />

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-500">Loading map...</div>
        </div>
      )}

      {/* Legend - Dynamic based on selected metric */}
      <div className="absolute bottom-4 left-4 z-10 min-w-[168px] rounded-field bg-brand-secondary/95 p-2.5 shadow-soft sm:min-w-[240px] sm:p-4">
        <h4 className="mb-2 text-xs font-semibold text-brand-primary sm:mb-3 sm:text-sm">{config.label}</h4>
        <div className="flex gap-1 mb-2">
          {config.colorScale.map((colorClass, idx) => (
            <div
              key={idx}
              className={`flex-1 h-3 sm:h-4 ${colorClass} ${idx === 0 ? 'rounded-l' : ''} ${idx === config.colorScale.length - 1 ? 'rounded-r' : ''}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>{config.legendMin}</span>
          <span>{config.legendMid}</span>
          <span>{config.legendMax}</span>
        </div>
      </div>
    </div>
  );
}
