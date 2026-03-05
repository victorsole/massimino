Summary: GEO Optimisation (llms.txt + SPA Pre-rendering)                                                                                                       
                                                                                                                                                                 
  1. llms.txt                                                                                                                                                    

  A markdown file at the site root that describes the site to LLM crawlers (standard from llmstxt.org).

  Files created:
  - frontend/public/llms.txt -- site description, features, pricing, tech stack, key pages
  - Root llms.txt -- copy for the repo root

  Wiring:
  - frontend/index.html -- added <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt">
  - frontend/public/robots.txt -- added Llmstxt: https://brubru.beresol.eu/llms.txt

  Template for Beresol: Write a markdown file describing the site. Include company name, what it does, key pages with URLs, pricing if applicable, and contact
  info. Keep it under ~2KB. Link it from <head> and robots.txt.

  ---
  2. SPA Pre-rendering

  Post-build step that renders public pages to static HTML using Puppeteer so AI crawlers see real content.

  Dependencies (devDependencies):

  npm install --save-dev puppeteer sirv


  Files:

  ┌───────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │         File          │                                              What it does                                              │
  ├───────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ scripts/prerender.mjs │ Boots sirv from dist/, visits each route with Puppeteer, captures HTML, writes dist/{route}/index.html │
  ├───────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ src/main.tsx          │ Conditional hydration -- hydrateRoot if pre-rendered content exists, createRoot otherwise              │
  ├───────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ public/robots.txt     │ Explicit Allow for GPTBot, ClaudeBot, PerplexityBot, Google-Extended                                   │
  ├───────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ package.json          │ Added "build:prerender": "tsc -b && vite build && node scripts/prerender.mjs"                          │
  └───────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  How main.tsx changes:
  // Before
  createRoot(document.getElementById('root')!).render(<App />);

  // After
  const root = document.getElementById('root')!;
  if (root.innerHTML.trim().length > 0) {
    hydrateRoot(root, <App />);
  } else {
    createRoot(root).render(<App />);
  }

  How prerender.mjs works:
  1. Saves original dist/index.html as backup
  2. Starts sirv serving dist/ on a random port
  3. For each route: opens Puppeteer page, navigates, waits for #root to have content, injects per-route <title> and <meta description>, captures page.content()
  4. After all routes captured in memory, writes each to dist/{route}/index.html
  5. Preserves the <script type="module"> tag in all files so the SPA still works for real users

  Key gotchas solved:
  - Don't overwrite dist/index.html mid-render (breaks subsequent routes since sirv serves it as SPA fallback)
  - Don't block Supabase/API requests (auth state won't resolve, pages stay empty)
  - Use networkidle2 not networkidle0 (more lenient for failed network requests)
  - Use a try/catch on the content wait with fallback (some pages may timeout)
  - Skip routes with no content rather than writing empty files

  robots.txt additions:

  User-agent: GPTBot
  Allow: /
  Disallow: /auth/
  Disallow: /admin

  User-agent: ClaudeBot
  Allow: /
  Disallow: /auth/
  Disallow: /admin


  (Same for PerplexityBot and Google-Extended)

  Build & deploy:

  npm run build              # normal SPA build (no pre-rendering)
  npm run build:prerender    # build + pre-render (use for production)


  The dist/ folder then has about/index.html, privacy/index.html, etc. Apache/Nginx serves these directly via DirectoryIndex.