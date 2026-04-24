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
| Fonts | Google Fonts: Playfair Display (display), Inter (body), DM Mono (metadata) |
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
| `Hero` | `film`, `relatedFilms` | Full-viewport, carousel hidden on mobile |
| `GenreRow` | `genre`, `tagline`, `genreIds`, `alignment`, `theme` | Fetches TMDB data per tab internally |
| `HeroCarousel` | `films`, `label` | Paginating portrait poster strip |
| `FilmCard` | `film`, `subtitle` | Reusable poster + title card |
| `FilterTabs` | `active`, `onChange`, `dark` | FEATURED / IN THEATERS / TOP RATED |
| `Navbar` | (none) | Fixed, translucent, search expand/collapse |

---

## Pages & Routes

| Page | Route | Status |
|------|-------|--------|
| Home | `/` | ✅ Complete |
| Login | `/login` | ✅ Complete (visual only without Auth0 credentials) |
| Profile | `/profile` | ✅ Complete |
| Film Detail | `/film/:id` | ✅ Complete |
| Person | `/person/:person_id` | ✅ Complete |
| Search | `/search/:query` | ✅ Complete |

---

## Conventions

1. **All colors via tokens** — no hardcoded hex anywhere in components
2. **All sizes via `clamp()`** — no fixed `px` for fonts or layout widths
3. **Import aliases** — always `@/components`, `@/hooks`, `@/lib`, `@/styles`
4. **Gold accent** — ratings, CTAs, active states ONLY; never decorative
5. **Data fetching** — in hooks or page-level useEffect; never inside ui/ components
6. **Font assignment** — `font-display` for headings, `font-body` for text, `font-mono` for metadata

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

## Next Steps

- **CI/CD pipeline** — Vercel / Netlify deployment
- **Authentication** — wire Auth0 with real credentials from `.env`
- **Watchlist** — requires backend/database (not started)
- **Mobile nav** — hamburger menu for mobile breakpoints
- **Performance** — image lazy loading, code splitting per route
