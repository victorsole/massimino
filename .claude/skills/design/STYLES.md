# /design: named aesthetics for Massimino

Each aesthetic is a recipe: pick one by the content's register, then specialise with Massimino's brand kit (Nunito Sans + Lato, Massimino blue `#2b5069`, warm cream `#fcfaf5`). The catalogue idea comes from TypeUI's design-skill pattern, by way of the Beresol version of this skill.

## Default for Massimino

**Clean Cream.** Nunito Sans, generous whitespace, cream (`#fcfaf5`) background, a 4px Massimino-blue accent rule, the word logo top-left, a single CTA bottom-left. It matches the live app (`body` is `bg-brand-secondary`) and the logo, whose background is the same cream. Use it most of the time.

Dark (Primary-Deep) is reserved for hero moments, partner slides and deck covers. If you reach for a dark canvas on a routine post, warn Victor first.

## Selection guide

| Aesthetic | When to use | Avoid when |
|---|---|---|
| **Clean Cream** (default) | Most social posts, workout cards, announcements, landing sections | Nothing avoids it |
| **Coach Card** | Exercise infographics: numbered form cues, target muscles, mistakes, safety note | Pure data stories |
| **Bento** | Nutrition explainers, "5 things" grids, feature overviews, comparison of N items | Single-fact hero |
| **Photo Overlay** | Programme cards and launches over a real cover photo | No suitable real photo |
| **Primary-Deep** | Partner announcements, deck slides, landing hero bands | Routine daily posts |
| **Editorial Data** | Fitness Intelligence figures: rankings, comparisons, choropleth caption cards | Motivational posts |
| **Paper Quote** | Real, consented trainer or athlete quotes | Anything without a named, consenting source |
| **Bold** | One-line challenge or event posts ("30-day squat challenge starts Monday") | Long copy |
| **Device Frame** | App Store / Google Play screenshots, "see it in the app" landing sections | When no real screenshot exists |

Dropped from the Beresol set: Premium-Forest and Natural-Deep (merged into Primary-Deep), Glassmorphism over EU imagery (Photo Overlay covers the photographic case), and Cafe (Clean Cream already carries the warm tone).

## Recipes (CSS templates)

All examples assume the rules are scoped by `#design-YYYY-MM-DD-slug .design-canvas { ... }`. All asset paths assume the file lives at `docs/marketing/designs/index.html`, so `public/` resolves via `../../../public/...`.

Shared font declaration for every recipe:

```css
font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
font-variation-settings: "wdth" 100, "YTLC" 500;
```

### Clean Cream (default)

```css
.design-canvas {
  background: #fcfaf5;
  color: #1e3d52;
  padding: 80px 72px;
  width: 1080px; height: 1350px;   /* Instagram 4:5; 1200x1200 for LinkedIn square */
  display: flex; flex-direction: column; justify-content: center;
  position: relative;
}
.design-logo { height: 72px; width: auto; }      /* massimino_logo_word.png, as-is */
.design-eyebrow {
  font-family: 'Lato', sans-serif;
  font-size: 15px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 3px;
  color: #3d6a85; margin: 0 0 16px;
}
.design-accent-rule {
  height: 4px; width: 96px; border: 0; border-radius: 2px;
  background: #2b5069; margin: 0 0 32px;
}
.design-h1 {
  font-size: 68px; font-weight: 800; line-height: 1.08;
  letter-spacing: -1px; color: #2b5069; margin: 0 0 28px;
}
.design-lede { font-size: 28px; line-height: 1.45; color: #1e293b; max-width: 860px; }
.design-cta {
  position: absolute; bottom: 56px; left: 72px;
  font-family: 'Lato', sans-serif; font-size: 20px; font-weight: 700;
  letter-spacing: 1px; color: #2b5069;
}
```

### Coach Card (exercise infographic)

Photo of the movement (from `public/exercises/<slug>/0.jpg` or `public/victor/`) on the left or top, numbered cues on the right or below, a safety strip at the bottom.

```css
.design-canvas { background: #fcfaf5; color: #1e3d52; width: 1080px; height: 1350px; padding: 64px; }
.design-photo {
  width: 100%; height: 520px; object-fit: cover; border-radius: 24px;
}
.design-muscles { display: flex; flex-wrap: wrap; gap: 10px; margin: 28px 0; }
.design-muscles span {
  font-family: 'Lato', sans-serif; font-size: 18px; font-weight: 700;
  padding: 8px 16px; border-radius: 999px;
  background: #f5f0e8; color: #2b5069; border: 1px solid #e7e1d6;
}
.design-cues { list-style: none; counter-reset: cue; padding: 0; margin: 0; }
.design-cues li {
  counter-increment: cue; display: grid; grid-template-columns: 52px 1fr; gap: 16px;
  align-items: start; font-size: 26px; line-height: 1.35; margin-bottom: 18px;
}
.design-cues li::before {
  content: counter(cue);
  width: 44px; height: 44px; border-radius: 50%;
  background: #2b5069; color: #fff; font-weight: 800; font-size: 22px;
  display: grid; place-items: center;
}
.design-safety {
  margin-top: 24px; padding: 18px 22px; border-radius: 16px;
  background: #fef3c7; border-left: 6px solid #f59e0b;   /* safety.yellow as fill + border */
  color: #78350f; font-size: 20px; line-height: 1.4;     /* dark text for contrast */
}
.design-mistake { color: #b91c1c; font-weight: 700; }     /* text-safe shade of safety.red */
```

