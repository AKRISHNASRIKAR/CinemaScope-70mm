# CLAUDE.md — CinemaScope Project Guide

> This file is the authoritative reference for anyone contributing to this codebase.
> Read it in full before adding any file, component, or feature.

---

## Project Overview

**CinemaScope** is a movie discovery web app built for cinema enthusiasts.
Users can browse popular films, search for movies and actors, view detailed film pages, and explore cast/crew profiles.

**Who it's for:** Personal project / portfolio — authenticated users via Auth0.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 (Vite 6, JSX — no TypeScript) |
| Routing | React Router DOM v7 |
| Auth | Auth0 (`@auth0/auth0-react`) |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) + Vanilla CSS for LoginPage |
| Component library | MUI v6 (icons + a few layout primitives) |
| Data source | TMDB API (The Movie Database) |
| HTTP client | `axios` (pages) + native `fetch` (Home.jsx) |
| Animations | Framer Motion installed — **not yet used** |
| Build tool | Vite 6 |
| Path alias | `@/` → `src/` (configured in `vite.config.js` + `jsconfig.json`) |

### Current State

| Feature | Status |
|---------|--------|
| Home page (banner + popular row) | ✅ Working |
| Film detail page | ✅ Working |
| Person / cast profile page | ✅ Working |
| Search (movies + people) | ✅ Working |
| Auth0 login / protected routes | ✅ Working |
| Profile page | ✅ Working |
| Footer | ⚠️ Built, never rendered — not in App.jsx |
| Design tokens / theming | ❌ Not started (`styles/tokens.css` is a placeholder) |
| Hooks extraction | ❌ Data fetching is still inline in pages |
| `lib/api/tmdb.js` used by pages | ❌ Pages still call TMDB directly — tmdb.js is ready but not wired up |

---

## Folder Structure

```
src/
  App.jsx                    Router + auth wrapper. No data fetching.
  main.jsx                   React DOM root. Auth0Provider. Global CSS import.
  components/
    ui/                      Primitive atoms: Button, Badge, Input, Modal, Spinner.
                             Stateless. No data fetching. No page layout.
    sections/                Composed page sections rendered inside pages.
                             Receive all data as props. No fetching.
    layout/                  Persistent app chrome: Navbar, Footer.
                             Rendered at the App.jsx level.
  pages/                     One file per route. Thin orchestrators only.
                             Render layout + sections. Delegate fetching to hooks/.
  hooks/                     Every useEffect/useState data pattern lives here.
                             Named useXxx.js. Returns data + loading + error.
  lib/
    api/                     Raw TMDB API call functions. No React, no state.
                             Returns data or throws. Consumed by hooks/.
    constants/               Static config, look-up tables, route strings.
                             No logic. No side effects.
    utils/                   Pure helper functions. input → output. No side effects.
  styles/
    globals.css              Global resets, base styles, Tailwind import.
                             Imported once in main.jsx.
    tokens.css               CSS custom properties (colors, spacing, typography).
                             Import in globals.css when ready.
    LoginPage.css            Scoped CSS for LoginPage only (vanilla CSS animation).
  assets/                    (currently empty — use public/ for images/logos)
```

### The Decision Rule

| If it… | It belongs in… |
|--------|---------------|
| Fetches data / has `useEffect` | `hooks/` |
| Is reusable and stateless | `components/ui/` |
| Is a composed page section | `components/sections/` |
| Is persistent app chrome | `components/layout/` |
| Is a full route/page | `pages/` |
| Calls an external API | `lib/api/` |
| Is a static value or lookup table | `lib/constants/` |
| Is a pure function | `lib/utils/` |
| Is a CSS variable or token | `styles/tokens.css` |

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase, filename = component name | `FilmCard.jsx` |
| Hooks | `useXxx.js` | `useFilmDetails.js` |
| API functions | camelCase | `getMovieDetails` |
| Utils | camelCase | `formatRuntime.js` |
| Types (future) | PascalCase with `.types.js` suffix | `Film.types.js` |
| Constants (values) | SCREAMING_SNAKE_CASE | `GENRE_MAP`, `BASE_URL` |
| Constants (files) | camelCase | `index.js`, `routes.js` |
| CSS files | PascalCase matching their component | `LoginPage.css` |

---

## Import Rules

### Always use the `@/` path alias — never `../../` relative imports

