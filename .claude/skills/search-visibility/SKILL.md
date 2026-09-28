---
name: search-visibility
description: The hands-on measurement-to-optimisation loop for Massimino's (massimino.fitness) search visibility across Google Search Console (GSC), Bing Webmaster Tools, and AI answer engines (Bing Copilot citations). Turns the CSV exports from both consoles into a ranked list of real opportunities, then ships the on-page fixes in the Next.js App Router codebase (title front-loading the ranking query via `metadata`/`generateMetadata`, answer-first subheads, FAQ + FAQPage schema, canonical and host hygiene, sitemap.ts, real 404s), pings IndexNow after the Vercel deploy, and closes the loop with request-indexing and a re-measure date. Use when someone shares a GSC or Bing export for Massimino, asks "why isn't Massimino ranking / getting clicks", wants to read a Coverage/Performance report, set up or fire IndexNow, add a sitemap, optimise a Massimino page (exercises, programmes, trainer/bio profiles, fitness-intelligence) for a keyword cluster, or wants the manual console steps only a human can do. Triggers: "/search-visibility", "GSC", "Search Console", "Bing Webmaster", "coverage report", "indexnow", "sitemap", "why am I not indexed", "read this SEO export".
argument-hint: "optional: 'read' (analyse exports), 'optimise' (ship on-page fixes), 'indexnow', or 'console' (the human-only walkthrough). Default: read then propose."
allowed-tools: ["Read", "Bash", "Edit", "Write", "Grep", "Glob", "WebFetch"]
---

# search-visibility: the GSC + Bing + AI-answers loop for Massimino

Operational playbook for reading the two search consoles for massimino.fitness, finding the one real opportunity in a sea of noise, shipping the on-page fix in this Next.js repo, and notifying the engines. The method was originally distilled at Beresol; this copy is specific to Massimino.

Related skills in this pack: `seo-audit` (technical/on-page theory, with a Massimino context section), `ai-seo` (GEO/AEO theory), `schema-markup` (JSON-LD how-to), `programmatic-seo`, `site-architecture`, `clarity` (behavioural evidence). This skill is the **hands-on console loop**: reading real exports and shipping real fixes.

Guardrails (house rules, not SEO rules): no emojis, no em-dashes (colons/periods/parentheses; en-dashes only for ranges), British spelling in prose (optimise, organisation, programme), Solé with the accent, honesty over polish (report what is live vs roadmap, never invent metrics or user counts). And the SEO-specific honesty rule: **do not manufacture busywork.** If a page's impressions are long-tail noise, say so and leave it alone; retitling a noise page is worse than doing nothing.

---

## Massimino search surface (verified in the repo; re-check before acting)

Stack: Next.js 14.2 App Router, React 18, TypeScript, Tailwind. Deployed on Vercel; domain registered and DNS managed at IONOS (`.claude/commands/ionos.md`: apex A record to Vercel, `www` CNAME to `cname.vercel-dns.com`). Single language: `<html lang="en">`, no i18n library.

Page types that matter for search, and their current state:

