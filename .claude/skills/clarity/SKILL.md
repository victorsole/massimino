---
name: clarity
description: The playbook for putting Microsoft Clarity to work on Massimino (massimino.fitness) as free behavioural + AI-visibility analytics. Covers the GEO/AEO mental model it plugs into (grounding queries, share of authority, owed answers, confirm-not-convince, iterative rhythm), what Clarity gives you (heatmaps, session replay, Copilot analyst, Smart Events, Data Export API, MCP server), and the exact Massimino implementation: a consent-gated Next.js App Router loader wired to the existing cookie banner (`massimino_cookie_consent`, `useCookieConsent()`), the CSP change in next.config.js, the privacy + cookies page disclosure, and the MCP + Data Export read-out. Use when someone wants to add Clarity to Massimino, wire analytics consent correctly, disclose it for GDPR, or query the Massimino Clarity project via MCP or the Data Export API. Triggers: "/clarity", "Microsoft Clarity", "add Clarity to Massimino", "heatmaps", "session replay", "clarity consent", "clarity mcp", "clarity data export", "behavioural analytics", "analytics on massimino".
argument-hint: "optional: 'install' (consent-gated loader + banner wiring + CSP), 'disclose' (privacy/cookies page wording), or 'read' (MCP / Data Export analysis). Default: explain, then propose the fit."
allowed-tools: ["Read", "Bash", "Edit", "Write", "Grep", "Glob", "WebFetch"]
---

# clarity: behavioural + AI-visibility analytics for Massimino

Operational playbook for wiring Microsoft Clarity into Massimino (Next.js 14 App Router on Vercel, domain massimino.fitness). The method was originally distilled at Beresol; this copy is specific to this repo.

Current state (verified in the repo, re-check before acting): **no analytics is installed** (no Clarity, GA, PostHog or Vercel Analytics). The cookie banner exists and stores an `analytics` flag, but nothing reads it to load a script yet.

Clarity is **free with no traffic cap**, so it is viable as an always-on instrument for Massimino.

Guardrails (house rules, not Clarity rules): no emojis, no em-dashes (use colons, periods, parentheses; en-dashes only for numeric ranges), British spelling in prose (optimise, organisation, behaviour), Solé with the accent, honesty over polish (report what is live vs roadmap, never invent metrics), and never enter credentials or tokens into a web form on the user's behalf. Clarity-specific honesty rule: **consent and disclosure are not optional and not an afterthought**; a Clarity install that loads before consent or is undisclosed is a defect, not a shortcut.

---

## The mental model (why Clarity, and why now)

Clarity is not "another traffic counter". It is the behavioural evidence layer under the shift to answer engines.

1. **One question becomes many hidden searches.** When someone asks an AI "what is a safe beginner hypertrophy programme" or "how do I log RPE", that single prompt fans out into many hidden queries. The answer is assembled from whatever the models can find, understand and trust.
2. **Share of authority, not share of traffic.** The real metric is what proportion of answers in a field (safe training, exercise technique, European fitness market data) are built from Massimino's pages versus someone else's. Every answer a competitor wins is a page Massimino owes.
3. **AI visitors come to confirm, not to be convinced.** A model arrives with a prior and checks whether the site confirms it. Clear, consistent, structured signals let it confirm Massimino. Structure beats persuasion.
4. **Behaviour is the missing evidence.** Rankings say you were seen. Heatmaps and replays say whether the page worked: where people hesitate on signup, give up in the workout logger, or never reach the programme they came for.
5. **It is a rhythm, not a deadline.** Content, competitors and the models keep moving, so discoverability is tended on a cadence.

---

## What Clarity gives you (the toolkit)

