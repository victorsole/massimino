---
name: reframe
description: Massimino's SEO/GEO/AEO analysis-to-implementation pipeline. Two modes. OWN mode turns an external input (a template, an article, a competitor page, a thesis, a partner brief) into a shipped, on-brand page or section of massimino.fitness, running Analysis then Proposal then Implementation (Next.js 14 App Router + TypeScript + Tailwind brand tokens, English only, metadata + JSON-LD + llms.txt kept in sync, responsive audit in Chrome at the CLAUDE.md breakpoints, verify with npm run build, deploy is a Vercel git push that only happens with Victor's explicit OK). EXTERNAL mode audits and reframes any other website (a competitor fitness app, a gym, a trainer, a partner such as MU Amsterdam, Quota Vita or Pump Gymwear): it fetches the live site via the browser tools or WebFetch, scores it on the three-layer GEO/AEO checklist (organisation + product/service + ideas/positions), and delivers an audit plus a reframe proposal, optionally an HTML mockup; it NEVER deploys anything. Bakes in the house guardrails (no emojis, no em-dashes, British spelling, Solé with accent, honesty: no fabricated metrics, users, testimonials or results, roadmap badged as roadmap, no medical claims). Use when Victor pastes something to "apply to the site", "reframe X", asks to restructure a Massimino page, OR gives a URL / F12 dump and asks to analyse, audit or reframe another website. Trigger on "reframe", "apply this to the site", "turn this into a page", "restructure the [page]", "audit this site", "analyse this website", "GEO audit", "competitor site".
argument-hint: "a source to apply (paste, file path or URL) for OWN mode, or a non-massimino.fitness URL for EXTERNAL mode"
---

# reframe: Massimino page pipeline (analysis -> proposal -> implementation)

Turn an external input into a shipped, on-brand Massimino page or section, or into an audit of someone else's site. Three phases. Do not skip the Proposal phase or the audit: shipping unverified or off-brand is the failure mode this skill exists to prevent.

Related skills: `seo-audit` (technical and on-page SEO), `search-visibility` (AI/search visibility), `schema-markup` (JSON-LD implementation), `ai-seo` (GEO/AEO content). Hand off to them for depth; this skill owns the end-to-end pipeline.

Optional reading for the section method below: Victor's structural template from the Beresol repo, `/Users/victorsole/Developer/beresol-eu-advocacy-hub/docs/ai_discoverability/plantilla_estructura.docx` (Spanish; extract with `unzip -p file.docx word/document.xml`). Not required.

---

## Modes: pick one first

- **OWN** (the target is `massimino.fitness`, or a route in this repo): the full three-phase pipeline below, ending in a build in THIS repo. Default when Victor says "apply to the site" or names a Massimino route.
- **EXTERNAL** (any other website: a competitor fitness app, a gym chain, a trainer, a partner): run Phase 1 against the live site, then Phase 2 as an audit + reframe proposal. **Do the "External site analysis" section instead of the build.** Never build in this repo for someone else's site, and never touch a site Massimino does not control.

State which mode you are in before starting. If a URL or an F12 dump is given, it is EXTERNAL unless the URL is massimino.fitness.

---

## External site analysis (EXTERNAL mode)

### Get the site yourself
Prefer fetching it live: `WebFetch` for static pages, or the Chrome tools (`navigate` + `read_page` for the heading/accessibility tree + `get_page_text` + a screenshot) for JS-rendered ones. Only ask Victor to paste F12 "Elements" (rendered DOM) or "View Source" when the site is auth-gated, geo-blocked, bot-walled, or so client-rendered that fetching returns an empty shell. Note which you used: "the bot sees an empty shell" is itself a finding (the site is invisible to AI crawlers). For app-store-only competitors, audit the marketing site plus the store listing text.

### Score the three-layer GEO/AEO checklist
Grade each present / partial / missing, with evidence:
1. **Organisation (entity grounding):** JSON-LD `Organization` (or `SportsActivityLocation` / `ExerciseGym` / `HealthClub` for gyms, `Person` for trainers), `sameAs` to Wikidata / LinkedIn / Instagram / app stores, consistent name-address, a plain H1 that says what they are.
2. **Product / service:** `SoftwareApplication` / `MobileApplication` for apps, `Product` + `Offer` for shops (apparel, supplements), `Service` / `Course` / `ExercisePlan` for coaching and programmes; clear offer and pricing statements, not just brochure prose.
3. **Ideas / positions (the differentiator):** is their training philosophy machine-readable and quotable (safety, evidence base, who it is for, what they refuse to do)? `Article` / `FAQPage` / `HowTo`, question-shaped answers, dated positions? Or are their ideas trapped in Instagram captions, videos and hero images an LLM cannot read?
4. **Structure:** exactly one H1, clean heading hierarchy, a coherent section stack.
5. **AEO:** FAQ schema, quotable direct answers ("is X safe for beginners", "how many days a week"), comparison-ready facts.
6. **Freshness + internal linking + topic clusters** (exercise library, programmes, blog); **hreflang** if multilingual.
7. **Machine-readability:** does a no-JS fetch see the real content? Meta title/description, canonical, `robots.txt`, `llms.txt`, sitemap.