| Page type | Route | Metadata source | Notes |
|---|---|---|---|
| Homepage | `src/app/page.tsx` | root `src/app/layout.tsx` only | `'use client'`, so it cannot export its own `metadata` |
| Exercise database | `src/app/exercises/page.tsx` | root only | `'use client'`; a single browser page. There are **no per-exercise URLs** today (only `/exercises/contribute`), so 1,300+ exercises in `public/databases/` and Supabase are not individually indexable. Biggest programmatic opportunity (see `programmatic-seo`). |
| Programmes | `src/app/workout-log/programs/[id]/page.tsx` | root only | `'use client'`, AND `public/robots.txt` disallows `/workout-log/`, so programme pages are blocked from crawling. Decide deliberately whether programmes should be public before optimising them. |
| Athlete pages | `src/app/workout-log/athletes/[slug]/page.tsx` | root only | Also under the blocked `/workout-log/`. |
| Trainer profiles | `src/app/trainer/[username]/page.tsx` | `generateMetadata` | Public, crawlable. |
| Bio (link-in-bio) profiles | `src/app/bio/[username]/page.tsx` | `generateMetadata` | Canonical and OG URL point to `https://bio.massimino.fitness/<username>` (a subdomain). `next.config.js` also redirects bare `/<username>` to `/bio/<username>`. Whether `bio.massimino.fitness` actually serves on Vercel: `TODO: confirm`. If it does not, those canonicals point at a dead host. |
| Fitness Intelligence | `src/app/fitness-intelligence/page.tsx` | static `metadata` + openGraph | Data page (European fitness market). Strong AEO candidate: answer-first figures + Dataset/FAQ schema. |
| Other public pages | `/community`, `/teams/discover`, `/teams/[id]`, `/massiminos`, `/partnerships`, `/safety`, `/massichat`, `/privacy`, `/terms`, `/cookies`, `/legal/subprocessors` | mixed | `grep -rln "export const metadata\|generateMetadata" src/app` for the current list. |

Known gaps (true at time of writing):
- **No sitemap.** `public/robots.txt` declares `Sitemap: https://massimino.fitness/sitemap.xml`, but there is no `src/app/sitemap.ts` and no `public/sitemap.xml`, so it 404s. Fix: add `src/app/sitemap.ts` (App Router convention) listing static public routes plus trainer/bio profiles (and exercises/programmes if and when they get public URLs).
- **robots is static** (`public/robots.txt`), which is fine; do not also add `src/app/robots.ts` or they conflict.
- **No `metadataBase`** in the root metadata, so relative OG/canonical URLs cannot resolve. Add `metadataBase: new URL('https://massimino.fitness')` to `src/app/layout.tsx`.
- **No JSON-LD** anywhere in `src/` (no Organization, WebSite, Person, ExercisePlan, FAQPage, Dataset).
- **No IndexNow** key file or script.
- `public/llms.txt` exists and is linked from the root `<head>`; keep its "Public Pages" list in step with the sitemap.
- `src/app/not-found.tsx` exists, so unknown App Router URLs should return a real 404 (verify with curl, below).

---

## The mental model

Two engines, three surfaces, one loop.

- **Google** = classic search. Console: **Google Search Console (GSC)**, `search.google.com/search-console`. No IndexNow; it discovers changes via the sitemap `lastModified` and manual "Request indexing".
- **Bing** = classic search AND the substrate for **Copilot / AI answers**. Console: **Bing Webmaster Tools**, `bing.com/webmasters`. Consumes **IndexNow** for near-instant recrawl. Its **AI Performance** panel (Copilot citations) is often the best-performing surface long before classic clicks arrive.
- The loop: **export > read > find the real opportunity > ship the on-page fix > `npm run build` > deploy to Vercel > ping IndexNow > request-indexing in GSC > re-measure in about 3 weeks.**

### The property trap (read this first, every time)
Both consoles can hold a **domain property** (aggregates every subdomain) or a **URL-prefix property** (one exact origin). Massimino has at least two hosts in play: `massimino.fitness` (and possibly `www.massimino.fitness`) and `bio.massimino.fitness` (bio profile canonicals). A domain property blends them. Create **URL-prefix properties** per host (`https://massimino.fitness/`, `https://bio.massimino.fitness/`) so each is measured alone.

Status: `TODO: which GSC properties exist and are verified (domain via IONOS DNS TXT, or URL-prefix)?` `TODO: is Bing Webmaster Tools set up (it can import from GSC)?` `TODO: canonical host, apex or www? Confirm the Vercel domain redirect matches.`

---

## Step 1: pull the exports

Ask the user to download these (or read them if already dropped into the repo; suggested location `docs/marketing/seo/`). File names below are exactly how each console names the download.