```js
// ✅ Correct
import Banner from "@/components/sections/Banner";
import { GENRE_MAP } from "@/lib/constants";
import "@/styles/globals.css";

// ❌ Wrong
import Banner from "../../components/sections/Banner";
```

### Alias Map

| Alias | Resolves to |
|-------|------------|
| `@/components` | `src/components` |
| `@/pages` | `src/pages` |
| `@/hooks` | `src/hooks` |
| `@/lib` | `src/lib` |
| `@/styles` | `src/styles` |
| `@/assets` | `src/assets` |

Alias is configured in `vite.config.js` (runtime) and `jsconfig.json` (IDE).

---

## Component Rules

1. **Every component must accept a `className` prop** (once UI solidification begins).
2. **No hardcoded colors, spacing, or font sizes** — use Tailwind utilities backed by tokens.
3. **No data fetching inside components** — always delegate to a hook in `hooks/`.
4. **No business logic inside UI components** — format/transform in `lib/utils/`.
5. **Sections receive all data as props** — they never know where data comes from.

---

## How to Add a New Page

1. Create `src/pages/YourPage.jsx` (PascalCase, matches route concept)
2. Add the route to `src/App.jsx` — decide if it needs `<ProtectedRoute>`
3. If the page needs data, create `src/hooks/useYourData.js` first
4. Compose sections from `src/components/sections/` inside the page
5. Add the route constant to `src/lib/constants/index.js` if needed

```jsx
// src/pages/WatchlistPage.jsx
import { useWatchlist } from "@/hooks/useWatchlist";
import FilmCarousel from "@/components/sections/FilmCarousel";

const WatchlistPage = () => {
  const { films, loading, error } = useWatchlist();
  return <FilmCarousel films={films} loading={loading} error={error} />;
};

export default WatchlistPage;
```

---

## How to Add a New Component

**Decide the folder first using the rule table above, then:**

### Adding a UI Primitive (`components/ui/`)

1. Create `src/components/ui/YourComponent.jsx`
2. Must be stateless and accept a `className` prop
3. No imports from `pages/`, `hooks/`, or `lib/api/`
4. Export as default

### Adding a Page Section (`components/sections/`)

1. Create `src/components/sections/YourSection.jsx`
2. Receive all data as props — no `useEffect`, no fetch calls
3. Can compose `ui/` primitives
4. Export as default

### Adding a Layout Component (`components/layout/`)

1. Create `src/components/layout/YourLayout.jsx`
2. Import in `src/App.jsx` if it's globally persistent
3. No page-specific logic

---

## How to Add a New Hook

```js
// src/hooks/useFilmDetails.js
import { useState, useEffect } from "react";
import { getMovieDetails } from "@/lib/api/tmdb";

export const useFilmDetails = (id) => {
  const [film, setFilm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    getMovieDetails(id)
      .then(setFilm)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { film, loading, error };
};
```

---

## Known Issues / TODOs

These were discovered during the restructure and intentionally left untouched.
Fix them in dedicated commits, not mixed with unrelated changes.

| # | Issue | File | Priority |
|---|-------|------|----------|
| 1 | Auth0 `domain` and `clientId` are hardcoded in source | `src/main.jsx` | High |
| 2 | Data fetching is inline in every page (not using hooks/) | `pages/*.jsx` | High |
| 3 | Pages call TMDB directly — `lib/api/tmdb.js` is ready but unused | `pages/*.jsx` | High |
| 4 | `Home.jsx` uses native `fetch` while all other pages use `axios` | `pages/Home.jsx` | Medium |
| 5 | `Footer` component exists but is never rendered | `components/layout/Footer.jsx` | Medium |
| 6 | No design tokens defined — colors/spacing hardcoded as Tailwind strings | All JSX files | Medium |
| 7 | `FilmPage.jsx` has 3 separate API calls that could be one hook | `pages/FilmPage.jsx` | Medium |
| 8 | Framer Motion installed but never used | `package.json` | Low |
| 9 | `favicon.jpeg` in public/ is not a proper `.ico` — `vite.ico` is currently used | `public/`, `index.html` | Low |
| 10 | No error boundary — any unhandled throw crashes the whole app | App-level | Medium |
| 11 | `SearchPage` is not auth-protected but all data it links to (FilmPage, Person) is | `src/App.jsx` | Review |
| 12 | MUI is used only for icons + 2 layout helpers — consider replacing with lighter alternatives | `package.json` | Low |
