# Phase 4 — Edge Function Scaffolds

> **PR:** #4 · **Branch:** `feat/phase-4-edge-function-scaffolds` · **Merged to:** `master`

---

## What Was Built

Five Supabase Edge Functions, each fully structured for production but with business logic stubbed out. The goal: every function is ready to receive a DB query on day one of implementation — no structural rewiring needed.

```
backend/supabase/functions/
├── _shared/                 ← Phase 3 utilities (imported by all)
├── deno.json                ← Deno compiler options
├── tmdb/index.ts            ← TMDB API proxy + caching
├── profile/index.ts         ← User profile read + update
├── watch-history/index.ts   ← Film watch log
├── watchlist/index.ts       ← Want-to-watch list
└── reviews/index.ts         ← Film reviews
```

---

## System Architecture

```
                         ┌──────────────────────────────────────┐
                         │           React Frontend              │
                         │                                      │
                         │  SWR fetcher → /functions/v1/*       │
                         └───────────────┬──────────────────────┘
                                         │ HTTPS + Bearer JWT
                                         ▼
                         ┌──────────────────────────────────────┐
                         │      Supabase Edge Runtime (Deno)    │
                         │                                      │
              ┌──────────┤  ┌────────┐  ┌─────────────────┐   │
              │          │  │  tmdb  │  │    _shared/      │   │
  TMDB API ◀──┤          │  │        │  │  cors  auth      │   │
  (external)  │          │  │ proxy  │  │  errors logger   │   │
              └──────────┤  │ cache  │  │  validation db   │   │
                         │  └───┬────┘  └──────────────────┘   │
                         │      │                               │
                         │  ┌───┴──────────────────────────┐   │
                         │  │  profile  watch-history       │   │
                         │  │  watchlist  reviews           │   │
                         │  └───────────────┬───────────────┘   │
                         └──────────────────┼───────────────────┘
                                            │ SQL (service role or JWT-scoped)
                                            ▼
                         ┌──────────────────────────────────────┐
                         │         PostgreSQL 17 + RLS          │
                         │                                      │
                         │  profiles  watch_history  watchlist  │
                         │  reviews   tmdb_cache                │
                         └──────────────────────────────────────┘
```

---

## `deno.json` — Deno Compiler Configuration

```json
{
  "compilerOptions": {
    "lib": ["deno.window"],        ← tells TypeScript to use Deno's global types
    "strict": true,                ← all strict checks enabled
    "noImplicitAny": true,         ← every variable must have a type
    "noUnusedLocals": true,        ← can't declare a variable and not use it
    "noUnusedParameters": true     ← same for function parameters
  }
}
```

**Why `"lib": ["deno.window"]`?** Deno's global environment differs from Node.js. `deno.window` tells TypeScript about Deno-specific globals like `Deno.serve()`, `Deno.env.get()`, and `crypto.randomUUID()`. Without it, TypeScript would show errors on those calls even though they're valid at runtime.

---

## Function 1: `tmdb/index.ts` — TMDB Proxy + Cache

### The Security Problem This Solves

The original frontend called TMDB directly from the browser:
```javascript
fetch(`https://api.themoviedb.org/3/movie/550?api_key=${import.meta.env.VITE_API_KEY}`)
//                                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                                         VITE bakes this into the JS bundle
//                                                         Anyone can open DevTools and read it
```

The proxy moves the key server-side:
```
Browser → /functions/v1/tmdb/movie/550        (no key)
Edge Fn → api.themoviedb.org?api_key=secret   (key added server-side)
Edge Fn → browser (just the data)
```

### TTL Map — Cache Lifespan Per Endpoint

```
┌─────────────────────────────────┬──────────────────────────────────────────┐
│ Endpoint Pattern                │ TTL    │ Reason                           │
├─────────────────────────────────┼────────┼──────────────────────────────────┤
│ /movie/:id/credits              │ 7 days │ Cast doesn't change after release│
│ /movie/:id/release_dates        │ 7 days │ Certifications are permanent     │
│ /person/:id                     │ 7 days │ Biography is stable              │
│ /person/:id/movie_credits       │ 7 days │ Filmography changes rarely       │
│ /movie/:id                      │ 7 days │ Title/overview don't change      │
│ /movie/:id/watch/providers      │ 6 hrs  │ Streaming rights can change      │
│ /movie/:id/similar              │ 24 hrs │ Ranking shifts day-to-day        │
│ /movie/:id/videos               │ 24 hrs │ Trailers added at release        │
│ /movie/top_rated                │ 12 hrs │ Ratings drift slowly             │
│ /movie/upcoming                 │ 6 hrs  │ Release schedule is semi-static  │
│ /movie/now_playing              │ 2 hrs  │ Theatrical slate changes weekly  │
│ /movie/popular                  │ 1 hr   │ Trending changes throughout day  │
│ /discover/movie                 │ 3 hrs  │ Genre browse results vary        │
│ /search/movie                   │ 30 min │ New films added to TMDB daily    │
└─────────────────────────────────┴────────┴──────────────────────────────────┘
```

### Cache Key Construction

```
Incoming request: /functions/v1/tmdb/search/movie?query=inception&api_key=secret&page=1

