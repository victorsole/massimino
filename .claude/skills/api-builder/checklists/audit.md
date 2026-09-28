# Audit mode

Score an API that already exists: Massimino's own routes, or a third party's. The
output is findings ranked by **what would actually break a consumer**, not a list of
deviations from a style guide.

**Never change an API Massimino does not control.** For someone else's API the deliverable
is the audit and a proposal, nothing more. For Massimino's own routes, start with the
shadow-endpoint sweep in `SKILL.md` and grade Surface A against the selective standard in
`references/massimino-stack.md`, not against the full canon.

---

## Get the API yourself

In this order of preference:

1. **The OpenAPI spec**, if one exists. Fetch it. If the spec and the running API disagree,
   that disagreement is itself a finding, and usually a high one.
2. **The running API.** Call it. A real response is worth more than any document.
   `WebFetch` or curl for a public endpoint; ask for a key for a gated one.
3. **The documentation**, as the last resort and the least reliable source.

Say which you used. "There is no machine-readable spec" is a finding in its own right,
because it is what makes an AI consumer generate wrong code.

---

## Score the seven dimensions

Grade each **sound / partial / broken**, with the evidence. Do not grade from the docs
alone where you could have called the endpoint.

### 1. Resource model
- Nouns or verbs in the URIs?
- Collections plural and consistent?
- Nesting deeper than `collection/item/collection`?
- Does the resource shape mirror a database schema? Column-shaped field names,
  `*_id` everywhere, a `type` field carrying a table name.
- Are relationships references, or embedded copies?
- Is the schema the same across Create, Get, List and Update?

### 2. Methods and status codes
- Is anything that changes state reachable by GET?
- PUT where PATCH belongs?
- Are status codes consistent across endpoints, or invented per handler?
- Does an unauthorised caller get 404 instead of 403? **This leaks existence.**
- Is 200 returned with an error in the body? Common, and it breaks every generic client.

### 3. Pagination
- **Does every collection endpoint paginate?** An unpaginated collection is the single
  highest-severity finding available, because it cannot be fixed without breaking clients.
- Is `page_size` capped? An uncapped one is a denial-of-service vector.
- Are tokens opaque, or can a consumer parse them (base64 of readable JSON counts as
  parseable)?
- Does the walk terminate cleanly, with an empty token on the last page?

### 4. Errors
- One envelope, or several?
- Is there a stable machine-readable code, or only prose? If only prose, **the message
  text is already frozen** and cannot be improved without breaking clients.
- Do dynamic values appear only inside the message, forcing consumers to parse it?
- Are validation errors returned all at once?
- Does any error leak a stack trace, SQL, a file path or an internal hostname?

### 5. Versioning and compatibility
- Is there a version at all, and where does it live?
- Is a minor version exposed on the wire?
- Is there a deprecation policy, and is it signalled in the response?
- Ask directly: **has any field ever been removed or renamed, or any default changed?**
  Each is a break that has already happened.

### 6. Security
- HTTPS enforced?
- How is auth carried, and is 401 vs 403 used correctly?
- Is the rate limit real, or documented but unenforced? **Documented-but-unenforced is a
  finding**, because consumers build against the documented behaviour.
- CORS: wildcard on a private API?
- Are secrets reachable? A key file committed to the repo, a secret under `public/` (served
  as a static file by Next.js and Vercel), or a secret echoed in an error body.

### 7. Operating model
- Is there a spec, and does it match the running API?
- Is there a runnable collection, or only prose docs?
- Are there tests, and do they cover the unhappy paths?
- Is there monitoring, and does it check endpoints or only infrastructure?
- **Shadow endpoints**: compare live traffic (gateway or access logs, analytics) against
  the spec. Endpoints taking traffic with no spec and no collection behind them are
  untested, undocumented, and outside every rule. Every API older than a year has some.
- Time to first call: how long from landing on the docs to a real response?

---

## Rank the findings

Order by consumer impact, not by how far each strays from the canon.

**Severity 1, unfixable later without breaking clients.** An unpaginated collection.
Errors with no machine-readable code. A resource-name scheme that has to change. A field
whose type or format needs to change. These get fixed now or they get fixed in a v2.

**Severity 2, actively harmful.** 404 where 403 belongs. PUT that silently drops new
fields. Secrets reachable over HTTP. An uncapped page size. A spec that disagrees with the
running API.

**Severity 3, cost that compounds.** Inconsistent status codes. Multiple error shapes.
Missing examples. Shadow endpoints. No contract tests.

**Severity 4, tidy when convenient.** Naming inconsistencies, missing descriptions,
over-nested URIs that still work.

---

## Deliver

- The seven dimensions, graded, with the evidence for each grade.
- The findings ranked, with **the single highest-return fix stated first**.
- For each severity 1 and 2 finding: what breaks, for whom, and what the fix is.
- For a third party's API (a partner, a wearable or payment provider): the integration
  risks it creates for Massimino and how the client code should defend against them.
- For Massimino's own API: a fix list ready to run through BUILD mode, cross-referenced to
  the finding IDs in `docs/audit/AUDIT.md` where one already exists.

State what you could not check and why. An audit that quietly skips the endpoints behind a
key is worse than one that says which endpoints it could not reach.
