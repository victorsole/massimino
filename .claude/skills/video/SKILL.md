---
name: video
description: Produce a short, event-driven marketing video about Massimino (massimino.fitness) for Instagram + LinkedIn. Starts from a real fitness, health or sport event of the day (a WHO physical-activity report, a marathon, a sports-science study, new Eurostat health data, a partner gym or brand event), proposes a top-3, picks one, and ties it to how Massimino helps through ONE or TWO surfaces (Fitness Intelligence, the exercise database, training programmes, the workout log, Massichat AI coach, public athlete/trainer profiles, teams and challenges, nutrition coaching, partnerships). Victor records the voice-over himself for a natural human voice; Claude builds the Massimino-branded HTML frames + Pexels b-roll (+ optional credit-costing AI stills/clips), captures the real product, assembles the 16x9 + 9x16 MP4s with ffmpeg following docs/marketing/videos/videomaker_standard.md, and turns the script into an IG + LinkedIn post. Invoked as "/video", "/video in English", "/video ES", "let's make a /video in Catalan". Default language English (the app is English-only); ES, CA, IT, NL, FR on request. Every video lives in its own folder under docs/marketing/videos/.
argument-hint: "optional language (default English | ES | CA | IT | NL | FR), optionally a named topic or surface (e.g. 'Fitness Intelligence', 'Hyrox programme')"
allowed-tools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep", "WebFetch", "WebSearch"]
---

# /video, event-driven Massimino marketing video

An ordered, gated process to make one short video (~42s target per the standard, ~55-60s tolerated for a natural human read) that uses a **real event of the day** to show off **one or two Massimino surfaces**. Victor publishes it on Instagram and LinkedIn.

**Technical standard:** `docs/marketing/videos/videomaker_standard.md` (the portable feature-video pipeline: 3-S rule, 42-second template, 16x9 + 9x16 output spec, stack, product-capture recipe, b-roll rules, 9x16 blur-fill cut). READ IT at Phase 0 and follow it for everything technical. This skill adds the editorial layer on top (event-driven topic, gates, brand, post) and lists its deliberate deviations from the standard in "Deviations from the standard" below. Do not duplicate the standard here; if the two disagree on a technical point not listed as a deviation, the standard wins.

## Golden rules

- **3-S rule** (see standard): Simplicity (one message, no feature bingo), Specificity (real event + real Massimino product on screen, never mockups), Short attention (branded title in the first 4s; the Massimino surface on screen by ~second 9).
- **Show, do not tell.** SHOW a Massimino surface doing something useful about the event. One or two surfaces. Never more than two.
- **Language:** default **English** (evidence: `<html lang="en">` in `src/app/layout.tsx`, no i18n library, all UI copy in English). If the invocation names another language ("/video ES", "in Catalan"), the script, on-screen text and social post are in that language; accents mandatory (Catalan: sóc, perquè, exercici; Spanish: está, músculo). Supported: EN, ES, CA, IT, NL, FR. Note: the captured product UI stays English, which is fine; say so in the beat sheet.
- **Narration hard rules** (from the standard): 75-100 words, no em-dashes, no emojis, no jargon codes in the spoken text (plain language: "a European survey", not a dataset code; codes are fine on screen inside the product), one concrete list beats abstractions. British spelling in English (programme, organisation, centre, optimise).
- **Health honesty (fitness-specific):** no medical claims, no promised results ("lose 5 kg in 4 weeks"), no before/after implications. Massimino's positioning is "Safe Workouts for Everyone": frame surfaces as tools for safe, structured, evidence-based training. Any statistic about the event is sourced and fact-checked (Phase 7).
- **Human records, Claude edits.** Victor records the voice-over (and films a phone screen only if needed). Claude does everything downstream.
- **Gate every phase.** Get an explicit "ok / proceed / go" from Victor before moving on. Never generate paid images, spend credits, or assemble without consent.
- **Cost awareness:** Pexels + HTML frames + local tools are free. Ideogram and Seedance (MuAPI) cost credits; only fire them after Victor approves the visual plan, and log the prompt and model used.
- **People and privacy:** never show a real user's name, face, workout data or profile without their consent. Use Victor's own account (`9462f027-...`, see CLAUDE.md), a demo account, or anonymised data. Partner logos only for current partners, shown as partners, never as endorsements of a result.

