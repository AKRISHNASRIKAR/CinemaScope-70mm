# Phase 2 — Database Schema & Migrations

> **PR:** #2 · **Branch:** `feat/phase-2-database-schema` · **Merged to:** `master`

---

## Key Concepts

### Drizzle ORM

**Drizzle** is a TypeScript-first ORM (Object-Relational Mapper). Instead of writing raw SQL to define tables, you write TypeScript and Drizzle generates the SQL for you.

```
You write this (TypeScript):          Drizzle generates this (SQL):
─────────────────────────────         ────────────────────────────────
pgTable('reviews', {                  CREATE TABLE reviews (
  id:     bigserial().primaryKey(),     id     BIGINT GENERATED ALWAYS AS IDENTITY,
  rating: smallint().notNull(),         rating SMALLINT NOT NULL,
  body:   text(),                       body   TEXT
})                                    );
```

**Why Drizzle over raw SQL?**
- TypeScript catches a wrong column name at compile time, not at runtime
- Schema changes generate versioned migration files automatically
- `$inferSelect` and `$inferInsert` give you free TypeScript types for every table row

### Migration Files

A **migration** is a numbered SQL script that transforms the database from one state to the next. They always run in order and are never edited after being applied — you add a new migration to make further changes.

```
migrations/
├── 0000_profiles.sql       ← creates profiles table
├── 0001_watch_history.sql  ← creates watch_history
├── 0002_watchlist.sql
├── 0003_reviews.sql
├── 0004_tmdb_cache.sql
├── 0005_rls_policies.sql   ← adds security policies
├── 0006_handle_new_user.sql ← adds trigger + functions
└── 0007_pg_cron.sql        ← schedules cleanup job
```

If you need to rename a column later, you don't edit `0000_profiles.sql`. You create `0008_rename_column.sql` with an `ALTER TABLE` statement.

### Row Level Security (RLS)

**RLS** is a PostgreSQL feature where the database itself enforces access control on every query. No matter how a row is accessed (via the API, a raw connection, or an Edge Function), the policy is checked.

```
Without RLS:                     With RLS:
──────────────────────────       ──────────────────────────────────
SELECT * FROM watch_history       SELECT * FROM watch_history
→ returns ALL rows               → returns ONLY rows where
                                   user_id = auth.uid()
                                   (the logged-in user's ID)
```

`auth.uid()` is a Supabase-provided PostgreSQL function that extracts the user ID from the verified JWT. It cannot be forged by sending a different `user_id` in a query parameter.

---

## Database Schema

### Entity-Relationship Diagram

```
┌─────────────────┐
│   auth.users    │  ← Managed by Supabase Auth (GoTrue)
│─────────────────│     You never write to this table directly.
│ id (uuid) PK    │
│ email           │
│ raw_user_meta.. │
└────────┬────────┘
         │ 1
         │ ON DELETE CASCADE
         │ (deleting the auth user removes all their data)
         │
    ┌────┴──────────────────────────────────────────┐
    │                                               │
    ▼ 1                                             │
┌─────────────────┐                                 │
│    profiles     │  ← 1-to-1 with auth.users       │
│─────────────────│                                 │
│ id (uuid) PK FK │                                 │
│ username        │                                 │
│ display_name    │                                 │
│ bio             │                                 │
│ avatar_url      │                                 │
│ region (char 2) │                                 │
│ created_at      │                                 │
│ updated_at      │                                 │
└─────────────────┘                                 │
                                                    │
    ┌───────────────────────────────────────────────┘
    │ 1-to-many (one user, many rows)
    │
    ├──▶ watch_history ──────────────────────────────┐
    │    ┌──────────────┐                            │
    │    │ id           │  UNIQUE(user_id, tmdb_id)  │
    │    │ user_id FK   │  → one record per film     │
    │    │ tmdb_id      │  → re-watching = upsert    │
    │    │ title        │  (denormalised)             │
    │    │ poster_path  │  (denormalised)             │
    │    │ watched_at   │                            │
    │    └──────────────┘                            │
    │                                               │
    ├──▶ watchlist ──────────────────────────────────┤
    │    ┌──────────────┐                            │
    │    │ id           │  UNIQUE(user_id, tmdb_id)  │
    │    │ user_id FK   │  → idempotent add          │
    │    │ tmdb_id      │                            │
    │    │ title        │  (denormalised)             │
    │    │ poster_path  │  (denormalised)             │
    │    │ added_at     │                            │
    │    └──────────────┘                            │
    │                                               │
    ├──▶ reviews ────────────────────────────────────┤
    │    ┌──────────────┐                            │
    │    │ id           │  UNIQUE(user_id, tmdb_id)  │
    │    │ user_id FK   │  → one review per film     │
    │    │ tmdb_id      │                            │
    │    │ title        │  (denormalised)             │
    │    │ rating 1-10  │  CHECK constraint           │
    │    │ body (null)  │  optional written review   │
    │    │ created_at   │                            │
    │    │ updated_at   │                            │
    │    └──────────────┘                            │
    │                                               │
    └──▶ (no FK to tmdb_cache — it's not user-owned) │

┌────────────────────────────────────────────────────┘
│
▼
┌──────────────────┐
│   tmdb_cache     │  ← Not user-owned. Written by Edge
│──────────────────│    Functions via service_role only.
│ cache_key PK     │
│ endpoint         │
│ payload (jsonb)  │  ← Raw TMDB JSON
│ fetched_at       │
│ expires_at       │  ← Checked on read; purged nightly
│ hit_count        │  ← Observability counter
└──────────────────┘
```

