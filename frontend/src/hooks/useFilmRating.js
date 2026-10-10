// Hook for the signed-in user's rating of one film, plus the member average,
// via the reviews Edge Function. Ratings are stored 1-10 (half-star units).

import useSWR from "swr";
import { supabase, FUNCTIONS_URL } from "@/lib/supabase";

async function apiFetch(path, options = {}) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${FUNCTIONS_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      "X-Request-ID": crypto.randomUUID(),
      ...options.headers,
    },
  });

  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }

  return res.status === 204 ? null : res.json();
}

/** Recompute count/average locally so the card updates before the refetch lands. */
const withMyRating = (current, rating) => {
  const previous = current?.mine?.rating ?? null;
  const count = current?.count ?? 0;
  const total = (current?.average ?? 0) * count - (previous ?? 0) + (rating ?? 0);
  const nextCount = count - (previous !== null ? 1 : 0) + (rating !== null ? 1 : 0);

  return {
    mine: rating !== null ? { ...(current?.mine ?? {}), rating } : null,
    count: nextCount,
    average: nextCount > 0 ? total / nextCount : null,
  };
};

export function useFilmRating(tmdbId, { enabled = true } = {}) {
  const shouldFetch = enabled && supabase && tmdbId;
  const key = shouldFetch ? `/reviews/summary?tmdb_id=${tmdbId}` : null;
  const { data, error, isLoading, mutate } = useSWR(key, apiFetch, { revalidateOnFocus: false });

  const rate = async ({ title, rating }) => {
    await mutate(
      apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({ tmdb_id: tmdbId, title, rating }),
      }),
      {
        optimisticData: (current) => withMyRating(current, rating),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      }
    );
  };

  const clearRating = async () => {
    await mutate(apiFetch(`/reviews/${tmdbId}`, { method: "DELETE" }), {
      optimisticData: (current) => withMyRating(current, null),
      rollbackOnError: true,
      populateCache: false,
      revalidate: true,
    });
  };

  return {
    rating: data?.mine?.rating ?? null,
    hasWrittenReview: Boolean(data?.mine?.body),
    average: data?.average ?? null,
    count: data?.count ?? 0,
    isLoading,
    error,
    rate,
    clearRating,
  };
}
