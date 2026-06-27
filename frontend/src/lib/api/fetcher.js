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
import { supabase, FUNCTIONS_URL } from "@/lib/supabase";

// Returns the Authorization header value for the current session, or null.
async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? `Bearer ${session.access_token}` : null;
}

function buildTmdbProxyUrl(path) {
  // Strip a leading slash if present; FUNCTIONS_URL already ends without one.
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${FUNCTIONS_URL}/tmdb/${clean}`;
}

export const fetcher = async (url) => {
  if (!url) return null;

  const resolvedUrl = url.startsWith("http") ? url : buildTmdbProxyUrl(url);

  const authHeader = await getAuthHeader();
  const headers = {
    "Content-Type": "application/json",
    "X-Request-ID": crypto.randomUUID(),
    ...(authHeader ? { Authorization: authHeader } : {}),
  };

  const res = await axios.get(resolvedUrl, { headers });
  return res.data;
};

export const parallelFetcher = async (args) => {
  const urls = Array.isArray(args) ? args : [args];
  return Promise.all(urls.map((url) => fetcher(url)));
};
