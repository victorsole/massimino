# The HTTP contract

Distilled from Microsoft's Azure API design guide and the Postman REST best-practices
blog, reconciled with the Google AIPs where they differ. Read in full on 8 September 2026.

---

## URIs

Nouns, not verbs. The verb is the HTTP method.

```
GET    /v1/monitors            list
GET    /v1/monitors/defence    read one
POST   /v1/monitors            create
PATCH  /v1/monitors/defence    update
DELETE /v1/monitors/defence    delete
```

Not `/getMonitors`, not `/create-monitor`, not `/monitors/defence/delete`.

- Plural for collections. A collection is its own resource with its own URI.
- **Never deeper than `collection/item/collection`.** `/customers/1/orders` is fine;
  `/customers/1/orders/99/products` is not. Once a client holds a reference to an order it
  can go to `/orders/99/products` directly.
- Do not expose database structure. `/user_table_v2/query?db_id=123` leaks the store and
  enlarges the attack surface.
- Where an operation genuinely maps to no resource, a pseudo-resource with query
  parameters is acceptable (`/add?operand1=99&operand2=1`), but use it sparingly.

---

## Methods and their status codes

The effect of a method depends on whether the target is a collection or an item.

| Resource | POST | GET | PUT | DELETE |
|---|---|---|---|---|
| `/customers` | create a new customer | list customers | bulk update | remove all |
| `/customers/1` | error | read customer 1 | update customer 1 | remove customer 1 |
| `/customers/1/orders` | create an order for customer 1 | list their orders | bulk update | remove all |

### GET

Safe and idempotent. Never use it for anything that changes state.
`GET /users/123/delete` and `GET /cart/add?product_id=789` are both wrong.

- **200** returned the resource. **204** succeeded with no body (a search with no matches).
  **404** not found.

### POST

Creates, or submits data for processing. The **server** assigns the URI; a client that
POSTs to a URI it invented gets **400**.

- **201** created, with a `Location` header pointing at the new resource and the resource
  in the body. **200** processed without creating anything. **204** no body.
  **400** invalid data. **405** POST not supported here.

### PUT

Full replacement of a single item, never a collection. **Must be idempotent.**

- **200** updated. **201** created. **204** updated, no body. **409** conflicts with the
  current state.
- Beresol's ruling: prefer PATCH. See `resource-design.md` for why PUT turns adding a field
  into a breaking change.

### PATCH

Partial update. The body is a patch document, and its format comes from the media type:

- `application/merge-patch+json` (RFC 7396): same shape as the resource, only the changed
  fields, `null` deletes a field. Simpler, but unusable if the resource can hold a genuine
  explicit `null`, and it does not specify the order updates apply in.
- `application/json-patch+json` (RFC 6902): an ordered sequence of `add`, `remove`,
  `replace`, `copy`, `test` operations. More flexible, and `test` lets a caller assert a
  value before writing.
- **200** updated. **400** malformed patch. **409** valid patch, cannot apply to the
  current state. **415** patch format not supported.

### DELETE

Idempotent by design. **204** deleted, no body. **404** does not exist.

### HEAD

Returns headers only. Useful before a partial fetch of something large.

---

## Status codes worth having memorised

**2xx**: 200 OK, 201 Created, 202 Accepted (async, still running), 204 No Content,
206 Partial Content.

**4xx**: 400 Bad Request, 401 Unauthorized (no or bad credentials), 403 Forbidden
(authenticated but not permitted), 404 Not Found, 405 Method Not Allowed, 406 Not
Acceptable (no matching `Accept`), 409 Conflict (including etag mismatch), 415 Unsupported
Media Type, 422 Unprocessable Entity (valid syntax, semantic failure), 429 Too Many
Requests.

**5xx**: 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable,
504 Gateway Timeout.

**Inconsistent status codes are the commonest cause of client-side bugs.** Decide the
mapping once and apply it everywhere.

### The 403-before-404 rule

Check permission **before** checking existence. A caller who may not see a resource gets
**403**, whether or not it exists. Only a caller who does have permission gets **404** for
something absent. Getting this backwards turns the API into an existence oracle.

---

## Errors

One envelope for the whole API. A stable machine-readable code, plus a human message.

```json
{
  "error": {
    "code": 404,
    "status": "NOT_FOUND",
    "message": "No monitor with the id 'defense'. The nearest match is 'defence'.",
    "reason": "MONITOR_NOT_FOUND",
    "domain": "beresol.eu",
    "metadata": { "requested": "defense" }
  }
}
```

- `code` is the **HTTP** status. `status` is its symbolic name. `reason` is the
  machine-readable identifier: UPPER_SNAKE_CASE, at most 63 characters, matching
  `[A-Z][A-Z0-9_]+[A-Z0-9]`.
