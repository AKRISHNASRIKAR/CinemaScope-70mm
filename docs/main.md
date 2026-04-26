# CinemaScope Architecture & Technical Implementation

This document explains the core technical patterns used across the CinemaScope application, focusing on data fetching, state management, and interactive components.

## 1. Data Fetching with SWR & Suspense

We use [SWR](https://swr.vercel.app/) for all client-side data fetching. This provides automatic caching, revalidation, and a smooth user experience.

### Key Patterns:
- **Suspense Integration**: Most components use `{ suspense: true }` in their SWR config. This allows us to use standard React `<Suspense>` boundaries to manage loading states at a granular level.
- **Granular Loading**: In `FilmPage.jsx`, the Hero, Cast, and Similar Movies sections are each wrapped in their own `<Suspense>` boundary with tailored skeletons. A slow response from the "Similar Movies" API doesn't block the rest of the page.
- **Parallel Fetching**: We use a custom `parallelFetcher` in `FilmPage.jsx` to fetch multiple related resources (movie details, release dates) simultaneously using `Promise.all`, eliminating waterfall delays.

## 2. Dynamic Sorting & Filtering

The **Genre Browse Page** (`GenrePage.jsx`) implements a flexible sorting system driven by URL parameters.

### Implementation:
- **State-Driven URLs**: The `GenreGrid` component uses a helper function `getUrl(page)` that constructs the TMDB API endpoint based on current `sortBy` and `filterTab` state.
- **Revalidation**: When the user clicks a different sort option (e.g., "Newest" or "Rating"), the `sortBy` state updates. SWR detects the key change (the URL change) and automatically triggers a new fetch.
- **Reset Logic**: A `useEffect` in `GenreGrid` ensures that when filters or sorting change, the internal page state resets to 1 and previous "Load More" results are cleared.

## 3. Debounced Search

To prevent excessive API calls while typing, the **Search Page** (`SearchPage.jsx`) implements a robust debouncing mechanism.

### Logic:
- **Two-State System**: We maintain `inputValue` (controlled input) and `searchTerm` (the value used for the API call).
- **Timer Management**: In `handleInputChange`, we clear any existing `debounceRef.current` (a timeout ID) and set a new one for 500ms.
- **Execution**: Only when the user stops typing for 500ms does the `searchTerm` update and the `useSearchParams` hook push the query to the URL.
- **Instant Override**: Pressing the "Enter" key immediately clears the timer and executes the search.

## 4. Main Functions & Hooks

### `useRecentlyViewed`
A custom hook that manages a list of viewed films in `localStorage`.
- It tracks the last 10 movies visited.
- It prevents duplicates and ensures the most recent visit is at the top of the list.

### `BackButton` & Navbar Height
- The `Navbar` measures its own rendered height and sets a global CSS variable `--navbar-height`.
- The `BackButton` uses this variable (`top: calc(var(--navbar-height) + 1rem)`) to ensure it always stays perfectly positioned below the navigation bar across all screen sizes.

### Hero Preloading & Transitions
The `Hero.jsx` component uses a three-layer system to ensure zero "flash" during background changes:
- **Layer A**: The current visible image.
- **Layer B**: The incoming image (hidden).
- **Logic**: When a transition starts, the component preloads the next image using `new Image()`. Once the browser confirms the image is in cache, Layer B becomes visible via a CSS opacity transition. After 1 second, Layer A is updated to match Layer B, and the cycle repeats.

### `useReducedMotion`
A utility hook that detects the user's system preferences for reduced motion. When active, it disables the Hero's Y-axis sliding animations and crossfades, providing a static but accessible experience.
