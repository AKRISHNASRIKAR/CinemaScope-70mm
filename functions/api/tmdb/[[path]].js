// Cloudflare Pages Function: TMDB proxy with edge caching.
//
// Runs as a Worker on the same origin as the frontend, so:
//   1. The TMDB API key never leaves the server (Pages secret TMDB_API_KEY).
//   2. Responses are cached at the edge (Cache API) per the TTL map below.
//   3. A stale copy is served as a fallback during TMDB outages.
//   4. No CORS: the browser calls /api/tmdb/... on its own origin.
//
// URL pattern: /api/tmdb/<tmdb-path>?<tmdb-query-params>
// Example:     /api/tmdb/movie/550
//              /api/tmdb/search/movie?query=inception&page=1
//
// Response headers added:
//   X-Cache: HIT | MISS | STALE
//   X-Cache-Age: <seconds since the copy was fetched>   (HIT/STALE only)

const TMDB_BASE = "https://api.themoviedb.org/3";

// Only the TMDB resources the app uses — this is not an open TMDB proxy.
const ALLOWED_PATH = /^\/(movie|person|search|discover|trending|genre)(\/[\w-]+)*$/;

// Endpoint TTL map (seconds) — most-specific patterns first; first match wins.
const TTL_MAP = [
  [/^\/movie\/\d+\/credits$/, 7 * 86_400],
  [/^\/movie\/\d+\/release_dates$/, 7 * 86_400],
  [/^\/movie\/\d+\/images$/, 7 * 86_400],
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
const DEFAULT_TTL = 3_600;

// Entries stay in the edge cache this long past their TTL so an expired copy
// can still be served if TMDB is down.
const STALE_WINDOW = 7 * 86_400;

// How long the browser may reuse a response without asking the edge again.
const BROWSER_MAX_AGE = 60;

const FETCHED_AT = "X-Fetched-At";

const ttlFor = (path) => TTL_MAP.find(([pattern]) => pattern.test(path))?.[1] ?? DEFAULT_TTL;

const errorResponse = (status, error, message) =>
  new Response(JSON.stringify({ error, message }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

// Drops server-only params and sorts the rest so equivalent requests share
// one cache entry.
function normalizedQuery(searchParams) {
  const query = new URLSearchParams(searchParams);
  query.delete("api_key"); // never forward a client-supplied key
  if (!query.has("language")) query.set("language", "en-US");
  query.sort();
  return query;
}

const clientResponse = (body, cacheStatus, ageSeconds) =>
  new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${BROWSER_MAX_AGE}`,
      "X-Cache": cacheStatus,
      ...(ageSeconds === undefined ? {} : { "X-Cache-Age": String(ageSeconds) }),
    },
  });

export async function onRequestGet({ request, env, params, waitUntil }) {
  const url = new URL(request.url);
  const path = `/${[params.path].flat().filter(Boolean).join("/")}`;

  if (!ALLOWED_PATH.test(path)) return errorResponse(404, "not_found", "Unknown TMDB resource.");

  const query = normalizedQuery(url.searchParams);
  const ttl = ttlFor(path);

  // Synthetic same-origin GET used purely as the cache key.
  const cacheKey = new Request(`${url.origin}/api/tmdb${path}?${query}`);
  const cache = caches.default;

  // ── 1. Cache lookup ────────────────────────────────────────────────────────
  const cached = await cache.match(cacheKey);
  const ageSeconds = cached
    ? Math.floor((Date.now() - Number(cached.headers.get(FETCHED_AT))) / 1_000)
    : undefined;

  if (cached && ageSeconds < ttl) return clientResponse(cached.body, "HIT", ageSeconds);

  const stale = (reason, message) =>
    cached
      ? clientResponse(cached.body, "STALE", ageSeconds)
      : errorResponse(503, "upstream_unavailable", message ?? reason);

  // ── 2. Fetch from TMDB ────────────────────────────────────────────────────
  if (!env.TMDB_API_KEY) return stale("missing_key", "TMDB_API_KEY is not configured.");

  const upstreamQuery = new URLSearchParams(query);
  upstreamQuery.set("api_key", env.TMDB_API_KEY);

  let upstream;
  try {
    upstream = await fetch(`${TMDB_BASE}${path}?${upstreamQuery}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    return stale("unreachable", "TMDB upstream unreachable.");
  }

  // A real 404 (bad film id) is the client's answer, not an outage.
  if (upstream.status === 404) return errorResponse(404, "not_found", "TMDB resource not found.");
  if (!upstream.ok) return stale("non_200", `TMDB returned ${upstream.status}.`);

  // ── 3. Store + respond ────────────────────────────────────────────────────
  const body = await upstream.text();

  waitUntil(
    cache.put(
      cacheKey,
      new Response(body, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${ttl + STALE_WINDOW}`,
          [FETCHED_AT]: String(Date.now()),
        },
      }),
    ),
  );

  return clientResponse(body, "MISS");
}

export const onRequest = () => errorResponse(405, "method_not_allowed", "HTTP method not allowed.");
