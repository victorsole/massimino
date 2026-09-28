---
name: api-builder
description: Massimino's design-to-shipped pipeline for APIs. Two modes. BUILD mode designs and ships a new API or endpoint in five stages (model the resources, write the contract first, implement against it, prove it with a runnable collection and smoke script, publish the docs), targeting Next.js App Router route handlers under src/app/api (the default, using the withAuth / ok / fail helpers in src/lib/api) or, only if ever justified, a standalone service. AUDIT mode scores an existing API (Massimino's own routes under src/app/api, a partner's, a wearable or payment provider's) against the canon and returns findings ranked by what would actually break a consumer, including a shadow-endpoint sweep. Built from the four canonical sources read in full on 8 September 2026: Google's AIPs, Postman Best Practices, the Postman REST blog, and Microsoft's Azure API design guide. Locks the house rulings so they are not re-litigated: PATCH not PUT, major version in the path, no HATEOAS, 403 before 404, pagination from v1, opaque page tokens, stable machine-readable error codes. Bakes in the guardrails (no emojis, no em-dashes, British English in prose but AIP-190 American English in identifiers, Solé with the accent). Use when asked to design, build, extend, document, version, secure or review a Massimino API route or endpoint, to add a route under src/app/api, to migrate routes to withAuth or the response envelope, to write an OpenAPI spec, or to audit an API. Trigger on "build an API", "new API route", "add an endpoint to Massimino", "design an API", "new endpoint", "API design", "OpenAPI spec", "REST API", "version the API", "audit this API", "review my API", "api-builder".
---

# api-builder: design an API, then ship it

Massimino runs its whole product through an API: the web front end and the Capacitor
mobile shells both call `src/app/api/`. This skill is the method: model, contract, build,
prove, publish. It exists to stop the two failure modes that cost the most later, because neither
can be fixed after consumers exist: **an unpaginated collection endpoint** and **a resource
shape that leaks the database**.

