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
import { requireAuth, extractBearerToken } from '../_shared/auth.ts';
import { userClient } from '../_shared/db.ts';
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

  const jwt = extractBearerToken(req)!;
  const client = userClient(jwt);
  const url = new URL(req.url);

  logger.info('request', { method: req.method, user_id: user.id, request_id: requestId });

  // ── GET: paginated watch history ──────────────────────────────────────────
  if (req.method === 'GET') {
    const { data: pagination, error } = parseQueryParams(url, PaginationSchema);
    if (error) return Errors.validation(corsHeaders, error.format());

    const from = (pagination.page - 1) * pagination.limit;
    const to = from + pagination.limit - 1;

    const { data: rows, error: dbError, count } = await client
      .from('watch_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .range(from, to);

    if (dbError) {
      logger.error('db_error', { user_id: user.id, error: String(dbError) });
      return Errors.internal(corsHeaders);
    }

    return new Response(
      JSON.stringify({
        data: rows ?? [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count ?? 0,
          pages: Math.ceil((count ?? 0) / pagination.limit),
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId } },
    );
  }

  // ── POST: upsert a film as watched ────────────────────────────────────────
  if (req.method === 'POST') {
    const { data, error } = await parseBody(req, WatchHistoryInsertSchema);
    if (error) return Errors.validation(corsHeaders, error.format());

    const { data: row, error: dbError } = await client
      .from('watch_history')
      .upsert(
        {
          user_id: user.id,
          tmdb_id: data.tmdb_id,
          title: data.title,
          poster_path: data.poster_path ?? null,
          watched_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,tmdb_id' },
      )
      .select()
      .single();

    if (dbError) {
      logger.error('db_error', { user_id: user.id, error: String(dbError) });
      return Errors.internal(corsHeaders);
    }

    logger.info('upserted', { user_id: user.id, tmdb_id: data.tmdb_id });

    return new Response(JSON.stringify(row), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId },
    });
  }

  // ── DELETE: remove a watch record ─────────────────────────────────────────
  if (req.method === 'DELETE') {
    const tmdbId = TmdbIdSchema.safeParse(url.pathname.split('/').at(-1));
    if (!tmdbId.success) return Errors.validation(corsHeaders, tmdbId.error.format());

    const { data: deleted, error: dbError } = await client
      .from('watch_history')
      .delete()
      .eq('user_id', user.id)
      .eq('tmdb_id', tmdbId.data)
      .select();

    if (dbError) {
      logger.error('db_error', { user_id: user.id, error: String(dbError) });
      return Errors.internal(corsHeaders);
    }

    if (!deleted || deleted.length === 0) {
      return Errors.notFound(corsHeaders, 'Watch history record');
    }

    logger.info('deleted', { user_id: user.id, tmdb_id: tmdbId.data });

    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return Errors.methodNotAllowed(corsHeaders);
});