### Bento (nutrition, grids of N)

```css
.design-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
.design-grid > .cell {
  border: 1px solid #e7e1d6; border-radius: 20px;
  padding: 28px; background: #ffffff;
}
.design-grid > .cell.highlight { background: #2b5069; color: #ffffff; border: 0; }
.design-grid > .cell.tint { background: #f5f0e8; border: 0; }
.design-grid > .cell .cell-num {
  font-size: 56px; font-weight: 900; letter-spacing: -1px; line-height: 1;
  font-variant-numeric: tabular-nums;
}
.design-grid > .cell .cell-label {
  font-family: 'Lato', sans-serif; font-size: 18px; margin-top: 8px; color: #5b6573;
}
.design-grid > .cell.highlight .cell-label { color: #d6e2ea; }
/* macro swatches: nutrition green, cardio cyan, muscle rose, always with a text label */
.swatch { display: inline-block; width: 14px; height: 14px; border-radius: 4px; margin-right: 8px; }
```

### Photo Overlay (programme cards)

```css
.design-canvas {
  position: relative; width: 1200px; height: 1200px; overflow: hidden; color: #ffffff;
  background: #1e3d52 url('../../../public/images/programs/marathon.jpg') center / cover no-repeat;
}
.design-canvas::before {
  content: ''; position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(180deg, rgba(30,61,82,0.15) 0%, rgba(30,61,82,0.55) 45%, rgba(30,61,82,0.92) 100%);
}
.design-body { position: absolute; left: 72px; right: 72px; bottom: 72px; z-index: 2; }
.design-h1 { font-size: 84px; font-weight: 900; line-height: 1.0; letter-spacing: -1.5px; margin: 0 0 24px; }
.design-facts { display: flex; flex-wrap: wrap; gap: 12px; }
.design-facts span {
  font-family: 'Lato', sans-serif; font-size: 20px; font-weight: 700;
  padding: 10px 18px; border-radius: 999px;
  background: rgba(252,250,245,0.95); color: #1e3d52;      /* level, weeks, sessions per week */
}
.design-logo { position: absolute; top: 56px; left: 72px; z-index: 2; }   /* cream disc lockup */
```

Check the overlay keeps white text at 4.5:1 over the brightest part of the photo; darken the gradient rather than shrinking the text.

### Primary-Deep (partner announcements, slides, hero bands)

```css
.design-canvas {
  background: linear-gradient(135deg, #2b5069 0%, #1e3d52 100%);
  color: #fcfaf5;
  width: 1920px; height: 1080px; padding: 112px 128px;
  display: flex; flex-direction: column; justify-content: center;
}
.design-eyebrow {
  font-family: 'Lato', sans-serif; font-size: 18px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 4px; color: #b9cfdd;
}
.design-h1 { font-size: 96px; font-weight: 900; line-height: 1.02; letter-spacing: -2px; color: #ffffff; max-width: 1400px; }
.design-supporting { font-size: 30px; line-height: 1.5; color: rgba(252,250,245,0.82); max-width: 1100px; }
.design-lockup { display: inline-flex; align-items: center; gap: 28px; margin-bottom: 48px; }
.design-lockup .x { font-size: 40px; font-weight: 300; color: #b9cfdd; }
.design-lockup .partner {
  height: 88px; width: auto; padding: 14px 20px; border-radius: 16px; background: #ffffff;  /* white tile for partner logos */
}
.design-logo-mark { height: 88px; width: 88px; border-radius: 50%; background: #fcfaf5; }   /* cream disc, never invert */
```

### Editorial Data (Fitness Intelligence figures)

```css
.design-canvas {
  background: #ffffff; color: #1e3d52;
  width: 1200px; height: 1200px; padding: 72px;
  border-top: 8px solid #2b5069;
}
.design-eyebrow {
  font-family: 'Lato', sans-serif; font-size: 14px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 3px; color: #3d6a85; margin-bottom: 16px;
}
.design-h1 { font-size: 48px; font-weight: 800; line-height: 1.15; max-width: 960px; margin: 0 0 40px; }
.design-rank li {
  display: grid; grid-template-columns: 180px 1fr 90px; gap: 16px; align-items: center;
  font-family: 'Lato', sans-serif; font-size: 22px; margin-bottom: 14px;
}
.design-rank .bar { height: 22px; border-radius: 11px; background: #3d6a85; }
.design-rank li:first-child .bar { background: #2b5069; }
.design-rank .val { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.design-caption { font-family: 'Lato', sans-serif; font-size: 18px; color: #5b6573; margin-top: 24px; }
```

