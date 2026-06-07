# CinemaScope — Backend Architecture

> **Phase 2: Social Cinematic Platform**
> Evolving from a TMDB discovery frontend into a Letterboxd-style social film platform.
> Stack: Supabase · PostgreSQL · RLS · Edge Functions · TypeScript · Drizzle ORM · TMDB as external source of truth

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Folder Structure](#2-folder-structure)
3. [Database Schema](#3-database-schema)
4. [Row Level Security Strategy](#4-row-level-security-strategy)
5. [Auth Architecture](#5-auth-architecture)
6. [Edge Function Structure](#6-edge-function-structure)
7. [API Route Organization](#7-api-route-organization)
8. [Service Layer Architecture](#8-service-layer-architecture)
9. [TMDB Caching Strategy](#9-tmdb-caching-strategy)
10. [Activity Feed Architecture](#10-activity-feed-architecture)
11. [Notification Architecture](#11-notification-architecture)
12. [AI-Ready Architecture](#12-ai-ready-architecture)
13. [Rate Limiting Strategy](#13-rate-limiting-strategy)
14. [File Storage Strategy](#14-file-storage-strategy)
15. [Share-Card Architecture](#15-share-card-architecture)
16. [Scalability Recommendations](#16-scalability-recommendations)
17. [Free-Tier Optimization](#17-free-tier-optimization)
18. [Production Deployment](#18-production-deployment)
19. [Security Architecture](#19-security-architecture)
20. [Monitoring & Logging](#20-monitoring--logging)
21. [Future Migration Strategy](#21-future-migration-strategy)

---

## 1. Architecture Overview

### Design Philosophy

- **Supabase-first**: Use Supabase's managed Postgres, Auth, Storage, Realtime, and Edge Functions as the single backend platform. Avoids running separate servers.
- **TMDB as source of truth**: Never duplicate TMDB's catalog. Store only user-generated data (ratings, reviews, lists, follows). Cache only what's needed for performance.
- **RLS everywhere**: Every table has Row Level Security. The frontend can query Supabase directly for most reads — no API proxy needed for simple queries.
- **Edge Functions for logic**: Business logic that can't live in RLS (feed generation, AI calls, TMDB proxying, card generation) lives in Supabase Edge Functions (Deno/TypeScript).
- **Drizzle ORM**: Type-safe schema definition and migrations. Lighter than Prisma, works well with Supabase's Postgres.

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React / Vite SPA                         │
│  (existing frontend — src/)                                     │
└────────────┬──────────────────────────────┬────────────────────┘
             │ Supabase JS client            │ TMDB REST API
             │ (auth + direct DB queries)    │ (movie metadata)
             ▼                               ▼
┌────────────────────────┐       ┌──────────────────────┐
│     Supabase Platform  │       │   TMDB API           │
│                        │       │   api.themoviedb.org │
│  ┌──────────────────┐  │       └──────────────────────┘
│  │  Auth (JWT)      │  │                ▲
│  └──────────────────┘  │                │ proxied/cached
│  ┌──────────────────┐  │       ┌────────┴─────────────┐
│  │  PostgreSQL DB   │  │       │  Edge Functions       │
│  │  + RLS policies  │◄─┼───────│  (Deno / TypeScript) │
│  └──────────────────┘  │       │                       │
│  ┌──────────────────┐  │       │  /tmdb-proxy          │
│  │  Storage         │  │       │  /feed                │
│  │  (avatars/cards) │  │       │  /recommendations     │
│  └──────────────────┘  │       │  /card-export         │
│  ┌──────────────────┐  │       │  /notifications       │
│  │  Realtime        │  │       └───────────────────────┘
│  │  (notifications) │  │
│  └──────────────────┘  │
└────────────────────────┘
```

### Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| ORM | Drizzle | Lightweight, TypeScript-native, no Prisma engine binary, works in Edge Functions |
| Auth | Supabase Auth (JWT) | Replaces Auth0 — same JWT model, free tier, built-in social login |
| TMDB data | Fetch on demand + selective cache | Avoids duplicating 1M+ movie records |
| Feed | Materialized via Edge Function | Simple fan-out on write for small social graphs |
| AI | pgvector + OpenAI embeddings | Additive — schema is ready, not required at launch |
| Cards | Frontend-generated, optional server persist | Keeps storage costs near zero at launch |

---

## 2. Folder Structure

The backend lives in a `backend/` directory at the project root, alongside the existing `src/` frontend.

```
cscope/
├── src/                          ← existing React frontend (unchanged)
├── backend/
│   ├── supabase/
│   │   ├── functions/            ← Edge Functions (Deno + TypeScript)
│   │   │   ├── _shared/          ← shared utilities imported by functions
│   │   │   │   ├── cors.ts
│   │   │   │   ├── auth.ts       ← JWT verification helper
│   │   │   │   ├── tmdb.ts       ← TMDB fetch wrapper
│   │   │   │   └── errors.ts
│   │   │   ├── tmdb-proxy/
│   │   │   │   └── index.ts      ← TMDB API proxy + cache layer
│   │   │   ├── feed/
│   │   │   │   └── index.ts      ← activity feed generation
│   │   │   ├── recommendations/
│   │   │   │   └── index.ts      ← AI-powered film recommendations
│   │   │   ├── card-export/
│   │   │   │   └── index.ts      ← shareable card metadata + optional persist
│   │   │   ├── notifications/
│   │   │   │   └── index.ts      ← notification fan-out trigger
│   │   │   └── taste-profile/
│   │   │       └── index.ts      ← compute user taste vector from ratings
│   │   ├── migrations/           ← Drizzle migration SQL files
│   │   │   ├── 0001_users.sql
│   │   │   ├── 0002_movies.sql
│   │   │   ├── 0003_watch.sql
│   │   │   ├── 0004_ratings.sql
│   │   │   ├── 0005_lists.sql
│   │   │   ├── 0006_social.sql
│   │   │   ├── 0007_activity.sql
│   │   │   ├── 0008_notifications.sql
│   │   │   ├── 0009_cards.sql
│   │   │   └── 0010_ai.sql
│   │   ├── seed/
│   │   │   └── genres.sql        ← static TMDB genre seed data
│   │   └── config.toml           ← Supabase local dev config
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema/           ← Drizzle schema definitions (TypeScript)
│   │   │   │   ├── users.ts
│   │   │   │   ├── movies.ts
│   │   │   │   ├── watch.ts
│   │   │   │   ├── ratings.ts
│   │   │   │   ├── lists.ts
│   │   │   │   ├── social.ts
│   │   │   │   ├── activity.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   ├── cards.ts
│   │   │   │   └── index.ts      ← re-exports all schemas
│   │   │   ├── client.ts         ← Drizzle + Supabase client setup
│   │   │   └── types.ts          ← inferred TypeScript types from schema
│   │   ├── services/             ← business logic, called by Edge Functions
│   │   │   ├── userService.ts
│   │   │   ├── movieService.ts
│   │   │   ├── watchService.ts
│   │   │   ├── ratingService.ts
│   │   │   ├── listService.ts
│   │   │   ├── socialService.ts
│   │   │   ├── feedService.ts
│   │   │   ├── notificationService.ts
│   │   │   ├── cardService.ts
│   │   │   └── aiService.ts
│   │   ├── lib/
│   │   │   ├── tmdb/
│   │   │   │   ├── client.ts     ← typed TMDB API client
│   │   │   │   ├── cache.ts      ← cache read/write helpers
│   │   │   │   └── types.ts      ← TMDB response types
│   │   │   ├── ai/
│   │   │   │   ├── embeddings.ts ← OpenAI embedding calls
│   │   │   │   └── prompts.ts    ← prompt templates
│   │   │   └── rateLimit.ts      ← rate limiting helpers
│   │   └── types/
│   │       └── index.ts          ← shared domain types
│   ├── drizzle.config.ts         ← Drizzle Kit config
│   ├── package.json
│   └── tsconfig.json
└── docs/
    └── backend-architecture.md   ← this document
```

---

## 3. Database Schema

### Design Principles

- Store **only user-generated data**. Movie metadata lives in TMDB.
- `tmdb_id` (integer) is the universal foreign key to TMDB's catalog.
- The `movies` table is a **thin cache** — only populated when needed for joins (e.g., to show a film title in a feed without a TMDB round-trip).
- All tables use `uuid` primary keys generated by `gen_random_uuid()`.
- `created_at` / `updated_at` on every table, managed by triggers.

---

### 3.1 Users

```sql
-- Extends Supabase's auth.users with app-specific profile data
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text UNIQUE NOT NULL,
  display_name  text,
  bio           text,
  avatar_url    text,                    -- Supabase Storage URL
  website_url   text,
  location      text,
  is_private    boolean DEFAULT false,
  preferences   jsonb DEFAULT '{}',     -- { theme, language, region, etc. }
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Taste profile: computed vector of genre/director/actor affinities
CREATE TABLE public.taste_profiles (
  user_id       uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  genre_weights jsonb DEFAULT '{}',     -- { "28": 0.8, "18": 0.6, ... }
  top_directors int[] DEFAULT '{}',     -- TMDB person IDs
  top_actors    int[] DEFAULT '{}',
  embedding     vector(1536),           -- pgvector — OpenAI embedding of taste
  computed_at   timestamptz DEFAULT now()
);
```

---

### 3.2 Movies (Thin Cache)

```sql
-- Minimal cache of TMDB movie metadata needed for joins/feeds
-- Only populated on first user interaction with a film
CREATE TABLE public.movies (
  tmdb_id       integer PRIMARY KEY,
  title         text NOT NULL,
  release_year  smallint,
  poster_path   text,                   -- TMDB path, not full URL
  backdrop_path text,
  runtime       smallint,
  genres        int[] DEFAULT '{}',     -- TMDB genre IDs
  overview      text,
  vote_average  numeric(3,1),
  popularity    numeric(10,3),
  cached_at     timestamptz DEFAULT now(),
  expires_at    timestamptz DEFAULT (now() + interval '7 days')
);

-- Aggregated stats computed from user data (not TMDB)
CREATE TABLE public.movie_stats (
  tmdb_id         integer PRIMARY KEY REFERENCES public.movies(tmdb_id),
  watch_count     integer DEFAULT 0,
  rating_count    integer DEFAULT 0,
  avg_rating      numeric(3,2) DEFAULT 0,
  review_count    integer DEFAULT 0,
  list_count      integer DEFAULT 0,
  updated_at      timestamptz DEFAULT now()
);
```

---

### 3.3 Watch System

```sql
-- A single "watched" record per user per film (most recent watch)
CREATE TABLE public.watched (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tmdb_id     integer NOT NULL REFERENCES public.movies(tmdb_id),
  watched_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, tmdb_id)
);

-- Full watch history — every watch event including rewatches
CREATE TABLE public.watch_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tmdb_id     integer NOT NULL REFERENCES public.movies(tmdb_id),
  watched_at  timestamptz DEFAULT now(),
  rewatch     boolean DEFAULT false,
  note        text                       -- optional private note per watch
);

CREATE INDEX idx_watch_history_user ON public.watch_history(user_id, watched_at DESC);
CREATE INDEX idx_watched_user ON public.watched(user_id);
```

---

### 3.4 Ratings & Reviews

```sql
CREATE TABLE public.ratings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tmdb_id     integer NOT NULL REFERENCES public.movies(tmdb_id),
  rating      numeric(2,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, tmdb_id)
);

CREATE TABLE public.reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tmdb_id         integer NOT NULL REFERENCES public.movies(tmdb_id),
  rating_id       uuid REFERENCES public.ratings(id) ON DELETE SET NULL,
  body            text NOT NULL,
  contains_spoiler boolean DEFAULT false,
  like_count      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Edit history for reviews (audit trail)
CREATE TABLE public.review_edits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  body        text NOT NULL,             -- snapshot of body before edit
  edited_at   timestamptz DEFAULT now()
);

-- Likes on reviews
CREATE TABLE public.review_likes (
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id   uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

CREATE INDEX idx_reviews_tmdb ON public.reviews(tmdb_id, created_at DESC);
CREATE INDEX idx_reviews_user ON public.reviews(user_id, created_at DESC);
```

---

### 3.5 Favorites

```sql
CREATE TABLE public.favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tmdb_id     integer NOT NULL REFERENCES public.movies(tmdb_id),
  position    smallint DEFAULT 0,        -- ordered favorites (top 4 Letterboxd-style)
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, tmdb_id)
);

-- Future: favorite actors/directors
CREATE TABLE public.favorite_people (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tmdb_person_id integer NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, tmdb_person_id)
);
```

---

### 3.6 Lists

```sql
CREATE TABLE public.lists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  is_ranked   boolean DEFAULT false,
  is_public   boolean DEFAULT true,
  cover_tmdb_id integer,                 -- film used as cover art
  item_count  integer DEFAULT 0,         -- denormalized for fast display
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE public.list_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  tmdb_id     integer NOT NULL REFERENCES public.movies(tmdb_id),
  position    integer DEFAULT 0,         -- for ranked lists
  note        text,                      -- per-item annotation
  added_at    timestamptz DEFAULT now(),
  UNIQUE(list_id, tmdb_id)
);

CREATE INDEX idx_list_items_list ON public.list_items(list_id, position);
CREATE INDEX idx_lists_user ON public.lists(user_id, updated_at DESC);
```

---

### 3.7 Social Graph

```sql
CREATE TABLE public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);
```

---

### 3.8 Activity Feed

```sql
-- Append-only event log — source of truth for all feed generation
CREATE TABLE public.activity_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type  text NOT NULL,             -- 'watched', 'rated', 'reviewed', 'listed', 'followed'
  tmdb_id     integer,                   -- null for non-film events (e.g. follows)
  ref_id      uuid,                      -- FK to the source record (review_id, list_id, etc.)
  metadata    jsonb DEFAULT '{}',        -- denormalized snapshot for fast feed render
  created_at  timestamptz DEFAULT now()
);

-- Materialized feed per user — pre-computed for fast reads
CREATE TABLE public.feed_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id    uuid NOT NULL REFERENCES public.activity_events(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(owner_id, event_id)
);

CREATE INDEX idx_activity_user ON public.activity_events(user_id, created_at DESC);
CREATE INDEX idx_feed_owner ON public.feed_items(owner_id, created_at DESC);
```

---

### 3.9 Notifications

```sql
CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,             -- 'like', 'follow', 'comment', 'mention'
  actor_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ref_id      uuid,                      -- review_id, list_id, etc.
  ref_type    text,                      -- 'review', 'list', 'profile'
  message     text,
  is_read     boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
```

---

### 3.10 Share Cards

```sql
-- Optional persistence for generated cinematic cards
CREATE TABLE public.share_cards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tmdb_id     integer NOT NULL REFERENCES public.movies(tmdb_id),
  style       text DEFAULT 'classic',    -- 'classic', 'minimal', 'neon', etc.
  rarity      text DEFAULT 'common',     -- 'common', 'rare', 'legendary'
  metadata    jsonb DEFAULT '{}',        -- card-specific data (rating, watched_at, etc.)
  image_url   text,                      -- Supabase Storage URL (if persisted)
  share_token text UNIQUE,               -- short token for public share URL
  view_count  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_cards_user ON public.share_cards(user_id, created_at DESC);
CREATE INDEX idx_cards_token ON public.share_cards(share_token);
```

---

### 3.11 AI / Embeddings (Future-Ready)

```sql
-- Semantic search index for movies (populated lazily)
CREATE TABLE public.movie_embeddings (
  tmdb_id     integer PRIMARY KEY REFERENCES public.movies(tmdb_id),
  embedding   vector(1536),              -- OpenAI text-embedding-3-small
  embedded_at timestamptz DEFAULT now()
);

-- AI-generated list suggestions
CREATE TABLE public.ai_lists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt      text NOT NULL,
  title       text,
  tmdb_ids    integer[] DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);
```

---

## 4. Row Level Security Strategy

### Principle

Every table has RLS enabled. The frontend uses the Supabase JS client with the user's JWT — no backend proxy needed for standard reads. Edge Functions use the `service_role` key to bypass RLS when doing privileged writes (feed fan-out, notification dispatch).

### Policy Patterns

```sql
-- ── PROFILES ──────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read public profiles
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (NOT is_private OR auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profile is created automatically via trigger on auth.users insert
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- ── WATCHED / WATCH_HISTORY ───────────────────────────────────────
ALTER TABLE public.watched ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

-- Users see only their own watch data
CREATE POLICY "watched_own" ON public.watched
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "watch_history_own" ON public.watch_history
  FOR ALL USING (auth.uid() = user_id);


-- ── RATINGS ───────────────────────────────────────────────────────
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Ratings are public (anyone can see what you rated)
CREATE POLICY "ratings_select_all" ON public.ratings
  FOR SELECT USING (true);

-- Only owner can insert/update/delete
CREATE POLICY "ratings_write_own" ON public.ratings
  FOR ALL USING (auth.uid() = user_id);


-- ── REVIEWS ───────────────────────────────────────────────────────
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_write_own" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);


-- ── LISTS ─────────────────────────────────────────────────────────
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

-- Public lists visible to all; private lists only to owner
CREATE POLICY "lists_select" ON public.lists
  FOR SELECT USING (is_public OR auth.uid() = user_id);

CREATE POLICY "lists_write_own" ON public.lists
  FOR ALL USING (auth.uid() = user_id);

-- List items inherit list visibility
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "list_items_select" ON public.list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = list_id AND (l.is_public OR l.user_id = auth.uid())
    )
  );

CREATE POLICY "list_items_write_own" ON public.list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = list_id AND l.user_id = auth.uid()
    )
  );


-- ── FOLLOWS ───────────────────────────────────────────────────────
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select_all" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "follows_write_own" ON public.follows
  FOR ALL USING (auth.uid() = follower_id);


-- ── ACTIVITY FEED ─────────────────────────────────────────────────
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Activity events are public (social platform)
CREATE POLICY "activity_select_all" ON public.activity_events
  FOR SELECT USING (true);

-- Only service_role can insert (via Edge Function fan-out)
CREATE POLICY "activity_insert_service" ON public.activity_events
  FOR INSERT WITH CHECK (false);  -- blocked for anon/user; service_role bypasses RLS


-- ── FEED ITEMS ────────────────────────────────────────────────────
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

-- Users see only their own feed
CREATE POLICY "feed_items_own" ON public.feed_items
  FOR SELECT USING (auth.uid() = owner_id);


-- ── NOTIFICATIONS ─────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);


-- ── SHARE CARDS ───────────────────────────────────────────────────
ALTER TABLE public.share_cards ENABLE ROW LEVEL SECURITY;

-- Public cards readable by anyone with the share token (handled in Edge Function)
CREATE POLICY "cards_select_own" ON public.share_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cards_write_own" ON public.share_cards
  FOR ALL USING (auth.uid() = user_id);


-- ── MOVIES (cache) ────────────────────────────────────────────────
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Movie cache is readable by all authenticated users
CREATE POLICY "movies_select_auth" ON public.movies
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service_role can write (via Edge Function TMDB proxy)
CREATE POLICY "movies_insert_service" ON public.movies
  FOR INSERT WITH CHECK (false);
```

### RLS Summary Table

| Table | Anon Read | Auth Read | Own Write | Service Write |
|---|---|---|---|---|
| profiles | public only | ✅ | ✅ | ✅ |
| watched | ❌ | own only | ✅ | ✅ |
| watch_history | ❌ | own only | ✅ | ✅ |
| ratings | ❌ | ✅ all | own only | ✅ |
| reviews | ❌ | ✅ all | own only | ✅ |
| lists | ❌ | public only | own only | ✅ |
| follows | ❌ | ✅ all | own only | ✅ |
| activity_events | ❌ | ✅ all | ❌ | ✅ |
| feed_items | ❌ | own only | ❌ | ✅ |
| notifications | ❌ | own only | own only | ✅ |
| movies | ❌ | ✅ all | ❌ | ✅ |
| share_cards | ❌ | own only | own only | ✅ |

---

## 5. Auth Architecture

### Migration from Auth0 to Supabase Auth

The existing frontend uses `@auth0/auth0-react`. Supabase Auth is a drop-in replacement that eliminates the Auth0 dependency and keeps everything on one platform.

```
Auth0 (current)          →    Supabase Auth (target)
─────────────────────────────────────────────────────
Auth0Provider            →    createClient() in supabase.ts
useAuth0()               →    useSession() / supabase.auth.getUser()
loginWithRedirect()      →    supabase.auth.signInWithOAuth()
logout()                 →    supabase.auth.signOut()
user.sub                 →    session.user.id (uuid)
VITE_AUTH0_*             →    VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
```

### JWT Flow

```
1. User clicks "Sign in with Google/GitHub"
2. supabase.auth.signInWithOAuth({ provider: 'google' })
3. Supabase redirects to OAuth provider
4. Provider returns to /auth/callback
5. Supabase exchanges code for session
6. Session stored in localStorage (same as current Auth0 cacheLocation)
7. JWT included automatically in all supabase-js requests
8. RLS policies evaluate auth.uid() from JWT
9. Edge Functions verify JWT via Supabase's built-in verifyJWT()
```

### Session Management in Frontend

```typescript
// src/lib/supabase.ts  (new file, replaces Auth0 config in main.jsx)
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      storageKey: 'cs_session',
      autoRefreshToken: true,
    }
  }
)
```

### Profile Auto-Creation Trigger

When a new user signs up, a Postgres trigger automatically creates their profile row:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    -- derive username from email prefix, ensure uniqueness
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(NEW.id::text, 1, 4),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Supported Auth Providers

| Provider | Config | Notes |
|---|---|---|
| Google | OAuth in Supabase dashboard | Primary social login |
| GitHub | OAuth in Supabase dashboard | Developer-friendly |
| Email/Password | Built-in | Fallback for users without social accounts |
| Magic Link | Built-in | Passwordless option |

---

## 6. Edge Function Structure

Edge Functions run on Deno at the edge. They handle logic that can't live in RLS: TMDB proxying, feed fan-out, AI calls, card generation, and notification dispatch.

### Shared Utilities (`_shared/`)

```typescript
// _shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// _shared/auth.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Missing auth header')
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return user
}

// _shared/tmdb.ts
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_KEY = Deno.env.get('TMDB_API_KEY')!

export async function tmdbFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  url.searchParams.set('api_key', TMDB_KEY)
  url.searchParams.set('language', 'en-US')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  return res.json()
}
```

### `tmdb-proxy/index.ts`

Proxies TMDB requests through the backend to:
1. Hide the TMDB API key from the frontend bundle
2. Cache responses in the `movies` table
3. Apply rate limiting per user

```typescript
// Handles: GET /functions/v1/tmdb-proxy?endpoint=/movie/popular
// Caches movie detail responses in public.movies
// Returns TMDB JSON directly for non-cacheable endpoints
```

### `feed/index.ts`

Called after any activity event (watch, rate, review, list). Fans out the event to all followers' feed tables.

```typescript
// POST /functions/v1/feed
// Body: { event_id: uuid }
// 1. Fetch the event from activity_events
// 2. Fetch all followers of event.user_id from follows
// 3. Batch insert into feed_items for each follower
// 4. Uses service_role to bypass RLS
// Triggered by Postgres webhook on activity_events INSERT
```

### `notifications/index.ts`

Dispatches notifications for social interactions.

```typescript
// POST /functions/v1/notifications
// Body: { type, actor_id, target_user_id, ref_id, ref_type }
// Inserts into notifications table
// Optionally sends push notification via Web Push API (future)
```

### `recommendations/index.ts`

AI-powered film recommendations based on user taste profile.

```typescript
// GET /functions/v1/recommendations
// Auth required
// 1. Fetch user's taste_profile (genre_weights, top_directors, embedding)
// 2. If embedding exists: pgvector similarity search on movie_embeddings
// 3. Fallback: TMDB /discover/movie with top genre IDs
// 4. Filter out already-watched films
// Returns: array of tmdb_ids with scores
```

### `taste-profile/index.ts`

Recomputes a user's taste profile from their ratings and watch history.

```typescript
// POST /functions/v1/taste-profile
// Auth required — called after rating/review actions
// 1. Aggregate ratings by genre (weighted by rating value)
// 2. Extract top directors/actors from highly-rated films
// 3. Build text description of taste for embedding
// 4. Call OpenAI embeddings API
// 5. Upsert into taste_profiles
```

### `card-export/index.ts`

Handles shareable card metadata and optional image persistence.

```typescript
// POST /functions/v1/card-export
// Body: { tmdb_id, style, metadata }
// 1. Validate user auth
// 2. Ensure movie exists in cache
// 3. Generate share_token (nanoid)
// 4. Insert into share_cards
// 5. Return share URL: /card/{share_token}
// Image generation is frontend-only (html2canvas/dom-to-image)
// Optional: accept base64 image and store in Supabase Storage
```

---

## 7. API Route Organization

The frontend communicates with the backend through two channels:

1. **Supabase JS client** — direct DB queries for simple CRUD (RLS enforced)
2. **Edge Functions** — complex logic, TMDB proxying, AI, feed generation

### Direct Supabase Client Calls (Frontend)

```typescript
// These replace direct TMDB calls for user data:

// Get user profile
supabase.from('profiles').select('*').eq('id', userId).single()

// Get user's watched films
supabase.from('watched').select('tmdb_id, watched_at').eq('user_id', userId)

// Add to watched
supabase.from('watched').upsert({ user_id, tmdb_id, watched_at: new Date() })

// Get user's rating for a film
supabase.from('ratings').select('rating').eq('user_id', userId).eq('tmdb_id', tmdbId).single()

// Submit/update rating
supabase.from('ratings').upsert({ user_id, tmdb_id, rating })

// Get reviews for a film
supabase.from('reviews')
  .select('*, profiles(username, avatar_url)')
  .eq('tmdb_id', tmdbId)
  .order('created_at', { ascending: false })

// Get user's lists
supabase.from('lists').select('*, list_items(count)').eq('user_id', userId)

// Get user's feed
supabase.from('feed_items')
  .select('*, activity_events(*, profiles(username, avatar_url))')
  .eq('owner_id', userId)
  .order('created_at', { ascending: false })
  .limit(50)

// Get notifications
supabase.from('notifications')
  .select('*, profiles!actor_id(username, avatar_url)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20)

// Real-time notifications
supabase.channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => handleNewNotification(payload.new))
  .subscribe()
```

### Edge Function Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/functions/v1/tmdb-proxy` | Required | Proxy TMDB requests, cache movie data |
| POST | `/functions/v1/feed` | Service | Fan-out activity event to followers |
| POST | `/functions/v1/notifications` | Service | Dispatch notification |
| GET | `/functions/v1/recommendations` | Required | AI film recommendations |
| POST | `/functions/v1/taste-profile` | Required | Recompute taste profile |
| POST | `/functions/v1/card-export` | Required | Create shareable card |
| GET | `/functions/v1/card-export/:token` | Public | Fetch card by share token |

### TMDB Proxy Usage (Frontend Migration)

Replace direct TMDB calls in `fetcher.js` with the proxy:

```typescript
// Before (current — exposes API key in browser)
axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${key}`)