### Deliver
- A **scored audit** (the seven dimensions, present/partial/missing + evidence + the single highest-return fix first).
- A **reframe proposal**: the section-by-section structure their key page should have, the H1 they should lead with, the schema to add, and the ideas layer they are missing.
- Optionally an **HTML mockup** of the reframed key page (self-contained, neutral or the audited brand, never passed off as theirs publicly). Never invent their metrics, reviews or quotes.
- For competitors, end with **"What Massimino should take from this"**: concrete, honest gaps or wins for massimino.fitness, which can become an OWN-mode run.
- Offer to save the audit to `docs/audit/external/<site>.md` (the `docs/audit/` folder already exists).

Guardrails still apply (no emojis, no em-dashes, British spelling, honesty). In an EXTERNAL audit you naturally name the site audited and its competitors; in OWN copy do not name competitors.

---

## Phase 1: Analysis

Read the source **top to bottom** before proposing anything. The source is one of: a template, an article or study, a competitor page, a partner brief, a LinkedIn post, a strategy note in `docs/`.

Produce, for Victor:
1. **What it actually is** (a method? a thesis? a claim?). For a docx, extract text with `unzip -p file.docx word/document.xml` then parse paragraphs.
2. **The reusable core:** the transferable method or argument, in Massimino's own words.
3. **The translation to Massimino:** the fit, honestly, including where it does NOT hold (e.g. a B2B SaaS pattern that does not suit a consumer fitness community).

Hard rule: **never name other companies in OWN output copy** (except current partners on partner surfaces). Analogies are described, not attributed.

---

## Phase 2: Proposal (do not code yet)

Map the analysis onto a concrete Massimino route. Propose, then lock decisions with `AskUserQuestion` before building.

### Section method (apply to every page)
Every page is a stack of numbered sections. For each section specify four things:
1. **Structure:** the heading skeleton: exactly **one H1** per page, then a disciplined H2 / H3 hierarchy.
2. **Content:** heading text, copy, and **every CTA written with its destination route** (internal linking designed up front: `/signup`, `/exercises`, `/massiminos`, `/fitness-intelligence`, `/teams/discover`, `/partnerships`).
3. **Visuals:** cards, galleries, accordions, API-driven content, video loops, self-hosted exercise images (see CLAUDE.md: avoid the ExerciseDB CDN).
4. **SEO rationale:** give machines a plain statement of what the thing is; FAQ marked up as `FAQPage`; dynamic proof via real data for freshness.

Doctrine to honour:
- Primary keyword / plain category statement in the **H1** ("Safe workout logging and training programmes for everyone", not a slogan alone). The tagline "Safe Workouts for Everyone" can sit beside it.
- **Trust signals above the fold**, real numbers only (e.g. the exercise count, only if the database confirms it today).
- **Topic-cluster links** (exercise library, programmes, Fitness Intelligence, public profiles).
- **FAQ with schema** as the answer-engine layer. There is no FAQ component yet; propose one (e.g. `src/components/seo/page_faq.tsx` emitting `FAQPage` JSON-LD) and reuse it. Include at least one question that states Massimino's *ideas* (safety first, evidence-based programming, trainer oversight), not just identity and features: the three-layer move.
- Audience segmentation (athletes, trainers, teams, partners) and social proof get their own sections.

### The proposal deliverable
A section-by-section map (what stays / changes / is new), the exact H1 + supporting line, and the open decisions. Recommend, do not survey. Then `AskUserQuestion` for the genuine forks (headline, where it lives, how to badge anything not yet live, how much existing content to keep). Wait for answers.

---

## Phase 3: Implementation, audit, verify, deploy (OWN mode)

### Build
- Next.js 14 **App Router**, TypeScript, Tailwind. Prefer **server components**; many existing pages (including `src/app/page.tsx`) are `'use client'`, so put interactive parts in child client components rather than marking a whole new page client-side. Follow patterns in `src/components/` (`ui/` primitives, `ui/animated_section.tsx`, `framer-motion` reveals).
- **Brand tokens:** `brand-primary` `#2b5069`, `brand-secondary` `#fcfaf5`; `font-display` (Nunito Sans) for headings, `font-body` (Lato) for body (see `tailwind.config.js`). Do not introduce new colours or fonts.
- **Language:** the site is **English only** (`<html lang="en">`, no i18n library). Write British English. Do not add i18n scaffolding unless Victor asks; keep genuine quotes in their original language.
- Reuse real data (`public/databases/`, Supabase/Prisma, `src/app/api/partners/route.ts`, Fitness Intelligence data). **Never fabricate** metrics, users, testimonials, reviews, transformations or integrations. No medical or guaranteed-result claims.
- Anything not shipped (e.g. store availability of the Capacitor apps if not yet live, wearables if not live) is **badged as roadmap** ("Coming soon" / "Where we are heading"), never claimed live.
- Respect CLAUDE.md known issues (navigation back-to-Programs bug, missing exercise media, missing exercises) and do not make them worse.