- **Heatmaps**: click, scroll and area maps per page.
- **Session replays**: anonymised recordings of real visits (rage clicks, dead clicks, hesitation, quick-backs).
- **Copilot analyst**: a built-in AI that summarises sessions and answers plain-language questions about behaviour.
- **Smart Events**: auto-detected key actions (sign-ups, CTA clicks) without hand-coded tracking.
- **Dashboards**: engagement, dead/rage clicks, scroll depth, JS errors, popular pages, sources.
- **Data Export API**: pull metrics as JSON for your own reports and audits.
- **MCP server**: query a project directly from an AI assistant, so analysis becomes conversational.
- **Client API**: `clarity('consent' | 'identify' | 'set' | 'event')` plus `data-clarity-mask` / `data-clarity-unmask` attributes for privacy control. The project ID *is* the client API key, no cost.

### Clarity's AI-visibility reports (the GEO core)
- **Bot activity ("Is AI finding me?")**: which AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Copilot) reach the site, what they take, what they ignore. Cross-check against `public/robots.txt`, which allows these bots but disallows `/api/`, `/dashboard/`, `/profile/`, `/messages/`, `/workout-log/`.
- **Citations ("How am I showing up in answers?")**: the *grounding queries* the assistant ran and when Massimino pages were used as a source.
- **Topic Insights ("Where are competitors winning that I'm not?")**: topics/prompts/competitors with **share of authority** plus recommended actions.
- **Copilot in Clarity**: Chat, Session Insights, Grouped Session Insights, Heatmap Insights, Ad Campaign Insights.

---

## Implementation on Massimino

### 1. Create the project and get the ID
In `clarity.microsoft.com`, create a project for `massimino.fitness`. Decide whether `bio.massimino.fitness` (used as the canonical host for `/bio/[username]` pages) is covered by the same project or not.

- Project ID: `TODO_CLARITY_PROJECT_ID` (not created yet as far as the repo shows). It is public (it ships in the page), so it can live in code or in `NEXT_PUBLIC_CLARITY_PROJECT_ID` on Vercel.
- API token (JWT, used for Data Export and MCP): secret. Keep it in `.env.local` / shell env and never commit it. `TODO: create token in Clarity Settings > Data Export`.

### 2. How the existing consent works (read this before writing the loader)
`src/components/ui/cookie_consent.tsx`:
- Mounted from `src/components/layout/Layout.tsx` (both layout branches render `<CookieConsent />`), which is wrapped by `src/app/layout.tsx`.
- Stores `localStorage['massimino_cookie_consent']` as JSON: `{ essential: true, analytics: boolean, marketing: boolean, timestamp: number }`. "Accept All" sets analytics true; "Essential Only" and the close button set it false; "Customize" lets the user toggle it.
- Exports `useCookieConsent()`, which **reads localStorage once on mount and never updates**. It does not react to a choice made later in the same page view, and `savePreferences()` dispatches no event. So a loader built on the hook alone would only start on the *next* navigation or reload after the visitor accepts.

The install must therefore add a change signal. Minimal change to `savePreferences()`:

```ts
const savePreferences = (prefs: CookiePreferences) => {
  const toSave = { ...prefs, timestamp: Date.now() };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(toSave));
  window.dispatchEvent(new CustomEvent('massimino-consent-changed', { detail: toSave }));
  setIsVisible(false);
};
```

And make `useCookieConsent()` listen for it (plus the `storage` event for other tabs), so every consumer reacts live:

```ts
export function useCookieConsent(): CookiePreferences | null {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
        setConsent(stored ? JSON.parse(stored) : null);
      } catch { setConsent(null); }
    };
    read();
    window.addEventListener('massimino-consent-changed', read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener('massimino-consent-changed', read);
      window.removeEventListener('storage', read);
    };
  }, []);
  return consent;
}
```

Also note: there is currently no way to reopen the banner after a choice is made (it only shows when the key is absent). A "Cookie settings" link (e.g. in the footer or on `/cookies`) that clears or edits the preference is needed for consent to be withdrawable as easily as it was given.

### 3. The consent-gated loader (Next.js App Router)
This is Clarity's canonical tag (Setup > Install manually), wrapped so it only runs after analytics consent. **Do not paste the raw tag into `<head>`** in `src/app/layout.tsx`: it would set cookies on first paint, before consent.

