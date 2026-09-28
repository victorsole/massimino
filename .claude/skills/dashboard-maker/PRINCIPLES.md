# Dashboard design principles

The reasoning behind the rules in `SKILL.md`. Read this when you need to justify a decision, argue against a request that would make a dashboard worse, or explain a trade-off.

Source: Josep Ferrer, "Effective Dashboard Design: Principles, Best Practices, and Examples", DataCamp, 5 December 2025. Ferrer is a freelance data scientist working on European projects, teaching Big Data at the University of Navarra, with a BS from the Polytechnic University of Catalonia and an MS from Pompeu Fabra. Read in full via Playwright on 24 August 2026. Everything here is a distillation, not a reproduction. This method was originally compiled for Beresol and adapted for Massimino.

## What a dashboard is, and is not

A dashboard is a **single screen** carrying a small set of metrics plus enough context to support a decision. It turns raw tables into ranked lists, small trends and clear status, so people know where to look first and what to do next.

Its value is that it gives a shared view: teams argue about what to do instead of arguing about whose number is right. It shortens the distance from "what is going on?" to the next action, whether that action is raising a ticket, calling a customer, rerouting inventory or adjusting spend.

It is **not** a gallery of charts, not a data dump, and not a replacement for analysis. Most good dashboards start from one recurring question ("are sign-ups on pace?"), answer it once, keep the data fresh, and get reused indefinitely.

The pipeline from data to action: **collect, clean, model, transform, encode**. The last step is where dashboard design lives: mapping numbers to the charts and labels that make the intent obvious, including units, targets, comparisons and time windows.

## The narrative approach

Dashboards work better when they read like a short story: a setup, a change, and a next step. People remember sequences. If the screen says what changed and why, they stop hunting through charts and start acting.

Keep the arc tight:

> **What changed? → Why? → What do we do now?**

Ferrer's worked example, a country CO2 dashboard, shows the arc: it states the headline (CO2 per capita 5.2 t, down against 2019), names the driver (oil is the largest slice of energy emissions; the country sits mid-pack per capita), then points at an action (shift the power mix, fund gas-to-renewables swaps, set a quarterly target tied to CO2 per GDP and track it in the trend cards).

A second example, a retail dashboard, follows the same shape: headline metrics up against prior year, then sub-category bars naming which products carry the growth, then the action (reorder fast movers, secure supply from the leading manufacturer, clear the underperformers).

For Massimino this is the natural mode for `/fitness-intelligence`, which is an explanatory page for a broad audience (partners, press, curious athletes), not an analyst tool. The athlete and trainer dashboards are tactical instead.

## Where dashboards earn their keep

Any place where routine choices depend on fresh data:

- **Healthcare**: bed occupancy by ward, median emergency wait by shift, antimicrobial use rates
- **Finance**: profit and loss against plan, cash runway, fraud review queues
- **Sales and CRM**: pipeline by stage, win rate by segment, forecast accuracy
- **SaaS**: activation, cohort retention, feature adoption
- **Public sector and logistics**: permit cycle time, on-time arrivals, inventory turns

Each should produce a clear outcome: reassign the night shift, call the aged invoices, reorder stock for the morning flight, ship a small fix. Good design makes the next action obvious.

## Visual hierarchy

People read what is **heavy, close and high-contrast** first. In left-to-right languages they scan in a Z: top-left, top-right, bottom-left, bottom-right. The critical numbers belong on that path, especially at its start.

The **inverted pyramid** organises the page by urgency:

- **Top**: status and targets, the "are we good?" line
- **Middle**: trends and comparisons that explain the movement
- **Bottom**: details, owners and links that route the follow-up work

The practical consequence: the top-left card answers "good or not?", and everything else on the page exists to explain "why".

## Layout

Layout is how you arrange charts so the essential information is easy to find. Size and whitespace signal priority; they are not decoration.

The core rule is a **simple grid with even gutters**. Aligned cards read as orderly and trustworthy. Break the grid and the page reads as noisy, which slows scanning and hides what matters.

To reduce the mental effort of interpretation:

- Group related items; separate unrelated ones with **space, not lines**
- Put filters above the content with short, plain labels
- Keep legends close to their charts
- If a table sorts, show the sorting column with a visible arrow and a large enough click target