---

## Table Deep Dives

### `profiles`

```sql
CREATE TABLE public.profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     text        NOT NULL UNIQUE,
  display_name text,
  bio          text,
  avatar_url   text,
  region       char(2)     NOT NULL DEFAULT 'US',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

**Key decisions:**
- `REFERENCES auth.users(id) ON DELETE CASCADE` — deleting an auth user cascades and deletes the profile row. This is the GDPR "right to erasure" mechanism — one Supabase Auth deletion cleans everything.
- `region char(2)` — stores a 2-letter ISO country code (US, GB, IN, etc.). Used to localise the Watch Providers section in the frontend. Currently hard-coded to `'US'` in the app; this column enables user-controlled localisation later.
- `username` is set once via the `handle_new_user` trigger and cannot be changed by the user (no UPDATE policy covers it). This prevents usernames from becoming inconsistent across reviews.

**Drizzle schema** (`src/db/schema/profiles.ts`):
```typescript
export const profiles = pgTable('profiles', {
  id:           uuid('id').primaryKey(),
  username:     text('username').notNull().unique(),
  display_name: text('display_name'),
  bio:          text('bio'),
  avatar_url:   text('avatar_url'),
  region:       char('region', { length: 2 }).notNull().default('US'),
  created_at:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// TypeScript types inferred automatically from the schema:
export type Profile    = typeof profiles.$inferSelect;  // a row read from DB
export type NewProfile = typeof profiles.$inferInsert;  // a row being inserted
```

---

### `watch_history` and `watchlist`

Both use the same pattern — **UNIQUE constraint + upsert** — for idempotent writes:

```
First watch:
  INSERT INTO watch_history (user_id, tmdb_id, title, watched_at)
  VALUES (user123, 550, 'Fight Club', now())
  ON CONFLICT (user_id, tmdb_id) DO UPDATE SET watched_at = now()
  → inserts a new row

Re-watch (same user, same film):
  Same query runs again
  → conflict detected → updates watched_at to now()
  → no duplicate row
```

**Denormalised columns** (`title`, `poster_path`):

These columns duplicate data that also exists in `tmdb_cache`. This is an intentional trade-off:

```
Option A (normalised — JOIN on every read):
  SELECT w.*, c.payload->>'title' as title
  FROM watch_history w
  JOIN tmdb_cache c ON c.cache_key = '/movie/' || w.tmdb_id
  WHERE w.user_id = $1
  ← PROBLEM: if the cache entry was evicted, title is NULL

Option B (denormalised — title stored in the row):
  SELECT * FROM watch_history WHERE user_id = $1
  ← always works; title is always available; one simple query
```

Film titles are stable (they don't change after release). The tiny storage overhead is worth the query simplicity and reliability.

---

### `reviews`

```sql
rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 10)
```

The `CHECK` constraint is a database-level assertion — PostgreSQL rejects any INSERT or UPDATE that would put an out-of-range rating in the row, regardless of which application path triggered it. Zod validation in the Edge Function is a first-line check; the `CHECK` constraint is the guaranteed backstop.

**Indexes:**
```sql
CREATE INDEX idx_reviews_tmdb_id ON reviews (tmdb_id, created_at DESC);
CREATE INDEX idx_reviews_user_id ON reviews (user_id, created_at DESC);
```

Two indexes serve the two read patterns:
- `tmdb_id` index → "show all reviews for this film" (film detail page)
- `user_id` index → "show all reviews by this user" (profile page)

Without indexes, PostgreSQL would scan every row in the table for each query. With them, it jumps directly to the relevant rows via the B-tree index.

---

### `tmdb_cache`

```sql
cache_key text PRIMARY KEY,   -- e.g. "/movie/550" or "/search/movie?query=inception"
payload   jsonb NOT NULL,     -- raw TMDB JSON response
expires_at timestamptz NOT NULL
```

**Why `jsonb` instead of `text`?**
`jsonb` stores JSON in a binary format, enabling:
- Faster reads (no parsing on every SELECT)
- JSON path queries (`payload->>'title'`) if needed later
- Automatic JSON validation on INSERT

**Cache key construction:**
```
Input URL: /functions/v1/tmdb/movie/550?language=en-US&api_key=secret

Strip function prefix:   /movie/550
Strip server-only params: (api_key, language stripped)
Sort remaining params:    (none left)
Final cache_key:          /movie/550

Input: /search/movie?page=1&query=inception&api_key=secret
Strip prefix + server params: query=inception, page=1
Sort: page=1&query=inception
Final: /search/movie?page=1&query=inception
```

The sort ensures that `/search/movie?query=inception&page=1` and `/search/movie?page=1&query=inception` produce the same key.

---

## Migration Sequence

```
npx supabase db push
        │
        ├── 0000_profiles.sql
        │     CREATE TABLE profiles (...)
        │
        ├── 0001_watch_history.sql
        │     CREATE TABLE watch_history (...)
        │
        ├── 0002_watchlist.sql
        ├── 0003_reviews.sql
        ├── 0004_tmdb_cache.sql
        │     (all tables now exist)
        │
        ├── 0005_rls_policies.sql
        │     ALTER TABLE ... ENABLE ROW LEVEL SECURITY
        │     CREATE POLICY ... (references tables that must exist first)
        │
        ├── 0006_handle_new_user.sql
        │     CREATE FUNCTION handle_new_user() ...
        │     CREATE TRIGGER on_auth_user_created ...
        │     (references public.profiles which must exist first)
        │
        └── 0007_pg_cron.sql
              SELECT cron.schedule(...)
              (must run last; pg_cron extension must be enabled)
```

**Why this order matters:** Migration 0006 creates a trigger that inserts into `profiles`. If `profiles` doesn't exist when the trigger is created, PostgreSQL will error. Migration 0005 enables RLS on all tables — if run before the tables exist, it would fail. Order is strict.

---

## RLS Policy Map

```
Table           │ anon │ authenticated (own rows) │ authenticated (others' rows)
────────────────┼──────┼──────────────────────────┼────────────────────────────
profiles        │  ✗   │ read ✓  update ✓          │ read ✓  update ✗
watch_history   │  ✗   │ all ✓                     │ ✗
watchlist       │  ✗   │ all ✓                     │ ✗
reviews         │  ✗   │ read ✓  write ✓  del ✓    │ read ✓  write ✗  del ✗
tmdb_cache      │  ✗   │ read ✓ (via Edge Fn)      │ (not user-owned concept)
                │      │ write: service_role only  │
```

---

## The `handle_new_user` Trigger

This PostgreSQL trigger fires automatically every time a new row is inserted into `auth.users` (i.e., every time a user signs up):

```
User signs up via Google OAuth
        │
        ▼
Supabase Auth inserts row into auth.users
        │
        ▼  ← trigger fires here
handle_new_user() function runs
        │
        ├── Derives username from display name
        │   "John Smith" → "johnsmith"
        │   If taken → "johnsmith1" → "johnsmith2" → ...
        │
        └── INSERT INTO public.profiles (id, username, avatar_url)
```

**Why a trigger instead of application code?** If you handle profile creation in the Edge Function (after OAuth callback), there is a window between `auth.users` insert and the profile insert where the user exists in auth but not in profiles. Any RLS policy that joins profiles would fail for that user during that window. The trigger runs inside the same database transaction as the `auth.users` insert — there is zero window.

---

## TypeScript Type System

### `src/types/database.ts` — Single Source of Truth

```typescript
export type {
  Profile,           // typeof profiles.$inferSelect
  NewProfile,        // typeof profiles.$inferInsert
  WatchHistoryEntry,
  NewWatchHistoryEntry,
  // ... etc
} from '../db/index.js';
```

**What `$inferSelect` and `$inferInsert` mean:**

```typescript
// Drizzle knows the column types from your schema definition.
// It generates TypeScript types automatically:

type Profile = {
  id:           string;       // uuid maps to string
  username:     string;       // text NOT NULL → string (not string | null)
  display_name: string | null; // text (nullable) → string | null
  region:       string;       // char(2) NOT NULL → string
  created_at:   Date;         // timestamptz → Date
  updated_at:   Date;
}

// You get this for free — no manual type definition needed.
// If you change the schema, the type updates automatically.
```

### `src/types/tmdb.ts` — TMDB API Shapes

```typescript
// Example: what TMDB returns for /movie/550
interface TmdbMovie {
  id:            number;
  title:         string;
  overview:      string;
  poster_path:   string | null;  // null if no poster
  backdrop_path: string | null;
  vote_average:  number;         // 0.0 - 10.0
  genres:        TmdbGenre[];
  // ...
}
```

These types make the Edge Function's `payload` field typed when you parse it:
```typescript
const movie = JSON.parse(row.payload as string) as TmdbMovie;
//                                                ^^^^^^^^^^ typed!
console.log(movie.vote_average); // TypeScript knows this is a number
```

---

## What This Phase Achieved

- **5 database tables** with correct data types, constraints, and indexes
- **8 migration files** that can be applied to any fresh PostgreSQL database to reproduce the exact schema
- **Full RLS coverage** — every user-owned table is protected at the database layer
- **Auto profile creation** via trigger — the application never needs to manually create profile rows
- **TypeScript types** inferred from schema — zero manual type maintenance as the schema evolves
- **GDPR erasure** via `ON DELETE CASCADE` — one auth deletion removes all user data atomically
