# CinemaScope

A cinematic film discovery web app powered by the TMDB API.

## Overview

CinemaScope lets users browse popular films, explore curated genre sections, view detailed film and actor pages, and search across the entire TMDB catalogue. It is built as a polished, production-quality frontend with a dark cinematic aesthetic. The project is actively evolving toward a full film review and rating platform where users can log films, write reviews, and build personal watchlists.

## Features

- ✅ **Hero carousel** — auto-rotating full-viewport backdrop with crossfade transitions, manual prev/next controls, and dot indicators
- ✅ **Genre rows** — three curated genre sections (Drama & Romance, Action & Adventure, Comedy) with live TMDB tab switching (Featured / In Theaters / Top Rated)
- ✅ **Film detail page** — backdrop hero, poster, metadata (certification, runtime, genres), cast polaroid grid with expand/collapse, similar films
- ✅ **Actor/person page** — portrait, biography with read more/less, filmography scroll row
- ✅ **Search** — debounced live search across films and people, URL-synced query params, direct URL load support
- ✅ **Genre browse page** — full grid with sort (Popularity, Rating, Newest, Oldest) and filter (All, In Theaters, Top Rated, Coming Soon) tabs, infinite load more
- ✅ **Skeleton loaders** — every data-driven section has a dimension-matched shimmer skeleton to eliminate layout shift
- ✅ **Lazy loading** — IntersectionObserver-based image loading with shimmer placeholders and contextual error fallbacks
- ✅ **Responsive design** — mobile-first, all sizes via `clamp()`, tested at 375px / 768px / 1280px
- ✅ **Cinematic design system** — dark aesthetic, Tailwind v4 `@theme` token system, Epilogue + Playfair Display + Inter + DM Mono
- 🚧 **Authentication** — Auth0 SDK integrated, non-functional without valid Auth0 tenant credentials
- 🚧 **User profiles** — profile page exists, stats (films watched, reviews, favourites) are placeholders pending backend

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18, Vite 6, JSX |
| Styling | Tailwind CSS v4 — `@theme` block in `tokens.css` |
| Fonts | Epilogue (wordmark), Playfair Display (headings), Inter (body), DM Mono (metadata) |
| Animation | Framer Motion |
| Data | TMDB API via SWR + axios |
| Auth | Auth0 React SDK |
| State | React `useState` / `useEffect` — no global state library |
| Icons | MUI Icons Material |
| Build | Vite 6 with `@tailwindcss/vite` plugin |

## Getting Started

### Prerequisites

- Node.js 18+
- A [TMDB API key](https://www.themoviedb.org/settings/api) (free)
- (Optional) An [Auth0](https://auth0.com) tenant for authentication

### Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/cinemascope.git
cd cinemascope
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Required |
|---|---|---|
| `VITE_API_KEY` | Your TMDB API key | Yes |
| `VITE_BASE_URL` | TMDB API base URL (`https://api.themoviedb.org/3`) | Yes |
| `VITE_GITHUB_URL` | Your GitHub profile URL (shown in footer) | No |

### Run locally

```bash
npm run dev
```

App runs at `http://localhost:5173`.

> **Note:** Without valid Auth0 credentials configured in the app, all protected routes redirect to the login page. The login page is visual-only in this state.

### Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # Stateless primitives — FilmCard, FilterTabs, LazyImage, Skeletons, etc.
│   ├── sections/     # Page sections — Hero, HeroCarousel, GenreRow, StatsBlock
│   └── layout/       # App chrome — Navbar, Footer
├── pages/            # One file per route — Home, FilmPage, Person, SearchPage, GenrePage, Profile, LoginPage
├── hooks/            # Custom hooks — useBackNavigation, useMoviesByGenre
├── lib/
│   ├── api/          # TMDB fetcher and parallelFetcher
│   └── constants/    # GENRE_MAP, GENRE_SECTIONS
└── styles/           # globals.css, tokens.css (Tailwind v4 @theme block)
```

## Design System

The app uses a **cinematic dark aesthetic** built on a Tailwind v4 `@theme` token system defined in `src/styles/tokens.css`. Every color, font, shadow, radius, and animation duration is a named token — no hardcoded values in components.

Key decisions:
- `--color-gold` (`#c9a843`) is reserved exclusively for ratings, active states, and CTAs
- All layout sizes use `clamp(min, preferred, max)` for fluid responsive scaling without breakpoint jumps
- The `.center-container` utility (80rem / 1280px max-width, auto margins) is the single source of truth for page-level centering

## Architecture Decisions

- **SWR with `suspense: true`** — each data-driven section suspends independently, so a slow API call in one section never blocks others. Each section has its own `<Suspense>` boundary with a dimension-matched skeleton and an `<ErrorBoundary>`.
- **Parallel fetching** — `parallelFetcher` in `fetcher.js` resolves multiple TMDB endpoints simultaneously (e.g. film details + release dates on FilmPage) to eliminate request waterfalls.
- **Three-layer hero** — Layer A (current backdrop), Layer B (incoming, preloaded silently before crossfade), Layer C (permanent vignette). Prevents flash frames during transitions.
- **IntersectionObserver for cast images** — the cast grid only starts loading profile photos when the section scrolls into view (200px rootMargin), keeping initial page load fast.
- **CSS custom property for navbar height** — `--navbar-height` is set dynamically from the real DOM height on mount and resize, so the fixed BackButton and sticky filter bars always offset correctly regardless of breakpoint.

## Roadmap

- [ ] Wire Auth0 with a real tenant — enable protected routes
- [ ] User film reviews and star ratings
- [ ] Watchlist and favourites (localStorage → backend)
- [ ] CI/CD pipeline (GitHub Actions → Vercel/Netlify)
- [ ] TypeScript migration
- [ ] Trailer modal via TMDB videos endpoint
- [ ] Watch providers data (streaming availability)
- [ ] Keyboard navigation for carousels

See [`docs/improvements.md`](./docs/improvements.md) for the full technical improvements backlog.

## Contributing

Pull requests are welcome. Please follow the conventions documented in [`CLAUDE.md`](./CLAUDE.md) — token-only colors, `clamp()` sizing, no data fetching inside `ui/` components.

## License

MIT