// After (proxied — key stays server-side)
supabase.functions.invoke('tmdb-proxy', {
  body: { endpoint: '/movie/popular' }
})
```

---

## 8. Service Layer Architecture

Services are TypeScript modules called by Edge Functions. They encapsulate all database interactions and business logic, keeping Edge Function handlers thin.

### `userService.ts`

```typescript
export const userService = {
  getProfile: (userId: string) => { ... },
  updateProfile: (userId: string, data: Partial<Profile>) => { ... },
  searchUsers: (query: string) => { ... },
  getFollowers: (userId: string) => { ... },
  getFollowing: (userId: string) => { ... },
}
```

### `movieService.ts`

```typescript
export const movieService = {
  // Ensure movie exists in cache; fetch from TMDB if not
  ensureCached: async (tmdbId: number): Promise<Movie> => {
    const existing = await db.select().from(movies).where(eq(movies.tmdbId, tmdbId))
    if (existing.length && existing[0].expiresAt > new Date()) return existing[0]
    
    const tmdbData = await tmdbFetch(`/movie/${tmdbId}`)
    return db.insert(movies).values(mapTmdbToCache(tmdbData))
      .onConflictDoUpdate({ target: movies.tmdbId, set: { ...mapped, cachedAt: new Date() } })
      .returning()
  },
  
  getStats: (tmdbId: number) => { ... },
  updateStats: (tmdbId: number) => { ... },  // recalculate from ratings/reviews
}
```

### `watchService.ts`

```typescript
export const watchService = {
  markWatched: async (userId: string, tmdbId: number) => {
    await movieService.ensureCached(tmdbId)
    // Upsert watched record
    // Insert watch_history record
    // Emit activity event
    // Trigger taste profile recompute (async, non-blocking)
  },
  getWatchHistory: (userId: string, page: number) => { ... },
  isWatched: (userId: string, tmdbId: number) => { ... },
}
```

### `ratingService.ts`

```typescript
export const ratingService = {
  upsertRating: async (userId: string, tmdbId: number, rating: number) => {
    await movieService.ensureCached(tmdbId)
    // Upsert rating
    // Update movie_stats.avg_rating (via DB function)
    // Emit activity event
    // Trigger taste profile recompute
  },
  deleteRating: (userId: string, tmdbId: number) => { ... },
  getFilmRatings: (tmdbId: number, page: number) => { ... },
}
```

### `feedService.ts`

```typescript
export const feedService = {
  emitEvent: async (event: ActivityEvent) => {
    // Insert into activity_events
    // Fetch follower IDs
    // Batch insert into feed_items for each follower
    // Also insert into own feed
  },
  getFeed: (userId: string, cursor?: string, limit = 50) => { ... },
  getProfileActivity: (userId: string, page: number) => { ... },
}
```

### `notificationService.ts`

```typescript
export const notificationService = {
  dispatch: async (notification: NewNotification) => {
    // Insert into notifications
    // Supabase Realtime will push to subscribed client
  },
  markRead: (userId: string, notificationId: string) => { ... },
  markAllRead: (userId: string) => { ... },
  getUnreadCount: (userId: string) => { ... },
}
```

### Service Interaction Flow

```
User action (e.g. rate a film)
  │
  ▼
