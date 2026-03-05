# CLAUDE.md - Massimino Project Guidelines

## Project Overview

Massimino is a fitness application built with Next.js that includes workout logging, training programs, nutrition coaching, and exercise databases.

---

## Workflow Principles (The Cherny Paradigm)

*Based on Boris Cherny's Claude Code workflow*

### Core Philosophy

Treat AI as a **workforce**, not an assistant. You are a **fleet commander** orchestrating multiple parallel operations.

### Key Principles

1. **Parallel Execution** - Run multiple Claude instances for different tasks simultaneously
2. **Model Selection** - Use Opus 4.5 with thinking for everything; slower but requires less correction
3. **Institutional Memory** - Every mistake becomes a rule in this file
4. **Slash Commands** - Automate repetitive workflows
5. **Verification Loops** - Claude proves its own work through testing

---

## Design System

### Responsive Design

Massimino **must be fully responsive** across all screen sizes: smartphone (sm: 640px), tablet (md: 768px), laptop (lg: 1024px), desktop (xl: 1280px), and large desktop (2xl: 1536px). All layouts, components, and pages must adapt gracefully from mobile-first upward.

### Brand Colors

- **Primary:** `#2b5069` — headings, buttons, accents
- **Background:** `#fcfaf5` — page backgrounds, surfaces

### Typography

