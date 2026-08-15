-- Row Level Security policies for all user-owned tables.
-- Authorization is enforced at the DB layer regardless of how the request
-- arrives (PostgREST, Edge Function, or direct connection).
-- auth.uid() is a Supabase-provided function that extracts the user ID from
-- the verified JWT — it cannot be spoofed via query parameters.

-- ── Enable RLS ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tmdb_cache   ENABLE ROW LEVEL SECURITY;


-- ── profiles ─────────────────────────────────────────────────────────────
-- Any authenticated user can read any profile (needed for review attribution).
CREATE POLICY profiles_select_authenticated
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile row.
CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT is handled exclusively by the handle_new_user trigger (migration 0006)
-- running as SECURITY DEFINER. No INSERT policy for the authenticated role
-- prevents a client from creating a profile row for a different user's ID.


-- ── watch_history ─────────────────────────────────────────────────────────
-- Users can only read, write, and delete their own rows.
CREATE POLICY watch_history_own
  ON public.watch_history FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ── watchlist ─────────────────────────────────────────────────────────────
CREATE POLICY watchlist_own
  ON public.watchlist FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ── reviews ───────────────────────────────────────────────────────────────
-- Reviews are publicly readable (drives social discovery).
CREATE POLICY reviews_select_authenticated
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

-- Write operations are restricted to the review owner.
CREATE POLICY reviews_insert_own
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY reviews_update_own
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY reviews_delete_own
  ON public.reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ── tmdb_cache ────────────────────────────────────────────────────────────
-- Authenticated users can read cached payloads (returned by the Edge Function).
-- Writes always use the service_role key inside the Edge Function — no
-- INSERT/UPDATE/DELETE policy for the authenticated role.
CREATE POLICY tmdb_cache_select_authenticated
  ON public.tmdb_cache FOR SELECT
  TO authenticated
  USING (true);
