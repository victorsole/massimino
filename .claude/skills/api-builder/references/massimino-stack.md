# The Massimino stack

How the canon in `resource-design.md`, `http-contract.md` and `operating-model.md` lands on
Massimino's real code. Everything here was read from the repo, not assumed. Where a fact is
unverified it says so.

---

## What exists today, honestly

- **Next.js 14.2 App Router, TypeScript.** Route handlers live under `src/app/api/`: around
  35 top-level groups (`ai`, `assessments`, `athletes`, `auth`, `challenges`, `coaching`,
  `dashboard`, `massichat`, `nutrition`, `payments`, `profile`, `social`, `teams`,
  `trainer`, `users`, `wearables`, `workout` and more) and roughly 130 `route.ts` files.
- **Auth: NextAuth**, session cookie, resolved with `getServerSession(authOptions)` where
  `authOptions` comes from `@/core` (config in `src/core/auth/config.ts`). The deprecated
  `src/lib/auth/config.ts` is still importable; never import from it (audit B-M7).
- **Data: Prisma** (`prisma/schema.prisma`) on **Supabase Postgres**. Import the client as
  `import { prisma } from '@/core/database'`. Exercise reference data also lives in JSON
  under `public/databases/`.
- **Hosting: Vercel**, domain `massimino.fitness` registered and DNS-managed at IONOS.
  `src/middleware.ts` currently only redirects signed-in users away from `/login` and
  `/signup`; it does not touch `/api`.
- **Consumers.** The API is an **internal app API**: its only consumers are the Next.js front
  end and the Capacitor mobile shells (`android/` is a Capacitor Android project; `ios/`
  holds only a `.gitignore` so far). No `capacitor.config.*` is committed, so how the
  shells reach the API (bundled web assets calling `https://massimino.fitness/api`, or a
  remote `server.url`) is **unverified**; check before designing anything the apps depend on.
- **No versioning.** Routes are `/api/<group>/...`; there is no `/api/v1/` anywhere.
- **No OpenAPI spec**, no runnable collection, and an empty Jest suite (audit R-M6).
- **No public API.** `docs/audit/AUDIT.md` section 6.5 lists candidates (exercises,
  variations, NASM sections, public program templates, accredited providers; and
  user-scoped data behind OAuth) but none of it exists yet. Treat it as a target only.

## How the canon applies: two surfaces

The house rulings in `SKILL.md` are written for an API with third-party consumers. Massimino
has two surfaces and they are held to different standards. Say which one you are working on.

### Surface A: the internal app API (`/api/<group>/...`, what exists)

Its consumers ship in lockstep with it, except the mobile shells, which lag by an app-store
review. Apply the canon **selectively and incrementally**:

- **Always, on new and touched routes:** the one error envelope (`fail`), `withAuth`,
  ownership checks (403 before 404), capped pagination on any list that can grow, no state
  change on GET, no stack traces or secrets in errors, rate limits on auth, AI, upload and
  money routes, idempotency keys on anything that creates a Stripe object.
- **Do not retrofit:** a `/v1/` prefix, AIP resource names, or snake_case field names onto
  existing routes. Renaming what the front end and installed mobile apps already call is
  churn with no consumer benefit. The audit (B-M6) standardises the internal API on
  **camelCase** payloads; follow that here. This is a recorded deviation from AIP-148's
  field names (`create_time`, `display_name`), not a slip.
- **PUT vs PATCH:** the tree has about 16 `PUT` and 12 `PATCH` handlers. New update routes
  use PATCH. Convert an existing PUT only when you are already changing it, and check the
  mobile shell does not call it.
- **Mobile shells are the compatibility constraint.** Before removing or renaming a field or
  route, assume an installed app version still calls it.

### Surface B: a future public or versioned API (target, does not exist)

If Massimino ever exposes data to third parties, partners or AI assistants, that surface
follows the canon **in full**: `/api/v1/`, AIP resource names, opaque page tokens,
`reason` codes, OpenAPI 3.1 written first, keys or OAuth declared as a security scheme,
snake_case identifiers per AIP-190/148. It is a separate route tree, not a relabelling of
Surface A. AUDIT.md 6.5 sets a precondition: resolve the schema problems (the exercise
trio overlap, the JSON columns in `program_templates`) before modelling it, because a
public resource shape that mirrors those tables is the primary anti-pattern.

---

## Target 1: Next.js route handlers in this repo (the default)

### The house way to write a route

The helper layer in `src/lib/api/` (in progress, uncommitted as of September 2026) is the
standard. Import everything from `@/lib/api`.

- `withAuth(handler)` (`src/lib/api/with-auth.ts`): resolves the NextAuth session, returns
  `401 AUTH_REQUIRED` in the standard envelope if there is none, then calls
  `handler({ session }, req, { params })`. `session.user.id` is always present inside.
- `assertOwnership(session, targetUserId)`: throws `OwnershipError` (403, `FORBIDDEN`)
  unless the caller is the target user.
- `assertOwnershipAsync(session, targetUserId, predicate?)`: same, but a predicate can grant
  access through a verified relationship, e.g. an `ACTIVE` `trainer_clients` row.
