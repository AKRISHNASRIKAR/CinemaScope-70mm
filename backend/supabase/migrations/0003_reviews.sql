-- reviews table
-- User-authored film reviews (rating 1-10 + optional text).
-- UNIQUE(user_id, tmdb_id) enforces one review per user per film (upsert pattern).

CREATE TABLE IF NOT EXISTS public.reviews (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id     integer     NOT NULL,
  title       text        NOT NULL,
  rating      smallint    NOT NULL CHECK (rating BETWEEN 1 AND 10),
  body        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_user_film_unique UNIQUE (user_id, tmdb_id)
);

-- Read patterns: all reviews for a film (public), all reviews by a user (profile)
CREATE INDEX IF NOT EXISTS idx_reviews_tmdb_id
  ON public.reviews (tmdb_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id
  ON public.reviews (user_id, created_at DESC);
