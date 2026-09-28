---
name: dashboard-maker
description: Massimino's dashboard builder. Designs and ships dashboards that answer a decision in ten seconds, not galleries of charts. Covers the full loop: name the three questions the page must answer, pick the dashboard type (analytical, operational, strategic, tactical, explanatory), lay it out on the inverted pyramid, match each chart to its question, add the four layers of context (comparison, scope, freshness, nuance), and audit for accessibility and responsiveness. Two output targets: a Next.js 14 App Router route in this repo (server components first, hand-rolled inline SVG charts, MapLibre for maps, Tailwind brand tokens, English only) or a standalone self-contained HTML page in the Massimino brand (partner deck figure, investor or gym-partner deliverable, artifact). Grounded in Josep Ferrer's DataCamp dashboard-design tutorial plus Massimino's own dashboards (/fitness-intelligence, the athlete /dashboard, trainer /my-athletes, /admin/revenue, leaderboards). Use when asked to build, design, restructure, critique or audit a dashboard, a stats or progress page, a KPI view, a trainer or athlete overview, a leaderboard or an admin panel screen. Triggers: "/dashboard-maker", "build a dashboard", "design a dashboard", "stats page", "progress page", "KPI page", "admin analytics", "this dashboard is cluttered", "audit this dashboard".
---

# /dashboard-maker: Massimino dashboard builder

A dashboard sits between a question and a decision. When it works, someone answers "what changed?" in seconds and acts. When it does not, they hunt through tabs and guess.

This skill exists so Massimino never ships the second kind. It is the distillation of Josep Ferrer's DataCamp tutorial on dashboard design (read in full, 5 Dec 2025 edition) mapped onto how Massimino actually builds: Next.js 14 App Router, hand-rolled SVG charts, Tailwind brand tokens, one language (English), and a hard rule against fabricated numbers. The method was originally written for Beresol and adapted here.

## Massimino's dashboards (the reference set)

| Route | Code | Type | Audience | Notes |
|---|---|---|---|---|
| `/fitness-intelligence` | `src/app/fitness-intelligence/` | Explanatory with strategic elements | Public, gym partners, press | The reference implementation. Server page with client islands (`fitness_map_section.tsx`, `europe_map.tsx` on MapLibre, `data_table.tsx`, `fitness_tables.tsx`). Data in `src/data/fitness/` with source, wave and retrieval date in the file header; Eurostat EHIS series retrieved live via the Brubru open-data API |
| `/dashboard` | `src/app/dashboard/page.tsx` + `src/components/dashboard/` | Tactical | Logged-in athlete | `StatCard`, `ActivityAnalytics`, `NutritionDonut`, `CaloriesChart`. Client component |
| `/my-athletes` (and `/dashboard/athletes`) | `src/app/my-athletes/page.tsx` + `src/components/coaching/` | Tactical | Trainer | Server page (session check) wrapping `MyAthletesDashboard` |
| `/admin/revenue` | `src/app/admin/revenue/page.tsx` | Tactical / analytical | Admin | Async server component querying Prisma directly; money via `toNumber` from `src/lib/decimal.ts` |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | Analytical | Admin | |
| Leaderboards | `src/components/leaderboards/media_leaderboard.tsx`, APIs in `src/app/api/leaderboards/` and `src/app/api/challenges/[challengeId]/leaderboard/` | Operational-lite (ranking) | Athletes, teams | Entry point from `/community`. Respect `api/leaderboards/privacy` |

Read the closest one before building anything new.

## The one test that governs everything

> If the dashboard cannot answer its audience's top two questions in ten seconds, it is too complex and must be rearranged.

Apply this before you write code, and again before you ship. Everything below serves it.

## Invocation

| Trigger | What it does |
|---|---|
| `/dashboard-maker <topic>` | Full build: discovery through to shipped page |
| `/dashboard-maker audit <route or file>` | Score an existing dashboard against the checklist, return ranked fixes |
| `/dashboard-maker layout <topic>` | Layout and metric plan only, no code (use when Victor wants to lock the shape first) |
| `/dashboard-maker html <topic>` | Standalone self-contained HTML dashboard, no React |

If invoked free-form, infer the mode and say which one you picked in one line.

## Step 0: Refuse to start without real data

