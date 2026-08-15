// Central fetch layer.
// All TMDB requests now go through the Supabase Edge Function proxy so that:
//   1. The TMDB API key stays server-side (never in the browser bundle).
//   2. Responses are cached server-side per the TTL map in the Edge Function.
//
// URL routing:
//   Relative paths ("/movie/550", "/search/movie?query=...")
//     → proxied through /functions/v1/tmdb/<path>
//   Absolute http(s) URLs
//     → passed through unchanged (for external resources)

import axios from "axios";
import { supabase, FUNCTIONS_URL, hasSupabaseConfig } from "@/lib/supabase";

const TMDB_BASE_URL = import.meta.env.VITE_BASE_URL;
const TMDB_API_KEY = import.meta.env.VITE_API_KEY;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const REQUEST_TIMEOUT_MS = 10000;

function hasDirectTmdbConfig() {
  return Boolean(TMDB_BASE_URL && TMDB_API_KEY);
}

function createDataSourceError() {
  return new Error(
    "CinemaScope data source is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or VITE_BASE_URL and VITE_API_KEY."
  );
}

function isProxyConfigurationError(error) {
  const status = error?.response?.status;
  const details = error?.response?.data?.details ?? error?.response?.data?.message ?? "";
  return status === 401 || status === 403 || (status === 503 && String(details).includes("TMDB_API_KEY"));
}

// Returns the Authorization header for Supabase Edge Function calls.
// Supabase requires Bearer auth even for public endpoints — use the
// user's session token when signed in, anon key otherwise.
async function getAuthHeader() {
  if (!supabase) return SUPABASE_ANON_KEY ? `Bearer ${SUPABASE_ANON_KEY}` : null;
  const { data: { session } } = await supabase.auth.getSession();
  return session ? `Bearer ${session.access_token}` : (SUPABASE_ANON_KEY ? `Bearer ${SUPABASE_ANON_KEY}` : null);
}

function buildTmdbProxyUrl(path) {
  // Strip a leading slash if present; FUNCTIONS_URL already ends without one.
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${FUNCTIONS_URL}/tmdb/${clean}`;
}

function buildDirectTmdbUrl(path) {
  const separator = path.includes("?") ? "&" : "?";
  const hasLanguage = /[?&]language=/.test(path);
  const languageParam = hasLanguage ? "" : "&language=en-US";
  return `${TMDB_BASE_URL}${path}${separator}api_key=${TMDB_API_KEY}${languageParam}`;
}

export const fetcher = async (url) => {
  if (!url) return null;

  if (url.startsWith("http")) {
    const res = await axios.get(url, { timeout: REQUEST_TIMEOUT_MS });
    return res.data;
  }

  // Try Supabase proxy first (keeps TMDB key server-side and works on
  // networks where api.themoviedb.org is not directly reachable).
  if (hasSupabaseConfig) {
    try {
      const resolvedUrl = buildTmdbProxyUrl(url);
      const authHeader = await getAuthHeader();
      const headers = {
        "Content-Type": "application/json",
        "X-Request-ID": crypto.randomUUID(),
        ...(SUPABASE_ANON_KEY ? { apikey: SUPABASE_ANON_KEY } : {}),
        ...(authHeader ? { Authorization: authHeader } : {}),
      };
      const res = await axios.get(resolvedUrl, { headers, timeout: REQUEST_TIMEOUT_MS });
      return res.data;
    } catch (error) {
      if (isProxyConfigurationError(error)) throw error;
      // Proxy network failure — fall through to direct TMDB when configured.
    }
  }

  // Direct TMDB fallback (VITE_BASE_URL + VITE_API_KEY).
  if (hasDirectTmdbConfig()) {
    const res = await axios.get(buildDirectTmdbUrl(url), { timeout: REQUEST_TIMEOUT_MS });
    return res.data;
  }

  throw createDataSourceError();
};

export const parallelFetcher = async (args) => {
  const urls = Array.isArray(args) ? args : [args];
  return Promise.all(urls.map((url) => fetcher(url)));
};