**GSC** (in each URL-prefix property, ideally):
- **Coverage / Indexing**: `Indexing > Pages > Export`. Gives `Chart.csv` + a table of issue categories with counts. Drill into a single category and export again for the **per-URL list** (`Table.csv`); the counts alone cannot be actioned.
- **Performance**: `Performance > Search results > Export`. Gives `Queries.csv`, `Pages.csv`, `Countries.csv`, `Devices.csv`, `Search appearance.csv`, `Chart.csv`. This is where the opportunities live.

**Bing Webmaster Tools** (left nav):
- **Search Performance** export (`SearchPerformanceOverview...csv`): daily clicks/impressions/CTR.
- **Site Explorer** (`SiteExplorerUrls...csv`): which URLs Bing actually knows. If it is nearly empty, submit the sitemap (once it exists) + IndexNow.
- **AI Performance** (`AIPerformanceOverviewStats...csv`): Citations + Cited-Pages counts (Copilot). The overview CSV is **counts-only, no URLs**. To learn *which* pages are cited, open the page-level table below the chart and export/screenshot it.

---

## Step 2: read the exports (the interpretations that matter)

### GSC Coverage buckets, decoded
| Bucket | What it usually means | Action |
|---|---|---|
| **Discovered - currently not indexed** | New pages indexing slowly (normal), or thin pages | Monitor. Only worry if it never converts. |
| **Crawled - currently not indexed** | Quality signal: Google crawled and declined (thin/duplicate) | The real quality bucket. Thin trainer/bio profiles with no content are the likely candidates on Massimino; consider `noindex` for empty profiles rather than letting them dilute the site. |
| **Duplicate without user-selected canonical** | Missing self-referential canonical, or near-dupes | Pull the per-URL list. On Massimino, check `/<username>` vs `/bio/<username>` vs `bio.massimino.fitness/<username>` (three forms of one profile), and apex vs www. |
| **Page with redirect** | Redirects Google crawled (http to https, bare username to `/bio/`, www to apex) | Expected/harmless if canonicals and sitemap use the final form. |
| **Blocked by robots.txt** | URLs under disallowed paths (`/workout-log/`, `/profile/`, `/dashboard/`, `/messages/`, `/api/`) | Expected for private areas. If programme pages show here and should rank, that is a product decision, not an SEO bug. |
| **Soft 404** | Server returns 200 + generic content for unknown URLs | Real bug. Check dynamic routes (`/trainer/[username]`, `/bio/[username]`, `/teams/[id]`) call `notFound()` for unknown IDs instead of rendering an empty 200 page. |
| **Not found (404)** | Genuine 404s | Correct and healthy. |

### GSC Performance: find the ONE opportunity
Separate a **real head-term opportunity** from **noise**. A real opportunity is a query with **meaningful impressions (say >50)** at a **catchable position (about 5-15)** whose intent matches a page Massimino owns. Noise is dozens of generic fitness queries at position 50-90 with 0 clicks, where large incumbents will always outrank a young domain.

Recipes (header row is `Top queries,Clicks,Impressions,CTR,Position`):
```bash
cd <dir with Queries.csv Pages.csv>
# top queries by impressions (where visibility is)
tail -n +2 Queries.csv | sort -t',' -k3 -nr | head -25
# a cluster you suspect owns a page
tail -n +2 Queries.csv | grep -iE 'gym penetration|fitness market|europe gym' | sort -t',' -k3 -nr | head -15
# Massimino pages only, by impressions
tail -n +2 Pages.csv | grep -E 'https://(www\.)?massimino\.fitness/' | sort -t',' -k3 -nr | head -20
```
Read position AND CTR together. Pages at position about 10-11 with near-zero CTR are "bottom of page 1": the levers are (a) push position via on-page relevance + internal links, and (b) a title/snippet that earns the click. Pages at position 40-90 ranking for terms they should not: leave them.

### Bing: read the AI win
Classic Bing clicks are often tiny early, but **AI Performance frequently shows traction first**. That is the GEO signal: answer-first, schema-marked content is being cited before it ranks. Double down on exactly the cited pages (Fitness Intelligence is the most likely early candidate).

