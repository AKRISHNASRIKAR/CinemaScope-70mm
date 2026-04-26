# CLAUDE.md — CinemaScope Project Guide

---

## Project Overview

**CinemaScope** is a cinematic film discovery web app. Users browse popular films, explore genre sections with live TMDB data, view detailed film pages, and search for movies and actors.

**Stage:** Active development — landing page and all internal pages redesigned with a cinematic dark aesthetic. No authentication backend wired (Auth0 is present but non-functional without valid credentials). No persistent storage.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18, Vite 6, JSX |
| Styling | Tailwind CSS v4 — `@theme` block in `tokens.css` generates all utility classes |
| Fonts | Google Fonts: Epilogue (wordmark), Playfair Display (display), Inter (body), DM Mono (metadata) |
| Data source | TMDB API — all calls via `fetch` or `axios` |
| Auth | Auth0 SDK installed — **not functional without valid Auth0 credentials** |
| State | React `useState` / `useEffect` — no global state library |
| Build | Vite 6 with `@tailwindcss/vite` plugin |
| Path alias | `@/` → `src/` (vite.config.js + jsconfig.json) |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_KEY` | TMDB API key | Yes |
| `VITE_BASE_URL` | TMDB API base (`https://api.themoviedb.org/3`) | Yes |
| `VITE_GITHUB_URL` | Developer's GitHub URL (footer credit link) | No |

See `.env.example` for template.

---

## What Was Built / Changed

### Session Changelog

1. **Project restructured** — files moved to `components/ui/`, `sections/`, `layout/`, `pages/`, `hooks/`, `lib/`, `styles/`
2. **Design tokens** — `tokens.css` with `@theme` block: colors, typography, shadows, blur, radius, animation
3. **Navbar** — fixed translucent bar. Logo centered ("CinemaScope" in Playfair Display), search expands inline, user avatar right
4. **Hero** — full-viewport backdrop, vignettes + grain overlay, bottom-left film info (rating, genres, title, metadata), "NOW SHOWING" carousel hidden on mobile
5. **StatsBlock** — stats numbers + "Top Picks by Genre" heading + poster bleed
6. **GenreRow** — three genre sections (Drama & Romance, Action & Adventure, Comedy) with real TMDB tab switching (FEATURED / IN THEATERS / TOP RATED), skeleton loading, responsive grid
7. **Footer** — minimal dark footer, developer credit with GitHub link
8. **All pages redesigned** — FilmPage, SearchPage, Person, Profile, LoginPage all use cinematic dark aesthetic with clamp() responsive sizing
9. **Responsiveness** — every size value uses `clamp(min, preferred, max)` for mobile→desktop scaling

### Session 4 — Performance, UX Features, Code Quality, Accessibility