- `reason` must be terse but meaningful. `CPU_AVAILABILITY`, `NO_STOCK`, `CHECKED_OUT` are
  good. `ERROR` is too general; `THE_BOOK_YOU_WANT_IS_NOT_AVAILABLE` is a sentence.
- **The same `(reason, domain)` pair means the same error, always**, and two logically
  different errors never share one. The test is whether a client would take the same action
  to resolve them.
- **Anything dynamic in the message must also be in `metadata`**, as a key-value pair, so
  no client ever has to parse prose to extract a value. Metadata keys may be added over
  time but never removed: once a consumer has seen a key, it must keep appearing (possibly
  empty).
- Return **all** validation failures at once, as a list, not the first one. Otherwise the
  consumer fixes their request one field per round trip.
- Messages are for a reasonably technical reader who is not an expert in your API and knows
  nothing about its implementation. Brief, actionable, and free of internal detail.
- **Once an error has shipped without a machine-readable code, its message text is frozen**,
  because clients will have parsed it. This is the strongest argument for putting a `reason`
  on every error from day one.
- Do not do partial errors. Where a bulk operation genuinely needs them, make it a
  long-running operation and put the partial failures in its metadata.

---

## Pagination

**Every collection endpoint, from v1.** Adding pagination later is a breaking change even
though the fields are additive: a consumer whose collection had 75 items and who got all 75
now silently gets 50 and does not know to ask for more. Client libraries also generate
different method signatures for paginated calls, so the change breaks them too.

Three shapes, in Beresol's order of preference:

1. **Token / cursor** (the AIP form, and the only reliable one for feeds and high-write
   data):
   ```
   GET /v1/monitors?page_size=50&page_token=eyJpZCI6MTIzfQ
   -> { "monitors": [...], "next_page_token": "eyJpZCI6MTQzfQ" }
   ```
2. **Limit and offset**: simple, but items shift under the reader if the collection changes
   between requests.
3. **Page number**: `?page=3&per_page=20`, with `current_page`, `total_pages`,
   `total_items` in the response. Familiar to humans, weakest under concurrent writes.

Rules regardless of shape:

- `page_size` is never required. Omitted or 0 means a documented default; negative is
  **400**; above the maximum is **coerced down**, not rejected. Cap it: an uncapped page
  size is a denial-of-service vector.
- The server may return fewer than asked, even mid-collection.
- **`next_page_token` empty is the only signal that the collection has ended.** If the end
  has not been reached, or the server cannot tell in time, it must return a token.
- If the caller changes `page_size` mid-walk, honour the new size. If they change any other
  argument, **400**.
- **Tokens are opaque and URL-safe.** Base64 of something readable is not obfuscation. A
  token that can be deconstructed becomes part of the API surface. Tokens carry no
  authority: authorise the request as normal regardless of the token.
- Tokens may expire (about three days is reasonable) and this need not be documented.
- The response is never a stream.

---

## Filtering, sorting, field selection

- **Filter**: exactly one `filter` string field, not a field per dimension. Requirements
  change constantly, and a string parameter can evolve without a client update. Support
  `AND` / `OR` (note: `OR` binds tighter than `AND` in the AIP grammar, matching speech
  rather than programming languages, so encourage explicit parentheses), `NOT` and `-`,
  the comparison operators for strings, numbers, timestamps and durations, `.` traversal,
  and `:` for "has". An invalid filter is **400**. Simpler query-parameter filtering
  (`?status=shipped&minCost=100`) is fine for a small, fixed set of dimensions.
- **Sort**: `?order_by=price` or `?sort=price:asc,category:desc`. Ascending by default.
  Note that sorting fragments the cache, since query strings form part of the cache key.
- **Field selection**: `?fields=name,email`. Cuts payload for mobile and slow links.
  **Validate the requested fields**, so selection cannot be used to reach a field the API
  does not normally expose.

Only add filtering or sorting when someone needs it. Removing either later breaks clients.

---

## Versioning

**Beresol: major version in the path, `/api/v1/`. No minor version on the wire.** A stable
API is updated in place with backwards-compatible improvements; consumers get new
functionality without migrating.

The four options and their trade-offs, for when a client asks:

| Form | Example | Trade-off |
|---|---|---|
| URI | `/v2/customers/3` | Explicit, cache-friendly, versions coexist. Purists object that the same customer now has two URIs. |
| Query string | `/customers/3?version=2` | Same resource, one URI. Some old proxies do not cache query-string responses. |
| Header | `Custom-Header: api-version=2` | Clean URLs. Needs correct client behaviour, and fragments server-side caches. |
| Media type | `Accept: application/vnd.contoso.v1+json` | Elegant, works with content negotiation, same caching caveat. |