- `assertOwnershipOrFail(session, targetUserId)`: returns a 403 `NextResponse` or `null`,
  for handlers that prefer not to try/catch.
- `ok(data)` and `fail(code, message, status, details?, headers?)`
  (`src/lib/api/response.ts`, see the TODO below): the one envelope.

```ts
import { withAuth, assertOwnershipAsync, ok, fail } from '@/lib/api'
import { prisma } from '@/core/database'

export const GET = withAuth(async ({ session }, req, { params }) => {
  // Permission before existence: 403 before 404.
  await assertOwnershipAsync(session, params.athleteId, async () =>
    (await prisma.trainer_clients.findFirst({
      where: { trainerId: session.user.id, clientId: params.athleteId, status: 'ACTIVE' },
    })) != null
  )
  const athlete = await prisma.users.findUnique({ where: { id: params.athleteId } })
  if (!athlete) return fail('NOT_FOUND', 'Athlete not found', 404)
  return ok({ id: athlete.id, displayName: athlete.name })
})
```

An `OwnershipError` thrown from `assertOwnership*` must become a 403; until a wrapper
catches it centrally, catch it in the handler or use `assertOwnershipOrFail`.

### The envelope and error codes

Success: `{ "success": true, "data": ... }`. Failure:
`{ "success": false, "error": { "code": "NOT_FOUND", "message": "...", "details"?: ... } }`.
This is AUDIT.md 6.2 and runbook 04; it is Surface A's version of the canon's envelope.

Codes already in the helpers or runbook: `AUTH_REQUIRED` (401), `FORBIDDEN` (403),
`VALIDATION_ERROR` (400). Proposed to complete the set (not yet used anywhere):
`NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL` (500). Treat the
list as closed: add a code deliberately and record it here, never coin one per handler. Validate bodies
with `zod` (already a dependency) and return every validation failure at once in `details`.

### Pagination on Surface A

About 20 routes read `limit`/`page` query params by hand, with no shared cap; audit B-M1
found negative and NaN values reaching Prisma. Until a shared helper exists, clamp:
`Math.max(1, Math.min(parseInt(x) || 20, 100))`, and return `nextPage` (or a cursor) so the
client knows when to stop. Any new list endpoint that can grow paginates from day one.

### Rate limits

`src/lib/rate-limit.ts`: `checkRateLimit(identifier, RATE_LIMITS.x)`,
`getClientIdentifier(req)`, `getRateLimitHeaders(result)`. Presets: `standard` 100/min,
`auth` 10/min, `ai` 20/min, `upload` 10/min, `health` 30/min. Key on `user:<id>` for
authenticated routes, client IP otherwise. Attach `X-RateLimit-*` headers on 429.
The store is an in-memory `Map`, so on Vercel each instance counts separately; Redis
(Upstash) is the planned fix. Do not describe the limit as hard until it moves.

### Money

Monetary columns are moving from `Float` to `Decimal(10,2)` (audit 1.7; AUDIT.md links a
runbook 03 that is not in `docs/audit/runbooks/`).
Read them through `toNumber()` from `src/lib/decimal.ts`, which works under both the old
and regenerated Prisma client. Never do arithmetic on a raw Prisma `Decimal`. Payment
routes need idempotency keys (audit B-H4), and the Stripe webhook must return 5xx on
processing failure so Stripe retries (audit 1.3).

### Checks and deploy

- `npm run type-check` (`tsc --noEmit`) must be clean. `npm run build` has a known
  pre-existing failure on `/api/ads` (audit 1.4); do not mistake it for your change.
- Prove against the dev server (`npm run dev`, port 3000; see the stale-process rule in
  `CLAUDE.md`) with curl and a session cookie, as in runbook 04's smoke scripts.
- Deploy is Vercel from git. Do not commit or push unless asked. After a deploy, hit the
  live route on `https://massimino.fitness/api/...` and paste the output.
- Never commit secrets. A Firebase admin key JSON sits at the repo root; rotation is
  runbook 01.

## Target 2: a standalone service (only if ever needed)

Only when something cannot live in a Vercel function: a long-running job, a heavy
queue worker, or a public API that needs its own scaling and key store. Nothing like this
exists today. If it is proposed, write the case first (why Target 1 cannot do it), then
design it as Surface B: contract-first OpenAPI, versioned, its own auth scheme. Reuse the
same Supabase database through a clear boundary rather than a second copy of the schema.

---

## Where to look

- `docs/audit/AUDIT.md`: section 2 (Backend and API, findings B-H1 to B-L7), 6.1 and 6.2
  (middleware and envelope), 6.5 (public API readiness), 6.6 (observability:
  `x-request-id`, a single logger).
- `docs/audit/runbooks/04-auth-middleware-and-rate-limits.md`: the helper layer, which
  routes are rate-limited, and the pending rollout list.
- `docs/audit/runbooks/01-firebase-key-rotation.md`. (Runbook 03, the Decimal migration,
  is referenced by AUDIT.md but missing from the folder.)
- `docs/api-analysis.md` (January 2026): external integrations and the route inventory.