25. **Route-level code splitting** — `App.jsx` now uses `React.lazy()` + `Suspense` for all pages. Initial bundle reduced from one 534kB chunk to a 311kB vendor chunk + per-page chunks (FilmPage 12kB, GenrePage 13kB, etc.)
26. **WebP image URLs** — `src/lib/utils/tmdbImage.js` added: `tmdbImage()`, `posterUrl()`, `backdropUrl()`, `profileUrl()` helpers rewrite TMDB paths to `.webp` for ~30% smaller images. Used in `FilmCard`, `FilmPage`, `Person`, `HeroCarousel`, `Hero`
27. **Font subsetting** — Google Fonts URL updated with `&subset=latin` to reduce font payload
28. **Skip navigation link** — visually hidden "Skip to main content" link added to `index.html`; `<main id="main-content">` added in `App.jsx`
29. **`useReducedMotion` hook** — `src/hooks/useReducedMotion.js` reads `prefers-reduced-motion` media query reactively. Hero uses it to swap Framer Motion animated variants for instant static variants
30. **Hero keyboard navigation** — `ArrowLeft`/`ArrowRight` keys on the `<section>` advance the carousel; `aria-label` and `aria-roledescription="carousel"` added
31. **`ScrollRow` component** — `src/components/ui/ScrollRow.jsx`: generic horizontal scroll primitive with keyboard `ArrowLeft`/`ArrowRight` support, `role="region"`, `aria-label`, `focus-visible` ring, hover-reveal arrows. Replaces duplicated scroll logic
32. **`HeroCarousel` refactored** — uses WebP URLs, keyboard navigation on strip, `role="button"` + `tabIndex` + `aria-label` on each card item
33. **`FilmographyRow` refactored** — uses `ScrollRow`, keyboard-accessible items, WebP URLs via `posterUrl()`
34. **`FilmCard` updated** — WebP URLs, `role="button"`, `tabIndex`, `aria-label`, `focus-visible` ring, accepts `className` prop
35. **`useRecentlyViewed` hook** — `src/hooks/useRecentlyViewed.js`: persists last 10 visited film IDs in `localStorage`, cross-tab sync via `storage` event
36. **Recently Viewed row** — appears on homepage above genre sections after visiting any film; includes Clear button; uses `ScrollRow`
37. **Watch Providers section** — `WatchProviders` component on FilmPage fetches `/movie/{id}/watch/providers`, shows Stream/Rent/Buy provider logos with JustWatch attribution; independent `Suspense` boundary
38. **Film Comparison page** — `/compare?a=ID&b=ID` route; inline film search dropdowns, side-by-side poster/rating/runtime/genres/overview, swap button, shareable URL params
39. **Compare link** — added to Navbar right cluster (hidden on mobile)
40. **`@keyframes spin`** — added to `globals.css` for the `PageLoader` spinner in `App.jsx`
18. **Skeleton audit — full rewrite of `Skeletons.jsx`:**
    - Added `HomeHeroSkeleton` (90vh) — separate from `FilmDetailHeroSkeleton` (clamp 40–65vh) since they have different heights
    - `CastSectionSkeleton` — now renders 8 cards (matching `INITIAL_CAST`), correct `aspect-[3/4]` photo area, correct polaroid bottom padding proportion
    - `PersonHeaderSkeleton` — now uses correct `sm:w-[38%] lg:w-[35%]` left column, `aspect-[2/3]` portrait, bio line heights matching real text
    - `FilmRowSkeleton` — card width corrected to `clamp(100px, 12vw, 180px)` matching real filmography cards
    - Added `SimilarMoviesSkeleton` — 5-card grid matching `xl:grid-cols-5` layout with section heading placeholder
    - Added `GenreRowSkeleton` — 2/3/4 column grid matching `GenreRowContent` exactly (replaces `FilmRowSkeleton` in `GenreRow`)
    - All skeletons use `.skeleton` shimmer class, `rounded-card` border radius, `bg-white/5` surface
19. **GenreRow** — switched from `FilmRowSkeleton` to `GenreRowSkeleton` (grid layout, not flex row)
20. **GenrePage** — `NAV_HEIGHT` changed from hardcoded `clamp(3.5rem, 7vw, 5rem)` to `var(--navbar-height, 3.5rem)` so it tracks the real navbar
21. **Person.jsx** — removed stale `mb-8` BackButton wrapper div (BackButton is fixed-positioned)
22. **README.md** — written from scratch: overview, features (honest ✅/🚧), tech stack, getting started, project structure, design system, architecture decisions, roadmap
23. **docs/loom-walkthrough.md** — 5-minute timed Loom script for Bettrhq application
24. **docs/improvements.md** — candid technical improvements backlog: performance, UX, code quality, accessibility, review platform features, infrastructure

---

## Design System

### Color Tokens (from `src/styles/tokens.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-base` | `#090909` | Page background |
| `--color-surface` | `#111111` | Cards, inputs |
| `--color-section-dark/mid/light` | `#0f0f0f` / `#181e2c` / `#f5f5f0` | Genre row backgrounds |
| `--color-gold` | `#c9a843` | **Ratings, CTAs, active tabs ONLY** |
| `--color-muted` | `#8a8a8a` | Secondary text |
| `--color-ink` | `#111111` | Text on light sections |

### Typography

| Role | Font | Usage |
|------|------|-------|
| Display | Playfair Display (serif) | Hero title, section headings, page titles |
| Body | Inter (sans-serif) | All body text, buttons, labels |
| Mono | DM Mono | Metadata, ratings, timestamps |

### Responsive Approach

All sizes use `clamp(min, preferred, max)`:
- **Mobile:** `< 640px` — single column, hero carousel hidden
- **Tablet:** `640–1024px` — 2-3 column grids
- **Desktop:** `> 1024px` — full layout, 4-column poster grids

