'use client';

// Sport Europe atlas: a small GIS in the browser.
// Thematic choropleth on country polygons (Natural Earth, self-hosted), a layer catalogue
// grouped by theme, three classification methods, a bivariate "compare two layers" mode,
// proportional symbols for counts, identify-on-click, a linked attribute table, and
// CSV / GeoJSON export of the joined attribute table.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection, Geometry } from 'geojson';
import {
  ATLAS_LAYERS,
  ATLAS_RECORDS,
  ATLAS_THEMES,
  LAYER_BY_ID,
  THEME_BY_ID,
  type AtlasLayer,
  type AtlasRecord,
} from '@/data/fitness/atlas_layers';
import { COUNTRY_CENTROIDS } from './country_centroids';
import { DataTable, type DataColumn } from './data_table';
import {
  BIVARIATE_PALETTE,
  CLASS_METHODS,
  classOf,
  classify,
  rampFor,
  tertileBreaks,
  tertileOf,
  type ClassMethod,
} from './atlas_classify';

type Mode = 'single' | 'bivariate';
type Basemap = 'plain' | 'osm';

const NO_DATA = '#e9e4da';
const SEA = '#dde7ed';
const EUROPE_BOUNDS: [[number, number], [number, number]] = [[-25, 34], [45, 71]];
const RATE_LAYERS = ATLAS_LAYERS.filter((l) => l.kind === 'rate');
const COUNT_LAYERS = ATLAS_LAYERS.filter((l) => l.kind === 'count');
const RECORD_BY_ISO = new Map(ATLAS_RECORDS.map((r) => [r.iso_code, r]));

export function formatLayerValue(layer: AtlasLayer, v: number): string {
  const x = v.toLocaleString('en-GB', { minimumFractionDigits: layer.decimals, maximumFractionDigits: layer.decimals });
  switch (layer.unit) {
    case '%':
      return `${x}%`;
    case 'pts':
      return `${v > 0 ? '+' : ''}${x} pts`;
    case 'M':
      return `${x}M`;
    case 'k':
      return `${x}k`;
    case '€M':
      return v >= 1000 ? `€${(v / 1000).toFixed(1)}B` : `€${Math.round(v)}M`;
    default:
      return x;
  }
}

