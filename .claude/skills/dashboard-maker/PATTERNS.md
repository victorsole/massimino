# Dashboard patterns

Copy-ready skeletons for both output targets. Adapt, do not paste blindly: read the live dashboard you are matching first (`src/app/fitness-intelligence/page.tsx` for public data pages, `src/app/admin/revenue/page.tsx` for internal tactical views).

House rules apply throughout: no emojis, no em-dashes, British English, units in every label, a comparison on every KPI.

---

## Part 1: Next.js target (this repo)

Next.js 14.2 App Router, React 18, Tailwind 3, TypeScript. No chart library is installed: charts are small typed inline-SVG components. No i18n: copy is inline English.

### Page skeleton (server component)

```tsx
// src/app/<slug>/page.tsx
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/animated_section';
import { SLUG_KPIS, SLUG_SERIES, SLUG_ROWS, SLUG_META } from '@/data/<area>/<slug>'; // or a Prisma query
import { KpiCard } from './components/kpi_card';
import { TrendChart } from './components/trend_chart';
import { SlugTable } from './components/slug_table'; // 'use client' only if sortable

export const metadata: Metadata = {
  title: 'Slug title - Massimino',
  description: 'One sentence that answers the page question.',
  openGraph: { title: 'Slug title - Massimino', description: '...', type: 'website' },
};

export default async function SlugPage() {
  return (
    <main className="min-h-screen bg-brand-secondary">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* TOP RAIL: title, freshness, status */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-brand-primary md:text-4xl">Is the question answered here?</h1>
          <p className="mt-2 max-w-2xl text-gray-600">One-line standfirst stating the answer.</p>
          <p className="mt-3 text-xs text-gray-500">
            Updated {SLUG_META.retrieved}. Source: {SLUG_META.source}.
          </p>
        </header>

        {/* PYRAMID TOP: status and targets */}
        <section aria-labelledby="slug-kpis" className="mb-12">
          <h2 id="slug-kpis" className="sr-only">Headline figures</h2>
          <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SLUG_KPIS.map((k) => (
              <StaggerItem key={k.id}><KpiCard {...k} /></StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* PYRAMID MIDDLE: trends and comparisons */}
        <AnimatedSection>
          <section aria-labelledby="slug-trend" className="mb-12">
            <h2 id="slug-trend" className="mb-4 text-2xl font-semibold text-brand-primary">What explains the movement</h2>
            <Card><CardContent className="pt-6"><TrendChart data={SLUG_SERIES} /></CardContent></Card>
          </section>
        </AnimatedSection>

        {/* PYRAMID BOTTOM: detail, sources, follow-up */}
        <AnimatedSection>
          <section aria-labelledby="slug-detail" className="mb-12">
            <h2 id="slug-detail" className="mb-4 text-2xl font-semibold text-brand-primary">Detail</h2>
            <SlugTable rows={SLUG_ROWS} />
          </section>
        </AnimatedSection>

        {/* Sources and methodology, as on /fitness-intelligence */}
        <footer className="border-t border-gray-200 pt-6 text-sm text-gray-600">...</footer>
      </div>
    </main>
  );
}
```

For an auth-gated view (athlete, trainer, admin), fetch the session first, as `src/app/my-athletes/page.tsx` does:

```tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';

const session = await getServerSession(authOptions);
if (!session?.user) redirect('/login');
```

Prisma `Decimal` values never cross into a client component raw: map them with `toNumber` from `@/lib/decimal` first.

### Data file header (sourced static data)

Every file in `src/data/` opens with its provenance, as `src/data/fitness/eurostat_activity.ts` does: dataset, filter, meaning, wave, source, source update date, retrieval date and URL. Export a `*_META` object carrying the same so the page can print the freshness stamp from it rather than hard-coding a date.

### KPI card: fixed anatomy

Label, Value, Delta, Time frame. Same order everywhere, no exceptions.