---

## Component Architecture

```
src/
├── components/
│   ├── ui/           ← Stateless primitives (FilmCard, FilterTabs, BrowseMoreLink, PaginationDots, PlayButton)
│   ├── sections/     ← Page sections (Hero, HeroCarousel, StatsBlock, GenreRow)
│   └── layout/       ← App chrome (Navbar, Footer)
├── pages/            ← One file per route
├── hooks/            ← Data fetching hooks (useMoviesByGenre)
├── lib/
│   ├── api/          ← TMDB API functions (tmdb.js)
│   └── constants/    ← Static data (GENRE_MAP, GENRE_SECTIONS, logoURL)
└── styles/           ← globals.css, tokens.css, LoginPage.css
```

### Key Components

| Component | Props | Notes |
|-----------|-------|-------|
| `Hero` | `film`, `relatedFilms` | Full-viewport, carousel hidden on mobile, keyboard navigable |
| `GenreRow` | `genre`, `tagline`, `genreIds`, `alignment`, `theme` | Fetches TMDB data per tab internally |
| `HeroCarousel` | `films`, `label` | Paginating portrait poster strip, keyboard navigable |
| `FilmCard` | `film`, `subtitle`, `className` | Reusable poster + title card, keyboard accessible |
| `FilterTabs` | `active`, `onChange`, `dark` | FEATURED / IN THEATERS / TOP RATED |
| `Navbar` | (none) | Fixed, translucent, search expand/collapse, Compare link |
| `ScrollRow` | `showArrows`, `scrollAmount`, `gap`, `label`, `arrowSize`, `children` | Generic keyboard-accessible horizontal scroll primitive |

---

## Pages & Routes

| Page | Route | Status |
|------|-------|--------|
| Home | `/` | ✅ Complete — includes Recently Viewed row |
| Login | `/login` | ✅ Complete (visual only without Auth0 credentials) |
| Profile | `/profile` | ✅ Complete |
| Film Detail | `/film/:id` | ✅ Complete — includes Watch Providers section |
| Person | `/person/:person_id` | ✅ Complete |
| Search | `/search/:query` | ✅ Complete |
| Genre Browse | `/genre/:id` | ✅ Complete |
| Compare | `/compare` | ✅ Complete — shareable URL params |

---

## Conventions

1. **All colors via tokens** — no hardcoded hex anywhere in components
2. **All sizes via `clamp()`** — no fixed `px` for fonts or layout widths
3. **Import aliases** — always `@/components`, `@/hooks`, `@/lib`, `@/styles`
4. **Gold accent** — ratings, CTAs, active states ONLY; never decorative
5. **Data fetching** — in hooks or page-level useEffect; never inside ui/ components
6. **Font assignment** — `font-display` for headings, `font-body` for text, `font-mono` for metadata
7. **Centering containers** — always use `.center-container` (defined in `globals.css`); never use `max-w-screen-xl mx-auto` directly in components
8. **Button padding (Tailwind v4 quirk)** — Tailwind v4 does not reliably compile shorthand padding utilities on `<button>` elements with `rounded-*`. Always use explicit inline `style={{ padding: "..." }}` on text buttons to prevent text clipping at the border. Example: `style={{ padding: "0.75rem 2rem" }}`
9. **BackButton** — already `fixed` positioned via `--navbar-height` CSS variable; never wrap it in an additional positioned container

### How to Add a New Page

1. Create `src/pages/YourPage.jsx`
2. Add route in `src/App.jsx`
3. Use `font-display` for page title, `bg-base` for background
4. Include `<Footer />` at the bottom
5. All sizes must use `clamp()` values

### How to Add a New Genre Section

1. Add entry to `GENRE_SECTIONS` in `src/lib/constants/index.js`
2. It will auto-render on the homepage — no other changes needed

---

## Known Issues / TODOs

- Auth0 is non-functional without valid credentials — all routes are `ProtectedRoute` wrapped, so the app redirects to login on every page without a real Auth0 tenant configured
- Chunk size advisory from Vite build (>500kB) — resolved by route-level code splitting; main vendor chunk is now 311kB
- Profile stats (Films Watched, Reviews, Favourites) are commented out — pending backend/watch history feature
- Trailer modal UI (`PlayButton.jsx`) exists but is not wired — TMDB `/movie/{id}/videos` endpoint not yet consumed
- No test coverage — see `docs/improvements.md` for the testing strategy
- CI/CD pipeline not yet set up — immediate next infrastructure task
- Watch Providers shows US region by default; no region selector yet