Frontend: supabase.from('ratings').upsert(...)
  │
  ▼ (Postgres trigger or Edge Function webhook)
ratingService.upsertRating()
  ├── movieService.ensureCached()     ← ensure movie in cache
  ├── update movie_stats              ← recalculate avg_rating
  ├── feedService.emitEvent()         ← fan-out to followers
  │     └── insert feed_items × N followers
  ├── notificationService.dispatch()  ← notify relevant users
  └── taste-profile Edge Function     ← async recompute (non-blocking)
```

---

## 9. TMDB Caching Strategy

### Core Principle

TMDB is the source of truth. The backend caches only what's needed for joins and feed rendering. Never replicate the full catalog.

### What Gets Cached

| Data | Cache? | TTL | Reason |
|---|---|---|---|
| Movie detail (title, poster, year, genres) | ✅ Yes | 7 days | Needed for feed/list rendering without TMDB round-trip |
| Movie stats (avg_rating, watch_count) | ✅ Yes | Real-time | User-generated, not from TMDB |
| Popular/trending lists | ✅ Yes | 1 hour | High-traffic endpoint, rate limit protection |
| Search results | ❌ No | — | Too dynamic, low value to cache |
| Cast/credits | ❌ No | — | Fetched on demand from TMDB |
| Watch providers | ❌ No | — | Changes frequently, region-specific |
| Person details | ❌ No | — | Low traffic, fetch on demand |

### Cache Population Strategy

**Lazy population** — movies are cached on first user interaction:

```
User visits /film/550 (Fight Club)
  │
  ▼