### Top-rail versus left-rail

**Top-rail** consolidates navigation, filters and KPIs into a horizontal header, leaving the space below for charts. Best when the first question is "are we on track?".
- Pros: KPIs sit in the hot zone, filters stay visible, works well on wide screens
- Watch-outs: gets tall on small laptops, and too many filter pills create clutter

**Left-rail** puts navigation and filters in a vertical column, preserving full width for deep analysis. Best when people switch views often or need many filters.
- Pros: stable navigation, more vertical room for charts
- Watch-outs: the sidebar consumes width, and filters below the fold get ignored

## Colour

Colour is a signal, not decoration.

- **Assign stable meanings**: brand neutrals for chrome, a single highlight colour for "pay attention", a reserved colour for risk and alerts
- **Restrict the palette**: eight to twelve distinct hues is plenty for categories. Avoid the rainbow
- **Back colour with a second cue**: icons, patterns or direct labels, so colour-blind users are not blocked. ColorBrewer is the reference for checking a palette
- **Test both themes early**: if a chip, tag or button fails contrast, users miss it under time pressure

## Consistency and cognitive load

Consistency lets people reuse what they learned on the first page. Fix a grid, a spacing scale and a component set. Titles look the same everywhere, filters live in the same spot, legends behave the same way. Never surprise the user between tabs.

**Make the rules explicit:**
- One colour system across the suite (status, segment, alert)
- One or two typefaces with fixed roles (titles, labels, notes)
- Stable interaction patterns for filtering, drill-downs and view switches

**Trim mental effort:**
- Remove non-data ink, shorten labels, round to a useful precision
- Hide rarely used controls behind a clear "More" or "Advanced"
- Keep navigation shallow and predictable

**Limit choices:**
- Five precise filters beat fifteen vague ones
- Ship safe defaults so the first view is useful with zero clicks

Simplicity is not decor. It is fewer decisions for the reader.

## Know the audience

Ask: who opens this page, when, and why?

The user's **cadence** dictates technical constraints: refresh frequency, tolerance for data lag, level of detail. The **decision type** dictates the context you must provide: comparison against target, against history, or against a cohort.

The validation test: if the dashboard cannot answer the team's top two questions in ten seconds, it is too complex and should be rearranged.

## The five types

| Type | Purpose | User | Cadence | Design priorities | Example |
|---|---|---|---|---|---|
| Analytical | Root cause analysis | Analysts | Ad-hoc, deep dive | High interaction, filters, drill-downs | Sales deep-dive |
| Operational | Live monitoring | Shift leads | Real-time | Low latency, big status, alerts | Support wallboard |
| Strategic | Long-term steering | Executives | Quarterly, monthly | Comparisons, baselines, annotations | KPI summary |
| Tactical | Daily execution | Managers | Daily, weekly | Actionability, progress vs targets | Campaign tracker |
| Explanatory | Storytelling | General audience | As needed | Narrative, minimal controls | Broad overview |

**Analytical** dashboards are built for exploration, so they lean on filters, drill-downs and range pickers. Because they are dense, include a reset control and keep metric definitions one click away.

**Operational** dashboards track live systems and need low latency and immediate clarity. Prioritise big status indicators and clear ownership, often tiles or tables extended with sparklines. Alert rules must be explicit so action triggers the moment a threshold is crossed.

**Strategic** dashboards track long-term outcomes with fewer, larger charts. Always compare against a baseline (plan, last year, target), and annotate events like launches or outages so viewers can interpret sudden shifts.

**Tactical** dashboards bridge strategy and execution. Show outcome metrics alongside work in progress: targets, current progress, blockers, owners. Refresh often and keep controls near the data.

**Explanatory** dashboards communicate a pre-defined story to a broad audience rather than inviting exploration. One question, one answer per screen. Minimal controls. Use annotations, step-through sections and before/after comparisons.

## The build process

**Step 1, objectives and audience.** Define three questions the page must answer in plain language. Tie each to a business goal: if a widget cannot be mapped to a goal, it does not ship. Understand cadence and device. Capture quick personas with roles, data fluency and the decisions they make.

