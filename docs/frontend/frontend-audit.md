# CinemaScope Frontend Audit

Date: 2026-06-27
Branch: master

## Executive Summary

CinemaScope already has a clear premium direction: dark cinematic surfaces, strong poster-forward layouts, responsive `clamp()` sizing, route-level splitting, SWR Suspense boundaries, and a coherent typography stack. The strongest production opportunities are refinement rather than redesign: make every interactive surface semantic, unify motion timing, remove repeated card/search behavior, improve focus and loading states, reduce imperative DOM styling, and keep page sections resilient on small and very large screens.

The first implementation pass should preserve the visual system and focus on:

- Semantic cards and carousel controls with keyboard parity.
- Shared motion tokens and reduced-motion-safe transitions.
- Search/listbox improvements for accessibility and polish.
- Reusable person/film card patterns to reduce duplicated interaction code.
- Small performance fixes: unused imports, stable callbacks, image priority hints, and CSS-only hover states.
- Better error and empty states without adding visual clutter.

## Phase 1: Page Audit

### Home

- UI consistency: Strong. Hero, recently viewed, genre rows, and footer share the cinematic language.
- Spacing consistency: Mostly consistent, though heading bands use one-off padding values that should be tokenized over time.
- Typography consistency: Good use of display headings and compact mono metadata. The hero title currently uses Inter instead of the display font by design, but it should be intentional and documented.
- Hierarchy: Clear. Hero is dominant, genre rows follow naturally.
- Interaction quality: Hero arrows, dots, cards, and rows work, but some active carousel behavior is not fully announced to assistive tech.
- Accessibility: Skip link exists. Hero carousel needs better region labelling and a focusable carousel container or clear control semantics.
- Responsiveness: Solid on mobile/tablet/desktop. Ultrawide would benefit from max content rhythm and not allowing hero content to feel too far from the action.
- Animation quality: Backdrop preloading is good. Content easing can be smoother and shared through motion constants.
- Visual clutter: Low.
- Usability issues: Recently Viewed clear action lacks confirmation but is low risk. Hero text click target is not obvious enough as navigation.

### Film Detail

- UI consistency: Strong hero/poster composition and cinematic cast section.
- Spacing consistency: Good, but several sections use custom margins instead of shared section spacing.
- Typography consistency: Good, with a clean metadata grid.
- Hierarchy: Clear title, poster, metadata, overview, cast, providers, similar films.
- Interaction quality: Cast cards use clickable `div`s and imperative hover styling; needs semantic button/link behavior.
- Accessibility: Cast cards need keyboard access and meaningful labels. Provider logos have useful alt text. Rating uses a star glyph that may be noisy for screen readers.
- Responsiveness: Good, with poster and text stacking cleanly.
- Animation quality: Cast hover is charming but implemented imperatively; should move to CSS transitions and respect reduced motion.
- Visual clutter: Moderate in cast section because every card rotates; acceptable for brand, but hover should settle calmly.
- Usability issues: Overview is clamped to three lines with no expand control; acceptable for current scope but worth revisiting.

### Search

- UI consistency: Fits the dark system.
- Spacing consistency: Good.
- Typography consistency: Good.
- Hierarchy: Clear search field and result grouping.
- Interaction quality: Search debounce is useful. Result film cards duplicate `FilmCard` behavior, and person results use non-semantic clickable `div`s.
- Accessibility: Search input needs a stronger accessible label. Results should use semantic list/listitem structure. Clear button needs an aria label.
- Responsiveness: Good grid behavior.
- Animation quality: Mostly hover image scaling; acceptable.
- Visual clutter: Low.
- Usability issues: Only first page of mixed search results is shown; pagination or "more results" can be backlog.

### Person

- UI consistency: Strong portrait-forward layout.
- Spacing consistency: Good.
- Typography consistency: Good.
- Hierarchy: Clear person name, bio, birth/death, filmography.
- Interaction quality: Read More is clear. Filmography row is keyboard accessible.
- Accessibility: Biography toggle should expose `aria-expanded`. Filmography cards should reuse the shared card primitive.
- Responsiveness: Good portrait stacking.
- Animation quality: Subtle and clean.
- Visual clutter: Low.
- Usability issues: Long filmography is capped to 20 without an affordance for all credits.

### Genre Browse

