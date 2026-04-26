# CinemaScope — Improvements & Future Work

A candid, technically specific backlog. Items are ordered roughly by impact-to-effort ratio.

---

## Performance

**Image formats** ✅ Done
- `src/lib/utils/tmdbImage.js` rewrites all TMDB image paths to `.webp`. Used across FilmCard, FilmPage, Person, HeroCarousel, Hero.

**Font subsetting** ✅ Done
- Google Fonts URL updated with `&subset=latin`.

**Route-level code splitting** ✅ Done
- All pages use `React.lazy()` + `Suspense`. Main bundle reduced from 534kB to 311kB vendor + per-page chunks.

**SWR cache persistence**
- Not yet implemented. Add `swr/persist` with a localStorage provider for instant repeat visits.

**Service worker / offline caching**
- Not yet implemented. Workbox would cache TMDB responses and static assets.

**Bundle analysis**
- Run `npx vite-bundle-visualizer` to identify remaining large contributors.

---

## User Experience

**Keyboard navigation for carousels** ✅ Done
- `ScrollRow` component handles `ArrowLeft`/`ArrowRight`. Hero carousel handles arrow keys on the section. HeroCarousel strip handles arrow keys.

**Recently viewed films** ✅ Done
- `useRecentlyViewed` hook persists last 10 films in `localStorage`. Row appears on homepage above genre sections.

**Film comparison** ✅ Done
- `/compare?a=ID&b=ID` page with inline search, side-by-side stats, shareable URL.

**Watch providers** ✅ Done
- `WatchProviders` section on FilmPage fetches `/movie/{id}/watch/providers`, shows Stream/Rent/Buy logos. US region default; no region selector yet.

**Trailer modal**
- `PlayButton.jsx` exists. Wire TMDB `/movie/{id}/videos` endpoint and render a YouTube `<iframe>` in a focus-trapped modal.

**Film comparison enhancements**
- Add cast overlap detection, budget/revenue comparison, vote count display.

**Toast notifications**
- No feedback on actions. Add `react-hot-toast` or a lightweight custom toast.

---

## Code Quality

**Consolidate carousel logic** ✅ Done
- `ScrollRow` (`src/components/ui/ScrollRow.jsx`) is the single generic scroll primitive. `FilmographyRow` in `Person.jsx` and `HeroCarousel` both use it or its pattern. No more duplicated `useRef` + `scrollBy` logic.

**TypeScript migration**
- The codebase is JSX. Moving to TSX would catch prop-type errors at compile time. Component interfaces are already well-defined (props are documented in CLAUDE.md). Migration should be incremental — start with `lib/`, `hooks/`, then `ui/` components, then pages.

**Prop validation**
- No PropTypes or TypeScript interfaces on components. Until TypeScript is added, adding PropTypes to the most-reused components (`FilmCard`, `LazyImage`, `FilterTabs`) would catch misuse early.

**Test coverage**
- Zero tests currently. Priority order:
  1. Unit tests for `fetcher.js` and `parallelFetcher` (mock axios, assert URL construction)
  2. Unit tests for `useBackNavigation` hook
  3. Component tests for `FilmCard`, `FilterTabs`, `LazyImage` with React Testing Library
  4. Integration test for the search flow (type → debounce → results render)
  5. E2E test for the homepage → film page → person page navigation flow with Playwright

**Stricter ESLint config**
- Current ESLint config is minimal. Adding `eslint-plugin-jsx-a11y` would catch accessibility violations at lint time. Adding `no-hardcoded-colors` rule (custom or via a plugin) would enforce the token-only convention automatically.

---

## Accessibility

**Carousel keyboard navigation** ✅ Done
- Hero carousel: `ArrowLeft`/`ArrowRight` on the section element. `ScrollRow`: `ArrowLeft`/`ArrowRight` on the strip. HeroCarousel strip: same. All carousel items have `role="button"`, `tabIndex`, `aria-label`.

**Skip navigation link** ✅ Done
- Visually hidden "Skip to main content" link in `index.html`. `<main id="main-content">` in `App.jsx`.

**`prefers-reduced-motion`** ✅ Done
- `useReducedMotion` hook reads the media query reactively. Hero swaps Framer Motion animated variants for instant static variants when reduced motion is preferred.

**Focus trap in modals**
- When the trailer modal is added, use `focus-trap-react` or implement manually.

**ARIA labels on icon-only buttons**
- Audit complete for new components. Remaining: verify all existing icon buttons in `GenreRow`, `FilterTabs`, `BrowseMoreLink` have sufficient labels.

**Color contrast**
- `text-muted` (#8a8a8a) on `bg-base` (#090909) passes AA at normal sizes. Audit minimum clamp values for very small metadata text.

**`FilmCard` keyboard access** ✅ Done
- `role="button"`, `tabIndex={0}`, `aria-label`, `focus-visible` ring added.

---

## Features for the Review/Rating Platform (Next Phase)

This is the core product evolution. The current app is a discovery tool; the next phase makes it a community platform.

**User accounts with profiles**
- Auth0 is already integrated. Wire it to a real tenant. Store user metadata (display name, avatar, bio) in a backend database keyed by Auth0 `sub`.

**Star ratings**
- Users rate films 1–5 stars. Store in a `ratings` table (`user_id`, `film_id`, `rating`, `created_at`). Show average community rating alongside TMDB rating on film pages.

**Written reviews**
- Users write text reviews attached to a rating. `reviews` table (`user_id`, `film_id`, `rating_id`, `body`, `created_at`). Film detail page shows a reviews section below the cast grid.

**Review feeds**
- A "Community" or "Activity" feed showing recent reviews from all users, or from followed users. Requires a `follows` table and a feed query.

**Social features**
- Follow other users, like reviews, comment on reviews. Standard social graph — `follows`, `likes`, `comments` tables.

**Watchlists and custom lists**
- Users create named lists ("Want to Watch", "Watched", custom). `lists` table + `list_items` junction table. The profile page already has placeholder UI for this.

**Notifications**
- Notify users when someone likes their review, follows them, or comments. Requires a `notifications` table and a real-time delivery mechanism (WebSockets or polling).

---

## Infrastructure

**CI/CD pipeline**
- GitHub Actions workflow: on every PR, run `npm run lint` and `npm run build`. Block merge if either fails. On merge to `main`, deploy to Vercel or Netlify automatically. This is the immediate next infrastructure task.

**Testing in CI**
- Once tests exist, add a `npm run test` step to the CI workflow. Fail the build on test failures.

**Staging environment**
- Maintain a `staging` branch that deploys to a separate Vercel preview URL. Test against real TMDB data before merging to production.

**Environment management**
- Currently one environment (local dev). Add `staging` and `production` environment variable sets in Vercel. Use separate TMDB API keys per environment to track usage independently.

**Error tracking**
- Add Sentry for runtime error tracking. The `ErrorBoundary` component already catches render errors — wire it to `Sentry.captureException()` so errors in production are visible without user reports.

**Analytics**
- Add Plausible or Fathom (privacy-respecting, no cookie banner required) to understand which pages and features are actually used. Useful for prioritising the roadmap.

**Rate limiting awareness**
- TMDB free tier allows 40 requests per 10 seconds. The current app makes multiple parallel requests per page. Add a request queue or debounce strategy if rate limit errors appear in production logs.
