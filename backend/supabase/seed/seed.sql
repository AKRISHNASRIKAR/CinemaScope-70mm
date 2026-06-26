-- Development seed data
-- Applied by `npx supabase db reset` when db.seed.enabled = true in config.toml

-- Note: auth.users rows cannot be seeded directly via SQL in Supabase local dev.
-- Create test users through the Supabase Studio UI at http://127.0.0.1:54323
-- or via the auth API. The handle_new_user trigger will auto-create profile rows.

-- Seed tmdb_cache with a handful of popular films so the app works immediately
-- after a db reset without hitting the TMDB API. Values are illustrative.
INSERT INTO public.tmdb_cache (cache_key, endpoint, payload, expires_at)
VALUES
  (
    '/movie/popular',
    '/movie/popular',
    '{"page":1,"results":[],"total_pages":1,"total_results":0}'::jsonb,
    now() + INTERVAL '1 hour'
  )
ON CONFLICT (cache_key) DO NOTHING;
