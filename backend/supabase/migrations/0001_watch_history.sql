-- watch_history table
-- Tracks films each user has watched. UNIQUE(user_id, tmdb_id) enforces one
-- record per film per user; re-watching updates watched_at via upsert.

CREATE TABLE IF NOT EXISTS public.watch_history (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id     integer     NOT NULL,
  title       text        NOT NULL,
  poster_path text,
  watched_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT watch_history_user_film_unique UNIQUE (user_id, tmdb_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_history_user_watched
  ON public.watch_history (user_id, watched_at DESC);
