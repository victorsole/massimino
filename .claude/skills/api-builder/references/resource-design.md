# Resource design (the Google AIP layer)

Distilled from google.aip.dev, read in full on 8 September 2026: AIPs 121, 122, 130, 131,
132, 133, 134, 135, 136, 148, 151, 154, 191. The AIPs are written for gRPC and protobuf;
what follows is the part that transfers to a JSON/HTTP API, which is nearly all of it.

---

## The shape of a resource-oriented API

A large number of resources, each with a small number of methods. Not the reverse. Design
in this order:

1. The resources (nouns) the API will provide.
2. The relationships and hierarchy between them.
3. The schema of each resource.
4. The methods on each, leaning as hard as possible on the five standard verbs.

**The resource schema must be identical across every method.** If Get returns a `Monitor`,
Create takes and returns the same `Monitor`, and List returns an array of the same
`Monitor`. A "create shape" that differs from a "read shape" is a design smell.

| Standard method | Request contains | Response is |
|---|---|---|
| Create | the resource | the resource |
| Get | nothing | the resource |
| Update | the resource | the resource |
| Delete | nothing | nothing (or the resource, if soft delete) |
| List | nothing | the resources |

**Get is mandatory.** A client must be able to read back state after a mutation. **List is
mandatory** except for singletons.

### Anti-patterns, named

- **Mirroring the database.** An API identical to the schema underneath is tightly coupled
  to a system the consumer must never see. It also enlarges the attack surface and invites
  data leakage. Introduce a mapping layer if you have to.
- **Chatty APIs.** A very large number of very small resources forces a client into many
  round trips. Denormalise into meaningful resources, balanced against fetching data the
  client does not want.
- **Cyclic references.** Resource relationships must form a directed acyclic graph, and so
  must the parent-child tree. A cycle means creating A, then B, then updating A, and a
  delete order nobody can reason about.

---

## Resource names

A resource name is a URI path without the leading slash:

```
monitors/defence
monitors/defence/entries/2026-09-07
publishers/123/books/les-miserables
```

Rules that matter:

- Alternate collection identifiers and resource IDs. `/` separates segments; non-terminal
  segments must not contain one.
- **Collection identifiers are plural, camelCase, ASCII, lower-case first letter.** Where
  there is no plural ("info") or it is identical ("moose"), use the singular. Do not coin
  "infos".
- Within one resource name, a collection identifier appears at most once.
  `people/x/people/y` is invalid.
- Resource IDs stick to DNS-safe characters (RFC-1123), lower-case, no URL-escaping.
  User-specified IDs should match `^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$` and the API **must**
  document the allowed format.
- **Nested collections may drop a redundant prefix**: prefer `users/x/events/y` over
  `users/x/userEvents/y`. Do it consistently across the whole API or not at all.
- **A resource must expose its name in a `name` field.** Nothing else may be called `name`.
- **Resources must not expose self-links, tuples, or other identification forms.** This is
  where the AIPs part company with HATEOAS.
- The version is **not** part of the resource name. `v1` lives in the URL, not the name,
  because the name has to survive a major version bump.

### Why names and not IDs

With bare IDs you need a resource-specific tuple to identify anything: `(bucket, object)`,
`(user, album, photo)`. Tuples are hard to pass, invisible to shared infrastructure
(logging, access control), and prevent generic machinery like long-running operations from
working across resources. A single string name solves all of it.

### Referring to another resource

A field that points at another resource is a **string holding that resource's name**, not
an embedded copy of it. Embedding is banned because it complicates the lifecycle (what
happens to the copy when the original is deleted?), bypasses permissions (a caller with
read on the parent suddenly sees a child they may not read), and couples the two
resources' schemas and rollouts together.

---

## The five standard methods

### Get

`GET /v1/{name=monitors/*}`. Response **is** the resource, not a wrapper. No request body.
The name is the only path variable; everything else is a query parameter. Return the fully
populated resource unless there is a documented reason not to.

### List

`GET /v1/{parent=publishers/*}/books`.

- Request: `parent` (required unless top-level), `page_size`, `page_token`, optionally
  `filter` and `order_by`.
- Response: one repeated field of resources, plus `next_page_token`. Optionally
  `total_size`, which may be an estimate if documented, and which reflects the filter.
- `order_by` is a comma-separated field list, ascending by default, ` desc` suffix for
  descending: `"created_time desc, title"`. Whitespace is insignificant. Subfields use `.`.
- Only add filtering or ordering when there is real demand. Adding them later is easy;
  **removing them is a breaking change**.
- Soft-deleted resources are excluded by default; expose `show_deleted` to include them.

### Create

`POST /v1/{parent=publishers/*}/books` with the resource as the body. Response **is** the
created resource, fully populated.

- **Let the caller specify the ID.** `?book_id=les-miserables`, as a query parameter in
  REST, and on the request, not on the resource. Without it, a declarative client cannot
  find the resource it just made, and every reference to it has to be rewritten.
- The `name` field on a submitted resource body is ignored.
- Duplicate ID means **ALREADY_EXISTS (409)**, unless the caller cannot see the existing
  resource, in which case **PERMISSION_DENIED (403)**.

### Update

`PATCH /v1/{monitor.name=monitors/*}` with the resource as the body.

