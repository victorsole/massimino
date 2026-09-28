# Ship checklist

Run before calling a BUILD done. Anything unchecked is either fixed or stated plainly as a
known gap. Never report an API as shipped with an unverified item.

---

## 1. Model

- [ ] Resources are nouns, collections plural, camelCase, and never coined ("infos").
- [ ] Hierarchy is acyclic and no deeper than `collection/item/collection`.
- [ ] The resource-name pattern is written down and will never change.
- [ ] **The resource shape does not mirror a database table.** Field names are domain
      terms, not column names.
- [ ] Every resource has Get. Every non-singleton has List.
- [ ] The resource schema is identical across Create, Get, Update and List.
- [ ] References to other resources are name strings, not embedded copies.
- [ ] Every custom method has a written justification for why no standard method fits.
- [ ] Custom method names are verb-then-noun, contain no preposition, no standard verb,
      and no "Async".

## 2. Contract

- [ ] An OpenAPI 3.1 spec exists and was written **before** the implementation.
- [ ] The major version is in the path. No minor version appears on the wire.
- [ ] **Every collection endpoint is paginated**, with `page_size` (documented default and
      maximum), `page_token`, `next_page_token`.
- [ ] Page tokens are opaque and URL-safe.
- [ ] One error envelope for the whole API, with a stable machine-readable `reason`.
- [ ] Auth is a declared security scheme, not prose.
- [ ] Reserved field names are respected: `name`, `parent`, `display_name`, `title`,
      `create_time`, `update_time`, `uid`, `etag`.
- [ ] Identifiers use American English (AIP-190); all prose uses British English.
- [ ] Status codes are consistent across every endpoint.
- [ ] Every field has a description saying what it is, its units, its range, and its
      default when omitted.

## 3. Behaviour

- [ ] GET changes nothing. Nothing that changes state is reachable by GET.
- [ ] Updates use PATCH. Any PUT is justified as genuine full replacement.
- [ ] **403 is returned before 404**: permission checked before existence.
- [ ] Duplicate create is 409, or 403 if the caller cannot see the existing resource.
- [ ] etag mismatch is 409, not 400.
- [ ] Delete with children present is 409 / FAILED_PRECONDITION unless `force` is set.
- [ ] All validation errors are returned at once, not one per round trip.
- [ ] Anything dynamic in an error message also appears in the error metadata.
- [ ] Any POST that creates or costs money accepts an idempotency key.
- [ ] Anything that can exceed about 10 seconds returns 202 with a status endpoint.

## 4. Security

- [ ] HTTPS only.
- [ ] No key: 401 with `WWW-Authenticate`. Bad key: 401. Inactive key: 403.
- [ ] Rate limit enforced, with `X-RateLimit-*` headers, 429 when exceeded. **If it is not
      enforced, do not document it as if it were.**
- [ ] `page_size` has a hard maximum. An uncapped page size is a denial-of-service vector.
- [ ] CORS origins are explicit, unless the API is genuinely public and read-only.
- [ ] No stack trace, SQL, file path or internal hostname appears in any error.
- [ ] Field selection validates the requested fields against what the caller may see.
- [ ] Secrets are not in the repo. Key stores are gitignored.

## 5. Proof (never skipped)

Run these and **paste the real output**.

- [ ] Happy path on every endpoint, with a real key.
- [ ] No key -> 401.
- [ ] Wrong key -> 401.
- [ ] Inactive key -> 403.
- [ ] Unknown resource -> 404.
- [ ] Forbidden resource -> 403, **not** 404.
- [ ] A full paginated walk that terminates: last page returns an empty `next_page_token`.
- [ ] An invalid `page_size` (negative) -> 400; an oversized one is coerced, not rejected.
- [ ] A malformed filter -> 400.
- [ ] A runnable collection or `.http` file exists and passes.
- [ ] The smoke script is committed and can run on a deploy.

If any of these fails, say so with the output. Do not report the build as done.

## 6. Docs and publish

- [ ] Every endpoint has a working example: real request, real response, copy-pasteable.
- [ ] Error cases are documented with their `reason` codes and what a client should do.
- [ ] The access path is documented (NextAuth session on Surface A; key or OAuth on Surface B).
- [ ] Data freshness is stated: what the date means and where it comes from.
- [ ] The docs are generated from or verified against the spec, so they cannot drift.
- [ ] If there is an MCP surface, it was updated too, or the divergence is deliberate and
      recorded.

## 7. House guardrails

- [ ] `grep -rn $'\u2014'` over everything written returns nothing. No em-dashes, anywhere.
- [ ] No emojis, anywhere: prose, code, comments, JSON, generated data.
- [ ] British English in all prose. Solé with the accent, Victor without one.
- [ ] User-facing error messages are plain British English and leak no stack, table or trace.
- [ ] Only your own edits were staged. Never `git add` a whole file in this tree.

## 8. Deploy (Massimino on Vercel)

- [ ] `npm run type-check` clean. `npm run build` passes apart from the known `/api/ads`
      failure (audit 1.4), which is not yours.
- [ ] Routes use `withAuth`, `ok` / `fail` from `@/lib/api`, and a rate-limit preset where
      the route is auth, AI, upload or money. See `references/massimino-stack.md`.
- [ ] Nothing the Capacitor mobile shell calls was removed or renamed.
- [ ] Nothing committed or pushed unless Victor asked; Vercel deploys from git.
- [ ] The live route on `https://massimino.fitness/api/...` hit with a real session after
      the deploy, and the output pasted.
