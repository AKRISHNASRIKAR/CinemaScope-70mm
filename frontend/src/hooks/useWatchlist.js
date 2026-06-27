// Hook for managing a user's watchlist via the Supabase Edge Function.
// Provides add, remove, list, and isInWatchlist utility.

import useSWR, { mutate as globalMutate } from "swr";
import { supabase, FUNCTIONS_URL } from "@/lib/supabase";

const CACHE_KEY = "/watchlist";

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

export function useWatchlist({ enabled = true } = {}) {
  const shouldFetch = enabled && supabase;
  const { data, error, isLoading } = useSWR(shouldFetch ? CACHE_KEY : null, () => apiFetch("/watchlist"), {
    revalidateOnFocus: false,
  });

  const items = data?.data ?? [];

  const addToWatchlist = async ({ tmdb_id, title, poster_path = null }) => {
    const optimisticItem = {
      tmdb_id,
      title,
      poster_path,
      added_at: new Date().toISOString(),
    };

    await globalMutate(
      CACHE_KEY,
      apiFetch("/watchlist", {
        method: "POST",
        body: JSON.stringify({ tmdb_id, title, poster_path }),
      }),
      {
        optimisticData: (current) => ({
          ...(current ?? {}),
          data: [
            optimisticItem,
            ...((current?.data ?? []).filter((item) => item.tmdb_id !== tmdb_id)),
          ],
        }),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      }
    );
  };

  const removeFromWatchlist = async (tmdbId) => {
    await globalMutate(
      CACHE_KEY,
      apiFetch(`/watchlist/${tmdbId}`, { method: "DELETE" }),
      {
        optimisticData: (current) => ({
          ...(current ?? {}),
          data: (current?.data ?? []).filter((item) => item.tmdb_id !== tmdbId),
        }),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      }
    );
  };

  const isInWatchlist = (tmdbId) => items.some((item) => item.tmdb_id === tmdbId);

  return {
    watchlist: items,
    isLoading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  };
}