Create `src/components/analytics/clarity_analytics.tsx` (follow the repo's snake_case file naming for UI components, check neighbours first):

```tsx
'use client';

import Script from 'next/script';
import { useCookieConsent } from '@/components/ui/cookie_consent';

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID; // TODO_CLARITY_PROJECT_ID

export function ClarityAnalytics() {
  const consent = useCookieConsent();
  if (!CLARITY_PROJECT_ID || !consent?.analytics) return null;

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
        window.clarity("consent");`}
    </Script>
  );
}
```

Mount it once in `src/app/layout.tsx`, inside `<body>` next to the existing `<Script>` tags (service worker, Facebook SDK): `<ClarityAnalytics />`. `next/script` with a fixed `id` only injects once per page lifetime.

Withdrawal: if a visitor later turns analytics off, unmounting the component does not unload an already-running script. On a `false` transition, call `window.clarity?.('consent', false)` and treat the next reload as the clean state.

Optional (identify signed-in users): do not send email or name. If you need it, call `clarity('identify', <hashed NextAuth user id>)` only after consent, and disclose it.

### 4. Allow Clarity in the Content Security Policy
`next.config.js` enforces a CSP in production (Report-Only in dev, so a missing entry only breaks on Vercel). Clarity will be blocked until you add:
- `script-src`: `https://www.clarity.ms https://*.clarity.ms`
- `connect-src`: `https://*.clarity.ms https://c.bing.com`
- `img-src` already allows `https:`.

Verify on a Vercel preview, not only in `next dev`.

### 5. Mask sensitive surfaces
Clarity masks form inputs by default (Balanced mode). On Massimino, additionally mark with `data-clarity-mask` anything showing health or personal data: nutrition logs, body metrics, Massichat conversations (`/massichat`, `/dashboard/ai-coach`), direct messages (`/messages`), payment and business screens. Consider setting the project to Strict masking, since workout and nutrition data can be health-adjacent under GDPR. Exclude `/admin` entirely (Clarity URL exclusion or do not mount the loader under the admin layout).

