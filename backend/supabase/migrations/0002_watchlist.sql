-- watchlist table
-- Films a user intends to watch. UNIQUE(user_id, tmdb_id) makes add idempotent.

CREATE TABLE IF NOT EXISTS public.watchlist (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id     integer     NOT NULL,
  title       text        NOT NULL,
  poster_path text,
  added_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT watchlist_user_film_unique UNIQUE (user_id, tmdb_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_added
  ON public.watchlist (user_id, added_at DESC);
