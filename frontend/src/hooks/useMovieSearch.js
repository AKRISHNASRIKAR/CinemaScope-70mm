import useSWR from "swr";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetcher } from "@/lib/api/fetcher";

export function useMovieSearch(query, { limit = 6, delay = 350 } = {}) {
  const debouncedQuery = useDebouncedValue(query.trim(), delay);
  const key = debouncedQuery
    ? `/search/movie?query=${encodeURIComponent(debouncedQuery)}&page=1`
    : null;

  const { data, error, isLoading } = useSWR(key, fetcher, {
    keepPreviousData: true,
    suspense: false,
  });

  return {
    query: debouncedQuery,
    results: (data?.results || []).slice(0, limit),
    isLoading,
    error,
  };
}