Frontend calls tmdb-proxy Edge Function
  │
  ▼
Edge Function checks public.movies WHERE tmdb_id = 550
  │
  ├── Cache HIT + not expired → return cached data
  │
  └── Cache MISS or expired
        │
        ▼
        Fetch from TMDB API
        │
        ▼
        Upsert into public.movies (title, poster_path, genres, etc.)
        │
        ▼
        Return data to frontend
```

### Trending Cache (Scheduled Refresh)

Use Supabase's pg_cron extension to refresh trending data hourly:

```sql
-- Runs every hour via pg_cron
SELECT cron.schedule(
  'refresh-trending',
  '0 * * * *',
  $$SELECT net.http_post(
    url := current_setting('app.edge_function_url') || '/tmdb-proxy/refresh-trending',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
  )$$
);
```

### Cache Invalidation

- TTL-based: `expires_at` column checked on every read
- Manual: Admin can call `DELETE FROM movies WHERE tmdb_id = ?` to force refresh
- Bulk: `DELETE FROM movies WHERE expires_at < now()` — run weekly via pg_cron

### TMDB Rate Limit Protection

TMDB free tier: 40 requests / 10 seconds per IP.

```typescript
// In tmdb-proxy Edge Function:
// 1. Check cache first — most requests never hit TMDB
// 2. Deduplicate in-flight requests (same endpoint within 100ms)
// 3. If rate limit error (429), return cached data with stale flag
// 4. Log rate limit hits to monitoring
```

---

## 10. Activity Feed Architecture

### Strategy: Fan-Out on Write

When a user performs an action, the event is written to `activity_events` and immediately fanned out to all followers' `feed_items` tables. This makes feed reads O(1) — just query `feed_items WHERE owner_id = ?`.

This is appropriate for a social platform at this scale (< 10k followers per user). For accounts with massive follower counts, switch to fan-out on read for those accounts specifically.

### Event Types

| Event Type | Trigger | Metadata Snapshot |
|---|---|---|
| `watched` | User marks film watched | `{ tmdb_id, title, poster_path }` |
| `rated` | User rates a film | `{ tmdb_id, title, poster_path, rating }` |
| `reviewed` | User writes a review | `{ tmdb_id, title, poster_path, rating, review_excerpt }` |
| `listed` | User adds film to a list | `{ tmdb_id, title, list_id, list_title }` |
| `list_created` | User creates a new list | `{ list_id, list_title, item_count }` |
| `followed` | User follows another user | `{ following_id, following_username }` |

### Fan-Out Flow

```
1. User rates a film
   │
   ▼