### 6. Disclose it (privacy + cookies pages)
- `src/app/privacy/page.tsx` (markdown string `PRIVACY_MD`): in section 11 "Cookies and tracking technologies", name Microsoft Clarity, what it captures (behavioural metrics, heatmaps, session replay via first- and third-party cookies), that it only loads with analytics consent, that sensitive fields are masked, retention, that Microsoft may process data per the Microsoft Privacy Statement, and international transfers (standard contractual clauses). Bump "Last Updated".
- `src/app/cookies/page.tsx`: add rows to the cookie table where the comment says `{/* Add analytics/marketing rows here if/when enabled (e.g., _ga) */}`: `_clck`, `_clsk` (and `CLID`, `ANONCHK`, `MR`, `MUID`, `SM` as set by clarity.ms/bing.com; confirm the current list against Clarity's docs before publishing). While there, note the table lists the consent entry as `cookies-consent`, but the code actually uses localStorage key `massimino_cookie_consent`; fix the name.
- `src/app/legal/subprocessors/page.tsx`: add Microsoft Corporation (Clarity) alongside Vercel and Supabase.
- Supervisory authority: the controller is Massimino, Apeldoorn, Netherlands (per the privacy page), so the Autoriteit Persoonsgegevens.

### 7. Verify, build, deploy
- Local: `npm run dev` (see CLAUDE.md corrections log about stale processes on :3000). With no consent, DevTools Network shows nothing from `clarity.ms`. Click Accept All: `https://www.clarity.ms/tag/<id>` loads in the same page view (this proves the event wiring). Essential Only: never loads.
- `npm run build` for type errors (the `/api/ads` ENOENT failure is pre-existing, see CLAUDE.md).
- Deploy is Vercel (push to the production branch). Set `NEXT_PUBLIC_CLARITY_PROJECT_ID` in Vercel project env for Production (and Preview if wanted). Re-check CSP on the live domain.
- Mobile viewport check, per CLAUDE.md.

### 8. Read it through Copilot, MCP and the Data Export API
- **MCP server**:
  ```bash
  npx @microsoft/clarity-mcp-server --clarity_api_token=<JWT>
  ```
  In Claude Code, add to `.mcp.json` at the repo root (committable; the token is expanded from shell env `${VAR}`, NOT auto-loaded from `.env`):
  ```json
  { "mcpServers": { "clarity": {
      "command": "npx",
      "args": ["-y", "@microsoft/clarity-mcp-server", "--clarity_api_token=${CLARITY_MCP_TOKEN}"]
  } } }
  ```
  Then `export CLARITY_MCP_TOKEN=<JWT>` persistently (e.g. `~/.zshrc`), restart the client, accept the workspace-trust dialog. Tools: `query-analytics-dashboard`, `list-session-recordings`, `query-documentation-resources`. (`.mcp.json` does not exist in this repo yet: TODO.)
- **Data Export API**:
  ```
  GET https://www.clarity.ms/export-data/api/v1/project-live-insights
      ?numOfDays=1..3 &dimension1=... &dimension2=... &dimension3=...
  Authorization: Bearer <JWT>
  ```
  Limits: about 10 requests/day, last 1 to 3 days only, up to 3 dimensions, 1000 rows, no pagination. Dimensions: Browser, Device, Country, OS, Source, Medium, Campaign, Channel, URL. Metrics: Scroll Depth, Engagement Time, Traffic, Rage/Dead/Quickback/Error click counts, Excessive Scroll, Script Errors.

Good first questions for Massimino: where do visitors drop in `/signup`; do people reach a programme from the homepage; which `/exercises` searches end in rage clicks; how far people scroll on `/fitness-intelligence`; which pages AI bots fetch versus ignore.

---

## GDPR guardrail (never skip)

Load only after explicit analytics consent, mask sensitive fields, name it in the privacy and cookies pages, honour decline (nothing loads) and make withdrawal as easy as consent.

- **Masking** defaults to Balanced; Strict and Relaxed exist. Control per element with `data-clarity-mask` / `data-clarity-unmask`.
- **IP blocking** and URL exclusions keep internal, staging and admin traffic out.
- **Not for services aimed at under-18s**: Massimino's terms require users to be at least 18 (`src/app/terms/page.tsx`), which is compatible. Re-check if that ever changes.
- **CSP**: see step 4.

Side note found while adapting this skill: `src/app/layout.tsx` loads the Facebook SDK (`connect.facebook.net`) unconditionally, not gated on the `marketing` consent flag. That is outside Clarity's scope, but the same consent-gating pattern should be applied to it.

---

## Massimino reference

| Piece | Massimino instance |
|---|---|
| Project ID | `TODO_CLARITY_PROJECT_ID` (env `NEXT_PUBLIC_CLARITY_PROJECT_ID` on Vercel) |
| Consent storage | `localStorage['massimino_cookie_consent']` = `{essential, analytics, marketing, timestamp}` |
| Banner + hook | `src/components/ui/cookie_consent.tsx` (`CookieConsent`, `useCookieConsent()`), mounted in `src/components/layout/Layout.tsx` |
| Consent change event | `massimino-consent-changed` (to be added by the install; does not exist yet) |
| Loader | `src/components/analytics/clarity_analytics.tsx` (to be created), mounted in `src/app/layout.tsx` |
| CSP | `next.config.js` `headers()` |
| Disclosure | `src/app/privacy/page.tsx` (section 11), `src/app/cookies/page.tsx` (cookie table), `src/app/legal/subprocessors/page.tsx` |
| API token / MCP | shell env `CLARITY_MCP_TOKEN`; `.mcp.json` at repo root (TODO) |
| Deploy | Vercel; DNS at IONOS (`.claude/commands/ionos.md`) |

Product facts to keep straight: Clarity is free and unlimited; Consent Mode gates cookies on `clarity('consent')`; Data Export caps at about 10 req/day and 1000 rows over the last 1 to 3 days; the MCP server is `@microsoft/clarity-mcp-server` over stdio.