```tsx
type KpiProps = {
  label: string;        // phrased as the answer to a question
  value: string;        // pre-formatted
  unit?: string;        // kg, kcal, min, EUR, %
  delta?: { value: string; direction: 'up' | 'down' | 'flat'; goodWhen: 'up' | 'down' };
  timeframe: string;    // "vs last week", "last 30 days"
  note?: string;        // nuance: "Warm-up sets excluded"
};

export function KpiCard({ label, value, unit, delta, timeframe, note }: KpiProps) {
  const isGood = delta && delta.direction === delta.goodWhen;
  const arrow = delta?.direction === 'up' ? '\u25B2' : delta?.direction === 'down' ? '\u25BC' : '\u25A0';

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-medium text-gray-600">{label}</h3>
      <p className="mt-2 text-3xl font-bold tabular-nums text-brand-primary">
        {value}{unit && <span className="ml-1 text-lg font-medium text-gray-500">{unit}</span>}
      </p>
      {delta ? (
        // colour is NOT the only cue: the arrow glyph and the text carry it too
        <p className={`mt-1 text-sm font-medium ${isGood ? 'text-emerald-700' : 'text-red-700'}`}>
          <span aria-hidden="true">{arrow}</span> <span>{delta.value} {timeframe}</span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">{timeframe}</p>
      )}
      {note && <p className="mt-2 text-xs text-gray-500">{note}</p>}
    </article>
  );
}
```

Use `text-emerald-700` / `text-red-700` for delta text, not `safety.green` / `safety.red`: the 500-weight hues fail 4.5:1 on white as text (fine as fills and pills). The same applies to the bright label colours in the current `StatCard` (`#4ADE80`, `#22D3EE`, `#E8C547` text on white): they fail contrast, so do not copy that pattern for text.

### SVG line with target band (server-safe, no library)

The shaded band is what turns a trend into a judgement.

```tsx
type Point = { label: string; value: number };

export function TrendChart({
  data, target, band, unit, takeaway, height = 240,
}: { data: Point[]; target?: number; band?: [number, number]; unit: string; takeaway: string; height?: number }) {
  const w = 640, h = height, pad = { t: 12, r: 16, b: 28, l: 40 };
  const vals = data.map((d) => d.value).concat(target ?? [], band ?? []);
  const min = Math.min(0, ...vals), max = Math.max(...vals) * 1.1 || 1;
  const x = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / Math.max(1, data.length - 1);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`).join(' ');

  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label={takeaway}>
        {band && <rect x={pad.l} y={y(band[1])} width={w - pad.l - pad.r} height={y(band[0]) - y(band[1])} fill="#2b5069" fillOpacity={0.08} />}
        {target !== undefined && (
          <line x1={pad.l} x2={w - pad.r} y1={y(target)} y2={y(target)} stroke="#2b5069" strokeDasharray="4 4" />
        )}
        <path d={path} fill="none" stroke="#2b5069" strokeWidth={2.5} strokeLinejoin="round" />
        {data.map((d, i) => (
          <text key={d.label} x={x(i)} y={h - 8} textAnchor="middle" className="fill-gray-500 text-[11px]">{d.label}</text>
        ))}
        <text x={4} y={pad.t + 8} className="fill-gray-500 text-[11px]">{unit}</text>
      </svg>
      {/* the one-line takeaway that makes the chart screen-reader legible */}
      <figcaption className="mt-2 text-sm text-gray-600">{takeaway}</figcaption>
    </figure>
  );
}
```

Add hover tooltips only in a `'use client'` wrapper, and make them keyboard reachable (focusable points or a table fallback). For label-dense axes on mobile, show every nth label below `sm`.

### Sorted horizontal bar (ranking, leaderboards)

Always sort descending. Horizontal so labels are readable. Plain HTML bars are the simplest accessible option and collapse cleanly on mobile.

```tsx
export function RankBars({ rows, unit }: { rows: { name: string; value: number }[]; unit: string }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const max = sorted[0]?.value || 1;
  return (
    <ol className="space-y-2">
      {sorted.map((r, i) => (
        <li key={r.name} className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm">
          <span className="truncate text-gray-700">{i + 1}. {r.name}</span>
          <span className="h-3 rounded-full bg-brand-secondary-dark">
            <span className={`block h-3 rounded-full ${i === 0 ? 'bg-brand-primary' : 'bg-brand-primary-light'}`}
              style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="tabular-nums text-gray-900">{r.value} {unit}</span>
        </li>
      ))}
    </ol>
  );
}
```

### Accessible data table

Prefer the existing `DataTable` in `src/app/fitness-intelligence/components/data_table.tsx`. If hand-writing:

```tsx
<div className="overflow-x-auto">           {/* the table scrolls, never the page */}
  <table className="w-full text-sm">
    <caption className="sr-only">{caption}</caption>
    <thead>
      <tr className="border-b border-gray-200">
        <th scope="col" className="px-3 py-2 text-left font-medium">Athlete</th>
        <th scope="col" className="px-3 py-2 text-right font-medium">Sessions (last 7 days)</th>
        <th scope="col" className="px-3 py-2 text-right font-medium">Volume (kg)</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r.id} className="border-b border-gray-100">
          <th scope="row" className="px-3 py-2 text-left font-normal">{r.name}</th>
          <td className="px-3 py-2 text-right tabular-nums">{r.sessions}</td>
          <td className="px-3 py-2 text-right tabular-nums">{r.volume}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Maps