2. Frontend: supabase.from('ratings').upsert(...)
   │
   ▼
3. Postgres trigger fires on ratings INSERT/UPDATE
   │
   ▼
4. Trigger calls pg_net to invoke feed Edge Function
   (async — doesn't block the rating write)
   │
   ▼
5. feed/index.ts:
   a. Insert into activity_events
   b. SELECT follower_id FROM follows WHERE following_id = user_id
   c. Batch INSERT into feed_items (owner_id = each follower_id)
   d. Also insert for the user themselves (own activity)
```

### Feed Query (Frontend)

```typescript
// Paginated feed with cursor
const { data } = await supabase
  .from('feed_items')
  .select(`
    id,
    created_at,
    activity_events (
      event_type,
      tmdb_id,
      metadata,
      created_at,
      profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    )
  `)
  .eq('owner_id', userId)
  .lt('created_at', cursor ?? new Date().toISOString())
  .order('created_at', { ascending: false })
  .limit(20)
```

### Feed Rendering

The `metadata` JSONB column contains a denormalized snapshot of the event data (film title, poster, rating excerpt). This means the feed renders without additional TMDB or DB lookups — the data is already there.

---

## 11. Notification Architecture

### Delivery Mechanism

Supabase Realtime handles push delivery. The frontend subscribes to the `notifications` table for the current user. When a new row is inserted (by an Edge Function), Supabase pushes it to the subscribed client instantly.

```typescript
// Frontend subscription (in a useNotifications hook)
useEffect(() => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      setNotifications(prev => [payload.new, ...prev])
      setUnreadCount(c => c + 1)
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [userId])
```

### Notification Triggers

| Action | Notification Recipient | Type |
|---|---|---|
| User A likes User B's review | User B | `like` |
| User A follows User B | User B | `follow` |
| User A comments on User B's review | User B | `comment` |
| User A mentions @User B in a review | User B | `mention` |

### Notification Dispatch (Edge Function)

```typescript
// Called by Postgres triggers or other Edge Functions
// Never called directly from the frontend

async function dispatchNotification({
  type, actorId, targetUserId, refId, refType, message
}: NotificationPayload) {
  // Don't notify users about their own actions
  if (actorId === targetUserId) return
  
  await supabaseAdmin.from('notifications').insert({
    user_id: targetUserId,
    type,
    actor_id: actorId,
    ref_id: refId,
    ref_type: refType,
    message,
  })
  // Realtime subscription on the frontend picks this up automatically
}
```

### Notification Batching (Future)

To avoid notification spam (e.g., 50 likes in 1 minute), implement batching:
- Buffer notifications in a `notification_queue` table
- A pg_cron job runs every 5 minutes and collapses duplicates
- "User A and 12 others liked your review" instead of 13 separate notifications

---

## 12. AI-Ready Architecture

### Phase 1 (Launch): No AI Required

The schema is AI-ready but AI features are not required at launch. The `taste_profiles.embedding` and `movie_embeddings.embedding` columns are nullable — they're populated lazily as the feature is enabled.

### Phase 2: Taste-Based Recommendations

```
User has rated 10+ films
  │
  ▼
taste-profile Edge Function runs
  │
  ├── Aggregate genre weights from ratings
  │   (genre_id → weighted average rating)
  │
  ├── Extract top directors/actors from 4+ star films
  │
  ├── Build taste description text:
  │   "Loves slow-burn psychological thrillers (Drama, Mystery).
  │    Favors Kubrick, Fincher, Villeneuve. Dislikes action comedies."
  │
  └── Call OpenAI text-embedding-3-small (1536 dims, $0.02/1M tokens)
        │
        ▼
      Store in taste_profiles.embedding (pgvector)
```

### Phase 3: Semantic Film Search

```
User searches "films about loneliness in modern cities"
  │
  ▼
Embed the query with OpenAI
  │
  ▼
pgvector similarity search:
  SELECT tmdb_id, title, 1 - (embedding <=> $query_embedding) AS score
  FROM movie_embeddings
  ORDER BY embedding <=> $query_embedding
  LIMIT 20
  │
  ▼
Filter out already-watched films
  │
  ▼
Return ranked results
```

### Phase 4: AI-Generated Lists

```typescript
// recommendations Edge Function
// User prompt: "Give me a list of films for a rainy Sunday"
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are a film curator. Return only TMDB movie IDs.' },
    { role: 'user', content: `User taste: ${tasteDescription}\nRequest: ${userPrompt}` }
  ],
  response_format: { type: 'json_object' }
})
// Parse tmdb_ids from response, save to ai_lists table
```

### pgvector Setup

```sql
-- Enable pgvector extension (available on Supabase free tier)
CREATE EXTENSION IF NOT EXISTS vector;

