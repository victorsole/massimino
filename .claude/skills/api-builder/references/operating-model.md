# The operating model (the Postman layer)

Distilled from Postman Best Practices, all twelve chapters, read on 8 September 2026. This
layer is about how an API is **run**: who owns it, how it is tested, governed, observed and
found. None of it is about the wire format.

The tooling is Postman's. The ideas are portable, and most of them apply to a one-person
company running eight monitors and a data API just as much as to an enterprise.

---

## The distinction everything else hangs on

**App-specific API**: built for one consumer, usually one team, tightly coupled to the app
that calls it. Requirements come from the UI, not from a contract. Changes are fast and
informal. Testing happens through the UI. Heavy public documentation would be waste,
because the consumer can read the code.

**Reusable API**: built for many independent consumers, who must be able to discover,
understand and integrate it **without talking to you**. That self-service requirement is
what forces the spec, the documentation, the versioning, the backwards-compatibility
promise, and the security and performance work.

Getting this wrong in either direction is expensive: ceremony on an app-specific API slows
delivery for nothing, and an under-specified reusable API generates support load forever.

**Beresol's monitor API and the Brubru EU Data API are reusable APIs.** Anything built for
a single client site is app-specific until it is not.

The transition is a real event, not a gradual drift. When an app-specific API acquires a
second consumer: move it somewhere with stricter rules, write the spec properly, start
versioning, and tell people when it changes.

---

## Governance

Governance is a linter, not a review board. The point is that standards run in the
background and fail a build, rather than waiting on a person.

- **Lightweight for app-specific APIs**: schema validation, required fields, basic
  security checks. Enough to catch the errors that cause rework.
- **Strict for reusable APIs**: naming conventions, error-shape consistency, required auth
  declarations, response formats. Spectral rulesets against the OpenAPI spec, run in the
  editor and again in CI.
- Different rule sets for different audiences: strict for public-facing, permissive for
  internal service-to-service. Applying the public rules to everything just blocks
  internal velocity.
- **Define the rules before onboarding anyone.** Rules added afterwards are a migration
  project.

The two artefacts and how they relate: a **specification** is the formal contract, the
source of truth for structure. A **collection** is the executable form, used to test, mock
and demonstrate. Specs say what the API should do; collections show what it does. They
should feed each other in both directions.

---

## Testing

Tests are also documentation. Name a collection for its business purpose, not its verb:
"User onboarding flow", not "POST /users".

Seven kinds, and which are mandatory:

| Test | App-specific | Reusable |
|---|---|---|
| Exploratory | required | required |
| Functional / smoke | required | required |
| Integration | required | required |
| End-to-end workflow | required | required |
| Security | recommended | **required** |
| Performance | recommended | **required** |
| Synthetic monitoring | recommended | **required** |
| Contract testing | optional | **required** |

**Contract testing is the one that matters for a reusable API.** It is what catches a
breaking change before a consumer does. Run it in both the producer's and the consumer's
pipelines, against a shared contract that the consumer owns and the producer merges.

Test the unhappy paths deliberately: authentication failure, validation error, rate limit,
retry, edge case. A green test suite that only walks happy paths tells you nothing about
how the API behaves when a consumer gets something wrong, which is most of the time.

Include realistic example bodies and expected responses, and explain in the description
**why** a parameter is required or what business rule applies.

---

## Observability

The failure mode: you find out from a customer, and your dashboards show CPU rather than
which endpoint is failing, what error the user saw, or how to reproduce it.

- **Turn the existing tests into monitors.** Smoke tests become uptime checks. Integration
  tests become dependency health. Workflow tests become journey reliability. Contract tests
  become compatibility alerts. Performance tests become latency trends.
- **Read them as trends, not pass/fail.** One failure is noise; a declining success rate on
  contract tests is a compatibility problem forming.
- Frequency by criticality: user-facing every 5 to 15 minutes, internal hourly, contract
  validation around deploys.
- **Alert on decline, not only on failure.** A success rate drifting down while every test
  still passes is the earliest signal you get.
- On-demand monitors as a release gate, alongside the scheduled ones.

Monitors validate **what should happen**. Traffic analysis shows **what is actually
happening**. Both are needed, and the second one is where shadow endpoints come from.

When something fails: capture the failing call, replay it exactly, fix, then **save the
failing scenario as a regression test** so it cannot recur.

---

## Shadow endpoints

**An endpoint receiving live traffic with no specification and no collection behind it.**

Untested, undocumented, and outside every governance rule. Every API that has existed for
more than a year has some. They are the single highest-value thing to look for in an audit,
because they are invisible to the people responsible for the API.

Finding them means comparing real traffic (gateway logs, access logs, an analytics tool)
against the spec. For Beresol's own API, the access log versus the routes in
`public/api/v1/index.php` is the whole exercise.

Review them on a cadence, assign each one an owner, and either document it or remove it.
Do not let the list grow.

---

## Discovery

An API that cannot be found gets rebuilt by someone else. The recurring finding across the
Postman material is that internal API programmes fail on discoverability, not on design.

What a consumer must be able to find in one place:

- **The specification**, as the single source of truth.
- **A collection** they can press send on and get a real response immediately.
- **Environments**: `base_url`, version, so they are not guessing configuration.
- **Metadata that says the intent, not the category.** "Use this for processing
  PCI-compliant transactions in North America", not "The Billing API".

Two ideas worth stealing for Beresol:

- **Curate the consumer-facing surface separately from the build surface.** Publish only
  the endpoints intended for outside use, so internal or test endpoints cannot be misused
  and the consumer sees a smaller, clearer API.
- **Documentation as a by-product of the pipeline, not a chore.** If the docs are generated
  and pushed by CI on merge, they cannot drift. If a human has to remember, they will.

---

## AI consumers

The material's strongest current theme, and it is directly Beresol's business: an AI agent
integrating against an API needs the same things a developer does, and needs them
**machine-readable**. A missing or stale spec makes a coding agent generate wrong code with
full confidence.

- Centralised, current specifications are what let an agent write a correct integration.
- MCP is the surface that exposes an API to an assistant directly. Beresol already runs one
  at `beresol.eu/api/mcp/`; see `project_beresol_monitors_mcp` in memory.
- Serve protocol-appropriate documentation. A consumer arriving via MCP has different needs
  from one arriving via curl.
- Performance matters more for automated consumers than for humans: agents call in loops.

---

## Time to first call

The metric the public-API chapters keep returning to, and the right one for Beresol's
`/api` page. Everything that reduces it is worth doing:

- A one-click way to make a real call.
- Authentication that is guided rather than described. A high rate of 401s is a
  documentation failure, not a user failure.
- Collections grouped by **use case**, not by endpoint. Identify the two or three things
  most consumers actually want to do, and make those the entry points.
- Worked examples that run, not fragments.
- An SDK, or at minimum a copy-pasteable snippet per language.

---

## Change communication

Once someone depends on the API, a change is an event, not a commit:

- Announce before, not after.
- Provide migration guidance with the announcement.
- Run both versions in parallel for a stated period.
- Warn in the response itself (`Deprecated: true`, `X-API-Warn`), because that is the only
  channel guaranteed to reach whoever is actually calling.
