-- tmdb_cache table
-- Server-side cache for TMDB API responses. The Edge Function proxy checks
-- this table before hitting the TMDB API; writes use the service role key.
-- cache_key is a hash of endpoint path + sorted query params (api_key stripped).
-- Expired rows are purged nightly by the pg_cron job in migration 0007.

CREATE TABLE IF NOT EXISTS public.tmdb_cache (
  cache_key   text        PRIMARY KEY,
  endpoint    text        NOT NULL,
  payload     jsonb       NOT NULL,
  fetched_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  hit_count   integer     NOT NULL DEFAULT 0
);

-- Used by pg_cron purge job to find expired rows efficiently
CREATE INDEX IF NOT EXISTS idx_tmdb_cache_expires
  ON public.tmdb_cache (expires_at);