Reuse `EuropeMap` (`src/app/fitness-intelligence/components/europe_map.tsx`, MapLibre GL). Keep the choropleth for rates (penetration %, activity %) and pair it with a sorted table so the map is never the only way to read the data.

### Route checklist

1. `src/app/<slug>/page.tsx` (server component) plus `components/` for client islands
2. `metadata` export for public pages
3. Session check and redirect for private pages; admin pages under `src/app/admin/`
4. Link it from the relevant nav (dashboard sidebar, admin layout, footer or community page)
5. Add to `public/llms.txt` if it is a public data asset
6. `npm run build` (ignore only the known `/api/ads` ENOENT), then check in the browser at every breakpoint

---

## Part 2: Standalone HTML target

One self-contained file. Inline everything. No external requests except Google Fonts. Must render correctly in isolation, and must be theme-aware if it is published as an artifact.

### Shell with top rail

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap" rel="stylesheet">
<style>
  :root {
    --primary: #2b5069; --primary-light: #3d6a85; --primary-dark: #1e3d52;
    --cream: #fcfaf5; --cream-dark: #f5f0e8;
    --good: #047857; --warn: #b45309; --danger: #b91c1c;   /* text-safe shades of safety green/yellow/red */
    --bg: var(--cream); --card: #ffffff; --border: #e7e1d6; --muted: #5b6573; --text: #1e3d52;
    --gutter: 20px; --radius: 16px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-variation-settings: "wdth" 100, "YTLC" 500;
    line-height: 1.5;
  }
  .wrap { max-width: 1240px; margin: 0 auto; padding: 24px 16px 56px; }

  /* TOP RAIL: title, freshness, filters */
  .rail { border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 24px; }
  .rail .brand { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 12px; font-weight: 800; letter-spacing: 2px; color: var(--primary); font-size: .8125rem; }
  .rail .brand img { height: 36px; width: 36px; border-radius: 50%; }
  .rail h1 { margin: 0 0 4px; font-size: clamp(1.5rem, 3vw, 2.125rem); font-weight: 800; color: var(--primary); }
  .rail .stamp { font-family: 'Lato', sans-serif; font-size: .75rem; color: var(--muted); }
  .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .filters button {
    font: inherit; font-size: .8125rem; padding: 5px 12px; border-radius: 999px;
    border: 1px solid var(--border); background: #fff; color: var(--text); cursor: pointer;
  }
  .filters button[aria-pressed="true"] { background: var(--primary); border-color: var(--primary); color: #fff; }
  .filters button:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: 2px; }

  /* PYRAMID TOP: KPI row */
  .kpis { display: grid; gap: var(--gutter); grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
  .kpi { border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; background: var(--card); }
  .kpi h3 { margin: 0; font-size: .8125rem; font-weight: 600; color: var(--muted); }
  .kpi .val { margin: 8px 0 2px; font-size: 2rem; font-weight: 800; color: var(--primary); font-variant-numeric: tabular-nums; }
  .kpi .val .u { font-size: 1.05rem; font-weight: 500; margin-left: 3px; color: var(--muted); }
  .kpi .delta { margin: 0; font-size: .8125rem; font-weight: 600; }
  .kpi .delta.good { color: var(--good); } .kpi .delta.bad { color: var(--danger); }
  .kpi .note { margin: 8px 0 0; font-family: 'Lato', sans-serif; font-size: .6875rem; color: var(--muted); }

  /* PYRAMID MIDDLE + BOTTOM */
  section { margin-top: 36px; }
  section h2 { font-size: 1.25rem; font-weight: 700; color: var(--primary); margin: 0 0 12px; }
  .scroll { overflow-x: auto; }          /* wide content scrolls, the page never does */
  table { width: 100%; border-collapse: collapse; font-family: 'Lato', sans-serif; font-size: .875rem; }
  th, td { padding: 8px 10px; border-bottom: 1px solid var(--border); }
  th[scope="col"] { text-align: left; font-weight: 700; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .takeaway { margin-top: 8px; font-size: .875rem; color: var(--muted); }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #0f1a22; --card: #15232d; --border: #26394a; --muted: #9fb0bf; --text: #e9eef2;
      --primary: #8fb8d4; --good: #34d399; --danger: #f87171;
    }
  }
  :root[data-theme="dark"] {
    --bg: #0f1a22; --card: #15232d; --border: #26394a; --muted: #9fb0bf; --text: #e9eef2;
    --primary: #8fb8d4; --good: #34d399; --danger: #f87171;
  }