### The rich-results reality check
`Search appearance.csv` shows which rich results fire. A young domain shows almost none even with valid FAQ/Dataset/Breadcrumb schema, because rich results need site-level trust. Keep the schema (it is correct and it is what LLMs parse), but do NOT promise a CTR lift until Google grants the rich result.

---

## Step 3: ship the on-page fixes (the levers, in order of leverage)

Only touch pages the data justifies.

1. **Title front-loads the ranking query.** Put the exact high-impression query at the FRONT of the `<title>`, brand adjacent. E.g. Fitness Intelligence's current title is `Fitness Intelligence - Massimino`; if the data shows impressions for "europe gym membership statistics", the title should lead with that phrase. Do not change titles without a query to justify it.
2. **Answer-first subhead with the number.** The visible intro should lead with the exact query phrase and a concrete, sourced figure (Fitness Intelligence uses Eurostat and FY2025 data; cite the real number and year, never invent one).
3. **FAQ with FAQPage schema (the AEO layer).** Question-shaped headings with direct, dated, quotable answers. Emit `FAQPage` JSON-LD via a `<script type="application/ld+json">` in a server component. See `schema-markup`. Candidates: Fitness Intelligence, `/safety`, `/massichat`, trainer profiles (`Person`), the homepage (`Organization` + `WebSite`).
4. **One H1 per page; clean heading hierarchy.** Audit it (recipe below).
5. **Canonical + host consistency.** Add `metadataBase` in the root layout, then `alternates: { canonical: '/path' }` per public page. Pick ONE host (apex or www) and make sitemap = canonical = Vercel primary domain. Next.js defaults to no trailing slash (`trailingSlash` is not set in `next.config.js`); keep it that way and keep sitemap URLs slash-free.
6. **Real 404s.** Verify: `curl -s -o /dev/null -w "%{http_code}" https://massimino.fitness/this-does-not-exist-xyz` must be 404. Careful: the bare-username redirect in `next.config.js` sends unknown single-segment paths to `/bio/<path>`, so the 404 has to come from `/bio/[username]` calling `notFound()` (test `/bio/does-not-exist-xyz` too, expect 404 not 200).
7. **Add the sitemap.** `src/app/sitemap.ts` returning `MetadataRoute.Sitemap`; include static public routes and query Prisma for public trainer/bio usernames. Use the canonical host and real `lastModified` values.

### The "second source" in Next.js (the trap that silently wastes every title edit)
In the App Router, the crawler sees the server-rendered `<head>` from `metadata` / `generateMetadata`. **Pages marked `'use client'` (homepage, `/exercises`, programme pages) cannot export `metadata`**, so they silently inherit the root title "Massimino - Safe Workouts for Everyone". Setting `document.title` in a client effect does not help crawlers. To give such a page its own title: add a sibling `layout.tsx` (server component) in that route folder exporting `metadata`, or split the page into a server `page.tsx` that exports metadata and renders the client component. Find the metadata source before editing titles:
```bash
grep -rln "export const metadata\|generateMetadata" src/app
grep -rl "^'use client'" src/app --include=page.tsx
```
Verify after deploy: `curl -s https://massimino.fitness/<route> | grep -o '<title>[^<]*</title>'`.

### Audit before you ship
Next.js does not emit static HTML files for dynamic pages, so audit the running app (local `npm run build && npm run start`, or the Vercel preview URL):
```bash
BASE=http://localhost:3000   # or the Vercel preview URL
for p in / /exercises /fitness-intelligence /community /teams/discover /massiminos /partnerships /safety; do
  html=$(curl -s "$BASE$p")
  t=$(printf '%s' "$html" | awk '/<\/head>/{exit}1' | grep -o '<title>' | wc -l | tr -d ' ')
  h=$(printf '%s' "$html" | grep -oE '<h1[ >]' | wc -l | tr -d ' ')
  echo "$p head-title=$t h1=$h"
done
```
Client-rendered H1s will not appear in the curl output; for `'use client'` pages check in the browser too. Remember the known pre-existing `npm run build` failure on `/api/ads` (CLAUDE.md).