Step 1 — strip function routing prefix:
  /search/movie?query=inception&api_key=secret&page=1

Step 2 — remove server-only params (api_key, language):
  /search/movie?query=inception&page=1

Step 3 — sort remaining params alphabetically:
  /search/movie?page=1&query=inception

Step 4 — this is the cache_key stored in tmdb_cache

Why sort? So these two URLs produce the same key:
  /search/movie?query=inception&page=1
  /search/movie?page=1&query=inception   ← same key → same cache hit
```

### Request Lifecycle

```
Browser: fetch('/functions/v1/tmdb/movie/550')
                │
                ▼ Edge Function receives request
                │
                ├── 1. Parse tmdbPath = '/movie/550'
                ├── 2. Compute cache_key = '/movie/550'
                ├── 3. ttlSeconds = 604800 (7 days)
                │
                ├── 4. SELECT FROM tmdb_cache WHERE cache_key = '/movie/550'
                │         AND expires_at > now()
                │
                ├── [HIT] ─────────────────────────────────────────────────┐
                │    UPDATE hit_count = hit_count + 1                       │
                │    Return payload                                         │
                │    X-Cache: HIT                                           │
                │    X-Cache-Age: <seconds since fetched_at>                │
                │                                                           │
                ├── [MISS] ────────────────────────────────────────────────┤
                │    fetch('https://api.themoviedb.org/3/movie/550         │
                │           ?api_key=<secret>&language=en-US')             │
                │                                                           │
                │    [TMDB 200 OK]:                                         │
                │      INSERT INTO tmdb_cache                               │
                │        (cache_key, endpoint, payload, expires_at)         │
                │      Return payload                                        │
                │      X-Cache: MISS                                        │
                │                                                           │
                │    [TMDB error]:                                           │
                │      Check for stale (expired) cache entry                │
                │      [stale exists]: Return stale payload                 │
                │                      X-Cache: STALE                       │
                │      [no stale]:     Return 503 upstream_unavailable      │
                │                                                           │
                └───────────────────────────────────────────────────────────┘
                                         │
                                         ▼ Browser receives response
```

### Response Headers Added

| Header | Values | Meaning |
|---|---|---|
| `X-Cache` | `HIT`, `MISS`, `STALE` | Whether data came from cache |
| `X-Cache-Age` | `"3600"` (seconds) | How old the cache entry is |
| `X-Request-ID` | UUID | Correlate with logs |

The frontend's existing SWR `fetcher` receives exactly the same JSON structure as direct TMDB calls — no frontend changes needed when switching URLs.

---

## Function 2: `profile/index.ts` — Profile Read & Update

### Routes

```
GET  /functions/v1/profile   → own profile + computed stats
PATCH /functions/v1/profile  → update display_name, bio, region
```

### Why an Edge Function (not PostgREST)?

The `GET /profile` endpoint needs **computed stats** — counts from three different tables:

```sql
-- PostgREST can't easily do this in one request:
SELECT
  p.*,
  (SELECT COUNT(*) FROM watch_history WHERE user_id = p.id) AS watched_count,
  (SELECT COUNT(*) FROM watchlist     WHERE user_id = p.id) AS watchlist_count,
  (SELECT COUNT(*) FROM reviews       WHERE user_id = p.id) AS review_count
FROM profiles p
WHERE p.id = auth.uid();
```

An Edge Function runs all four queries and returns the merged result:
```json
{
  "id": "uuid",
  "username": "johnd",
  "display_name": "John",
  "bio": null,
  "region": "US",
  "stats": {
    "watched": 42,
    "watchlist": 7,
    "reviews": 12
  }
}
```

### `ProfileUpdateSchema`

```typescript
const ProfileUpdateSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  bio:          z.string().max(500).nullable().optional(),
  region:       z.string().length(2).transform(v => v.toUpperCase()).optional(),
});
```

**Note on `username`:** Username is intentionally absent from this schema. It's set once by the trigger on signup and is not updateable — usernames appear on reviews and must remain stable.

---

## Function 3: `watch-history/index.ts` — Film Watch Log

### Routes

```
GET    /functions/v1/watch-history            → paginated list
POST   /functions/v1/watch-history            → log a film as watched (upsert)
DELETE /functions/v1/watch-history/:tmdbId    → remove a record
```

### Upsert Pattern on POST

The `UNIQUE(user_id, tmdb_id)` constraint enables the upsert pattern:

```
First time watching Fight Club:
  POST { tmdb_id: 550, title: "Fight Club", poster_path: "/path.jpg" }
  → INSERT ... ON CONFLICT (user_id, tmdb_id) DO UPDATE SET watched_at = now()
  → New row created: { user_id: "me", tmdb_id: 550, watched_at: "2026-01-01" }

