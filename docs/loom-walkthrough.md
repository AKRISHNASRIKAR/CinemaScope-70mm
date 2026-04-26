# CinemaScope — 5-Min Loom Walkthrough Script

**For:** Bettrhq application — sayan.bhattacharyya@bettrhq.com  
**GitHub:** [YOUR_GITHUB]  
**LinkedIn:** [YOUR_LINKEDIN]  
**Criteria:** Product walkthrough, decisions, architecture, commit history, code quality

---

## [0:00 – 0:30] Introduction

> "Hi, I'm Krishna. This is CinemaScope — a cinematic film discovery app I built to explore what a polished, production-quality React frontend looks like when you treat design and engineering with equal seriousness.
>
> It's powered by the TMDB API, built with React 18, Vite, Tailwind v4, and SWR. The goal was to build something that feels like a real product — not a tutorial project."

**Show:** The homepage loading for the first time. Let the hero carousel auto-rotate once.

---

## [0:30 – 1:30] Product Walkthrough

### Homepage
- Point out the **hero carousel** — auto-rotating, crossfade transitions, dot indicators, manual arrows
- Scroll down slightly to show the **"Top Picks by Genre"** heading and the first genre row loading in
- Click a **filter tab** (e.g. "In Theaters") — show it fetches and re-renders independently
- Point out the **"Browse More"** link — navigates to the genre page

### Film Detail Page
- Click any poster from a genre row
- Show the **backdrop hero** fading into the page background
- Point out the **cast polaroid grid** — rotated cards, hover animation
- Click **"View Full Cast"** — show the expand animation
- Click a **cast member** — navigate to the person page

### Person Page
- Show the **portrait + biography** layout
- Point out the **"Known For"** filmography scroll row
- Click a film to navigate back

### Search
- Open the navbar search capsule — show the expand animation
- Type a query — show debounced live results
- Show both **Movies** and **People** sections in results
- Click a person result — show the polaroid card style

### Genre Browse Page
- Navigate to a genre page (via "Browse More" or genre heading)
- Show the **blurred poster mosaic** hero
- Switch sort options and filter tabs — show the grid re-fetching
- Scroll to the bottom — show **Load More** appending results

**Point out moments that feel intentional:**
- The hero crossfade never flashes — backdrops are preloaded silently before the transition starts
- Skeletons match exact content dimensions — no layout shift when data loads
- The navbar height is measured from the real DOM and exposed as a CSS variable — the back button always offsets correctly

---

## [1:30 – 2:30] Architecture & Technical Decisions

**Show the `src/` folder structure while talking.**

> "The folder structure reflects a clear separation of concerns."

- `ui/` — stateless primitives. `FilmCard`, `LazyImage`, `Skeletons`. No data fetching, no side effects.
- `sections/` — page sections that may have their own data. `Hero`, `GenreRow`, `HeroCarousel`.
- `layout/` — app chrome. `Navbar`, `Footer`.
- `pages/` — one file per route. Each page composes sections and manages its own Suspense boundaries.
- `hooks/` — data and navigation logic extracted from components.
- `lib/api/` — all TMDB calls go through a single `fetcher` and `parallelFetcher`.

**Key decisions:**

1. **SWR with `suspense: true`** — each section suspends independently. A slow cast API call doesn't block the film hero from rendering. Show the three `<Suspense>` boundaries in `FilmPage.jsx`.

2. **Parallel fetching** — open `fetcher.js`. Show `parallelFetcher`. On the film page, movie details and release dates are fetched simultaneously with `Promise.all` — eliminates a full round-trip waterfall.

3. **Three-layer hero** — open `Hero.jsx`. Explain Layer A (current), Layer B (incoming, preloaded before fade), Layer C (permanent vignette). The preload happens silently via `new Image()` before the opacity transition starts.

4. **Auth0** — installed and wired, but non-functional without a real tenant. All routes are `ProtectedRoute` wrapped. This is intentional — the architecture is ready for real auth, it just needs credentials.

---

## [2:30 – 3:30] Code Quality Walkthrough

### Best-structured component: `Hero.jsx`
- Open it. Point out: constants at the top, pure helper functions, clear state model (layerA/B/C), `useCallback` for stable references, `useRef` for stale-closure-safe index tracking.
- The component has zero data fetching — data comes in as props from `HeroSection` in `Home.jsx`.

### Design token system: `tokens.css`
- Open `src/styles/tokens.css`. Show the `@theme` block.
- Every color, font, shadow, radius, and animation duration is a named token.
- `--color-gold` is documented as ratings/CTAs/active states only — enforced by convention.
- `clamp()` values on every size token — fluid scaling without breakpoint jumps.

### CLAUDE.md as a living context document
- Open `CLAUDE.md`. Show the session changelog, conventions section, known issues.
- Explain: this is the project's memory. Every agent or developer who touches this codebase reads this first. It documents decisions, not just code.

### Custom hook: `useBackNavigation.js`
- Open it. Simple, focused — checks `window.history.length` and either navigates back or falls back to a provided route. Prevents users from getting stuck when landing via direct URL.

### Error boundary + skeleton pattern
- Open `FilmPage.jsx`. Show the three independent `<ErrorBoundary><Suspense fallback={<Skeleton />}>` blocks.
- Each section fails independently. A broken credits API doesn't crash the film hero.

---

## [3:30 – 4:30] What I'd Do Next / Roadmap

> "I want to be honest about what's missing and specific about what comes next."

**Immediate next steps:**

1. **CI/CD pipeline** — GitHub Actions running `npm run build` and `npm run lint` on every PR. Deploy to Vercel on merge to main. This is literally the next task.

2. **Wire Auth0** — configure a real tenant, test the protected route flow end-to-end.

3. **User reviews and ratings** — this is the core product evolution. Users log films, write reviews, give star ratings. Needs a backend (likely a lightweight Node/Express API or Supabase), a reviews data model, and new UI components. The profile page already has placeholder slots for this data.

4. **TypeScript migration** — the codebase is JSX today. Moving to TSX would catch prop-type errors at compile time. The component interfaces are already well-defined — migration would be incremental.

**Show `docs/improvements.md`** — "I keep a candid improvements doc. It covers performance gaps, accessibility issues, and features I'd build next. I think it's important to be honest about what a project doesn't do yet."

---

## [4:30 – 5:00] Close

> "The repo is at [YOUR_GITHUB] — the commit history shows the progression from initial scaffold to the current state. CLAUDE.md documents every session's changes.
>
> I'd love to talk more about the architecture decisions or walk through any specific part of the code. You can reach me on LinkedIn at [YOUR_LINKEDIN], or reply to this recording.
>
> Thanks for watching."

---

*Contact: sayan.bhattacharyya@bettrhq.com*