**Step 2, metrics and sources.** Pick a small set of KPIs that predict performance, plus a few helpers; avoid piling on lagging indicators. Document each metric: owner and source, exact formula, units, rounding, data grain, active filters, caveats, comparison logic. Group related metrics into sections, use progressive disclosure, put primary KPIs at the top.

Data hygiene: pull from a single governed source of truth so teams never see conflicting numbers; automate freshness and completeness checks (row counts, nulls, range checks) before data hits the screen; always display an explicit "last updated" stamp.

**Step 3, layout.** Simple grid, consistent spacing. Group by question, with status at the top, trend under it, details last. Put global filters together and always show what is applied, so there are no hidden states.

**Step 4, visual elements.** Pick charts based on the data, not for variety. See the matching table in `SKILL.md` Step 5. Keep legends next to their charts to minimise eye movement. Use compact KPI cards for headline numbers, and badges or coloured pills for status alerts rather than burying status in text.

**Step 5, highlight key facts.** People act faster when the headline is obvious. Give the few KPIs that matter the most real estate. Phrase card titles as the answer to a question. Include units in labels. Round usefully. Show date range, time zone and timestamp. Tuck definitions behind a consistent info icon.

**Step 6, review and iterate.** Ship it, watch real people use it, tighten what slows answers. Run task-based tests ("show me where we missed target last week"). Prioritise decision-blockers: unclear labels, missing comparisons, sluggish loads. Re-verify formulas after business shifts like pricing or attribution changes. Keep a changelog and a request board. Schedule a monthly review: three pain points, three wins, three next fixes.

## The five failure modes

**Overloading with data.** A crowded page slows reading and invites guesswork; users cannot separate signal from noise. Apply the data-ink ratio: remove anything not essential to the message. Keep the core view to one laptop screen and move detail to a drill-down. Delete duplicate metrics (showing both total sales and order count when they track together). Trim gridlines, tick marks and decorative icons. Consolidate filters into one panel.

**Poor choice of visualisation.** Many-slice pies hide small categories and defeat comparison: use a sorted bar. Dual-axis lines nudge people toward fake correlations and confuse scale: split into two vertically aligned panes. 3D and shadows distort actual values: keep charts flat. Unsorted heatmaps are just noise: sort rows and columns by a meaningful key.

**Lack of context.** A single number answers nothing. Four layers: comparison (target, prior period, benchmark), scope (units in labels, visible date range), freshness (exact timestamp, and stale data should look stale), nuance (small notes like "refunds excluded").

**Inconsistent design.** Inconsistency forces users to re-learn every card. Reserve colour mappings for recurring dimensions: if a region is blue on the overview it cannot be green on the detail page. Keep card anatomy fixed: Label, Value, Delta, Time frame. Lock legends and filters to the same spot on every page.

**Ignoring end-user needs.** Dashboards are tools; if they do not fit the job they gather dust. Watch users work rather than asking what they want, and time how long a real task takes. Ship keyboard navigation, visible focus states and 4.5:1 contrast. Offer exports (CSV, PNG, PDF) and copy-to-clipboard. Keep a changelog and a request box.

## Accessibility

Dashboards must work with a mouse, a keyboard and a screen reader, in bright offices and dim laptops. Design for differences in vision, motor control and memory: plain language, predictable layouts, large touch targets.

**Visual clarity.** Do not rely on colour alone: label directly on the visual. Always pair measure, unit and time window ("uptime 99.935, last 30 days"). Maintain 4.5:1 minimum contrast for text, and give interactive elements distinct hover, focus and pressed states.

**Keyboard operability.** Tab order follows the visual layout. Never hide the focus ring. Every filter, date picker, slider and tooltip must work with keys alone (arrows plus Enter and Escape).

**Screen readers.** Mark tables up properly with `thead`, `tbody` and scoped headers so rows and columns can be navigated. Give widgets clear ARIA roles and names. For complex charts, provide a one-line text takeaway or readable summary. If data updates live, announce changes politely rather than flooding.

## The through-line

Good dashboard design shortens the gap between a question and the next action. Keep the user's goal visible, write for different abilities, design for speed.

Tools change and AI will keep proposing views, but the job does not move: turn messy data into a clear decision on one screen.