-- IVFFlat index for fast approximate nearest-neighbor search
-- Build after 1000+ rows for meaningful performance
CREATE INDEX ON movie_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX ON taste_profiles USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);
```

### Cost Estimates (OpenAI)

| Operation | Model | Cost | Frequency |
|---|---|---|---|
| Taste profile embedding | text-embedding-3-small | ~$0.000002/user | On rating |
| Movie embedding | text-embedding-3-small | ~$0.000002/movie | Once per movie |
| AI list generation | gpt-4o-mini | ~$0.0003/request | On demand |
| Semantic search | text-embedding-3-small | ~$0.000002/query | On search |

At 1,000 active users: < $5/month for AI features.

---

## 13. Rate Limiting Strategy

### Layers of Rate Limiting

**Layer 1: TMDB API Protection (Edge Function)**

```typescript
// In tmdb-proxy Edge Function
// Track per-user TMDB request counts in a Redis-like structure
// Supabase doesn't have Redis, so use a lightweight in-memory approach
// or a rate_limits table with TTL cleanup

const TMDB_LIMIT_PER_USER = 100  // requests per 10 minutes
const TMDB_LIMIT_GLOBAL = 35     // requests per 10 seconds (TMDB limit is 40)

// Check cache first — most requests never reach TMDB
// If cache miss, check rate limit before calling TMDB
```

**Layer 2: Edge Function Rate Limiting**

```sql
-- Simple rate limit table (cleaned up by pg_cron)
CREATE TABLE public.rate_limits (
  key         text NOT NULL,           -- 'user:{id}:tmdb' or 'ip:{ip}:search'
  count       integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  PRIMARY KEY (key)
);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) RETURNS boolean AS $$
DECLARE
  v_count integer;
  v_window_start timestamptz;