Watching Fight Club again a month later:
  Same POST body
  → Conflict detected (same user, same film)
  → UPDATE watch_history SET watched_at = now() WHERE ...
  → Row updated: { user_id: "me", tmdb_id: 550, watched_at: "2026-02-01" }
  → No duplicate rows
```

This is safe to call from `useEffect` (fires twice in React StrictMode) without creating duplicates.

### Pagination

```
GET /functions/v1/watch-history?page=2&limit=20

PaginationSchema:
  page:  z.coerce.number().int().positive().default(1)
  limit: z.coerce.number().int().min(1).max(100).default(20)

SQL:
  ORDER BY watched_at DESC
  LIMIT 20 OFFSET 20   ← (page - 1) * limit
```

`z.coerce.number()` is important: URL query params are always strings (`"2"`), but the schema expects numbers (`2`). `coerce` converts automatically.

### Delete by tmdbId

```typescript
// URL: DELETE /functions/v1/watch-history/550
const tmdbId = TmdbIdSchema.safeParse(url.pathname.split('/').at(-1));
//                                          ^^^^^^^^^^^^^^^^^^^^^^^^
//                           at(-1) gets the last path segment: "550"
```

---

## Function 4: `watchlist/index.ts` — Want-to-Watch List

### Routes

```
GET    /functions/v1/watchlist             → full list, newest first
POST   /functions/v1/watchlist             → add a film (idempotent)
DELETE /functions/v1/watchlist/:tmdbId     → remove a film
```

### Idempotent POST

Unlike `watch-history` where re-watching refreshes the timestamp, a watchlist add should be silent if the film is already there:

```sql
INSERT INTO watchlist (user_id, tmdb_id, title, poster_path)
VALUES (user.id, data.tmdb_id, data.title, data.poster_path)
ON CONFLICT (user_id, tmdb_id) DO NOTHING    ← silently ignores duplicates
RETURNING *
```

This means clicking "Add to Watchlist" twice has no visible effect — no error, no duplicate.

---

## Function 5: `reviews/index.ts` — Film Reviews

### Routes

```
GET    /functions/v1/reviews?tmdb_id=550    → all reviews for a film
POST   /functions/v1/reviews                → create or update own review
DELETE /functions/v1/reviews/:tmdbId        → delete own review
```

### GET — Reviews with Reviewer Attribution

The GET endpoint joins `reviews` with `profiles` to return the reviewer's username and avatar alongside each review:

```sql
SELECT reviews.*, profiles.username, profiles.avatar_url
FROM reviews
JOIN profiles ON profiles.id = reviews.user_id
WHERE reviews.tmdb_id = $1
ORDER BY reviews.created_at DESC
```

Without this join, the frontend would need to make a separate request per reviewer to get their display name — an N+1 query problem. One JOIN returns everything needed to render the reviews section.

### `ReviewUpsertSchema`

```typescript
const ReviewUpsertSchema = z.object({
  tmdb_id: TmdbIdSchema,                      // z.coerce.number().int().positive()
  title:   z.string().min(1).max(500),
  rating:  z.number().int().min(1).max(10),   // Zod enforces 1-10
  body:    z.string().max(5_000).nullable().optional(),
});
```

Both Zod (Edge Function) and `CHECK (rating BETWEEN 1 AND 10)` (PostgreSQL) enforce the rating range — defence in depth.

### Review Upsert

```sql
INSERT INTO reviews (user_id, tmdb_id, title, rating, body)
VALUES (user.id, data.tmdb_id, data.title, data.rating, data.body)
ON CONFLICT (user_id, tmdb_id)
DO UPDATE SET
  rating     = EXCLUDED.rating,    ← EXCLUDED refers to the attempted INSERT values
  body       = EXCLUDED.body,
  updated_at = now()