- UI consistency: Good hero and grid language.
- Spacing consistency: Mostly good; sticky filter bar uses hardcoded base color.
- Typography consistency: Good.
- Hierarchy: Clear genre title, filters, grid.
- Interaction quality: Load More is clear. Tabs should expose `role="tablist"`/`role="tab"` or stay buttons with explicit pressed state.
- Accessibility: Filter buttons need `aria-pressed` or tab semantics. Loading more should announce busy state.
- Responsiveness: Fluid grid is strong.
- Animation quality: Minimal and stable.
- Visual clutter: Low.
- Usability issues: Commented-out sort UI should be removed or restored later; keeping dead code hurts maintainability.

### Compare

- UI consistency: Good compact production-tool feel.
- Spacing consistency: Good.
- Typography consistency: Good.
- Hierarchy: Clear two-column task.
- Interaction quality: Inline search works, but listbox keyboard support is incomplete.
- Accessibility: Needs combobox semantics, active option handling, Escape behavior, and outside-click close.
- Responsiveness: Good on mobile and tablet.
- Animation quality: Mostly static, which is appropriate.
- Visual clutter: Low.
- Usability issues: Loading text appears under the dropdown area and may shift nearby content.

### Login

- UI consistency: Cinematic but slightly more marketing-card-like than the app.
- Spacing consistency: Good.
- Typography consistency: Good.
- Hierarchy: Simple and clear.
- Interaction quality: Basic and adequate.
- Accessibility: Loading spinner needs `role="status"`. Animated grid must respect reduced motion.
- Responsiveness: Good.
- Animation quality: Grid animation should use global keyframes and reduced-motion rules rather than inline style tag.
- Visual clutter: Low.
- Usability issues: Auth0 is not functional without credentials, so copy should avoid promising a complete auth flow in production demos.

### Profile

- UI consistency: Strong with avatar-as-backdrop treatment.
- Spacing consistency: Good.
- Typography consistency: Good.
- Hierarchy: Clear account information.
- Interaction quality: Straightforward.
- Accessibility: Online dot is decorative but may imply live status; mark hidden or add text when it becomes real.
- Responsiveness: Good.
- Animation quality: Minimal and appropriate.
- Visual clutter: Low.
- Usability issues: Dead commented stats block should move to docs/backlog or be removed.

## Phase 2: Component Review

### FilmCard

- Responsibility: Good shared poster navigation card.
- Props: `film`, `subtitle`, `className` are reasonable; should add optional `eager`, `imageSize`, `onClick`, and `ariaLabel` only if needed.
- Composition: Should be a semantic link or button instead of `div role="button"`.
- Performance: Fine. Could be memoized later if grids grow.
- Accessibility: Needs native focus and navigation semantics.

### Navbar

- Responsibility: App chrome, search, profile/login, compare.
- Props: None; acceptable.
- Complexity: Moderate. Search expansion is local and understandable.
- Accessibility: Search wrapper currently has click behavior on a `div`; input and buttons are okay. Wordmark should be a link/button.
- Performance: Height measurement should use `ResizeObserver` instead of window resize only.

### Hero

- Responsibility: Featured carousel and hero content.
- Complexity: High but justified by preloaded crossfade.
- Performance: Good image preloading. Should pause auto-advance while focused/hovered for usability.
- Accessibility: Needs better carousel semantics and active slide announcements.
- Animation: Good foundation; replace easing literals with shared motion tokens.

### HeroCarousel

- Responsibility: Poster strip for hero.
- Complexity: Duplicates `ScrollRow` behavior despite importing it.
- Accessibility: Cards are `div role="button"`; should be native interactive elements.
- Performance: Fine for small list.

### GenreRow

- Responsibility: Homepage genre section with data tab switching.
- Complexity: Reasonable.
- Accessibility: Heading click target should be a button/link, not a clickable heading.
- Maintainability: Unused props and hardcoded endpoint logic can be cleaned.

### Search

- Responsibility: Page-level search experience.
- Complexity: Reasonable.
- Accessibility: Result group semantics and clear button label need polish.
- Maintainability: Film/person result card duplication should be extracted or reuse shared primitives.

### Compare

- Responsibility: Shareable two-film comparison.
- Complexity: Inline search has enough behavior to deserve a reusable hook/component eventually.
- Accessibility: Needs combobox/listbox keyboard pattern.
- Performance: Debounced fetch is good; cancellation could be added later.

### LazyImage

- Responsibility: Image loading, shimmer, fallback.
- Props: Good.
- Accessibility: Fallback is hidden, image alt flows through.
- Performance: Good. Should reset load/error state when `src` changes.

