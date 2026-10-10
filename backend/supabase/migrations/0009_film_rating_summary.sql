-- film_rating_summary
-- Aggregate CinemaScope rating for one film: how many members rated it and
-- the mean rating on the stored 1-10 scale (the UI renders it as 0.5-5 stars).
--
-- Aggregating in SQL keeps the film page from downloading every review row
-- just to show an average. Served by idx_reviews_tmdb_id.
--
-- SECURITY INVOKER: runs under the caller's RLS. reviews_select_authenticated
-- already lets any signed-in user read every review, so no elevated rights
-- are needed.

CREATE OR REPLACE FUNCTION public.film_rating_summary(p_tmdb_id integer)
RETURNS TABLE (rating_count bigint, rating_average numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT count(*), round(avg(r.rating), 2)
  FROM public.reviews AS r
  WHERE r.tmdb_id = p_tmdb_id;
$$;

REVOKE ALL ON FUNCTION public.film_rating_summary(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.film_rating_summary(integer) TO authenticated;