A new major version is for **breaking changes only**: removed fields, changed types,
changed auth. Additive changes never justify one.

### What is a breaking change

- Removing or renaming anything. Renaming is remove-plus-add.
- Changing a field's type, even to a wire-compatible one, because generated code changes.
- Changing a default value, or changing whether a default is serialised at all. If a field
  was absent when it held its default, it must stay absent.
- Changing the format or construction of an existing value, even an output-only one. IPv4
  becoming IPv6 in an `ip_address` field breaks every client parsing it.
- **Increasing a string's maximum length.** Consumers store your values in columns with
  fixed widths, and put them in URLs.
- **Changing the set of valid resource names**, in either direction. Tightening breaks
  requests that used to work; loosening breaks client-side validation and storage.
- Adding a required field to an existing request.
- Adding pagination to an endpoint that had none.
- Any semantic change a reasonable developer would not expect.

### Deprecation

Announce early, publish migration guidance, run old and new in parallel, and warn in the
response:

```
Deprecated: true
X-API-Warn: This endpoint is deprecated and will be removed on 2027-06-01. Use /v2/monitors.
```

Roughly 180 days is the recommended window. Nothing should ever arrive already deprecated.

---

## Security

- **HTTPS only.** No exceptions, no plaintext fallback.
- **API keys** (`Authorization: Bearer <key>`, or `X-API-Key`) for server-to-server. Fine
  as the primary mechanism for a read-only data API; not sufficient on its own for
  sensitive operations.
- **OAuth 2.0 bearer tokens** where the caller acts on behalf of a user, or where scoped,
  time-limited access matters.
- **Rate limiting**, with the headers so a client can behave:
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 847
  X-RateLimit-Reset: 1640995200
  ```
  Over the limit is **429**, saying when to retry.
- **CORS**: name the allowed origins explicitly for a private API. `*` is defensible for a
  genuinely public read-only API and nowhere else.
- Never return internal detail in an error. Stack traces, SQL, and file paths are leaks.

---

## Idempotency

GET and HEAD are naturally idempotent. PUT and DELETE must be made so. POST is not, and
retries are inevitable, so any POST that creates something or costs money takes a key:

```
POST /v1/payments
Idempotency-Key: 9f1c0c7e-...
```

The server stores the key with its response and replays that same response for a repeat,
rather than acting twice.

---

## Content types

`application/json` is the default for request and response. Honour `Accept` where content
negotiation is genuinely supported; return **406** if nothing matches, **415** if the
request's `Content-Type` is not supported.

---

## Response shape

- **Keep it flat.** Deep nesting is hard to parse and usually means the internal model has
  leaked. Prefer `organization_id` and `organization_name` beside the user over a nested
  organisation containing nested details containing nested settings.
- Return what the client needs and no more. Large responses cost latency and bandwidth.
- **Partial retrieval** for large binaries: advertise `Accept-Ranges: bytes`, answer a
  `Range` request with **206** and a `Content-Range`. Let clients HEAD first to size it.

---

## Observability

- Log method, endpoint, status, and latency for every request. Track error rate and slow
  endpoints. Alert on anomalies rather than on raw volume.
- **Return a request ID** the caller can quote: `X-Request-ID: f47ac10b-...`. It is the
  difference between "it broke" and a traceable incident.
- Propagate trace context across services with `Correlation-ID`, `X-Request-ID` or
  `X-Trace-ID`, echoing it in the response.

---

## Multitenancy

Decide how a tenant is identified before the first endpoint exists; retrofitting isolation
is a rewrite. Three forms:

- **Subdomain**: `https://adventureworks.api.contoso.com/orders/3`. Clean, supports data
  residency and custom branded domains, needs DNS work. Preserve the hostname between the
  proxy and the backend or you leak internal URLs.
- **Header**: `X-Tenant-ID`, or a claim in the JWT. Keeps the URI RESTful and centralises
  auth, but needs a layer-7 gateway, and **it is dangerous with caches**: a cache keyed
  only on the URI will serve one tenant's response to another.
- **Path**: `/tenants/adventureworks/orders/3`. Simple routing, at the cost of putting a
  non-resource concept into the resource hierarchy.

---

## Maturity, for orientation

Richardson's model: level 0, one URI and everything is a POST; level 1, a URI per resource;
level 2, HTTP methods used properly; level 3, hypermedia. **Most good public APIs sit at
level 2, and that is Beresol's target.** Level 3 (HATEOAS) is not, for the reasons in
`SKILL.md`.

---

## OpenAPI

Contract-first, not implementation-first: design the interface, then write code that
implements it. The spec generates documentation, client libraries and mock servers, and it
is what a consumer actually integrates against. It is also what a governance linter can
check automatically, which is what turns standards into something enforced rather than
aspirational.