- **PATCH, not PUT.** The reason is worth keeping: a client wrote
  `PUT {"title": "...", "author": "..."}` against v1; the resource later gained a `rating`
  field; that same PUT now silently erases every rating. PUT makes adding a field a
  breaking change. Use PUT only where full replacement is genuinely the semantic the
  consumer wants.
- Partial update uses an `update_mask`. It must be optional, and an omitted mask means
  "every field that is populated". `*` means full replacement, and is risky for exactly
  the reason above: prefer naming the fields.
- **Update must not have side effects.** State fields are not directly writable; a state
  transition is a custom method.
- Optional `allow_missing` turns update into create-or-update, but only where the client
  assigns the resource name.

### Delete

`DELETE /v1/{name=monitors/*}`. Empty response, or the resource if the delete is soft.

- Deleting a resource that does not exist is **404**, unless `allow_missing` is set, in
  which case it is a no-op success.
- **Children present means FAILED_PRECONDITION.** A cascading delete requires an explicit
  `force` flag on the request; deletion is usually permanent and must never happen by
  accident. The exception is a singleton child, whose lifecycle is tied to the parent.
- Optional `etag` for a protected delete: mismatch is **409 / ABORTED**.

---

## Custom methods

Only when no standard method fits. Do not contort a standard method to "sort of work".

```
POST /v1/{name=monitors/*}:refresh
POST /v1/{parent=publishers/*}/books:sort
POST /v1/{project=projects/*}:translateText     (stateless, no collection)
```

- The URI uses a `:` then the verb. camelCase if the verb needs word separation.
- **Verb then noun.** No prepositions. `CreateBookFromDictation` should be `TranscribeBook`;
  `GetBookByAuthor` should be `SearchBooks` with an `author` dimension. Prepositions in a
  method name almost always mean a field belongs on an existing method instead, and they
  breed a swarm of hyper-specific endpoints.
- Do not reuse a standard verb (Get, List, Create, Update, Delete) in a custom method name.
- Never `Async` in the name. If the point is that it is long-running, suffix `LongRunning`.
- **GET for retrieval, POST for anything with side effects.** POST is also acceptable for
  a retrieval whose request would blow past URL length limits.
- A stateless method puts both verb and noun after the colon: `:translateText`, not
  `text:translate`, because there is no collection to name.

---

## Long-running operations

Rule of thumb: **anything that might take more than about 10 seconds**.

Return an operation resource rather than blocking. The operation carries `done`, a
`response` when it succeeds, an `error` when it fails, and a `metadata` payload for
progress and partial failures. Expire operations after a reasonable window (about 30 days).

Over plain HTTP without the gRPC machinery, the Microsoft form is the practical one:
respond **202 Accepted** with a `Location` header pointing at a status endpoint; that
endpoint returns the current status, and **303 See Other** with a `Location` for the
created resource once it completes.

A resource being created or deleted by an operation should still appear in Get and List,
marked unusable via a state field.

Changing an operation's response or metadata type is a breaking change.

---

## Standard field names (AIP-148)

Use these names for these concepts, and never for anything else.

| Field | Meaning |
|---|---|
| `name` | the resource name. Reserved. Nothing else may use it. |
| `parent` | the resource name of a collection's parent |
| `display_name` | mutable, user-set, human-readable label, up to 63 characters, not unique |
| `title` | the formal official name of an entity |
| `given_name` / `family_name` | **not** `first_name` / `last_name`; neither is first or last in many cultures |
| `create_time` | output only, when the resource was created |
| `update_time` | output only, most recent user-visible change |
| `delete_time` | output only, when it was soft deleted; empty if it was not |
| `expire_time` | when the resource or attribute stops being valid |
| `purge_time` | when a soft-deleted resource will actually be removed |
| `uid` | output only, system-assigned UUID |
| `etag` | server-computed freshness checksum, RFC 7232, quoted |
| `annotations` | `map<string, string>` for small arbitrary client state, dot-namespaced keys |
| `ip_address` | or a `_ip_address` suffix, with the version format documented |

---

## etags and freshness (AIP-154)

Include an `etag` on any resource where two writers could race.

- Server-computed, opaque, quoted (`"abc"`, not `abc`). Weak etags carry the `W/` prefix.
- Matching etag: proceed. Mismatching etag: **409 / ABORTED**, not 400. This changed in
  2021; older material says FAILED_PRECONDITION.
- No etag sent: allow the request, unless the API has strong consistency requirements, in
  which case reject with 400 / INVALID_ARGUMENT and document that.
- Update can piggyback on the resource's own etag field. Delete cannot, so it needs an
  `etag` on the request message.

---

## Consistency

For anything on the management plane, a completed operation means steady state:

- After a successful create, a Get returns the resource.
- After a successful update, a Get returns the updated values.
- After a successful delete, a Get returns 404 (or the resource in DELETED state, if soft).

Clients chain operations. If completion does not mean "readable", every consumer has to
invent a retry loop.

---

## File layout, where it applies

Higher-level and more important definitions first. In a spec or a schema file: services,
then resource definitions (parent before child), then request and response shapes in
method order, then everything else. Do not name a file after a version (`v1.json`); it
produces absurd imports downstream.