BEGIN
  SELECT count, window_start INTO v_count, v_window_start
  FROM public.rate_limits WHERE key = p_key;
  
  IF NOT FOUND OR (now() - v_window_start) > (p_window_seconds || ' seconds')::interval THEN
    INSERT INTO public.rate_limits (key, count, window_start)
    VALUES (p_key, 1, now())
    ON CONFLICT (key) DO UPDATE SET count = 1, window_start = now();
    RETURN true;
  END IF;
  
  IF v_count >= p_limit THEN RETURN false; END IF;
  
  UPDATE public.rate_limits SET count = count + 1 WHERE key = p_key;
  RETURN true;
END;
$$ LANGUAGE plpgsql;
```

**Layer 3: Supabase Built-in Limits**

Supabase free tier enforces:
- 500MB database storage
- 1GB bandwidth/month
- 50,000 monthly active users
- 500,000 Edge Function invocations/month

These are generous for a launch-phase app. Monitor via Supabase dashboard.

### Rate Limit Responses

```typescript
// Edge Function response when rate limited
return new Response(
  JSON.stringify({ error: 'Rate limit exceeded', retryAfter: 60 }),
  { status: 429, headers: { 'Retry-After': '60', ...corsHeaders } }
)
```

---

## 14. File Storage Strategy

### Supabase Storage Buckets

```
storage/
├── avatars/          ← user profile photos
│   └── {user_id}/profile.webp
├── cards/            ← persisted share card images (optional)
│   └── {user_id}/{card_id}.webp
└── lists/            ← list cover images (future)
    └── {user_id}/{list_id}.webp
```

### Storage Policies

```sql
-- Avatars: public read, owner write
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Cards: public read (for share links), owner write
INSERT INTO storage.buckets (id, name, public) VALUES ('cards', 'cards', true);
-- Same pattern as avatars
```

### Avatar Upload Flow

```typescript
// Frontend: upload avatar
const file = event.target.files[0]
const webpBlob = await convertToWebP(file)  // client-side conversion

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/profile.webp`, webpBlob, {
    contentType: 'image/webp',
    upsert: true  // replace existing
  })

// Update profile with new URL
const avatarUrl = supabase.storage.from('avatars').getPublicUrl(`${userId}/profile.webp`).data.publicUrl
await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId)
```

### Storage Cost Optimization

- Convert all uploads to WebP before storing (client-side with `canvas.toBlob`)
- Resize avatars to max 400×400px before upload
- Card images are optional — most users will just share the URL, not the image
- Free tier: 1GB storage — sufficient for ~10,000 avatars at 100KB each

---

## 15. Share-Card Architecture

### Design Philosophy

Cards are **frontend-generated first**. The backend provides metadata and optional persistence. This keeps storage costs near zero at launch while enabling future cosmetic upgrades.

### Card Generation Flow

```
User clicks "Create Card" on a film page
  │
  ▼
Frontend renders a hidden <div> with card layout
(poster, title, user rating, watched date, username, style)
  │
  ▼
html2canvas or dom-to-image captures the div as a PNG/WebP
  │
  ▼
Option A (share only): Convert to data URL, open native share sheet
  │
  ▼
Option B (persist): POST to card-export Edge Function
  ├── Validate auth
  ├── Insert into share_cards (style, metadata, share_token)
  ├── Upload image to Supabase Storage cards/ bucket
  ├── Update share_cards.image_url
  └── Return: { shareUrl: '/card/{share_token}' }
```

### Card Styles & Rarity System

```typescript
// Card styles (cosmetic, frontend-rendered)
type CardStyle = 'classic' | 'minimal' | 'neon' | 'vintage' | 'polaroid'

// Rarity (future — unlocked via activity milestones)
type CardRarity = 'common' | 'rare' | 'epic' | 'legendary'

// Rarity unlock conditions (examples):
// common    → default
// rare      → watched 50+ films
// epic      → written 10+ reviews
// legendary → followed by 100+ users
```

### Public Share Page