The canon is four sources, read in full on 8 September 2026 and distilled into
`references/`. Do not re-fetch them: `references/` is the working copy. The canon was
originally compiled for Beresol (Victor Solé's software company) and ported here: where a
canon file says "Beresol's ruling" read "the house ruling", and its `monitors` examples are
illustrative resource names, nothing Massimino exposes. How the canon applies to
Massimino's real code is in `references/massimino-stack.md`; read that first.

---

## Modes: pick one first, and say which

- **BUILD**: a new API, or a new resource on an existing one. Run the five stages below.
- **AUDIT**: an API that already exists (Massimino's own routes, or a third party's).
  Run `checklists/audit.md` instead of the five stages. Never change an API Massimino
  does not control.

If the ask is "add an endpoint to the workout API", that is BUILD, scoped to stages 1, 2,
3 and 5. Stage 4 is never skipped.

**Which surface?** Say so up front. Surface A is the existing internal app API
(`/api/<group>/...`, unversioned, camelCase, consumed by the front end and the mobile
shells): the canon applies selectively and incrementally. Surface B is a future public,
versioned API (does not exist yet): the canon applies in full. The split and the recorded
deviations are in `references/massimino-stack.md`.

### Shadow-endpoint sweep over `src/app/api`

Part of every AUDIT of Massimino's own API. Massimino has no spec and no gateway, so the
route files are the only inventory. Build it, then compare it against what is called:

```sh
# Inventory: every route file and the verbs it exports
find src/app/api -name 'route.ts' | sort | while read f; do
  v=$(grep -oE 'export (async function|const) (GET|POST|PUT|PATCH|DELETE)' "$f" \
      | awk '{print $NF}' | tr '\n' ' ')
  echo "${f#src/app}  $v"
done

# Callers: every /api path referenced by the front end
# (--exclude-dir=api skips src/app/api and src/lib/api; template literals end at the
#  first ${...}, so match dynamic segments by prefix)
grep -rhoE "['\"\`]/api/[A-Za-z0-9_/\[\]\-]+" src --include='*.ts' --include='*.tsx' \
  --exclude-dir=api | sort | uniq -c | sort -rn
```

Routes with no caller are shadow or dead endpoints (the mobile shells may still call
them; check before deleting). Callers with no route are broken links. Also flag routes
still reachable in production that should not be (`api/email/test`, `smtp-test`, audit
B-L7), and pull Vercel's function logs when available: traffic to an unlisted path is the
strongest shadow signal.

---

## Stage 1: Model

Nothing is written yet. Answer four questions in order, in the reply, before any file:

1. **What are the resources?** Nouns, plural collections. `references/resource-design.md`.
2. **What is the hierarchy?** Parent-child, acyclic, never deeper than
   `collection/item/collection`.
3. **What is the resource-name pattern?** e.g. `programs/{program}`,
   `programs/{program}/weeks/{week}`. This is the API's spine and it can never change,
   not even across a major version.
4. **Which methods does each resource need?** Standard only (Get, List, Create, Update,
   Delete), in that preference order. A custom method (`POST /v1/programs/x:duplicate`) is
   the last resort and needs a sentence justifying why no standard method fits.

Two hard checks at this stage, because they are cheap now and impossible later:

- **Does the resource shape mirror a database table?** If the field names are column
  names, stop and remodel. Both Google and Microsoft call this the primary anti-pattern.
  The API is an abstraction over the store, not a view of it.
- **Is the data a business entity or an implementation detail?** Expose the entity.

State the model as a short table (resource, name pattern, methods) and get it agreed
before Stage 2. This is the cheapest place to be wrong.

## Stage 2: Contract

Write the OpenAPI 3.1 spec **before** the implementation. Contract-first is the whole
point: the spec is the deliverable a consumer integrates against, and the implementation
is what makes it true.

Every v1 spec ships with these four, present from the first version because each is a
breaking change to add later:

- **Pagination** on every collection: `page_size` (documented default and maximum),
  `page_token`, `next_page_token`. Opaque tokens. See `references/http-contract.md`.
- **The error envelope**, one shape for the whole API, with a stable machine-readable
  code. Never invent a second error shape for one endpoint.
- **Auth**, declared as a security scheme, not described in prose.
- **The version**, in the path.

Then run `checklists/ship.md` sections 1 and 2 against the draft spec.

## Stage 3: Build

Pick the target and follow its section in `references/massimino-stack.md`:

- **Target 1, Next.js route handlers in this repo** (the default): `withAuth`,
  `assertOwnership*`, `ok` / `fail` from `@/lib/api`, Prisma via `@/core/database`,
  rate limits from `src/lib/rate-limit.ts`. Read `src/lib/api/` and runbook 04 first.
- **Target 2, a standalone service**: only with a written case for why a Vercel route
  handler cannot do the job. Nothing like it exists today.

On Surface A, "contract first" can be a short typed contract (a `zod` schema plus the
envelope) rather than a full OpenAPI file; on Surface B it is OpenAPI 3.1, no exceptions.

Implement to the spec, not alongside it. Where the implementation cannot honour the spec,
change the spec and say so, rather than letting them drift.

## Stage 4: Prove

Not optional, and not "it returned 200". Never guess, never assume, and that applies
with full force to an API: a 200 proves the process is alive, not that the contract holds.

- A **runnable collection** (Postman collection JSON, or a `.http` file, or a curl script)
  hitting every endpoint, with a real request and the real response captured.
- A **smoke script** that a deploy can run: auth accepted, auth rejected, one happy path,
  one 404, one 403, one paginated walk to the last page.
- Check the **negative paths explicitly**: no key, wrong key, unknown resource, and a
  resource the caller may not see (which must be 403, not 404).

Paste the actual output. If something fails, say so with the output.

## Stage 5: Publish

- **Docs** with a working example per endpoint: the real request and the real response,
  copy-pasteable. Postman's finding is that drift between the docs and the API is the
  single commonest cause of a broken integration.
- **The access path**: how a consumer authenticates (a NextAuth session on Surface A; a
  key or OAuth on Surface B), and what the rate limit is.
- **Discoverability**: the docs page, and, if one is ever built, an MCP surface
  (AUDIT.md 6.5).
- **Freshness**: what the data date means and where it comes from.

Then run `checklists/ship.md` in full.

---

## The house rulings

Settled. Do not re-open them in a proposal; if a client insists otherwise, note the
deviation explicitly rather than silently switching.

| Ruling | Why |
|---|---|
| **PATCH for updates. PUT only where full replacement is the true semantic.** | Google AIP-134: once a field is added to a resource, an old client's PUT silently wipes it. Microsoft documents PUT normally; the house follows Google. |
| **Major version in the path: `/api/v1/`. Never a minor version on the wire.** | Google AIP-185. Cache-friendly (Microsoft). Applies to Surface B; Surface A is unversioned and is not retrofitted (see `references/massimino-stack.md`). |
| **No HATEOAS.** | Google's AIPs do not use it and AIP-122 forbids resources exposing self-links. Name resources instead. Microsoft's Richardson level 3 is not the house target. |
| **403 before 404: permission is checked before existence.** | AIP-193. A 404 to an unauthorised caller leaks whether the resource exists. |
| **Pagination from v1, always.** | AIP-158. Adding it later silently truncates every existing client. |
| **Opaque page tokens.** | If a consumer can parse a token, the pagination implementation becomes part of the API surface. |
| **Stable machine-readable error code plus a human message.** | AIP-193 and the Postman blog agree. The code is the contract; the message is for a human and may change only if a code was always present. |
| **Add fields, never remove or rename, inside a major version.** | AIP-180. Renaming is remove-plus-add. |
| **Resource names never change, not even across a major version.** | AIP-180. A v2 client must be able to address a resource created under v1. |
| **Idempotency keys on any POST that costs money or creates something.** | Retries are inevitable. |

## Naming: the one deliberate split

Identifiers in an API surface follow **AIP-190, which is American English**: `color`,
`license`, `initialize`. British English (`visualisation`, `organisation`,
`tokenised`) remains the rule for **all prose**: docs, descriptions, error messages,
marketing copy, this repo's pages.

Say so once in the spec's description when it comes up, so it reads as a decision rather
than a slip.

## Field names that are already decided

Do not invent alternatives to these (AIP-148):

- `name` is reserved for the resource name. A human label is `display_name`; a formal one
  is `title`. Never use `name` for anything else.
- Timestamps: `create_time`, `update_time`, `delete_time`, `expire_time`, `purge_time`.
  Not `created_at`.
- `uid` for a system-assigned UUID, output only. `parent` for a collection's parent.
- `etag` for the freshness token, quoted per RFC 7232, mismatching returns **409 /
  ABORTED**, not 400.

## Guardrails

- **No emojis.** Anywhere: prose, code, comments, JSON, generated data.
- **No em-dashes.** Sweep `grep -rn $'\u2014'` over everything written before finishing.
- **British English in prose**, American English in identifiers (see above).
- **Solé** with the accent; **Victor** without one.
- **User-facing copy is plain.** Error messages an athlete or trainer can see say what
  happened and what to do, in British English, with no stack traces, table names or
  internal codes in the prose.
- **Never guess.** Verify against the running API, or say plainly that it is unverified.
- **Deploying** is Vercel from git. Do not commit or push unless asked. Before calling it
  done: `npm run type-check` clean (the `/api/ads` build failure is pre-existing), the
  route proven on the dev server, and after a deploy the live route on
  `massimino.fitness` hit and the output pasted. Follow `CLAUDE.md` for the dev-server
  rules (stale process on port 3000, the Next.js patch).

## Reference files

Read the one you need; do not read all four by default. For any Massimino work, read
`massimino-stack.md` first.

- `references/resource-design.md`: resources, names, the five standard methods, custom
  methods, long-running operations, standard fields. The Google AIP layer.
- `references/http-contract.md`: verbs, status codes per verb, the error envelope,
  pagination, filtering, sorting, versioning, auth, CORS, idempotency, tracing,
  multitenancy. The HTTP layer.
- `references/operating-model.md`: governance, testing, observability, discovery, shadow
  endpoints, the app-specific vs reusable distinction. The Postman layer: how an API is
  run, not how it is shaped.
- `references/massimino-stack.md`: Massimino's real stack (Next.js route handlers,
  NextAuth, Prisma on Supabase, Vercel), the two surfaces and the recorded deviations,
  the `src/lib/api` helpers, the envelope and error codes, rate limits, money, and the
  audit findings to read first.

## Checklists

- `checklists/ship.md`: run before calling a BUILD done.
- `checklists/audit.md`: the AUDIT mode procedure and scoring.
