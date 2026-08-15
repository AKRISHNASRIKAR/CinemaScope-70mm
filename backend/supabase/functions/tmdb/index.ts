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

  // Strip the Supabase function routing prefix to get the raw TMDB path.
  // In production the Edge runtime usually exposes /tmdb/<path>; local and
  // some gateway paths can expose /functions/v1/tmdb/<path>.
  const tmdbPath = url.pathname.replace(/^\/(?:functions\/v1\/)?tmdb/, '') || '/';
  const params = new URLSearchParams(url.search);
  const cacheKey = buildCacheKey(tmdbPath, params);
  const ttlSeconds = getTtlSeconds(tmdbPath);

  logger.info('request', { path: tmdbPath, cache_key: cacheKey, request_id: requestId });

  // ── 1. Cache lookup ────────────────────────────────────────────────────────
  const { data: cached } = await adminClient
    .from('tmdb_cache')
    .select('payload, fetched_at, expires_at, hit_count')
    .eq('cache_key', cacheKey)
    .single();

  if (cached) {
    const isExpired = new Date(cached.expires_at) <= new Date();

    if (!isExpired) {
      // Cache HIT — increment hit counter asynchronously (fire-and-forget)
      adminClient
        .from('tmdb_cache')
        .update({ hit_count: (cached.hit_count ?? 0) + 1 })
        .eq('cache_key', cacheKey)
        .then(() => {});

      const ageSeconds = Math.floor(
        (Date.now() - new Date(cached.fetched_at).getTime()) / 1_000,
      );

      logger.info('cache_hit', { path: tmdbPath, age_s: ageSeconds, request_id: requestId });

      return new Response(JSON.stringify(cached.payload), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Cache-Age': String(ageSeconds),
          'X-Request-ID': requestId,
        },
      });
    }
  }

  // ── 2. Guard: TMDB key must be present ────────────────────────────────────
  if (!TMDB_API_KEY) {
    logger.error('missing_tmdb_key', { request_id: requestId });
    // Serve stale if available rather than returning an error
    if (cached) {
      logger.info('serve_stale_no_key', { path: tmdbPath, request_id: requestId });
      return new Response(JSON.stringify(cached.payload), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'STALE',
          'X-Request-ID': requestId,
        },
      });
    }
    return Errors.upstreamUnavailable(corsHeaders, 'TMDB_API_KEY not configured');
  }

  // ── 3. Fetch from TMDB ────────────────────────────────────────────────────
  const tmdbParams = new URLSearchParams(params);
  tmdbParams.delete('api_key'); // never forward a client-supplied key
  tmdbParams.set('api_key', TMDB_API_KEY);
  if (!tmdbParams.has('language')) tmdbParams.set('language', 'en-US');

  const tmdbUrl = `${TMDB_BASE}${tmdbPath}?${tmdbParams.toString()}`;

  let tmdbResponse: Response;
  try {
    tmdbResponse = await fetch(tmdbUrl);
  } catch (err) {
    logger.error('tmdb_fetch_error', { path: tmdbPath, error: String(err), request_id: requestId });
    if (cached) {
      return new Response(JSON.stringify(cached.payload), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'STALE',
          'X-Request-ID': requestId,
        },
      });
    }
    return Errors.upstreamUnavailable(corsHeaders, 'TMDB upstream unreachable');
  }

  if (!tmdbResponse.ok) {
    logger.warn('tmdb_non_200', { path: tmdbPath, status: tmdbResponse.status, request_id: requestId });
    if (cached) {
      return new Response(JSON.stringify(cached.payload), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'STALE',
          'X-Request-ID': requestId,
        },
      });
    }
    return Errors.upstreamUnavailable(corsHeaders, `TMDB returned ${tmdbResponse.status}`);
  }

  // ── 4. Parse + cache the response ─────────────────────────────────────────
  const payload = await tmdbResponse.json();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1_000);

  await adminClient.from('tmdb_cache').upsert(
    {
      cache_key: cacheKey,
      endpoint: tmdbPath,
      payload,
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      hit_count: 0,
    },
    { onConflict: 'cache_key' },
  );

  logger.info('cache_miss', { path: tmdbPath, ttl_s: ttlSeconds, request_id: requestId });

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Cache': 'MISS',
      'X-Request-ID': requestId,
    },
  });
});