RETURNING *
```

A user can update their review by POSTing again with a different rating/body.

---

## Common Pattern Across All Functions

Every function follows the same 7-step flow:

```
┌─────────────────────────────────────────────────────────┐
│                  Edge Function Template                  │
│                                                         │
│  1. getCorsHeaders(req)      ← always first             │
│  2. handleCors(req)          ← OPTIONS preflight exit   │
│  3. requireAuth(req)         ← JWT verify (try/catch)   │
│  4. parseBody / parseQuery   ← Zod validation           │
│  5. logger.info(...)         ← structured log           │
│  6. [TODO: DB query]         ← business logic           │
│  7. new Response(JSON, ...)  ← typed response           │
└─────────────────────────────────────────────────────────┘
```

The `// TODO:` comments in each function are structured as SQL pseudocode, so implementation is a matter of translating them to Drizzle ORM calls:

```typescript
// TODO comment in scaffold:
// SELECT * FROM watch_history WHERE user_id = user.id ORDER BY watched_at DESC

// Becomes in implementation:
const rows = await db
  .select()
  .from(watchHistory)
  .where(eq(watchHistory.user_id, user.id))
  .orderBy(desc(watchHistory.watched_at))
  .limit(pagination.limit)
  .offset((pagination.page - 1) * pagination.limit);
```

---

## Endpoint Summary

| Function | Method | Path | Auth | Body / Params |
|---|---|---|---|---|
| tmdb | ANY | `/tmdb/*` | optional | TMDB path + query |
| profile | GET | `/profile` | required | — |
| profile | PATCH | `/profile` | required | `{ display_name?, bio?, region? }` |
| watch-history | GET | `/watch-history` | required | `?page&limit` |
| watch-history | POST | `/watch-history` | required | `{ tmdb_id, title, poster_path? }` |
| watch-history | DELETE | `/watch-history/:tmdbId` | required | — |
| watchlist | GET | `/watchlist` | required | — |
| watchlist | POST | `/watchlist` | required | `{ tmdb_id, title, poster_path? }` |
| watchlist | DELETE | `/watchlist/:tmdbId` | required | — |
| reviews | GET | `/reviews` | required | `?tmdb_id` |
| reviews | POST | `/reviews` | required | `{ tmdb_id, title, rating, body? }` |
| reviews | DELETE | `/reviews/:tmdbId` | required | — |

---

## What This Phase Achieved

- **Five deployable Edge Functions** — each can be deployed immediately with `supabase functions deploy`
- **All auth + validation wiring complete** — no structural changes needed when adding business logic
- **Consistent HTTP surface** — the frontend team can start integrating against the scaffold responses
- **`// TODO:` comments are SQL pseudocode** — implementation is translation, not design
- **`deno.json`** ensures strict TypeScript checking matches the backend `tsconfig.json` settings
