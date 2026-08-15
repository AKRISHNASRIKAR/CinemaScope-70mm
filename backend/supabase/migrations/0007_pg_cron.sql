-- pg_cron scheduled jobs.
-- Supabase free tier supports pg_cron.
--
-- The extension is created here rather than left to a manual toggle in the
-- dashboard: without it this migration fails with
--   ERROR: schema "cron" does not exist (SQLSTATE 3F000)
-- on any fresh project, which makes the migration set non-reproducible.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;

-- Purge expired tmdb_cache rows nightly at 3 AM UTC.
-- The 1-hour grace period prevents a race where the cache is deleted
-- while an Edge Function is mid-request using the entry.
-- cron.schedule upserts by job name, so re-running is safe.
SELECT cron.schedule(
  'purge-tmdb-cache',
  '0 3 * * *',
  $$ DELETE FROM public.tmdb_cache WHERE expires_at < now() - INTERVAL '1 hour' $$
);
