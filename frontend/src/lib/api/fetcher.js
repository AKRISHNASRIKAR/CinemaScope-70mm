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

function hasDirectTmdbConfig() {
  return Boolean(TMDB_BASE_URL && TMDB_API_KEY);
}

// Returns the Authorization header value for the current session, or null.
async function getAuthHeader() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session ? `Bearer ${session.access_token}` : null;
}

function buildTmdbProxyUrl(path) {
  // Strip a leading slash if present; FUNCTIONS_URL already ends without one.
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${FUNCTIONS_URL}/tmdb/${clean}`;
}

function buildDirectTmdbUrl(path) {
  if (!hasDirectTmdbConfig()) {
    throw new Error(
      "Missing data configuration. Set VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY or VITE_BASE_URL/VITE_API_KEY.",
    );
  }

  const separator = path.includes("?") ? "&" : "?";
  const hasLanguage = /[?&]language=/.test(path);
  const languageParam = hasLanguage ? "" : "&language=en-US";

  return `${TMDB_BASE_URL}${path}${separator}api_key=${TMDB_API_KEY}${languageParam}`;
}

export const fetcher = async (url) => {
  if (!url) return null;

  if (url.startsWith("http")) {
    const res = await axios.get(url);
    return res.data;
  }

  const useSupabaseProxy = hasSupabaseConfig;
  const resolvedUrl = useSupabaseProxy ? buildTmdbProxyUrl(url) : buildDirectTmdbUrl(url);

  const authHeader = await getAuthHeader();
  const headers = useSupabaseProxy
    ? {
        "Content-Type": "application/json",
        "X-Request-ID": crypto.randomUUID(),
        ...(authHeader ? { Authorization: authHeader } : {}),
      }
    : undefined;

  const res = await axios.get(resolvedUrl, { headers });
  return res.data;
};

export const parallelFetcher = async (args) => {
  const urls = Array.isArray(args) ? args : [args];
  return Promise.all(urls.map((url) => fetcher(url)));
};