</style>

<div class="wrap">
  <div class="rail">
    <span class="brand"><img src="massimino_logo.png" alt="" /> MASSIMINO</span>
    <h1>Where in Europe is gym membership still growing?</h1>
    <p class="stamp">Updated 21 June 2026. Source: EuropeActive / Deloitte European Health &amp; Fitness Market Report; Eurostat EHIS 2019.</p>
    <div class="filters" role="group" aria-label="Metric">
      <button aria-pressed="true">Penetration</button>
      <button aria-pressed="false">Market size</button>
      <button aria-pressed="false">Growth</button>
    </div>
  </div>

  <div class="kpis">
    <article class="kpi">
      <h3>Members across Europe</h3>
      <p class="val"><!-- real figure from src/data/fitness --><span class="u">m</span></p>
      <p class="delta good"><span aria-hidden="true">&#9650;</span> <!-- delta --> vs prior year</p>
      <p class="note">Gym and health-club members only</p>
    </article>
    <!-- repeat, identical anatomy -->
  </div>

  <section>
    <h2>What explains the movement</h2>
    <!-- inline SVG chart -->
    <p class="takeaway"><!-- one-sentence answer, drawn from the data --></p>
  </section>
</div>
```

Copy the logo next to the HTML file (or inline it as a data URI) so the file stays self-contained. `massimino_logo.png` has no alpha channel and a cream background: the circular crop above hides the corners on cream; on the dark theme, wrap it in a cream disc (`background: #fcfaf5; padding: 2px`) rather than inverting it.

### Left-rail variant

Swap `.wrap` for a two-column grid, and collapse to one column on narrow screens.