### Skeletons

- Responsibility: Content-shaped loading states.
- Consistency: Strong and specific.
- Maintainability: Some hardcoded hex/backgrounds should move to tokens/classes.

### Buttons, Tabs, ScrollRow

- Buttons: Many one-off button styles. A shared `IconButton`/`TextButton` would help later.
- Tabs: Should expose `aria-pressed` or tab roles.
- ScrollRow: Strong primitive; can improve with disabled arrow state, labelled-by support, and reduced-motion scroll behavior.

## Phase 3: Animation Polish Plan

- Use shared motion custom properties for duration/easing.
- Prefer CSS transforms over inline mouse event style mutation.
- Use spring-like cubic easing for hover lift and button feedback.
- Keep page transitions minimal: Suspense fallback should fade rather than introduce heavy motion.
- Respect `prefers-reduced-motion` globally and in JS-driven components.

## Phase 4: UX Improvements Plan

- Make navigation elements native links/buttons.
- Make search clear buttons labelled and keyboard friendly.
- Add combobox semantics to inline film search.
- Improve empty states with concise, useful copy.
- Improve focus-visible rings consistently.
- Avoid hiding critical controls exclusively behind hover.

## Phase 5: Responsive Improvements Plan

- Keep `clamp()` approach.
- Use fluid grid minmax for film grids.
- Add more stable heights/aspect ratios around images and loading states.
- Check hero and sticky controls on phone, tablet, laptop, ultrawide, and 4K.

## Phase 6: Performance Plan

- Keep route-level code splitting.
- Remove unused imports and dead commented UI.
- Reset lazy image state per `src`.
- Use native links for better prefetch potential later.
- Consider virtualization only if search/genre grids grow beyond current load-more behavior.
- Keep font loading limited to Latin subset.

## Phase 7: Code Quality Plan

- Extract shared UI primitives only where duplication is real.
- Remove unused imports and stale comments.
- Replace magic transition literals with tokens.
- Prefer CSS classes over inline event-driven styling.
- Keep API access centralized in `fetcher.js`; deprecate older `tmdb.js` helpers if unused.

## Phase 8: Accessibility Plan

- Native links for navigational cards.
- `aria-pressed` for filter buttons.
- `aria-expanded` for disclosure controls.
- `role="status"` for loaders.
- Better carousel labels and live text for active slides.
- Combobox/listbox semantics for compare search.
- Preserve skip navigation and focus-visible outlines.

## Phase 9: Design System Plan

- Add motion custom properties to global CSS usage.
- Add reusable interaction classes: lift, focus ring, icon button.
- Reduce hardcoded colors in components where practical.
- Keep gold limited to ratings, CTAs, and active states.
- Preserve card radius and dark cinematic surfaces.

## Phase 10: Final Polish Definition

CinemaScope should feel calmer and more intentional, not visually different. Success means the same cinematic app now has native-feeling controls, fewer accidental inconsistencies, smoother motion, stronger keyboard behavior, cleaner source boundaries, and production-grade loading/error/focus states.

## Launch Polish Implementation Notes

Date: 2026-06-28

- SEO: Added a reusable React SEO component for title, description, canonical URL, robots tags, Open Graph/Twitter metadata, and JSON-LD. Static defaults were also added to `index.html` so the initial app shell has production metadata before hydration.
- Routing: Film, person, genre, compare, and search routes are public. Profile remains protected because it contains account-owned data. This fixes first-time discovery and makes shared links crawlable.
- Film detail: Added account-aware watchlist and watched controls backed by SWR optimistic mutations. Guests see a small sign-in affordance rather than a blocked page.
- Profile: Added watchlist and watch-history sections with loading and empty states so saved-film features are visible after sign-in.
- Search/genre/home grids: Shifted visual grids to semantic list markup where they represent collections, keeping the existing card visuals intact.
- Navigation: Added a compact mobile Compare entry and clearer search expanded state so the feature is discoverable on touch devices.
- Errors: Improved the shared ErrorBoundary with reusable title/message copy and a default retry action.
- Accessibility: Tightened button types, focus behavior, carousel labels, reduced-motion-aware carousel scrolling, form semantics, status messaging, and noindex handling for private/error pages.
- Fault tolerance: Added a noindex 404 route so unknown URLs resolve to a deliberate page instead of an empty app shell.