- **Primary font:** Nunito Sans (`font-family: "Nunito Sans", sans-serif`)
- **Secondary font:** Lato (`font-family: "Lato", sans-serif`)
- Load via Google Fonts:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap" rel="stylesheet">
  ```
- Nunito Sans variable settings: `font-variation-settings: "wdth" 100, "YTLC" 500;`

---

## Project-Specific Rules

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns in `src/components/`
- Use Tailwind CSS for styling
- Prefer server components where possible (Next.js App Router)

### Database

- Supabase is the primary database
- Exercise data is in JSON files under `public/databases/`
- User data, workout logs, and programs are in Supabase

### Known Issues to Avoid

1. **Navigation Bug**: "Back to Programs" sometimes returns to "Today" tab instead of "Programs" tab
2. **Exercise Media**: Several programs lack exercise media/demonstrations. ExerciseDB CDN (`static.exercisedb.dev`) is unreliable — prefer self-hosted images in `public/`.
3. **Missing Exercises**: Some programs reference exercises not in the database
4. **Build error on /api/ads**: `npm run build` fails with `ENOENT` for `/api/ads` page data collection — pre-existing, unrelated to most feature work.

### API Endpoints

- All API routes are in `src/app/api/`
- Authentication via Supabase Auth
- Exercise data served from local JSON and Supabase

### Testing

- Run `npm run build` to check for TypeScript errors
- Test mobile view for all UI changes
- Verify exercise media loads correctly

---

## Corrections Log

*Document every correction here so it doesn't happen again*

<!-- Add corrections in this format:
### YYYY-MM-DD: Brief Description
- What went wrong
- What the correct approach is
-->

### 2026-03-03: Next.js 14 dev server 500/404 crash loop
- **What went wrong:** `next dev` never creates `.next/server/` on disk, so `getMiddlewareManifest()` crashes with `MODULE_NOT_FOUND`. After `_not-found` compiles, every page returns 500 or 404 in an infinite error loop.
- **Root cause:** Next.js 14.2.35 compiles pages in-memory but `getMiddlewareManifest()` does a hard `require()` against the filesystem.
- **Fix:** `scripts/patch-next-server.js` wraps the `require()` in try/catch, applied automatically via `postinstall`. Also added `src/app/not-found.tsx` so the App Router handles 404s instead of the Pages Router fallback.
- **NEVER** delete `scripts/patch-next-server.js` or remove it from `postinstall`. This patch is required until Next.js is upgraded to 15+.
- **NEVER** run `rm -rf .next` without being aware the first page load may be slow (recompilation). Do NOT `rm -rf node_modules` without running `npm install` afterward (which re-applies the patch).

### 2026-03-03: Stale node process causes persistent 404
- **What went wrong:** After killing/restarting the dev server, the old `node` process stayed alive on port 3000. The new `next dev` silently fell back to port 3001. Hitting `localhost:3000` hit the zombie process which returned 404.
- **Symptoms:** `curl localhost:3000/` returns 404 with Pages Router error page (`"page":"/_error"`), even though App Router files exist.
- **Fix:** Always kill the old process first: `lsof -i :3000 -t | xargs kill -9`, then `rm -rf .next && npx next dev`. Check the server output to confirm it started on port 3000, not 3001.
- **Rule:** When diagnosing 404s, FIRST check `lsof -i :3000` to see if a stale process is occupying the port.

### 2026-03-03: ExerciseDB CDN media is dead (404)
- **What went wrong:** `static.exercisedb.dev` returns HTTP 404 for many GIF URLs that were stored in `exercise_media` rows. This breaks the Media section on public profiles.
- **Root cause:** ExerciseDB removed or reorganized their CDN content.
- **Fix:** Replaced 6 media records for Victor's profile with local images from `public/victor/`. For any future media, prefer self-hosted images in `public/` over external CDN URLs.

### 2026-03-03: User ID mismatch for media records
- **What went wrong:** Media records belonged to the system account (`67f5fc78-...`) not Victor's account (`9462f027-...`). The profile preview passed the session user ID to the API, so it queried the wrong user's media.
- **Fix:** Reassigned media records to Victor's actual user ID. Always verify `userId` matches the logged-in user when debugging missing data.
- **Key user IDs:** System admin = `67f5fc78-9c33-4e0e-8eb5-7979e62d1f53`, Victor = `9462f027-9916-41db-8d39-294c7858b516`.

---

## Slash Commands

<!-- Add custom slash commands here -->

- `/commit-push-pr` - Commits, pushes, and creates PR in one command

---

## Key Features Implemented

### Profile Preview ("Preview your public profile as")
- **API:** `GET /api/users/[userId]/public?previewAs=anonymous|athlete|trainer` — owner-only param that overrides viewer context
- **Component:** `src/components/profile/ProfilePreviewDialog.tsx` — Dialog wrapper using `UserPublicProfile` with `previewAs` prop
- **Flow:** ProfileHeader dropdown → sets state in `profile/page.tsx` → opens ProfilePreviewDialog → UserPublicProfile fetches with `previewAs` query param → API simulates viewer context
- **Security:** `previewAs` ignored unless `viewerId === userId`; synthetic IDs (`preview-athlete`, `preview-trainer`) can't match real users

### Profile Media
- Media stored in `exercise_media` table (Prisma), served via public profile API `?include=media`
- Victor's 6 training photos: `public/victor/*.jpeg` (tricep rope, pull-ups, bicep machine, overhead press, barbell curl)
- Profile page Media tab (`activeTab === 'media'`) fetches real media via `/api/users/{id}/public?include=media`

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
├─────────────────────────────────────────────────────────────┤
│  /app                                                        │
│  ├── /api          - API routes (Supabase, external APIs)   │
│  ├── /workout-log  - Workout logging features               │
│  ├── /profile      - User profile management                │
│  └── /massiminos   - Core app features                      │
├─────────────────────────────────────────────────────────────┤
│  /components       - Reusable React components              │
│  │  ├── /profile   - ProfileHeader, ProfilePreviewDialog    │
│  │  └── /layout    - UserPublicProfile (public profile view)│
│  /lib              - Utilities, Supabase client, helpers    │
│  /public/databases - Exercise JSON databases (NASM, etc.)   │
│  /public/victor    - Victor's training photos               │
└─────────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

Before shipping any change:

- [ ] TypeScript builds without errors (`npm run build`)
- [ ] UI works on mobile viewport
- [ ] No console errors in browser
- [ ] Navigation flows work correctly
- [ ] Database operations handle errors gracefully
