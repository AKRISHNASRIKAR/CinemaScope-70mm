import { fetcher } from "@/lib/api/fetcher";

export const swrConfig = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 2,
  dedupingInterval: 30_000,
};
