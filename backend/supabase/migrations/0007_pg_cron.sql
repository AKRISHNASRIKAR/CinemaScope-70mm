-- pg_cron scheduled jobs.
-- Requires the pg_cron extension to be enabled in Supabase project settings.
-- Supabase free tier supports pg_cron.

-- Purge expired tmdb_cache rows nightly at 3 AM UTC.
-- The 1-hour grace period prevents a race where the cache is deleted
-- while an Edge Function is mid-request using the entry.
SELECT cron.schedule(
  'purge-tmdb-cache',
  '0 3 * * *',
  $$ DELETE FROM public.tmdb_cache WHERE expires_at < now() - INTERVAL '1 hour' $$
);