### SEO sources to keep in sync (do not forget)
- **Metadata:** `export const metadata` / `generateMetadata` in the route's `page.tsx` or `layout.tsx` (root defaults in `src/app/layout.tsx`). A `'use client'` page cannot export metadata: add or edit a `layout.tsx` in that route segment.
- **JSON-LD:** none exists in `src/` yet. Add it server-side as `<script type="application/ld+json">` (use the `schema-markup` skill): `Organization` + `WebSite` at the root, `SoftwareApplication` for the app, `FAQPage` where there is an FAQ, `Dataset` for Fitness Intelligence, `Person` / `ProfilePage` for public profiles.
- **`public/llms.txt`**: update its feature list and "Public Pages" when a public route or claim changes.
- **`public/robots.txt`**: keep new public routes crawlable. There is no sitemap yet; propose `src/app/sitemap.ts` if the change adds public routes.
- Verify after build or on the dev server: `curl -s http://localhost:3000/<route> | grep -o '<title>[^<]*</title>'` and grep for the meta description and `ld+json`.

### Audit in Chrome (mandatory)
Load the Chrome tools (`ToolSearch` the `mcp__claude-in-chrome__*` set in ONE call), run `npm run dev` (before starting, check `lsof -i :3000` for a stale process per CLAUDE.md), open `http://localhost:3000/<route>` and check at the CLAUDE.md breakpoints: **mobile 375-390**, **sm 640**, **md 768**, **lg 1024**, **xl 1280**, **2xl 1536** (at minimum 390, 768 and 1440 if time is short; mobile is never optional):
- No H1 or content hidden behind the fixed header.
- No page-level horizontal overflow; wide content (tables, charts, maps) scrolls **inside its own `overflow-x-auto` box**.
- Grids collapse via `sm:`/`md:`/`lg:` prefixes; CTAs wrap; tap targets at least 44px on mobile.
- Contrast holds over video/imagery; scroll reveals settle (screenshot after the animation).
- Exercise media loads (no broken images); no console errors.
If `resize_window` reports success but the view stays desktop, retry once.

### Verify
- `npm run build` must pass for your changes. It has a **known pre-existing failure** (`ENOENT` during page-data collection for `/api/ads`, see CLAUDE.md): if that is the only error, report it as pre-existing and confirm TypeScript and your routes compiled; `npm run type-check` (`tsc --noEmit`) is a useful fast check.
- Do not delete `scripts/patch-next-server.js` or remove it from `postinstall`.

### Guardrails (enforce automatically, every phase)
- No emojis. No em-dashes (use colons, periods, parentheses; en-dashes fine for ranges). British spelling (programme, organisation, optimise, centre). Always **Solé** with the accent (Victor Solé, founder).
- Honesty over polish: report live vs roadmap truthfully; no invented proof; no health claims beyond what a source supports.

### Deploy (only with Victor's explicit OK; it is outward-facing)
- Massimino deploys on **Vercel** from `main` on `github.com/victorsole/massimino`; the domain is at IONOS (see the `ionos` skill for DNS). A deploy is a commit + `git push`.
- **Never commit or push without Victor's explicit OK** for that specific push. Stage only the files you changed (the working tree often has unrelated modifications), show the diff summary, and ask. `/commit-push-pr` exists if Victor prefers a PR.
- After Victor pushes (or approves your push), verify live: the route returns 200 on `https://massimino.fitness/<route>`, `curl -s ... | grep -o '<title>[^<]*</title>'` shows the new title, and the JSON-LD is present.

### Close out
Record any new learning as a Corrections Log entry in CLAUDE.md (only if it is a real mistake to avoid) and summarise what shipped vs what is roadmap.

---

## Reference files
- Project rules: `CLAUDE.md` · Root metadata + fonts: `src/app/layout.tsx` · Tokens: `tailwind.config.js`
- AI discoverability: `public/llms.txt`, `public/robots.txt` · Partners: `src/app/api/partners/route.ts`
- Existing audits: `docs/audit/` · GEO notes: `docs/llmsandspa.md`
- Origin: adapted from Victor's Beresol `reframe` skill (2026-09).
