// Hook for managing a user's watch history via the Supabase Edge Function.
// Provides add, remove, and list operations with SWR for live state.

import useSWR, { mutate as globalMutate } from "swr";
import { supabase, FUNCTIONS_URL } from "@/lib/supabase";

const CACHE_KEY = "/watch-history";

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

async function fetchHistory({ page = 1, limit = 20 } = {}) {
  return apiFetch(`/watch-history?page=${page}&limit=${limit}`);
}

export function useWatchHistory({ page = 1, limit = 20, enabled = true } = {}) {
  const key = `${CACHE_KEY}?page=${page}&limit=${limit}`;
  const shouldFetch = enabled && supabase;
  const { data, error, isLoading } = useSWR(shouldFetch ? key : null, () => fetchHistory({ page, limit }), {
    revalidateOnFocus: false,
  });

  const logWatch = async ({ tmdb_id, title, poster_path = null }) => {
    const optimisticItem = {
      tmdb_id,
      title,
      poster_path,
      watched_at: new Date().toISOString(),
    };

    await globalMutate(
      key,
      apiFetch("/watch-history", {
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
          pagination: current?.pagination ?? null,
        }),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      }
    );
  };

  const removeWatch = async (tmdbId) => {
    await globalMutate(
      key,
      apiFetch(`/watch-history/${tmdbId}`, { method: "DELETE" }),
      {
        optimisticData: (current) => ({
          ...(current ?? {}),
          data: (current?.data ?? []).filter((item) => item.tmdb_id !== tmdbId),
          pagination: current?.pagination ?? null,
        }),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      }
    );
  };

  return {
    history: data?.data ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    error,
    logWatch,
    removeWatch,
  };
}
