# CinemaScope — Loom Walkthrough Script

**Purpose:** Product walkthrough for Bettrhq  
**Contact:** sayan.bhattacharyya@bettrhq.com  
**Duration:** ~5 minutes

---

## [0:00 – 0:20] Opening

> "Hi, I'm Krishna. I built CinemaScope — a cinematic film discovery app that showcases what happens when you treat frontend engineering and design with equal seriousness.
>
> It's powered by the TMDB API, built with React 18, Vite, Tailwind v4, and SWR. The goal was simple: build something that feels like a real product — not a tutorial project."

**[ACTION]** Show the homepage loading for the first time. Let the hero carousel auto-rotate once.

---

## [0:20 – 1:15] Product Walkthrough

### Homepage

> "Let's start on the homepage. The hero carousel auto-rotates with smooth crossfade transitions. Notice there's no flash between slides — that's because backdrops are preloaded silently before the transition starts."

**[ACTION]** Point to the hero carousel, let it rotate once.

> "Scrolling down, you see 'Top Picks by Genre' — each genre row loads independently. I can click a filter tab like 'In Theaters' and it re-renders without affecting other sections."

**[ACTION]** Click a filter tab, show the loading state.

> "Each poster is a clickable card that navigates to the film detail page. There's also a 'Browse More' link that takes you to the full genre listing."

### Film Detail Page

> "Here's a film page. The backdrop hero fades beautifully into the page background. Let me scroll down to show the cast section — these are polaroid-style cards with a subtle rotation and hover animation."

**[ACTION]** Click a poster from a genre row → Film page loads → Scroll to cast.

> "Clicking 'View Full Cast' expands the section. And clicking any cast member navigates to their page."

**[ACTION]** Click a cast member → Person page loads.

### Person Page

> "The person page shows the portrait, biography, and a 'Known For' filmography row that you can scroll horizontally."

**[ACTION]** Show the filmography scroll row, click a film to navigate back.

### Search

> "The navbar has an expandable search capsule. Clicking it expands smoothly — let me type a query."

**[ACTION]** Open search, type "inception", show debounced results.

> "Results show both movies and people. Clicking a person shows the polaroid card style."

### Genre Browse Page

> "From the 'Browse More' link, you reach the genre page. It has a blurred poster mosaic as the hero. You can sort and filter — each option triggers a fresh API call."

**[ACTION]** Navigate to a genre page, switch sort options.

---

## [1:15 – 2:00] Architecture Decisions

> "The folder structure follows a clear separation of concerns. Let me walk you through it."

**[ACTION]** Show the `src/` folder structure.

> "- **ui/** — stateless primitives like FilmCard, LazyImage, Skeletons. No data fetching, no side effects.
> - **sections/** — page sections that may have their own data, like Hero and GenreRow.
> - **layout/** — app chrome: Navbar and Footer.
> - **pages/** — one file per route. Each manages its own Suspense boundaries.
> - **hooks/** — extracted logic like useBackNavigation.
> - **lib/api/** — all TMDB calls go through a single fetcher."

### Key Technical Decisions

> "Three things I want to highlight:

> **One, SWR with Suspense.** Each section suspends independently. A slow cast API call doesn't block the film hero from rendering. You can see three Suspense boundaries in FilmPage.jsx.

> **Two, Parallel fetching.** On the film page, movie details, credits, and release dates are fetched simultaneously with Promise.all — eliminates a full round-trip waterfall.

> **Three, Three-layer hero.** The hero has Layer A (current), Layer B (incoming, preloaded), and Layer C (permanent vignette). The preload happens silently via new Image() before the opacity transition starts — that's why there's no flash."

---

## [2:00 – 2:45] Code Quality

> "Let me show you what production-quality code looks like in this project."

### Hero.jsx — Best-structured component

> "This is the Hero component. Notice: constants at the top, pure helper functions, clear state model with layerA/B/C, useCallback for stable references, and useRef for stale-closure-safe index tracking. It has zero data fetching — data comes in as props."

**[ACTION]** Open Hero.jsx, scroll through.

### Design Tokens

> "Every color, font, shadow, radius, and animation duration is a named token in tokens.css. The gold color is documented as ratings and CTAs only — enforced by convention. Every size uses clamp() for fluid scaling without breakpoint jumps."

**[ACTION]** Open tokens.css, show the theme block.

### CLAUDE.md

> "This is CLAUDE.md — the project's living memory. It documents every session's changes, conventions, and known issues. Any developer or AI agent reads this first. It captures decisions, not just code."

### Error Boundaries

> "Each section has its own ErrorBoundary. A broken credits API call won't crash the film hero — it fails gracefully with a skeleton."

---

## [2:45 – 3:30] Auth0 Implementation

> "I recently improved the authentication system. Let me show you what's in place."

> "Auth0 is configured with environment variables — domain, client ID, and audience come from .env. This makes it easy to swap between dev and production tenants.

> I created a ProtectedRoute component that wraps all authenticated routes. It shows a loading spinner while auth state initializes, then redirects to /login if the user isn't authenticated.

> The login page uses Auth0's Universal Login. Once the user authenticates, they're redirected back to the original page they tried to access.

> Currently, the homepage and search are public, while film details, person pages, genre pages, profile, and compare require login. This is a common pattern — let users explore before asking them to sign up."

---

## [3:30 – 4:15] Roadmap

> "I want to be honest about what's next.

> **Immediate:** Set up CI/CD with GitHub Actions — build and lint on every PR, deploy to Vercel on merge.

> **User features:** Reviews and ratings. Users log films, write reviews, give star ratings. Needs a backend — likely a lightweight Node API or Supabase. The profile page already has placeholder slots for this data.

> **TypeScript migration:** The codebase is JSX today. Moving to TSX would catch prop-type errors at compile time. The interfaces are already well-defined — migration would be incremental."

**[ACTION]** Open docs/improvements.md.

> "I keep a candid improvements doc. It covers performance gaps, accessibility, and features I'd build next. I think it's important to be honest about what a project doesn't do yet."

---

## [4:15 – 5:00] Closing

> "The repo is on GitHub — the commit history shows the progression from initial scaffold to the current state. CLAUDE.md documents every session's changes.

> I'd love to talk more about the architecture decisions or walk through any specific part of the code. You can reach me on LinkedIn or reply to this recording.

> Thanks for watching."

---

## Quick Reference — Key Files to Show

| Time | File | What to Point Out |
|------|------|-------------------|
| 0:30 | Homepage | Hero carousel, genre rows, filter tabs |
| 1:00 | FilmPage.jsx | Backdrop hero, cast polaroids, Suspense boundaries |
| 1:30 | Person.jsx | Portrait, biography, filmography row |
| 1:45 | Navbar | Expandable search capsule |
| 2:00 | src/ folder | Folder structure |
| 2:10 | fetcher.js | parallelFetcher with Promise.all |
| 2:20 | Hero.jsx | Layer A/B/C, preload logic |
| 2:35 | tokens.css | Design tokens, clamp() sizing |
| 2:45 | CLAUDE.md | Session history, conventions |
| 3:00 | ProtectedRoute.jsx | Auth guard component |
| 3:15 | App.jsx | Route configuration |
| 3:45 | docs/improvements.md | Honest roadmap |

---

*End of script. Total runtime: ~5 minutes.*