```css
.shell { display: grid; grid-template-columns: 232px minmax(0, 1fr); gap: 28px; max-width: 1400px; margin: 0 auto; padding: 24px 16px; }
.sidebar { border-right: 1px solid var(--border); padding-right: 20px; }
.sidebar nav a { display: block; padding: 7px 10px; border-radius: 8px; color: inherit; text-decoration: none; font-size: .875rem; }
.sidebar nav a[aria-current="page"] { background: var(--cream-dark); color: var(--primary); font-weight: 700; }
@media (max-width: 767px) {
  .shell { grid-template-columns: minmax(0, 1fr); }
  .sidebar { border-right: 0; border-bottom: 1px solid var(--border); padding: 0 0 16px; }
  .sidebar nav { display: flex; flex-wrap: wrap; gap: 4px; }
}
```

Note the `minmax(0, 1fr)`: without it, a wide table or chart blows out the grid and the page scrolls horizontally.

### Inline SVG bullet chart (progress vs goal)

The most information-dense KPI visual: actual, target and qualitative bands in one compact row. Example: weekly sessions against a four-session goal.

```html
<svg viewBox="0 0 320 34" width="100%" height="34" role="img"
     aria-label="3 of 4 sessions this week, one short of target">
  <rect x="0" y="9" width="320" height="16" fill="#f5f0e8"/>
  <rect x="0" y="9" width="160" height="16" fill="#e7e1d6"/>
  <rect x="0" y="9" width="240" height="16" fill="#d8d0c2"/>
  <rect x="0" y="13" width="240" height="8" fill="#2b5069"/>
  <line x1="320" y1="5" x2="320" y2="29" stroke="#1e3d52" stroke-width="2.5"/>
</svg>
<p class="takeaway">3 of 4 sessions this week, one short of target.</p>
```

### Inline SVG sparkline

For table rows (for example an athlete's weekly volume in the trainer view) and compact status tiles.

```html
<svg viewBox="0 0 100 24" width="100" height="24" role="img" aria-label="Weekly volume rising over the last 12 weeks">
  <polyline fill="none" stroke="#2b5069" stroke-width="2"
    points="0,20 9,19 18,17 27,18 36,14 45,12 54,13 63,9 72,7 81,8 90,4 100,2"/>
</svg>
```

(The points are illustrative geometry for the recipe; in a real dashboard they are computed from sourced data.)

### Choropleth caption card

In React, Massimino maps use MapLibre through `EuropeMap`. For standalone HTML, pair a static map image or inline SVG with a caption card that carries the legend, the scale and the caveat, because the map alone never states its own units.

---

## Anti-patterns, with the fix

| Do not | Instead |
|---|---|
| Pie with 6+ slices | Sorted horizontal bar |
| Dual-axis line | Two vertically aligned panes sharing an x-axis |
| 3D bars, shadows, bevels | Flat |
| Unsorted heatmap | Sort rows and columns by a meaningful key |
| Colour as the only cue | Colour plus glyph, pattern, or direct label |
| Bare metric title ("Revenue") | Question-shaped ("Revenue vs Q3 target") |
| Number with no comparison | Pair with target, prior period, or benchmark |
| Rainbow category palette | Eight to twelve hues, reused consistently across pages |
| Fifteen vague filters | Five precise ones with safe defaults |
| Page scrolls sideways on mobile | `overflow-x: auto` on the wide element, `minmax(0, 1fr)` on the grid |
| Undated screen | Explicit "Updated DD Month YYYY, HH:MM UTC" |

---

## Pre-ship audit

Run the full checklist in `SKILL.md` Step 8. The three that catch the most problems in practice:

1. **The ten-second test.** Can the audience answer their top two questions that fast? If not, rearrange before doing anything else.
2. **Every widget maps to one of the three questions.** If it does not, delete it. This is the hardest rule to follow and the one that matters most.
3. **Audit at 1440, 1024, 768 and 375 px in the browser.** Responsive is mandatory in this repo. No horizontal page overflow, no clipped content, no illegible text.
