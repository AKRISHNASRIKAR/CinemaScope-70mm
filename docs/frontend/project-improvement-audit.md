# CinemaScope Frontend Improvement Audit

Created: 2026-10-10

This audit is based on the current `master` frontend structure and the implementation pass for the NEON-style hero and in-theaters carousel.

## High Priority

- Route layout should move toward explicit layout routes. `App.jsx` now hides the global header on the 404 route, but a future pass should define `PublicLayout`, `AppLayout`, and `MinimalLayout` so each route owns its chrome intentionally.
- TMDB endpoint construction should be centralized. `GenrePage.jsx` and `GenreRow.jsx` both need release-window and ranking logic; moving that into `src/lib/api/tmdb.js` would reduce bugs like genre filters being ignored by curated list endpoints.
- Search needs stronger empty, loading, and error affordances. The navbar and search page are usable, but failed requests silently collapse suggestions/results, which makes network failures feel like bad content.
- Auth actions need a single account surface. The logout button was removed from the navbar to reduce chrome clutter; sign-out should live in the profile page or an account menu so authenticated users still have an obvious place to manage their session.
- The share-card feature should get automated tests. It has the highest complexity in the app: WebGL, image loading, export timing, and DOM rasterization. Add focused tests around export states and fallback rendering.
- Bundle size is still shaped by icon and 3D dependencies. The Three.js code is already lazy, but `@mui/icons-material` plus Emotion is a large vendor cost for simple icons. Consider moving common icons to `lucide-react` or a local icon wrapper.

## Design System

- Reduce inline style drift by promoting repeated `clamp()` values into named tokens or small layout primitives.
- Keep the light sections intentional. The homepage now uses dark cinematic sections plus a NEON-inspired light in-theaters section; future light sections should share the same black/white editorial rules instead of introducing new palettes.
- Standardize interactive card hover states. `FilmCard`, trending cards, search rows, and carousel cards should share focus rings, title color transitions, and pressed states.
- Document section rhythm. Home has hero, recent, trending, in theaters, genre rows, membership, footer; this is coherent, but spacing tokens should make the rhythm easier to preserve.

## Components

- `FilmCard` is small and reusable, but it could expose a `mediaPriority` or image-size prop so cards in dense rows avoid loading larger images than needed.
- `ScrollRow` is useful, but it is visually generic. Keep it as behavior-only infrastructure and let specialized sections own their card presentation, as the in-theaters carousel now does.
- `Navbar` has grown into search, auth, navigation, and responsive overlay behavior. Extracting a `NavbarSearch` subcomponent would make it easier to test keyboard navigation and outside-click behavior.
- `GenreRow` owns both copy layout and data filtering. It would be cleaner as `GenreSection` plus `GenreFilmResults`, with query-building moved to the API layer.
- `LazyImage` should support `srcSet` and `sizes` for TMDB images. That would improve LCP/CLS and avoid overserving wide images on phones.

## Data And State

- Add `SWRConfig` at the app root for shared retry, dedupe, focus revalidation, and error policy.
- Give fetcher errors a normalized shape. UI can then show retry actions and human-readable API failure messages consistently.
- Keep server state in SWR; avoid introducing global client state unless reviews/lists/watchlists become real persisted features.
- Add endpoint helpers that generate stable SWR keys, especially for discover filters, pagination, and region-specific releases.

## Accessibility

- Add screen-reader labels and keyboard handling to every carousel and dropdown. The new in-theaters carousel supports region labeling and arrow-key scrolling; apply the same standard to any future horizontal media rows.
- Make account management keyboard discoverable after moving sign-out into profile/account UI.
- Audit modals in `features/share-card` for focus trapping, escape handling, labelled titles, and return-focus behavior.
- Add a visual skip link if it is not already visible on keyboard focus. The `main-content` target exists; the control itself should be easy to discover.

## Responsiveness

- Continue preferring fluid layouts over breakpoint-only changes. The app is already strong here with `clamp()` and `auto-fill`.
- Run visual checks at 390, 768, 1440, and ultrawide widths after every homepage layout change.
- Watch long movie titles in carousel cards, profile tabs, and compare rows. Truncation is mostly in place, but some controls still rely on optimistic text lengths.

## Performance

- Add responsive image helpers for poster/backdrop URLs and use `sizes` consistently.
- Prefetch route chunks on likely actions: film cards, search suggestions, and carousel cards can preload their target route on pointer enter/focus.
- Keep the 3D share-card chunk gated behind modal intent and reduced-motion checks.
- Add Lighthouse or Web Vitals checks in CI once deployment is stable.
- Use `npm audit` deliberately. Current dependency warnings include transitive issues; fix non-breaking updates first and avoid forced upgrades without regression testing.

## Deployment

- Keep Cloudflare Pages configured with root directory `/frontend` only if the deployed repo actually contains the Vite app in that folder. This checkout is currently a Vite app at repo root, so Pages should either build from root with output `dist`, or the repo should have a real `frontend/` app folder.
- Avoid `wrangler deploy` for a static Pages app unless deploying a Worker. The normal Pages build should run `npm run build` and publish `dist`.
- Validate required `VITE_*` variables during build so missing TMDB/Auth0 config fails clearly instead of rendering skeleton-only states.

## Testing Gaps

- Add Vitest/React Testing Library coverage for fetcher helpers, route guards, navbar search, carousel keyboard behavior, and empty/error states.
- Add Playwright smoke tests for home, film detail, search, genre page, profile redirect, compare, and 404.
- Add a small visual regression set for the hero and the in-theaters carousel because they carry the brand feel.