Sort bars descending, put units in the heading or the value, and keep the one-line takeaway as the headline. Every figure comes from `src/data/fitness/`.

### Paper Quote (real, consented quotes)

```css
.design-canvas { background: #fcfaf5; color: #1e3d52; width: 1080px; height: 1350px; padding: 120px 96px; position: relative; }
.design-quote-mark {
  font-family: Georgia, serif;          /* serif for the quote glyph only */
  font-size: 220px; line-height: 0.8; color: #2b5069; opacity: 0.18;
  position: absolute; top: 80px; left: 72px;
}
.design-quote { font-size: 46px; font-weight: 600; line-height: 1.32; letter-spacing: -0.5px; position: relative; z-index: 2; }
.design-attribution { margin-top: 40px; font-family: 'Lato', sans-serif; font-size: 22px; color: #5b6573; }
.design-attribution strong { color: #2b5069; font-weight: 700; }
.design-avatar { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; }
```

### Bold (challenges, one-liners)

```css
.design-canvas {
  background: #2b5069; color: #ffffff;
  width: 1080px; height: 1350px; padding: 96px 80px;
  display: flex; flex-direction: column; justify-content: center;
}
.design-flag {
  font-family: 'Lato', sans-serif; font-size: 18px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 4px; color: #fcfaf5;
  display: inline-block; padding: 8px 16px; border: 2px solid #fcfaf5; border-radius: 999px;
  margin-bottom: 36px; align-self: flex-start;
}
.design-h1 { font-size: 120px; font-weight: 900; line-height: 0.96; letter-spacing: -3px; }
```

### Device Frame (app-store screenshots, in-app landing sections)

```css
.design-canvas {
  width: 1290px; height: 2796px;       /* iPhone 6.9"; 1242x2688 for 6.5", 1080x1920 for Google Play */
  background: linear-gradient(180deg, #fcfaf5 0%, #f5f0e8 100%);
  color: #1e3d52; padding: 160px 96px 0;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.design-h1 { font-size: 96px; font-weight: 900; line-height: 1.05; letter-spacing: -1.5px; color: #2b5069; margin: 0 0 24px; }
.design-lede { font-size: 44px; line-height: 1.35; color: #1e293b; max-width: 1000px; margin: 0 0 96px; }
.design-device {
  width: 980px; border-radius: 120px; padding: 28px;
  background: #1e3d52;                  /* flat bezel, no 3D, no drop shadow */
}
.design-device img { display: block; width: 100%; border-radius: 96px; }   /* real screenshot only */
```

Keep one message per screenshot and the headline under six words. Store guidelines forbid misleading imagery: the screen must be the real app.

## Asset placements (per aesthetic)

- **Clean Cream, Coach Card, Bento, Editorial Data, Device Frame:** `massimino_logo_word.png` top-left at 64 to 80px height, or `massimino_logo.png` at 40 to 48px in the footer, as-is (cream on cream).
- **Photo Overlay, Primary-Deep, Bold:** cream disc lockup (`massimino_logo.png`, `border-radius: 50%`, cream background) plus a white `MASSIMINO` wordmark. Never `filter: invert`.
- **Paper Quote:** `massimino_logo.png` bottom-centre at 44px, with `massimino.fitness` centred underneath.
- **Partner designs:** Massimino mark and partner logo at equal optical height; partner logos without alpha (`quotavitalogo.jpg`) sit on a white rounded tile.

## Footer line: canonical pattern

Every design carries the Massimino mark plus the single CTA.

```html
<!-- light footer -->
<footer class="design-footer" style="display:flex;align-items:center;gap:14px;">
  <img src="../../../public/massimino_logo.png" alt="Massimino" style="height:44px;width:44px;border-radius:50%;" />
  <span class="design-cta" style="font-family:'Lato',sans-serif;font-weight:700;color:#2b5069;">massimino.fitness</span>
</footer>

<!-- dark footer -->
<footer class="design-footer" style="display:flex;align-items:center;gap:14px;">
  <img src="../../../public/massimino_logo.png" alt="Massimino" style="height:44px;width:44px;border-radius:50%;background:#fcfaf5;" />
  <span class="design-cta" style="font-family:'Lato',sans-serif;font-weight:700;color:#fcfaf5;">massimino.fitness</span>
</footer>
```

## When to ask before generating

- A topic but no source content (post draft, exercise entry, programme, data file). Ask: "Which content piece does this design accompany?"
- A recurring template ("every Monday exercise tip"). Suggest a small generator script in `scripts/` instead.
- The aesthetic conflicts with the content (Bold for a nuanced nutrition topic, Photo Overlay without a real photo, dark for a routine post).
- The brief implies fabricated numbers, invented results, a health claim, or a person whose consent is not confirmed: pause and ask.