Massimino shows people their own training, their athletes' progress, and public market data. A dashboard of invented numbers is the single worst thing this skill could produce, because it looks authoritative, and for a brand whose promise is "Safe Workouts for Everyone" a fake progress figure is a trust failure.

Before designing, establish where every number comes from: the database via Prisma (`src/core/database`), an API route in `src/app/api/`, a sourced data file in `src/data/fitness/` (header must name source, wave and retrieval date), the exercise JSON in `public/databases/`, a CSV or export Victor supplied, or a named public source (Eurostat, EuropeActive/Deloitte). If a metric has no source, it does not ship. Say so and design around the gap rather than filling it.

Hard-coded default props are fabrication too. A component that renders `2450 kcal` or a "78%" balance when no data was passed is a demo, not a dashboard: render an explicit empty state ("No meals logged this week") instead. Same for estimates dressed as measurements (for example deriving session duration as workouts x 45): label them as estimates or drop them.

Placeholder data is allowed **only** in `layout` mode, and every placeholder must be visibly marked as such.

## Step 1: Define the three questions and the audience

Never start with charts. Start with people.

1. Write the **three questions in plain language** the page must answer. Real examples: "Did I hit my training target this week?", "Which of my athletes has not logged a session in 7 days?", "Which countries have the most headroom for gym growth?", "Is monthly platform revenue up on last month, net of refunds?"
2. **Tie each question to a goal.** If a widget cannot be mapped to one of the three questions, it does not ship. This is the rule that keeps dashboards small.
3. **Profile the audience**: their role, their data fluency, the decision they make, how often they look (real-time, daily, monthly), and on what device.

Cadence dictates the technical constraints (refresh rate, tolerance for lag, level of detail). Decision type dictates the context you must supply (target, prior period, cohort, benchmark).

Write these down at the top of the work before proceeding. If Victor has not said who the audience is and the answer changes the design, ask once, in one line.

## Step 2: Pick the dashboard type

Match the type to the decision horizon. Do not blend types on one screen: that is how dashboards become galleries.

| Type | Purpose | User | Cadence | Design priorities |
|---|---|---|---|---|
| **Analytical** | Root cause | Analysts | Ad-hoc, deep dive | High interaction, filters, drill-downs, reset control, definitions one click away |
| **Operational** | Live monitoring | Shift leads | Real-time | Low latency, big status, explicit alert rules, clear ownership, sparklines |
| **Strategic** | Long-term steering | Executives | Monthly, quarterly | Fewer and larger charts, baselines, annotated events |
| **Tactical** | Daily execution | Managers | Daily, weekly | Progress against target, blockers, owners, controls near the data |
| **Explanatory** | Storytelling | General audience | As needed | Narrative, minimal controls, one question one answer, annotations |

In Massimino: `/fitness-intelligence` is **explanatory** with strategic elements (broad audience, low interaction, a story per section). The athlete `/dashboard` and the trainer `/my-athletes` view are **tactical** (progress against target, who needs attention). `/admin/revenue` is **tactical** leaning **analytical**. Leaderboards are a ranking view, close to **operational**. Do not import public-data-page conventions (hero video, long methodology) into an athlete or admin screen, or the reverse.

## Step 3: Choose the metrics

Pick a small set of KPIs that predict performance, plus a few helper metrics. Resist piling on lagging indicators.

For every metric, record a definition entry:
- **Owner and source**: who maintains this data
- **Technical spec**: exact formula, units, rounding, data grain
- **Context**: active filters, known caveats, comparison logic

Then structure them: group related metrics into named sections, put primary KPIs at the top and supporting stats below, and use progressive disclosure so the headline comes first and the detail comes on demand.

Data hygiene is part of the design, not an afterthought: pull from one source of truth so no two pages disagree, validate freshness and completeness before the data hits the screen, and always stamp an explicit "last updated" time. Stale data must look stale.

## Step 4: Lay it out

**The scan path.** In left-to-right languages people read in a Z: top-left, top-right, bottom-left, bottom-right. They read what is heavy, close and high-contrast first. Put the decision-driving number on the start of that path.

**The inverted pyramid**, three layers by urgency:

```
TOP     Status and targets        the "are we good?" line
MIDDLE  Trends and comparisons    what explains the movement
BOTTOM  Details, owners, links    what routes the follow-up work
```

The top-left card answers "good or not?". Everything else explains "why".