```
/card/{share_token}
  │
  ▼
Frontend fetches: GET /functions/v1/card-export/{token}
  │
  ▼
Edge Function:
  SELECT * FROM share_cards WHERE share_token = $token
  UPDATE share_cards SET view_count = view_count + 1
  Return card metadata
  │
  ▼
Frontend renders the card in full-screen cinematic view
with "Download", "Share", and "View on CinemaScope" CTAs
```

### OG Meta Tags for Share Cards

```html
<!-- Dynamically injected for /card/{token} routes -->
<meta property="og:title" content="{username}'s card for {film_title}" />
<meta property="og:image" content="{card_image_url}" />
<meta property="og:description" content="Rated {rating}/5 · Watched {date}" />
<meta name="twitter:card" content="summary_large_image" />
```

This requires either SSR or a meta-tag injection Edge Function that serves the `/card/` route with pre-populated OG tags for social preview.

---

## 16. Scalability Recommendations

### Database Scaling Path

| Users | Strategy |
|---|---|
| 0–1,000 | Supabase free tier — no changes needed |
| 1,000–10,000 | Upgrade to Supabase Pro ($25/mo) — more connections, daily backups |
| 10,000–100,000 | Add read replicas, enable connection pooling (PgBouncer — built into Supabase) |
| 100,000+ | Evaluate Supabase Enterprise or migrate to self-hosted Postgres on Fly.io/Railway |

### Feed Scaling

Fan-out on write works well up to ~1,000 followers per user. For accounts with large followings:

```typescript
// In feedService.emitEvent():
const followerCount = await getFollowerCount(userId)

if (followerCount > 1000) {
  // Fan-out on read: don't pre-populate feed_items
  // Instead, mark event as "celebrity" and query on read
  await markAsCelebrityEvent(eventId)
} else {
  // Standard fan-out on write
  await fanOutToFollowers(eventId, followerIds)
}
```

### Index Strategy

Critical indexes already defined in schema. Additional indexes to add as traffic grows:

```sql
-- For "films watched by people I follow" queries
CREATE INDEX idx_watched_tmdb ON public.watched(tmdb_id);

-- For movie stats recalculation
CREATE INDEX idx_ratings_tmdb ON public.ratings(tmdb_id);
CREATE INDEX idx_reviews_tmdb_created ON public.reviews(tmdb_id, created_at DESC);

-- For profile search
CREATE INDEX idx_profiles_username ON public.profiles USING gin(username gin_trgm_ops);
CREATE INDEX idx_profiles_display_name ON public.profiles USING gin(display_name gin_trgm_ops);
-- Requires: CREATE EXTENSION pg_trgm;
```

### Caching Layer (Future)

When Supabase DB becomes a bottleneck:
1. Add Upstash Redis (free tier: 10,000 requests/day) for hot data
2. Cache: user profiles, movie stats, trending lists
3. Invalidate on write via Edge Function

---

## 17. Free-Tier Optimization

### Supabase Free Tier Limits

| Resource | Free Limit | Optimization |
|---|---|---|
| Database | 500MB | Store only user data; no TMDB catalog duplication |
| Bandwidth | 5GB/month | Use TMDB CDN for images; never proxy images through Supabase |
| Storage | 1GB | WebP compression; avatars max 400×400px |
| Edge Functions | 500K invocations/month | Cache TMDB responses; batch notifications |
| Realtime | 200 concurrent connections | Disconnect when tab is hidden |
| Auth | 50K MAU | Generous for launch phase |

### Storage Budget Calculation

```
Avatars:     10,000 users × 50KB avg = 500MB
Cards:       1,000 cards × 200KB avg = 200MB
Lists covers: 500 × 100KB avg       = 50MB
Total:                               ≈ 750MB  ← within 1GB free
```

### Bandwidth Budget Calculation

```
TMDB images:  Served directly from TMDB CDN — 0 Supabase bandwidth
Avatar reads: 10,000 users × 50KB × 10 views/day = 5GB/month  ← borderline
→ Mitigation: Set long Cache-Control headers on avatar bucket (max-age=86400)
→ Mitigation: Use Cloudflare free tier in front of Supabase Storage URLs
```

### Edge Function Invocation Budget

```
TMDB proxy:    1,000 users × 20 requests/day × 30 days = 600K  ← over limit
→ Mitigation: Cache TMDB responses in movies table (7-day TTL)
→ With 80% cache hit rate: 120K invocations/month  ← well within limit

Feed fan-out:  1,000 users × 5 events/day × 30 days = 150K
Notifications: 1,000 users × 3 notifs/day × 30 days = 90K
Total:         ~360K/month  ← within 500K free limit
```

### Cost at Scale (Supabase Pro: $25/month)

| Resource | Pro Limit | Notes |
|---|---|---|
| Database | 8GB | Sufficient for 100K users |
| Bandwidth | 250GB | Covers heavy usage |
| Storage | 100GB | Covers 1M+ avatars |
| Edge Functions | 2M invocations | Covers 10K active users |

**Total infrastructure cost at 10,000 users: $25/month** (Supabase Pro only).

---

## 18. Production Deployment Architecture

### Frontend (Existing)

```
GitHub main branch
  │
  ▼ (GitHub Actions CI)
npm run lint + npm run build
  │
  ▼ (Vercel auto-deploy)
Vercel CDN
  ├── Static assets (JS, CSS, images) — edge-cached globally
  ├── SPA rewrites: /* → index.html
  └── Environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### Backend (Supabase)

```
GitHub main branch
  │
  ▼ (GitHub Actions CI)
supabase db push (run migrations)
supabase functions deploy (deploy Edge Functions)
  │
  ▼
Supabase Platform
  ├── PostgreSQL (managed, auto-backups on Pro)
  ├── Edge Functions (Deno, globally distributed)
  ├── Storage (S3-compatible, CDN-backed)
  └── Realtime (WebSocket, auto-scaled)
```

### Environment Variables

```bash
# Frontend (.env.production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...          # safe to expose — RLS enforces security
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3  # still used for non-proxied calls

# Backend (Supabase Edge Function secrets — set via CLI)
TMDB_API_KEY=...                        # never in frontend
OPENAI_API_KEY=...                      # never in frontend
SUPABASE_SERVICE_ROLE_KEY=...           # never in frontend
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      # Vercel deploys automatically on push to main

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db push --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
      - run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
```

### Environments

| Environment | Frontend | Backend | Purpose |
|---|---|---|---|
| Local | `localhost:5173` | `supabase start` (Docker) | Development |
| Preview | Vercel preview URL | Supabase staging project | PR review |
| Production | `cinemascope.app` | Supabase production project | Live |

---