## Docs

- [`docs/improvements.md`](./docs/improvements.md) — candid technical improvements backlog (performance, UX, accessibility, roadmap)
- [`docs/loom-walkthrough.md`](./docs/loom-walkthrough.md) — 5-minute Loom script for job application walkthrough

---

## Data Fetching Architecture

### Suspense & SWR
- **Strategy:** The project uses **SWR** with `suspense: true` for all client-side data fetching. This allows components to "suspend" while data is loading, offloading loading state management to parent `Suspense` boundaries.
- **Granular Boundaries:** Pages are divided into independent data-driven components (e.g., `FilmHero`, `CastSection`, `SimilarMovies`). Each has its own `Suspense` fallback (Skeleton) and `ErrorBoundary`, ensuring that a failure in one section doesn't crash the entire page.
- **Skeletons:** Custom skeletons in `src/components/ui/Skeletons.jsx` match exact content dimensions to eliminate Layout Shift (CLS).

### Performance — Waterfall Fixes
- **FilmPage:** Resolved waterfall by using `parallelFetcher` to request movie details and US certification release dates simultaneously.
- **PersonPage:** Header data and filmography credits are requested in parallel using independent Suspense boundaries.
- **HomePage:** Each `GenreRow` initiates its own fetch concurrently; a slow row doesn't block others.
- **Shared Fetcher:** `src/lib/api/fetcher.js` provides a centralized `fetcher` and `parallelFetcher` to handle TMDB auth and endpoint resolution.

---

## Navigation & UI

### BackButton
- **Component:** `src/components/ui/BackButton.jsx`
- **Behavior:** Smart back navigation via `useBackNavigation` hook.
  - Primary: `navigate(-1)`
  - Fallback: Uses `fallbackRoute` prop if no history exists (prevents users from getting stuck when landing via direct URL).
- **Styling:** Cinematic glass effect (blur + translucent bg) with responsive labels.

---

## Performance & Transitions

### Hero Cinematic Transitions
- **Three-Layer Logic:** The Hero uses Layer A (current), Layer B (incoming), and Layer C (permanent vignette).
- **Silent Preloading:** Next backdrop is preloaded via `img.onload` before the crossfade starts to prevent "flashing" or empty frames.
- **Staggered Content:** Film metadata (title, genre, etc.) uses `framer-motion` with staggered delays for a premium reveal effect.
- **Carousel Sync:** The "Now Showing" strip automatically smooth-scrolls the active film into the center of the viewport (using `scrollLeft` to avoid vertical page jumps).

### Lazy Loading Strategy
- **Above the Fold:** Hero backdrops and main film posters use `loading="eager"` and `fetchpriority="high"` for instant LCP.
- **Lazy Content:** All other posters and profile photos use `loading="lazy"` via the `LazyImage` component.
- **IntersectionObserver:** Heavy sections like the **Cast Grid** in `FilmPage` only load their images when the section scrolls into view (with a 200px rootMargin buffer).
- **Placeholders:** Every lazy image displays a `.skeleton` shimmer effect during load and a contextual icon fallback (Film or Person) on error to prevent layout shift.
- **No Dependencies:** Most logic uses native browser APIs (`IntersectionObserver`, `loading="lazy"`) to keep the bundle size small.

---

## Global UI & UX Refinements

- **Navbar Height Calculation:** The `Navbar` component measures its actual DOM height on mount and exposes it globally via the CSS custom property `--navbar-height` on the `:root` element. This guarantees perfect offsets for fixed elements like the `BackButton` and sticky filter tabs across all responsive breakpoints.
- **Accessibility & Motion:** All interactive elements feature a clear `focus-visible` gold outline. The application respects system accessibility settings globally via a `@media (prefers-reduced-motion: reduce)` rule that disables all CSS transitions and animations when requested by the user.
- **Future Improvements:** For a comprehensive list of planned frontend enhancements, low-effort high-impact tasks, and accessibility goals, see the living suggestions document at [docs/implement.md](./docs/implement.md).
