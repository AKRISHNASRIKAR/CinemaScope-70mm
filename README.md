# 🎬 CinemaScope

**A cinematic film-discovery app built on the TMDB API — with an exportable 3D collector card.**

Browse popular and trending films, explore genre sections with live data, dig into cast and streaming availability, search across films and people, and compare two films side by side. Then turn any film into a customisable collector card you can tilt in WebGL and export as a 1080px PNG.

<!-- TODO: replace with a real screenshot or GIF of the homepage / share card -->

---

## ✨ Features

**Discovery**
- Full-viewport cinematic hero with a three-layer crossfade and preloaded backdrops
- Trending strip, three genre sections with live TMDB tab switching, and a recently-viewed row
- Film pages with cast, streaming providers (via JustWatch), and similar titles
- Person pages, multi-search across films and people, genre browse with load-more
- Side-by-side film comparison with shareable `?a=&b=` URLs

**Collector Card** — the flagship feature
- Customise a card per film: 4 themes, 6 rubber stamps, star rating, caption
- Tilt and flip it in WebGL with pointer-tracking light and physically-based materials
- Export a deterministic 1080×1080 or 1080×1920 PNG to the native share sheet or download
- One React component drives all three renderers (HTML preview, 3D face texture, PNG export), so the preview and the export can't drift apart
- Fully client-side — nothing is uploaded, no account required

**Engineering**
- **Suspense-first data fetching** — SWR with `suspense: true`; every page section gets its own `<Suspense>` *and* `<ErrorBoundary>`, so a slow or failed TMDB call degrades one section instead of the page
- **Route-level code splitting** — every page is a `React.lazy` chunk. First load ≈ **186 kB gzipped**; the 886 kB Three.js chunk is double-lazy-loaded and gated on WebGL support + `prefers-reduced-motion`, so it never touches initial page load
- **Image priority strategy** — the LCP backdrop is `eager` + `fetchpriority="high"`; everything else is lazy, and the cast grid additionally waits on an `IntersectionObserver`
- **Scroll restoration** — a custom hook that handles PUSH/REPLACE/POP correctly and re-applies the saved offset across animation frames while Suspense-ed content fills in
- **Fluid sizing** — `clamp()` throughout with `auto-fill` + `minmax()` grids, so layout scales continuously from 320px to 4K with almost no media queries
- **Accessibility** — keyboard navigation and focus rings centralised in shared primitives, a skip-nav link, `prefers-reduced-motion` support in both CSS and JS, and a prose description of the card for screen readers (a `<canvas>` exposes nothing)

---

