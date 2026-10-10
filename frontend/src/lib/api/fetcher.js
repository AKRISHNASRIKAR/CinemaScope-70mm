// Central fetch layer.
// All TMDB requests go through the Cloudflare Pages Function at /api/tmdb
// (functions/api/tmdb/[[path]].js) so that:
//   1. The TMDB API key stays server-side (never in the browser bundle).
//   2. Responses are cached at the edge per the TTL map in the function.
//
// URL routing:
//   Relative paths ("/movie/550", "/search/movie?query=...")
//     → proxied through /api/tmdb/<path> (same origin — no CORS, no auth header)
//   Absolute http(s) URLs
//     → passed through unchanged (for external resources)
//
// In `vite dev` the same /api/tmdb path is served by the dev-server proxy in
// vite.config.js, so no Cloudflare tooling is needed locally.

import axios from "axios";

// Override only when the frontend is hosted apart from the proxy.
const TMDB_PROXY_URL = (import.meta.env.VITE_TMDB_PROXY_URL || "/api/tmdb").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 10000;

export const fetcher = async (url) => {
  if (!url) return null;

  const resolvedUrl = url.startsWith("http") ? url : `${TMDB_PROXY_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  const res = await axios.get(resolvedUrl, { timeout: REQUEST_TIMEOUT_MS });
  return res.data;
};

export const parallelFetcher = async (args) => {
  const urls = Array.isArray(args) ? args : [args];
  return Promise.all(urls.map((url) => fetcher(url)));
};