## Brand (canonical, do not invent)

- **Fonts:** Nunito Sans (headings, `font-variation-settings: "wdth" 100, "YTLC" 500`) + Lato (body). Load via the Google Fonts link in CLAUDE.md.
- **Palette:** primary `#2b5069` (headings, buttons, accents) on background `#fcfaf5` (warm cream). Tailwind tokens: `brand-primary`, `brand-secondary`. Light canvas for the body; a full `#2b5069` panel is fine for the title or outro card.
- **Logos (verified in `public/`):** `public/massimino_logo.png` (mark, 1024x1024), `public/massimino_logo_word.png` (wordmark, 1536x1024), `public/massimino_logo_word_animated.mp4` (animated wordmark, good for the outro). Both PNGs are **RGB, not transparent**, with a cream background close to `#fcfaf5`: place them on the cream canvas or inside a cream pill; on a `#2b5069` panel they render as a cream rectangle unless you flood-fill the background to alpha first (Pillow). Do NOT use `public/massimino-logo.svg` (an off-brand blue placeholder).
- **Partner logos (only if the event involves a partner):** `public/images/muscleupstore.png` (MU Amsterdam), `public/images/quotavitalogo.jpg` (Quota Vita), `public/images/pumpgymwear.png` (Pump Gymwear); canonical list in `src/app/api/partners/route.ts`. Run the Pillow alpha-check before placing any PNG on colour.
- **Stock backgrounds already owned:** `public/images/background/` (city and athletics stills, `autumn_run.mp4`, `euflag.mp4`) can serve as b-roll or frame backgrounds before reaching for Pexels.
- **Tagline:** "Safe Workouts for Everyone." on the outro (source: `public/llms.txt`, `src/app/layout.tsx`). **Single CTA:** `massimino.fitness` (or the specific public route, e.g. `massimino.fitness/fitness-intelligence`). No emojis, no em-dashes.
- If the project's `/design` skill has been adapted to Massimino, reuse its frame rules; if it still carries another brand's palette or assets, ignore them and build frames from the tokens above.

## Massimino surfaces (verified routes)

