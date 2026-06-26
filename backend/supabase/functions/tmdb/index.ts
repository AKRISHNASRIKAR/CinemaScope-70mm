// Edge Function: tmdb
// TMDB API proxy with server-side PostgreSQL caching.
//
// All TMDB calls from the frontend go through this function so that:
//   1. The TMDB API key never leaves the server.
//   2. Responses are cached server-side to reduce latency and protect rate limits.
//   3. Stale cache is served as a fallback during TMDB outages.
//
// URL pattern: /functions/v1/tmdb/<tmdb-path>?<tmdb-query-params>
// Example:     /functions/v1/tmdb/movie/550
//              /functions/v1/tmdb/search/movie?query=inception&page=1
//
// Auth: optional. Unauthenticated requests can use the proxy (public pages).
// Cache writes always use the service_role key (adminClient).
//
// Response headers added:
//   X-Cache: HIT | MISS | STALE
//   X-Cache-Age: <seconds since fetched_at>   (HIT/STALE only)

import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { createLogger } from '../_shared/logger.ts';
import { adminClient } from '../_shared/db.ts';

const logger = createLogger('tmdb');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY') ?? '';

// Endpoint TTL map — ordered from most-specific to least-specific patterns.
// The first matching pattern wins.
const TTL_MAP: ReadonlyArray<[RegExp, number]> = [
  [/^\/movie\/\d+\/credits$/, 7 * 86_400],
  [/^\/movie\/\d+\/release_dates$/, 7 * 86_400],
  [/^\/person\/\d+\/movie_credits$/, 7 * 86_400],
  [/^\/person\/\d+$/, 7 * 86_400],
  [/^\/movie\/\d+$/, 7 * 86_400],
  [/^\/movie\/\d+\/watch\/providers$/, 6 * 3_600],
  [/^\/movie\/\d+\/similar$/, 86_400],
  [/^\/movie\/\d+\/videos$/, 86_400],
  [/^\/movie\/top_rated$/, 12 * 3_600],
  [/^\/movie\/upcoming$/, 6 * 3_600],
  [/^\/movie\/now_playing$/, 2 * 3_600],
  [/^\/movie\/popular$/, 3_600],
  [/^\/discover\/movie$/, 3 * 3_600],
  [/^\/search\/movie$/, 1_800],
];

function getTtlSeconds(path: string): number {
  for (const [pattern, ttl] of TTL_MAP) {
    if (pattern.test(path)) return ttl;
  }
  return 3_600; // default 1 hour for unrecognised endpoints
}

// Strips server-only params and sorts the rest for a stable, reproducible key.
function buildCacheKey(path: string, params: URLSearchParams): string {
  const copy = new URLSearchParams(params);
  copy.delete('api_key');
  copy.delete('language');
  const sorted = [...copy.entries()].sort(([a], [b]) => a.localeCompare(b));
  const qs = new URLSearchParams(sorted).toString();
  return qs ? `${path}?${qs}` : path;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  const preflight = handleCors(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const requestId = req.headers.get('X-Request-ID') ?? crypto.randomUUID();

  // Strip the Supabase function routing prefix to get the raw TMDB path
  const tmdbPath = url.pathname.replace(/^\/functions\/v1\/tmdb/, '') || '/';
  const params = new URLSearchParams(url.search);
  const cacheKey = buildCacheKey(tmdbPath, params);
  const ttlSeconds = getTtlSeconds(tmdbPath);

  logger.info('request', { path: tmdbPath, cache_key: cacheKey, request_id: requestId });

  // ── TODO: Business logic (implement in a later sprint) ──────────────────
  //
  // 1. SELECT payload, fetched_at, expires_at FROM tmdb_cache WHERE cache_key = $1
  // 2. If row exists AND expires_at > now(): return payload (X-Cache: HIT)
  // 3. If TMDB_API_KEY is missing: return 503
  // 4. Build TMDB URL: TMDB_BASE + tmdbPath + params + api_key + language=en-US
  // 5. Fetch from TMDB; on non-200: check for stale row → return STALE or 503
  // 6. INSERT/UPDATE tmdb_cache row with new payload and computed expires_at
  // 7. Return payload (X-Cache: MISS)
  //
  // ────────────────────────────────────────────────────────────────────────

  return new Response(
    JSON.stringify({ scaffold: true, path: tmdbPath, cache_key: cacheKey, ttl_seconds: ttlSeconds }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Request-ID': requestId,
      },
    },
  );
});