---

## Step 4: notify the engines (IndexNow) and wire it into deploy

**IndexNow** pings Bing + Yandex to recrawl changed URLs instantly. Free, no API key beyond a key file.

Setup (one-off, not done yet):
1. Generate a key (32 hex chars, e.g. `openssl rand -hex 16`) and commit it as `public/<key>.txt` containing only the key string. Vercel serves it at `https://massimino.fitness/<key>.txt`. The bare-username redirect in `next.config.js` excludes paths containing a dot, so the key file is not redirected (verify with curl after deploy). Key: `TODO_INDEXNOW_KEY`.
2. Add a submit script, e.g. `scripts/indexnow.mjs`, that fetches `https://massimino.fitness/sitemap.xml` (requires the sitemap from Step 3), extracts the URLs, and POSTs `{ host, key, keyLocation, urlList }` to `https://api.indexnow.org/indexnow`. Dry-run by default, `--run` to submit. Add `"indexnow": "node scripts/indexnow.mjs --run"` to `package.json` scripts.
3. Expect `200` or `202`. `403` = key file not reachable yet; `422` = host/URL mismatch.

**Wire it into deploy.** Vercel deploys on push, with no post-deploy step in this repo. Options, in order of simplicity: run `npm run indexnow` manually after a production deploy that changed public pages; or a GitHub Action triggered on Vercel's `deployment_status` success event. Do not call IndexNow from `next build` (it runs before the new pages are live). Google has no IndexNow: it relies on the sitemap `lastModified` plus manual Request-indexing for anything urgent.

---

## Step 5: the human-only console actions (the walkthrough to hand over)

Claude cannot log into the consoles. Deliver these as explicit click-paths and say what to send back.

**Google Search Console:**
1. **Verify / split the property.** Domain property via DNS TXT record at IONOS (see `.claude/commands/ionos.md` for the DNS panel), then add URL-prefix properties `https://massimino.fitness/` and `https://bio.massimino.fitness/` (they auto-verify once the domain is DNS-verified).
2. **Submit the sitemap** once `src/app/sitemap.ts` is live: Sitemaps > `https://massimino.fitness/sitemap.xml`.
3. **Request indexing** for every page just changed: URL-inspection bar > paste URL > Request indexing (use the canonical host, no trailing slash).
4. **Export the per-URL list** for any actionable bucket and send it back.
5. Optional: **baseline** the target queries in Performance so the before/after is measurable.

**Bing Webmaster Tools:**
1. Add the site (import from GSC is quickest) and **submit the sitemap**.
2. **Confirm IndexNow** registered: the IndexNow panel shows the key and recent submissions.
3. **AI Performance > page-level table**: export or screenshot the **cited-pages URL list** and send it back.

**Then re-measure in about 3 weeks.** Watch two things: does the front-loaded query climb toward the top of page 1, and does the retitled page move off position 40-60 for its head term.

---

## Massimino reference

- Metadata: root `src/app/layout.tsx`; per-page `metadata` / `generateMetadata` (grep above). No `metadataBase` yet.
- robots: `public/robots.txt` (static; allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended; disallows `/api/`, `/dashboard/`, `/profile/`, `/messages/`, `/workout-log/`).
- llms.txt: `public/llms.txt`, linked from the root `<head>`.
- Sitemap: none yet (`src/app/sitemap.ts` to be created).
- IndexNow: none yet (`public/<key>.txt` + `scripts/indexnow.mjs` to be created).
- Redirects and CSP: `next.config.js` (http to https, bare `/<username>` to `/bio/<username>`).
- Build: `npm run build`. Deploy: Vercel. DNS: IONOS (`.claude/commands/ionos.md`).
- Exports archive: `docs/marketing/seo/` (create when the first export arrives).
- Open TODOs: GSC/Bing property status, canonical host (apex vs www), whether `bio.massimino.fitness` is live on Vercel, IndexNow key, whether programme pages should be public.