Public (Claude can capture without login):
- **Fitness Intelligence** `/fitness-intelligence`: FY2025 fitness market data, live Eurostat physical-activity data, interactive MapLibre map. The natural pairing for any data/report event.
- **Exercise database** `/exercises`: the exercise library (count from `public/llms.txt`; confirm on screen before quoting a number).
- **Public profiles** `/bio/[username]`, `/trainer/[username]`: athlete and trainer pages (Victor's own profile only unless consent).
- **Teams** `/teams/discover`, **Community** `/community`, **Partnerships** `/partnerships`.

Auth-gated (NextAuth session needed):
- **Workout log** `/workout-log` (sets, reps, weight, RPE) and **training programs** `/workout-log/programs`, `/massiminos`.
- **Massichat AI coach** `/massichat` (Mistral-backed).
- **Nutrition coaching** `/dashboard/nutrition`; **challenges / leaderboards** (API under `src/app/api/challenges`, `src/app/api/leaderboards`; UI inside dashboard/community components; verify the exact screen before promising it).
- **Mobile apps** (Capacitor, `android/` + `ios/`): only mention store availability if the app is actually live in the store; otherwise badge as roadmap or omit.

## Environment

Keys in `.env` (read with `grep '^KEY=' .env | cut -d= -f2-`, never `source` it):
- `PEXELS_API_KEY` (b-roll, free). Also read by the app in `src/app/api/pexels/route.ts`.
- Optional, credit-costing: `IDEOGRAM_API_KEY` (stills), `MUAPI_API_KEY` (Seedance video). Both are set (shared with Beresol); ask Victor before spending credits.

Tools: **ffmpeg** 8.x and **Playwright** are installed system-wide; `moviepy`, `kokoro`, `faster-whisper` are not. Install them on first run into a venv at `scripts/videos/.venv` (per the standard's install block). Working API clients can be copied, not symlinked, from `/Users/victorsole/Developer/beresol-eu-advocacy-hub/scripts/marketing-ai/` (`pexels_api.py`, `ideogram_api.py`, `seedance-api/`). Put reusable scripts where the standard says: `scripts/videos/` (`render_brand_frames.py`, `record_<feature>.py`, `assemble.py`, ...). None exist yet; wire minimal versions on the first run and keep them so later runs are turnkey.

## Per-video folder

Every video gets its own folder: `docs/marketing/videos/<YYYY-MM-DD>_<event-slug>_<lang>/`. The standard asks for `docs/marketing/videos/` to be gitignored; in Massimino it is not yet (it is currently untracked). Ask Victor before editing `.gitignore`, and never commit renders.

```
docs/marketing/videos/2026-10-01_who-activity-report_en/
  script.en.txt          # narration Victor records (Phase 3)
  voiceover.(m4a|wav)    # Victor's recording (he drops it here)
  beat_sheet.md          # segment-by-segment plan (visual + timing + which surface)
  capture.mp4            # product capture (Phase 5)
  frames/                # title, outro, infographic frames (HTML + PNG/webm)
  broll/                 # Pexels clips
  generated/             # optional Ideogram stills / Seedance clips (prompt logged)
  captions.srt           # from the canonical script (Phase 6)
  music_bed.mp3          # optional Pixabay track
  <slug>_<lang>_16x9.mp4 # FINAL LinkedIn feed
  <slug>_<lang>_9x16.mp4 # FINAL Instagram Reels / vertical
  post.<lang>.md         # the IG + LinkedIn post (Phase 7)
```

---

## Phase 0, setup (standard + language + folder)

1. Read `docs/marketing/videos/videomaker_standard.md` and CLAUDE.md.
2. Parse the **language** from the invocation; if none is given, use English and say so. Map to `en|es|ca|it|nl|fr`.
3. Create the per-video folder.
4. Announce the plan and gate before Phase 1.

## Phase 1, event scan -> top 3

**Two entry paths:**
- **User-specified topic:** if Victor names the subject ("a /video about the new Hyrox programme"), SKIP the scan; the event is that topic. Still do the Specificity check: is the surface actually live? Open the page and VIEW it.
- **Event-driven (default):** propose a **top-3 of very recent events** in fitness, health or sport, European or world. Examples: a WHO or EU physical-activity report, a new Eurostat health release, a big city marathon or Hyrox event, a peer-reviewed sports-science study (strength training and longevity, protein timing, injury prevention), a national guideline change, a partner event (MU Amsterdam, Quota Vita, Pump Gymwear). Sources:
  - **Massimino's own data first:** the Fitness Intelligence page (`src/app/fitness-intelligence/`, `docs/fitness_intelligence.md`, `docs/fitness_new_metrics.md`) and its live Eurostat feed are the freshest signal in Massimino's own domain.
  - **WebSearch** for the day's fitness, health and sport headlines (WHO, Eurostat news releases, PubMed / journal press releases, major race calendars).
  - **Partners:** check the partner sites (URLs in `src/app/api/partners/route.ts`) for launches or events; never imply a partnership detail that is not public.

Present a table: for each of the 3 events give **the event (one line)**, **why it is timely**, and a **proposed Massimino angle** (which one or two surfaces, and how Massimino helps someone act on it: see the data, pick a safe programme, log the work, ask the coach). Ask Victor to pick.

## Phase 2, pick the event + the Massimino surface(s)

Victor picks one. Together lock:
- **The angle:** one sentence, "here is a real thing happening, and here is how Massimino helps you act on it safely."
- **The 1-2 surfaces** to show (exact names from the surfaces list). Never more than two.
- **Which surface is captured live** (real page on screen) vs shown as an HTML frame (for data-only moments, e.g. a single Eurostat figure animated).
Gate before writing the script.

## Phase 3, script (Victor records it)

Write the narration in the chosen language, following the narration hard rules. Map it onto the standard's 42-second template so beats line up:

```
0.0  -> 4.0    Title card: the event hook + Massimino
4.0  -> 9.5    2 opening b-roll (the event, real-world imagery)
9.5  -> 33.5   The Massimino surface doing something about the event (24s body)
33.5 -> 38.5   2 closing b-roll (people training)
38.5 -> 42.5   Outro card: "Safe Workouts for Everyone." + massimino.fitness
```

- Save to `script.<lang>.txt`. Also write `beat_sheet.md` (timing, spoken line, exact visual, which surface is on screen).
- Tell Victor: **record the voice-over yourself** (QuickTime or phone, clean audio, one take is fine), drop it in the folder as `voiceover.m4a` or `.wav`.
- Gate: Victor approves the script (and starts recording) before Phase 4.

## Phase 4, visuals (Claude builds WHILE Victor records)

Build into the folder:
1. **Brand frames:** title + outro, 1920x1080 (and check they survive the 9x16 blur-fill), Massimino tokens and fonts, logo on cream. Render HTML and Playwright-screenshot it (write a temp HTML then `goto('file://...')`; `set_content()` does not resolve `file://` images).
2. **Animated HTML infographic frames** (optional): Massimino aesthetic, event-specific (a counter, a country bar reveal, a timeline). Capture with Playwright to `.webm`.
3. **B-roll:** 4 clips (2 opening + 2 closing) per the standard's rules: varied geography, at least one "people training" clip (gym floor, a run, a coach cueing form). Check `public/images/background/` first, then Pexels. Prefer safe, good-form footage; no ego lifting or risky technique on a "Safe Workouts" brand.
4. **Ideogram + Seedance (optional, credit-costing, only after the plan is approved):** for a hero still or a motion metaphor stock cannot supply. Save to `generated/` with the prompt logged. Keep AI visuals a MINORITY of the runtime; real product and real footage carry the video.

## Phase 5, surface capture

- **Public surfaces (Claude captures):** `/fitness-intelligence`, `/exercises`, `/teams/discover`, `/partnerships`, Victor's `/bio/<username>`. Use the live site `https://massimino.fitness` (or local `npm run dev` on port 3000; see CLAUDE.md for the stale-port and patch notes). Playwright `record_video` at 1920x1080 -> goto -> wait for real content (the Fitness Intelligence page has video backgrounds, a MapLibre map and live Eurostat fetches: `wait_for_function` on a rendered chart or map element, then a settle timeout) BEFORE scrolling or interacting. Interact, do not sit still.
- **Auth-gated surfaces** (workout log, programmes, Massichat, nutrition): Massimino uses NextAuth, so the standard's "inject a JWT into localStorage" recipe does not apply directly. Options, in order: (a) Victor screen-records the flow on his phone (native 9x16, real app feel); (b) Playwright with a stored session (`storage_state`) from a demo account Victor logs into once; never store Victor's credentials in a script. Only real data from consenting accounts on screen.
- For UI-heavy mobile surfaces, take a second capture at 393x852 for the 9x16 cut (the standard lists this as a v2 enhancement; for a mobile-first fitness app it is worth doing).
State which path this video takes; gate.

## Phase 6, assemble (only after Victor confirms the VO is in the folder)

Follow the standard's assembly and output-cut sections, with the deviations below.

1. **Sync first.** The VO is human, so use `faster-whisper` word timestamps to place every visual on its spoken beat (the standard keeps whisper "for non-TTS audio"; this is that case). Captions still use the **canonical script text** (never whisper's transcription) timed to whisper's segment boundaries.
2. The human `voiceover` is the audio track; measure its real duration and let the timeline flex to it.
3. Produce the **16x9 master** (1920x1080), then the **9x16 blur-fill cut** (1080x1920) exactly as in the standard, both with `-movflags +faststart`. No 1:1.
4. **Captions:** burn them in per the standard (larger `FontSize` on 9x16), Lato or Nunito Sans, `#fcfaf5` text with a `#2b5069` box. Fitness reels are often watched muted.
5. **Music bed (optional, v2 in the standard):** a soft, sidechain-ducked royalty-free track from Pixabay Music (free for commercial use). Keep the VO clear:
   ```bash
   ffmpeg -y -i silent_video.mp4 -i voiceover_norm.m4a -i music_bed.mp3 -filter_complex "\
     [0:v]fade=t=in:st=0:d=0.6,fade=t=out:st=$((END-0.6)):d=0.6[v];\
     [2:a]atrim=0:$END,volume=0.13,afade=t=in:st=0:d=2,afade=t=out:st=$((END-3)):d=3[mus];\
     [mus][1:a]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[duck];\
     [1:a][duck]amix=inputs=2:duration=first:normalize=0[amix];\
     [amix]afade=t=out:st=$((END-0.8)):d=0.8[a]" \
     -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -shortest out.mp4
   ```
6. Write finals to `<slug>_<lang>_16x9.mp4` and `_9x16.mp4`.
7. **Self-audit: extract and VIEW frames** (`ffmpeg -ss <t> -frames:v 1`) at the title, each infographic, the product capture, and the outro, in BOTH formats. Do NOT declare done on file existence alone. Check: single message, real Massimino product on screen, correct language and accents on every on-screen text, brand present, logo not a cream rectangle on blue, captions not covering the product, AI visuals a minority, no user data without consent.

### Deviations from the standard (deliberate)
- **Voice:** Victor's own recording, not Kokoro TTS. Kokoro (per the standard) is the fallback only if Victor explicitly asks for a synthetic draft or animatic.
- **Timing:** whisper word timestamps instead of proportional distribution (human audio, not TTS).
- **Length:** ~42s target, up to ~60s tolerated for a natural read.
- **Music bed** and **mobile-viewport capture** are used when helpful (both listed as v2 in the standard).

## Phase 7, Instagram + LinkedIn post

Turn the script into a publishable post, saved to `post.<lang>.md`:
- Lead with the event hook, then the one-sentence Massimino payoff, then the 1-2 surfaces shown.
- Rules: no em-dashes, no emojis, no jargon codes in the body, British spelling in English, bare CTA (`https://massimino.fitness/` or the specific public route), tagline "Safe Workouts for Everyone.". In the video's language. Hashtags: a short, relevant set (see `docs/finess_hashtags.md` if useful); tag a partner only if the video features them.
- Include a **fact-check table** (claim / source / verdict: TRUE / PARTIAL / SPECULATIVE / FALSE / UNVERIFIED) before presenting as ready; every factual line about the event AND about Massimino must be TRUE. No invented user counts, results or testimonials; anything not shipped is badged as roadmap or left out. Victor publishes manually; Claude never posts.

## Summary log (end of run)

Report, grouped: event chosen + why; surfaces shown; language; folder path; what Victor recorded or filmed; what Claude generated (HTML frames, b-roll sources, any Ideogram/Seedance assets + credits used); final MP4 paths + durations; post path. Note anything deferred and any newly wired scripts in `scripts/videos/`.

## Notes / gotchas

- Always write **Solé** with the accent (Victor Solé, founder).
- Pexels: send a `User-Agent` header on `api.pexels.com` searches or they can 403; send NO `Authorization` header to the `videos.pexels.com` CDN.
- The two Massimino PNG logos are opaque (RGB). Test them on the actual frame background before rendering the whole video.
- Massichat answers are generated live; if you capture one, use a question whose answer you have read and that makes no medical claim.
- `/video` is on-demand and event-driven (it needs Victor's voice-over), not a silent daily step. It fits the marketing routine as a reel slot.
- Origin: adapted from Victor's Beresol `/video` skill (2026-09); editorial process kept, surfaces, brand and tooling rewritten for Massimino.