function valueOf(r: AtlasRecord | undefined, id: string): number | undefined {
  const v = r?.values[id];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function download(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(v: string | number | boolean | undefined): string {
  if (v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/* ---------- Small UI pieces ---------- */

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-flow-col gap-1 rounded-field bg-brand-secondary p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
            value === o.id ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-600 hover:text-brand-primary'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </label>
  );
}

const selectClass =
  'w-full rounded-field border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30';

function LayerOptions({ layers }: { layers: AtlasLayer[] }) {
  return (
    <>
      {ATLAS_THEMES.map((t) => {
        const ls = layers.filter((l) => l.theme === t.id);
        if (!ls.length) return null;
        return (
          <optgroup key={t.id} label={t.label}>
            {ls.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </optgroup>
        );
      })}
    </>
  );
}

/* ---------- Main component ---------- */

export function SportAtlas() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const geo = useRef<FeatureCollection<Geometry, { iso: string; name: string }> | null>(null);
  const hoverIso = useRef<string | null>(null);
  const selectedIso = useRef<string | null>(null);
  const tooltipFor = useRef<(iso: string) => string | null>(() => null);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<Mode>('single');
  const [layerId, setLayerId] = useState('regular_sport');
  const [method, setMethod] = useState<ClassMethod>('jenks');
  const [bivX, setBivX] = useState('penetration');
  const [bivY, setBivY] = useState('regular_sport');
  const [symbolId, setSymbolId] = useState<string>('none');
  const [basemap, setBasemap] = useState<Basemap>('plain');
  const [opacity, setOpacity] = useState(0.9);
  const [selected, setSelected] = useState<string | null>(null);
  const [tableHover, setTableHover] = useState<string | null>(null);

  const layer = LAYER_BY_ID.get(layerId)!;
  const theme = THEME_BY_ID.get(layer.theme)!;
  const xLayer = LAYER_BY_ID.get(bivX)!;
  const yLayer = LAYER_BY_ID.get(bivY)!;
  const symbolLayer = symbolId === 'none' ? null : LAYER_BY_ID.get(symbolId)!;

  /* Classification for single-layer mode */
  const single = useMemo(() => {
    const rows = ATLAS_RECORDS.filter((r) => valueOf(r, layer.id) !== undefined);
    const values = rows.map((r) => valueOf(r, layer.id)!);
    const breaks = classify(values, method, 5);
    const colours = rampFor(theme.ramp, breaks.length);
    const min = Math.min(...values);
    const colourByIso = new Map<string, string>();
    const counts = new Array(breaks.length).fill(0);
    for (const r of rows) {
      const c = classOf(valueOf(r, layer.id)!, breaks);
      counts[c]++;
      colourByIso.set(r.iso_code, colours[c]);
    }
    const sorted = [...values].sort((a, b) => b - a);
    const rankOf = (v: number) => sorted.indexOf(v) + 1;
    return { rows, breaks, colours, counts, min, colourByIso, rankOf, n: rows.length };
  }, [layer, method, theme]);

  /* Classification for bivariate mode (tertiles on both axes) */
  const bivariate = useMemo(() => {
    const rows = ATLAS_RECORDS.filter((r) => valueOf(r, xLayer.id) !== undefined && valueOf(r, yLayer.id) !== undefined);
    const xb = tertileBreaks(rows.map((r) => valueOf(r, xLayer.id)!));
    const yb = tertileBreaks(rows.map((r) => valueOf(r, yLayer.id)!));
    const colourByIso = new Map<string, string>();
    const cellByIso = new Map<string, { x: number; y: number }>();
    for (const r of rows) {
      const x = tertileOf(valueOf(r, xLayer.id)!, xb);
      const y = tertileOf(valueOf(r, yLayer.id)!, yb);
      colourByIso.set(r.iso_code, BIVARIATE_PALETTE[y * 3 + x]);
      cellByIso.set(r.iso_code, { x, y });
    }
    // Pearson correlation, so the legend can say how strongly the two layers move together
    const xs = rows.map((r) => valueOf(r, xLayer.id)!);
    const ys = rows.map((r) => valueOf(r, yLayer.id)!);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const my = ys.reduce((a, b) => a + b, 0) / ys.length;
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    xs.forEach((x, i) => {
      sxy += (x - mx) * (ys[i] - my);
      sxx += (x - mx) ** 2;
      syy += (ys[i] - my) ** 2;
    });
    const r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
    return { rows, xb, yb, colourByIso, cellByIso, r, n: rows.length };
  }, [xLayer, yLayer]);

  const colourByIso = mode === 'single' ? single.colourByIso : bivariate.colourByIso;

  /* Proportional symbols */
  const symbols = useMemo(() => {
    if (!symbolLayer) return null;
    const pts = ATLAS_RECORDS.flatMap((r) => {
      const v = valueOf(r, symbolLayer.id);
      const c = COUNTRY_CENTROIDS[r.iso_code];
      return v !== undefined && v > 0 && c ? [{ iso: r.iso_code, name: r.name, v, c }] : [];
    });
    const max = Math.max(...pts.map((p) => p.v));
    const radius = (v: number) => 3 + 25 * Math.sqrt(v / max);
    const fc: FeatureCollection = {
      type: 'FeatureCollection',
      features: pts.map((p) => ({
        type: 'Feature',
        properties: { iso: p.iso, r: radius(p.v) },
        geometry: { type: 'Point', coordinates: p.c },
      })),
    };
    return { fc, max, radius };
  }, [symbolLayer]);

  /* Tooltip text, read through a ref so map handlers always see current state */
  tooltipFor.current = (iso: string) => {
    const r = RECORD_BY_ISO.get(iso);
    const name = r?.name ?? geo.current?.features.find((f) => f.properties.iso === iso)?.properties.name;
    if (!name) return null;
    const line = (l: AtlasLayer) => {
      const v = valueOf(r, l.id);
      return `<div class="text-xs text-gray-600">${l.label}: <span class="font-semibold text-gray-900">${
        v === undefined ? 'no data' : formatLayerValue(l, v)
      }</span></div>`;
    };
    const lines = mode === 'single' ? [line(layer)] : [line(xLayer), line(yLayer)];
    if (symbolLayer) lines.push(line(symbolLayer));
    return `<div class="p-1 min-w-[160px]"><div class="font-semibold text-gray-900 text-sm mb-0.5">${name}</div>${lines.join('')}</div>`;
  };

  const setHover = useCallback((iso: string | null) => {
    const m = map.current;
    if (!m || !m.getSource('countries')) return;
    if (hoverIso.current) m.setFeatureState({ source: 'countries', id: hoverIso.current }, { hover: false });
    hoverIso.current = iso;
    if (iso) m.setFeatureState({ source: 'countries', id: iso }, { hover: true });
  }, []);

  /* Initialise the map once */
  useEffect(() => {
    if (!container.current || map.current) return;
    let cancelled = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const m = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          { id: 'sea', type: 'background', paint: { 'background-color': SEA } },
          { id: 'osm', type: 'raster', source: 'osm', layout: { visibility: 'none' } },
        ],
      },
      bounds: EUROPE_BOUNDS,
      fitBoundsOptions: { padding: 12 },
      minZoom: 2,
      maxZoom: 7,
      maxBounds: [[-60, 20], [85, 80]],
      cooperativeGestures: window.matchMedia('(pointer: coarse)').matches,
      attributionControl: { compact: true },
      fadeDuration: reduceMotion ? 0 : 300,
    });
    map.current = m;
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    m.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');
    popup.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });

    m.on('load', async () => {
      try {
        const res = await fetch('/geo/europe_countries.geojson');
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as FeatureCollection<Geometry, { iso: string; name: string }>;
        if (cancelled) return;
        geo.current = data;
        m.addSource('countries', { type: 'geojson', data, promoteId: 'iso' });
        m.addSource('symbols', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        m.addLayer({
          id: 'countries-fill',
          type: 'fill',
          source: 'countries',
          paint: { 'fill-color': NO_DATA, 'fill-opacity': 0.9 },
        });
        m.addLayer({
          id: 'countries-line',
          type: 'line',
          source: 'countries',
          paint: { 'line-color': '#ffffff', 'line-width': 0.7 },
        });
        m.addLayer({
          id: 'countries-focus',
          type: 'line',
          source: 'countries',
          paint: {
            'line-color': '#16303f',
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false], 2.5,
              ['boolean', ['feature-state', 'hover'], false], 1.8,
              0,
            ],
          },
        });
        m.addLayer({
          id: 'symbols',
          type: 'circle',
          source: 'symbols',
          paint: {
            'circle-radius': ['get', 'r'],
            'circle-color': '#ffffff',
            'circle-opacity': 0.55,
            'circle-stroke-color': '#16303f',
            'circle-stroke-width': 1.2,
          },
        });

        m.on('mousemove', 'countries-fill', (e) => {
          const iso = e.features?.[0]?.properties?.iso as string | undefined;
          if (!iso) return;
          m.getCanvas().style.cursor = 'pointer';
          setHover(iso);
          const html = tooltipFor.current(iso);
          if (html) popup.current?.setLngLat(e.lngLat).setHTML(html).addTo(m);
        });
        m.on('mouseleave', 'countries-fill', () => {
          m.getCanvas().style.cursor = '';
          setHover(null);
          popup.current?.remove();
        });
        m.on('click', 'countries-fill', (e) => {
          const iso = e.features?.[0]?.properties?.iso as string | undefined;
          if (iso && RECORD_BY_ISO.has(iso)) setSelected(iso);
        });

        const narrow = (container.current?.clientWidth ?? 1024) < 640;
        m.resize();
        m.fitBounds(EUROPE_BOUNDS, { padding: narrow ? { top: 12, bottom: 120, left: 8, right: 8 } : 24, duration: 0 });
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    });

    return () => {
      cancelled = true;
      popup.current?.remove();
      m.remove();
      map.current = null;
    };
  }, [setHover]);

  /* Paint the choropleth whenever the classification changes */
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    const pairs: string[] = [];
    colourByIso.forEach((c, iso) => pairs.push(iso, c));
    m.setPaintProperty(
      'countries-fill',
      'fill-color',
      pairs.length ? (['match', ['get', 'iso'], ...pairs, NO_DATA] as unknown as maplibregl.ExpressionSpecification) : NO_DATA,
    );
    m.setPaintProperty('countries-fill', 'fill-opacity', opacity);
  }, [ready, colourByIso, opacity]);

  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    m.setLayoutProperty('osm', 'visibility', basemap === 'osm' ? 'visible' : 'none');
  }, [ready, basemap]);

  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    const src = m.getSource('symbols') as maplibregl.GeoJSONSource | undefined;
    src?.setData(symbols?.fc ?? { type: 'FeatureCollection', features: [] });
  }, [ready, symbols]);

  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    if (selectedIso.current) m.setFeatureState({ source: 'countries', id: selectedIso.current }, { selected: false });
    selectedIso.current = selected;
    if (selected) m.setFeatureState({ source: 'countries', id: selected }, { selected: true });
  }, [ready, selected]);

  useEffect(() => {
    if (ready) setHover(tableHover);
  }, [ready, tableHover, setHover]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelected(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const focusCountry = (iso: string) => {
    setSelected(iso);
    const c = COUNTRY_CENTROIDS[iso];
    const m = map.current;
    if (c && m) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      m.easeTo({ center: c, zoom: Math.max(m.getZoom(), 3.6), duration: reduce ? 0 : 600 });
    }
  };

  /* Exports */
  const exportCsv = () => {
    const header = ['iso_code', 'name', 'eu', ...ATLAS_LAYERS.map((l) => `${l.id}${l.unit ? ` (${l.unit})` : ''}`)];
    const lines = ATLAS_RECORDS.map((r) => [r.iso_code, r.name, r.eu, ...ATLAS_LAYERS.map((l) => valueOf(r, l.id))].map(csvCell).join(','));
    download('massimino_sport_europe_atlas.csv', [header.join(','), ...lines].join('\n'), 'text/csv;charset=utf-8');
  };
  const exportGeoJson = () => {
    if (!geo.current) return;
    const fc = {
      type: 'FeatureCollection',
      metadata: {
        title: 'Massimino Sport Europe atlas',
        sources: [...new Set(ATLAS_LAYERS.map((l) => `${l.source.name} (${l.source.year})`))],
        boundaries: 'Natural Earth 1:50m, public domain, clipped and simplified',
      },
      features: geo.current.features
        .filter((f) => RECORD_BY_ISO.has(f.properties.iso))
        .map((f) => {
          const r = RECORD_BY_ISO.get(f.properties.iso)!;
          return { ...f, properties: { iso_code: r.iso_code, name: r.name, eu: r.eu, ...r.values } };
        }),
    };
    download('massimino_sport_europe_atlas.geojson', JSON.stringify(fc), 'application/geo+json');
  };

  /* Linked attribute table */
  const tableRows = mode === 'single' ? single.rows : bivariate.rows;
  const columns: DataColumn<AtlasRecord>[] =
    mode === 'single'
      ? [
          {
            key: 'rank',
            header: '#',
            render: (r) => <span className="font-semibold text-gray-500 tabular-nums">{single.rankOf(valueOf(r, layer.id)!)}</span>,
          },
          {
            key: 'name',
            header: 'Country',
            sortable: true,
            sortValue: (r) => r.name,
            render: (r) => (
              <span className="flex items-center gap-2 font-medium text-gray-900">
                <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm border border-black/10" style={{ background: single.colourByIso.get(r.iso_code) }} />
                {r.name}
              </span>
            ),
          },
          {
            key: 'value',
            header: layer.label,
            align: 'right',
            sortable: true,
            sortValue: (r) => valueOf(r, layer.id)!,
            render: (r) => <span className="font-semibold tabular-nums" style={{ color: theme.accent }}>{formatLayerValue(layer, valueOf(r, layer.id)!)}</span>,
          },
          ...(layer.reference
            ? [
                {
                  key: 'vs',
                  header: `vs ${layer.reference.label}`,
                  align: 'right' as const,
                  hideOnMobile: true,
                  sortable: true,
                  sortValue: (r: AtlasRecord) => valueOf(r, layer.id)! - layer.reference!.value,
                  render: (r: AtlasRecord) => {
                    const d = valueOf(r, layer.id)! - layer.reference!.value;
                    return (
                      <span className="tabular-nums text-gray-600">
                        {d > 0 ? '+' : ''}
                        {d.toFixed(layer.decimals)}
                        {layer.unit === '%' || layer.unit === 'pts' ? ' pts' : ''}
                      </span>
                    );
                  },
                },
              ]
            : []),
        ]
      : [
          {
            key: 'name',
            header: 'Country',
            sortable: true,
            sortValue: (r) => r.name,
            render: (r) => (
              <span className="flex items-center gap-2 font-medium text-gray-900">
                <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm border border-black/10" style={{ background: bivariate.colourByIso.get(r.iso_code) }} />
                {r.name}
              </span>
            ),
          },
          {
            key: 'x',
            header: xLayer.label,
            align: 'right',
            sortable: true,
            sortValue: (r) => valueOf(r, xLayer.id)!,
            render: (r) => <span className="tabular-nums">{formatLayerValue(xLayer, valueOf(r, xLayer.id)!)}</span>,
          },
          {
            key: 'y',
            header: yLayer.label,
            align: 'right',
            sortable: true,
            sortValue: (r) => valueOf(r, yLayer.id)!,
            render: (r) => <span className="tabular-nums">{formatLayerValue(yLayer, valueOf(r, yLayer.id)!)}</span>,
          },
          {
            key: 'class',
            header: 'Group',
            hideOnMobile: true,
            render: (r) => {
              const c = bivariate.cellByIso.get(r.iso_code)!;
              const t = ['low', 'mid', 'high'];
              return <span className="text-xs text-gray-600">{t[c.x]} / {t[c.y]}</span>;
            },
          },
        ];

  const selectedRecord = selected ? RECORD_BY_ISO.get(selected) : undefined;
  const rangeLabel = (i: number) => {
    const lo = i === 0 ? single.min : single.breaks[i - 1];
    return `${formatLayerValue(layer, lo)} to ${formatLayerValue(layer, single.breaks[i])}`;
  };
  const strength = Math.abs(bivariate.r) >= 0.6 ? 'strong' : Math.abs(bivariate.r) >= 0.3 ? 'moderate' : 'weak';

  return (
    <div className="min-w-0 overflow-hidden rounded-card bg-white shadow-soft">
      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ── Layer panel ── */}
        <aside className="order-2 space-y-5 border-t border-gray-100 p-4 sm:p-5 lg:order-none lg:max-h-[min(900px,calc(100svh-6rem))] lg:overflow-y-auto lg:border-r lg:border-t-0" aria-label="Map layers and settings">
          <div>
            <FieldLabel>View</FieldLabel>
            <Segmented<Mode>
              label="Map view"
              value={mode}
              onChange={setMode}
              options={[
                { id: 'single', label: 'One layer' },
                { id: 'bivariate', label: 'Compare two' },
              ]}
            />
          </div>

          {mode === 'single' ? (
            <>
              {/* Phones: a compact select */}
              <div className="lg:hidden">
                <FieldLabel htmlFor="atlas-layer">Layer</FieldLabel>
                <select id="atlas-layer" value={layerId} onChange={(e) => setLayerId(e.target.value)} className={selectClass}>
                  <LayerOptions layers={RATE_LAYERS} />
                </select>
              </div>
              {/* Desktop: a layer catalogue grouped by theme */}
              <fieldset className="hidden lg:block">
                <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Layers</legend>
                <div className="space-y-3">
                  {ATLAS_THEMES.map((t) => {
                    const ls = RATE_LAYERS.filter((l) => l.theme === t.id);
                    if (!ls.length) return null;
                    return (
                      <div key={t.id}>
                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: t.accent }} />
                          {t.label}
                        </div>
                        <ul className="space-y-0.5">
                          {ls.map((l) => (
                            <li key={l.id}>
                              <label
                                className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                                  layerId === l.id ? 'bg-brand-primary/10 font-medium text-brand-primary' : 'text-gray-700 hover:bg-brand-secondary'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="atlas-layer"
                                  value={l.id}
                                  checked={layerId === l.id}
                                  onChange={() => setLayerId(l.id)}
                                  className="mt-0.5 accent-brand-primary"
                                />
                                <span>
                                  {l.label}
                                  <span className="block text-xs font-normal text-gray-500">{l.source.year}</span>
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
              <div>
                <FieldLabel htmlFor="atlas-method">Classification</FieldLabel>
                <select id="atlas-method" value={method} onChange={(e) => setMethod(e.target.value as ClassMethod)} className={selectClass}>
                  {CLASS_METHODS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">{CLASS_METHODS.find((c) => c.id === method)!.hint}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <FieldLabel htmlFor="atlas-x">Layer across (teal)</FieldLabel>
                <select id="atlas-x" value={bivX} onChange={(e) => setBivX(e.target.value)} className={selectClass}>
                  <LayerOptions layers={RATE_LAYERS} />
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="atlas-y">Layer up (pink)</FieldLabel>
                <select id="atlas-y" value={bivY} onChange={(e) => setBivY(e.target.value)} className={selectClass}>
                  <LayerOptions layers={RATE_LAYERS} />
                </select>
              </div>
              <p className="text-xs text-gray-500">
                Each layer is split into thirds (low, mid, high). Dark blue means high on both; pale grey means low on both.
              </p>
            </>
          )}

          <div>
            <FieldLabel htmlFor="atlas-symbols">Circles (counts)</FieldLabel>
            <select id="atlas-symbols" value={symbolId} onChange={(e) => setSymbolId(e.target.value)} className={selectClass}>
              <option value="none">None</option>
              <LayerOptions layers={COUNT_LAYERS} />
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <FieldLabel>Basemap</FieldLabel>
              <Segmented<Basemap>
                label="Basemap"
                value={basemap}
                onChange={setBasemap}
                options={[
                  { id: 'plain', label: 'Plain' },
                  { id: 'osm', label: 'Streets' },
                ]}
              />
            </div>
            <div>
              <FieldLabel htmlFor="atlas-opacity">Fill opacity {Math.round(opacity * 100)}%</FieldLabel>
              <input
                id="atlas-opacity"
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-brand-primary"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Download data</FieldLabel>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportCsv}
                className="flex-1 rounded-field border border-brand-primary/30 px-3 py-2 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={exportGeoJson}
                disabled={!ready}
                className="flex-1 rounded-field border border-brand-primary/30 px-3 py-2 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"
              >
                GeoJSON
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">All {ATLAS_LAYERS.length} layers for {ATLAS_RECORDS.length} countries, with sources.</p>
          </div>
        </aside>

        {/* ── Map ── */}
        <div className="relative order-1 min-w-0 lg:order-none">
          <div ref={container} className="fi-map-h w-full" role="region" aria-label="Interactive map of Europe. The table below lists the same values." />

          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-brand-secondary">
              <p className="text-sm text-gray-600">{failed ? 'The map could not load. The table below has every value.' : 'Loading map…'}</p>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-field bg-white/95 p-3 shadow-soft sm:max-w-[290px]">
            {mode === 'single' ? (
              <>
                <h3 className="text-xs font-semibold text-brand-primary sm:text-sm">
                  {layer.label}
                  <span className="font-normal text-gray-500"> · {layer.source.year}</span>
                </h3>
                <ul className="mt-2 space-y-1">
                  {single.colours.map((c, i) => (
                    <li key={c + i} className="flex items-center gap-2 text-xs text-gray-700">
                      <span aria-hidden="true" className="h-3 w-5 shrink-0 rounded-sm border border-black/10" style={{ background: c }} />
                      <span className="tabular-nums">{rangeLabel(i)}</span>
                      <span className="ml-auto pl-2 text-gray-500 tabular-nums">{single.counts[i]}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-xs text-gray-500">
                    <span aria-hidden="true" className="h-3 w-5 shrink-0 rounded-sm border border-black/10" style={{ background: NO_DATA }} />
                    No data
                  </li>
                </ul>
              </>
            ) : (
              <div className="flex items-end gap-3">
                <div>
                  <div className="grid grid-cols-3 gap-0.5" style={{ transform: 'rotate(-45deg)', margin: '10px' }} aria-hidden="true">
                    {[2, 1, 0].map((y) => [0, 1, 2].map((x) => <span key={`${x}${y}`} className="h-4 w-4" style={{ background: BIVARIATE_PALETTE[y * 3 + x] }} />))}
                  </div>
                </div>
                <div className="min-w-0 text-xs text-gray-700">
                  <p>
                    <span className="font-semibold text-teal-700">Across:</span> {xLayer.label}
                  </p>
                  <p className="mt-0.5">
                    <span className="font-semibold text-pink-700">Up:</span> {yLayer.label}
                  </p>
                  <p className="mt-1 text-gray-500">
                    {bivariate.n} countries · correlation r = {bivariate.r.toFixed(2)} ({strength})
                  </p>
                </div>
              </div>
            )}
            {symbols && symbolLayer && (
              <div className="mt-2 flex items-center gap-3 border-t border-gray-100 pt-2 text-xs text-gray-700">
                <svg width={2 * symbols.radius(symbols.max) + 2} height={2 * symbols.radius(symbols.max) + 2} aria-hidden="true">
                  {[symbols.max, symbols.max / 4].map((v) => {
                    const r = symbols.radius(v);
                    const R = symbols.radius(symbols.max);
                    return <circle key={v} cx={R + 1} cy={2 * R + 1 - r} r={r} fill="white" fillOpacity={0.6} stroke="#16303f" strokeWidth={1} />;
                  })}
                </svg>
                <div>
                  <p className="font-semibold">{symbolLayer.label}</p>
                  <p className="text-gray-500">
                    Largest {formatLayerValue(symbolLayer, symbols.max)}, inner {formatLayerValue(symbolLayer, symbols.max / 4)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Identify panel */}
          {selectedRecord && (
            <aside
              aria-label={`${selectedRecord.name}: all layers`}
              className="absolute inset-x-0 bottom-0 z-20 max-h-[75%] overflow-y-auto rounded-t-card bg-white shadow-2xl animate-fade-in-up sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-[340px] sm:rounded-none"
            >
              <div className="sticky top-0 flex items-start justify-between gap-3 bg-brand-primary p-4 text-white">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedRecord.name}</h3>
                  <p className="text-xs text-white/80">{selectedRecord.eu ? 'EU member state' : 'Outside the EU'} · all layers</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close country detail"
                  className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4 p-4">
                {ATLAS_THEMES.map((t) => {
                  const ls = ATLAS_LAYERS.filter((l) => l.theme === t.id && valueOf(selectedRecord, l.id) !== undefined);
                  if (!ls.length) return null;
                  return (
                    <div key={t.id}>
                      <h4 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: t.accent }} />
                        {t.label}
                      </h4>
                      <dl className="divide-y divide-gray-100 rounded-lg bg-brand-secondary/60">
                        {ls.map((l) => {
                          const v = valueOf(selectedRecord, l.id)!;
                          const all = ATLAS_RECORDS.map((r) => valueOf(r, l.id)).filter((x): x is number => x !== undefined).sort((a, b) => b - a);
                          return (
                            <div key={l.id} className="flex items-baseline justify-between gap-3 px-3 py-2">
                              <dt className="text-xs text-gray-600">{l.label}</dt>
                              <dd className="text-right">
                                <span className="text-sm font-semibold tabular-nums text-gray-900">{formatLayerValue(l, v)}</span>
                                <span className="block text-[11px] text-gray-500">
                                  {ordinal(all.indexOf(v) + 1)} of {all.length}
                                  {l.reference ? ` · ${l.reference.label} ${formatLayerValue(l, l.reference.value)}` : ''}
                                </span>
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    </div>
                  );
                })}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* ── What the map shows, and the linked attribute table ── */}
      <div className="border-t border-gray-100 p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-1">
          <p className="font-display text-base font-semibold text-brand-primary sm:text-lg">
            {mode === 'single' ? layer.question : `${xLayer.label} against ${yLayer.label.toLowerCase()}`}
          </p>
          <p className="text-sm text-gray-600">
            {mode === 'single' ? (
              <>
                {single.n} countries
                {layer.reference ? ` · ${layer.reference.label}: ${formatLayerValue(layer, layer.reference.value)}` : ''}
                {layer.note ? ` · ${layer.note}` : ''} Source:{' '}
                <a href={layer.source.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                  {layer.source.name}
                </a>{' '}
                ({layer.source.year}). {layer.source.licence}.
              </>
            ) : (
              <>
                {bivariate.n} countries with both values. Across the countries, the two layers show a {strength}{' '}
                {bivariate.r >= 0 ? 'positive' : 'negative'} relationship (r = {bivariate.r.toFixed(2)}). Correlation is not causation, and the
                two layers come from different years. Sources: {xLayer.source.name} ({xLayer.source.year}); {yLayer.source.name} ({yLayer.source.year}).
              </>
            )}
          </p>
        </div>
        <DataTable
          key={mode === 'single' ? layer.id : `${xLayer.id}-${yLayer.id}`}
          data={tableRows}
          columns={columns}
          rowKey={(r) => r.iso_code}
          searchText={(r) => `${r.name} ${r.iso_code}`}
          searchPlaceholder="Find a country…"
          itemLabel="countries"
          initialSort={mode === 'single' ? { key: 'value', dir: 'desc' } : { key: 'y', dir: 'desc' }}
          onRowHover={(r) => setTableHover(r?.iso_code ?? null)}
          onRowClick={(r) => focusCountry(r.iso_code)}
          activeRowKey={selected}
        />
      </div>
    </div>
  );
}