**Grid discipline.** Simple grid, even gutters, consistent spacing. Aligned cards read as orderly and trustworthy; a broken grid reads as noisy and hides what matters. Use size and whitespace to signal priority, never as decoration. Group related items and separate unrelated ones with space rather than lines. Keep legends next to their charts. Place filters above the content with short plain labels, and always show what is applied so there are no hidden states.

**Pick a rail:**

- **Top-rail** puts navigation, filters and KPIs in a horizontal header with the space below for charts. Best when the first question is "are we on track?". Watch out: gets tall on small laptops, and too many filter pills create clutter. This is the pattern `/fitness-intelligence` and the athlete `/dashboard` use.
- **Left-rail** puts navigation and filters in a vertical column, leaving full width for analysis. Best when people switch views often or need many filters. Watch out: the sidebar eats width, and filters below the fold get ignored. This is the right pattern for an admin panel (`src/app/admin/layout.tsx`) and the athlete dashboard shell (`DashboardSidebar.tsx`).

## Step 5: Match each chart to its question

Pick charts based on the data, never for variety.

| To show | Use | Design note |
|---|---|---|
| Change over time | Line chart or sparkline | Add a shaded target band for the expected range |
| Ranking | Horizontal bar | Sort descending so the winner is obvious; labels read better than on vertical columns |
| Operational detail | Table | Freeze key columns; put sparklines inside rows |
| Part to whole | Stacked bar | Donuts only with two or three slices |
| Spread, distribution | Histogram or box plot | Good for spotting outliers |
| Relationship | Scatter | Add a fit line to make correlation obvious |
| Progress vs goal | Bullet chart | Compactly shows actual, target and qualitative bands |
| Geography | Choropleth or dot map | Choropleth for rates and ratios, dot map for counts |

Compact KPI cards carry the headline numbers. Use badges or coloured pills for status alerts rather than burying status in rows of text.

**Never ship:** many-slice pies (use a sorted bar), dual-axis lines (split into two vertically aligned panes), 3D or shadows (they distort values), or unsorted heatmaps (sort rows and columns by a meaningful key).

## Step 6: Give every number its context

A single number answers nothing alone. Four layers, all four required:

1. **Comparison**: pair each KPI with a target, a prior period, or a benchmark
2. **Scope**: units in the label (kg or lb per the user's setting, kcal, min, reps, EUR, %) and a visible active date range
3. **Freshness**: an exact timestamp, for example "Updated 08:35 UTC"
4. **Nuance**: small notes for quirks, for example "Refunds excluded", "Warm-up sets excluded" or "EHIS 2019 wave, UK 2014"

Phrase card titles as the answer to a question ("Sessions this week vs target"), not as a bare noun ("Workouts"). Round to a useful precision. Tuck formulas and definitions behind a consistent info icon.

**Card anatomy is fixed everywhere**: Label, Value, Delta, Time frame. Same order, every card, every page.

## Step 7: Build it

Two targets. Pick by where the dashboard lives.

### Target A: a Next.js route in this repo

Follow the existing pattern rather than inventing one. Read `src/app/fitness-intelligence/page.tsx` first (public, explanatory) or `src/app/admin/revenue/page.tsx` (internal, tactical) and mirror the structure.

- **App Router.** Route in `src/app/<slug>/page.tsx`; route-private components in `src/app/<slug>/components/` (snake_case filenames, as in fitness-intelligence) or shared ones in `src/components/<area>/`.
- **Server components by default.** Fetch in the page (Prisma via `@/core/database`, or a static import from `src/data/`) and pass plain serialisable props down. Convert Prisma `Decimal` with `toNumber` from `src/lib/decimal.ts` before it crosses the boundary. Only interactive islands (filters, map, sortable table, tooltips) get `'use client'`.
- **Auth-gated pages** check the session server-side with `getServerSession(authOptions)` from `next-auth` and `@/core` (see `src/app/my-athletes/page.tsx`), then `redirect()` if absent. Admin pages sit under `src/app/admin/layout.tsx`.
- **Charts: no chart library is installed.** Existing charts are hand-rolled inline SVG (`src/components/dashboard/CaloriesChart.tsx`, `NutritionDonut.tsx`). Build line, bar, bullet and sparkline charts as small typed SVG components (recipes in `PATTERNS.md`). If a chart genuinely needs a library (brushing, zoom, hundreds of points), propose adding one and ask Victor first; do not add a dependency silently.
- **Maps: MapLibre GL** (`maplibre-gl`) through the existing `src/app/fitness-intelligence/components/europe_map.tsx`. Reuse it rather than starting another map.
- **Tables:** reuse `DataTable` from `src/app/fitness-intelligence/components/data_table.tsx` (sortable, typed columns) or `src/components/ui/table.tsx`.
- **UI primitives:** shadcn-style components in `src/components/ui/` (card, badge, tabs, tooltip, select, table). Icons from `lucide-react`, or MDI path strings as fitness-intelligence does (the MDI webfont is also loaded in `globals.css`).
- **Animation:** framer-motion via `AnimatedSection`, `StaggerContainer`, `StaggerItem`, `AnimatedCard` in `src/components/ui/animated_section.tsx`. Respect `prefers-reduced-motion`.
- **Brand tokens: use `brand-*`, not the shadcn `primary`.** In `tailwind.config.js` the shadcn `primary` / `ring` CSS variables in `globals.css` are still the default blue (`hsl(221 83% 53%)`), not Massimino's. Use `bg-brand-primary` / `text-brand-primary` (`#2b5069`), `hover:bg-brand-primary-dark` (`#1e3d52`), `brand-primary-light` (`#3d6a85`), `bg-brand-secondary` (`#fcfaf5`, the body background) and `brand-secondary-dark` (`#f5f0e8`). Semantic scales exist for data: `safety.green/yellow/red/blue` for status, `fitness.muscle/cardio/flexibility/nutrition` for training categories, `role.client/trainer/admin`. Reuse those mappings consistently.
- **Type:** Nunito Sans is the body font (loaded in `src/app/layout.tsx`, variation settings in `globals.css`); Lato is secondary. Use `tabular-nums` on every figure.
- **English only.** There is no i18n layer in this repo: write copy inline in British English. Do not introduce a translation system for one dashboard.
- **Public routes:** export Next `metadata` (title, description, openGraph) from the page, as fitness-intelligence does. Add a line to `public/llms.txt` if the page is a public data asset.
- **Responsive:** mobile first, checked at sm 640, md 768, lg 1024, xl 1280 and 2xl 1536 (CLAUDE.md).

### Target B: a standalone HTML dashboard

For partner decks (gym chains, brand partners), investor figures and artifacts. One self-contained file: inline CSS, inline SVG or inline chart code, no external requests except Google Fonts. Must render correctly in isolation.

Use the Massimino brand tokens (full shell in `PATTERNS.md` Part 2):

```
Font        'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
            font-variation-settings: "wdth" 100, "YTLC" 500;   (700/800 for display)
Secondary   'Lato', sans-serif   (captions, table text, footnotes)

primary        #2b5069    Massimino blue, headings, CTA, the "pay attention" highlight
primary-light  #3d6a85    hover, secondary series
primary-dark   #1e3d52    text on cream, dark bands
cream          #fcfaf5    page background
cream-dark     #f5f0e8    card and section tint
good           #10b981    safe, on target (safety.green)
warn           #f59e0b    review, near threshold (safety.yellow)
danger         #ef4444    risk, breach (safety.red)
```

Logo: `public/massimino_logo.png` (mark, 1024x1024) or `public/massimino_logo_word.png` (mark plus wordmark, 1536x1024). Both are RGB **without alpha** on a cream background: use as-is on cream or white; on dark bands place the mark inside a cream disc rather than inverting it (inverting turns the whole square into a block). Do not use `public/massimino-logo.svg`: it is an off-brand placeholder (blue `#3B82F6` circle with a generic dumbbell).

Colour is a signal, not decoration. Brand neutrals for chrome, one highlight colour for "pay attention", one reserved colour for risk. Eight to twelve distinct hues is plenty for categories: never a rainbow. Reuse colour mappings for recurring dimensions, so if cardio is cyan on one page it is cyan on every page.

## Step 8: Audit before shipping

Run every line. Report honestly which ones fail rather than quietly fixing the easy ones.

**Scope and structure**
- [ ] The three questions are written down, and every widget maps to one
- [ ] The ten-second test passes for the top two questions
- [ ] The core view fits one laptop screen; detail lives in a drill-down or a details tab
- [ ] Top-left card answers "good or not?"
- [ ] Inverted pyramid holds: status on top, trend in the middle, detail at the bottom

**Data**
- [ ] Every number has a named source; nothing is invented
- [ ] Every KPI has a comparison (target, prior period, or benchmark)
- [ ] Units are in the labels, and the active date range is visible
- [ ] An explicit "last updated" timestamp is on the page
- [ ] Caveats are noted where the number is not what it appears

**Visual**
- [ ] Each chart is the right type for its question (Step 5 table)
- [ ] No many-slice pies, no dual axes, no 3D, no unsorted heatmaps
- [ ] Card anatomy is identical everywhere: Label, Value, Delta, Time frame
- [ ] Legends sit beside their charts; filters sit in one consistent place
- [ ] Non-data ink removed: no gridline clutter, no decorative icons
- [ ] No duplicate metrics that track each other perfectly

**Accessibility** (non-negotiable, not a nice-to-have)
- [ ] Contrast at least 4.5:1 for body text
- [ ] Colour is never the only cue: labels, icons or patterns back it up
- [ ] Palette checked for colour blindness (ColorBrewer is the reference)
- [ ] Logical tab order following the visual layout; focus ring never hidden
- [ ] All filters, date pickers, sliders and tooltips operable by keyboard
- [ ] Tables marked up with `thead`, `tbody` and scoped headers
- [ ] Complex charts carry a one-line text takeaway or readable summary
- [ ] Live updates announce politely, without flooding

**Responsive** (mandatory per CLAUDE.md)
- [ ] Renders correctly at 1536px, 1280px, 1024px, 768px, 640px and 375px (the Tailwind breakpoints plus a small phone)
- [ ] No horizontal page overflow; wide tables and charts scroll inside their own container
- [ ] No clipped content, no illegible text at any breakpoint
- [ ] Audit in the browser at desktop and mobile widths before declaring done

## Step 9: Close the loop

A dashboard is a tool, and tools get worn in. After shipping:

- Run task-based tests: ask someone to do a specific thing ("show me where we missed target last week") and time it, rather than asking whether they like it
- Fix decision-blockers first: unclear labels, missing comparisons, slow loads
- Re-verify formulas after any business change (pricing, attribution, scope), so the maths still matches reality
- Keep a short changelog so stakeholders see what changed
- Schedule a light monthly review: top three pain points, top three wins, next three fixes

## House rules

These override any convention inherited from the source material.

- **No emojis.** Anywhere: code, copy, commit messages, output.
- **No em-dashes.** Use colons, full stops or parentheses. En-dashes are fine for ranges.
- **British English**: visualisation, organisation, optimisation, colour, centre, programme (except where "program" is the product noun already used in the app UI, such as "Training Programs": match the existing UI).
- **Date format**: "19 January 2026", never "January 19, 2026".
- **Never fabricate** a number, an athlete, a testimonial, a partner or a metric. Demo data is badged as demo; anything on the roadmap is badged as roadmap.
- **Safety first**: the brand promise is "Safe Workouts for Everyone". Never frame a metric in a way that rewards unsafe behaviour (for example ranking by fastest weight loss or by training through a flagged injury).
- **Privacy on shared views**: leaderboards, public profiles and trainer views only show what the user has made visible (check `api/leaderboards/privacy` and the public-profile rules before exposing a figure).

## Shipping

- `npm run build` must pass TypeScript. Note the known pre-existing `ENOENT` for `/api/ads` during page-data collection (CLAUDE.md): it is unrelated, but do not introduce new errors.
- Run the dev server and check the page in the browser at desktop and mobile widths. If `localhost:3000` returns a Pages Router 404, check `lsof -i :3000` for a stale process first (CLAUDE.md corrections log).
- Deployment follows the normal Massimino flow; do not commit or push unless Victor asks.

## Reference files

- `PRINCIPLES.md`: the full distillation of the DataCamp tutorial, with the source's own examples and the reasoning behind each rule. Read when you need the "why" or want to explain a decision to Victor.
- `PATTERNS.md`: copy-ready layout skeletons and chart recipes for both targets: KPI card, bullet chart, sparkline row, choropleth caption card, top-rail and left-rail shells, as typed React SVG components and as plain inline SVG.