## 🛠 Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18, Vite 6 |
| Routing | React Router 7 |
| Data | SWR 2 (`suspense: true`) + Axios |
| Styling | Tailwind CSS v4 — one `@theme` token block, no config file |
| 3D | Three.js, React Three Fiber, drei, maath |
| Export | html-to-image |
| Animation | Framer Motion |
| Auth | Auth0 (Authorization Code + PKCE) |
| Data source | [TMDB API](https://www.themoviedb.org/) |

There is **no state management library** — server state lives in SWR's cache (keyed by the TMDB path, so unrelated components share one request), and what remains is genuinely local `useState`.

---

## 🗺 Routes

| Route | Description | Auth |
|---|---|---|
| `/` | Hero, trending, recently viewed, genre sections | Public |
| `/film/:id` | Details, cast, watch providers, similar — hosts the share card | Public |
| `/person/:person_id` | Person header + filmography | Public |
| `/search`, `/search/:query` | Films and people | Public |
| `/genre/:id` | Genre browse with load-more | Public |
| `/compare` | Side-by-side comparison | 🔒 |
| `/profile` | Auth0 profile + recently viewed | 🔒 |
| `/login` | Sign-in surface | Public |

**Browsing is never gated** — only `/profile` and `/compare` require an account.

---

## 🚀 Getting Started

**Prerequisites:** Node.js 18+, a [TMDB API key](https://developer.themoviedb.org/docs/getting-started), and optionally an [Auth0](https://auth0.com/) tenant (only needed for the two protected routes).

```bash
git clone https://github.com/AKRISHNASRIKAR/CinemaScope-70mm.git
cd CinemaScope-70mm
npm install
cp .env.example .env     # then fill in your keys
npm run dev
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_KEY` | ✅ | TMDB API key |
| `VITE_BASE_URL` | ✅ | `https://api.themoviedb.org/3` |
| `VITE_AUTH0_DOMAIN` | For auth | Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | For auth | Auth0 SPA client ID |
| `VITE_AUTH0_AUDIENCE` | — | API identifier (unused until there's a backend) |
| `VITE_GITHUB_URL` | — | Footer credit link |

> ⚠️ **`VITE_`-prefixed variables are inlined into the JavaScript bundle at build time.** That's what the prefix means — it is not a leak, but it does mean the TMDB key is extractable from the shipped bundle and rate-limited against your account. There is no client-side fix; see [Known Limitations](#-known-limitations).

### Scripts

```bash
npm run dev       # Vite dev server on :5173
npm run build     # production build
npm run preview   # preview the production build
npm run lint      # ESLint (currently clean)
```

---

## 📂 Project Structure

```text
src/
├── App.jsx               # Router, scroll manager, top-level Suspense, 9 lazy routes
├── main.jsx              # createRoot + Auth0Provider (the only context provider)
├── components/
│   ├── ui/               # Stateless primitives — never fetch data
│   ├── sections/         # Page sections that DO own a useSWR call
│   └── layout/           # Navbar, Footer
├── features/
│   └── share-card/       # Self-contained slice: ~20 files, 2 exports
│       ├── components/   #   incl. three/ for the WebGL scene
│       ├── hooks/        #   useCardExport, useCardTilt
│       ├── constants/    #   card geometry, themes, stamps
│       └── utils/        #   pure helpers + font embedding
├── hooks/                # Cross-cutting: scroll restoration, reduced motion, recently viewed
├── lib/
│   ├── api/fetcher.js    # 12 lines — every TMDB call goes through here
│   ├── utils/            # TMDB image URLs, date formatting
│   └── constants/        # Genre map, homepage genre sections
└── styles/
    ├── tokens.css        # Tailwind v4 @theme block — the whole design system
    └── globals.css       # Reset, container, skeleton shimmer, a11y rules
```

**Two conventions worth knowing:**

1. **Nothing in `ui/` fetches data.** `FilmCard` appears in five different grids — if it fetched its own data, a 20-card grid would be 20 requests instead of one.
2. **`features/share-card` exports exactly two things.** That boundary is what keeps Three.js lazy: nothing outside the folder can import it by accident.

---

## 🏗 Architecture Notes

**Data flow.** Every TMDB call goes through one 12-line fetcher, and the SWR cache key is the short TMDB path rather than the full URL. Two components in unrelated parts of the tree that both request `/movie/popular` share one entry and one network request — which is why there's no global store.

**The share card.** `ShareCard.jsx` is the single source of truth for the artwork. It renders directly as the non-WebGL fallback, gets rasterized by `html-to-image` into the 3D card's face texture, and gets captured on an off-screen 1080px stage to produce the PNG. The card is authored in `em` with the root font size derived from its width, so one layout renders identically at 300px, 540px, 620px and 740px.

**The export is never a WebGL screenshot.** A screenshot would bake in whatever tilt the pointer left, the cursor-following light, the modal's dimensions and the GPU's antialiasing — and users with `prefers-reduced-motion` never load the 3D scene at all. A shared image has to be deterministic, so it comes from a separate HTML composition.

---

## ⚠️ Known Limitations

Stated plainly, because they're real:

- **No backend.** The TMDB API key ships in the client bundle, and every user's browser calls TMDB directly — so upstream traffic scales 1:1 with users. A thin proxy with a server-side cache is the first thing on the roadmap.
- **No persistence.** "Recently viewed" is 10 IDs in `localStorage` (per-device). Card customisation lasts one modal session. Ratings, reviews and lists aren't possible without a database.
- **Auth protects UI, not data.** There's no API of our own, so the access token is never actually sent anywhere. `ProtectedRoute` is a UX control, not a security boundary.
- **No tests and no CI.** The card export pipeline — font embedding, image decoding, animation-frame timing — is the riskiest code here and the least verified.
- **No `SWRConfig`.** Running on library defaults, so a film's details revalidate on tab focus exactly like trending does.
- **The 886 kB Three.js chunk.** Lazy and capability-gated, so it's off the critical path — but on a slow connection there's a real gap before the 3D preview appears.
- **`@mui/icons-material`** pulls in MUI core and Emotion as peer dependencies for 26 icons. That's the bulk of the 367 kB vendor chunk and the biggest available bundle win.
- **Card themes carry dead fields.** `clearcoat` / `iridescence` / `envIntensity` are defined per theme but no longer consumed by the face material — themes currently differ by edge colour and artwork only.
- Watch providers are hardcoded to the US region; search has no pagination; `PlayButton` exists but `/movie/{id}/videos` is never called.

---

## 🗺 Roadmap

1. Tests on the export pipeline and fetcher, plus CI running lint and build
2. A TMDB proxy with a Redis cache — moves the key server-side and turns N users into one upstream request (**one line changes in the frontend**, since every call already goes through a single fetcher)
3. PostgreSQL for ratings, reviews, watch history and lists
4. Persisted share cards at `/card/:token` with Open Graph previews
5. Recommendations — starting with genre affinity, not a model

---

## 🙏 Acknowledgements

Film data and imagery from [The Movie Database (TMDB)](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability provided by JustWatch via TMDB.

---

## 📝 License

MIT — see `LICENSE`.

<!-- NOTE: no LICENSE file exists in this repo yet. Add one, or remove this section. -->
