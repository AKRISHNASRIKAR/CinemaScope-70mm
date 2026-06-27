// Hook for managing a user's watchlist via the Supabase Edge Function.
// Provides add, remove, list, and isInWatchlist utility.

import useSWR, { mutate as globalMutate } from "swr";
import { supabase, FUNCTIONS_URL } from "@/lib/supabase";

const CACHE_KEY = "/watchlist";

async function apiFetch(path, options = {}) {
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

export function useWatchlist() {
  const { data, error, isLoading } = useSWR(CACHE_KEY, () => apiFetch("/watchlist"), {
    revalidateOnFocus: false,
  });

  const items = data?.data ?? [];

  const addToWatchlist = async ({ tmdb_id, title, poster_path = null }) => {
    await apiFetch("/watchlist", {
      method: "POST",
      body: JSON.stringify({ tmdb_id, title, poster_path }),
    });
    globalMutate(CACHE_KEY);
  };

  const removeFromWatchlist = async (tmdbId) => {
    await apiFetch(`/watchlist/${tmdbId}`, { method: "DELETE" });
    globalMutate(CACHE_KEY);
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
