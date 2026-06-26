// Edge Function: watch-history
// Manages the current user's film watch log.
//
// Routes:
//   GET    /functions/v1/watch-history              → paginated list (newest first)
//   POST   /functions/v1/watch-history              → upsert a film as watched
//   DELETE /functions/v1/watch-history/:tmdbId      → remove a record
//
// Auth: required for all routes.
// UNIQUE(user_id, tmdb_id) means POST is idempotent — re-watching a film
// updates watched_at rather than creating a duplicate row.

import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { createLogger } from '../_shared/logger.ts';
import { requireAuth } from '../_shared/auth.ts';
import { parseBody, parseQueryParams, z, PaginationSchema, TmdbIdSchema } from '../_shared/validation.ts';

const logger = createLogger('watch-history');

const WatchHistoryInsertSchema = z.object({
  tmdb_id: TmdbIdSchema,
  title: z.string().min(1).max(500),
  poster_path: z.string().nullable().optional(),
});

Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  const preflight = handleCors(req);
  if (preflight) return preflight;

  const requestId = req.headers.get('X-Request-ID') ?? crypto.randomUUID();

  let user: { id: string; email: string | undefined };
  try {
    user = await requireAuth(req);
  } catch {
    return Errors.unauthorized(corsHeaders);
  }

  const url = new URL(req.url);

  logger.info('request', { method: req.method, user_id: user.id, request_id: requestId });

  if (req.method === 'GET') {
    const { data: pagination, error } = parseQueryParams(url, PaginationSchema);
    if (error) return Errors.validation(corsHeaders, error.format());

    // ── TODO: Business logic ────────────────────────────────────────────────
    //
    // SELECT * FROM watch_history
    //   WHERE user_id = user.id
    //   ORDER BY watched_at DESC
    //   LIMIT pagination.limit OFFSET (pagination.page - 1) * pagination.limit
    //
    // ────────────────────────────────────────────────────────────────────────
    return new Response(JSON.stringify({ scaffold: true, user_id: user.id, pagination }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    const { data, error } = await parseBody(req, WatchHistoryInsertSchema);
    if (error) return Errors.validation(corsHeaders, error.format());

    // ── TODO: Business logic ────────────────────────────────────────────────
    //
    // INSERT INTO watch_history (user_id, tmdb_id, title, poster_path, watched_at)
    //   VALUES (user.id, data.tmdb_id, data.title, data.poster_path, now())
    //   ON CONFLICT (user_id, tmdb_id) DO UPDATE SET watched_at = now()
    //   RETURNING *
    //
    // ────────────────────────────────────────────────────────────────────────
    return new Response(JSON.stringify({ scaffold: true, user_id: user.id, data }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'DELETE') {
    // tmdbId is the last path segment: /watch-history/550
    const tmdbId = TmdbIdSchema.safeParse(
      url.pathname.split('/').at(-1),
    );
    if (!tmdbId.success) return Errors.validation(corsHeaders, tmdbId.error.format());

    // ── TODO: Business logic ────────────────────────────────────────────────
    //
    // DELETE FROM watch_history WHERE user_id = user.id AND tmdb_id = tmdbId.data
    // Return 204 on success, 404 if no row was deleted.
    //
    // ────────────────────────────────────────────────────────────────────────
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return Errors.methodNotAllowed(corsHeaders);
});
