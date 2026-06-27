// Edge Function: watchlist
// Manages the current user's want-to-watch list.
//
// Routes:
//   GET    /functions/v1/watchlist            → full list, newest-added first
//   POST   /functions/v1/watchlist            → add a film (idempotent upsert)
//   DELETE /functions/v1/watchlist/:tmdbId    → remove a film
//
// Auth: required for all routes.
// POST is safe to call multiple times (UNIQUE constraint + ON CONFLICT DO NOTHING).

import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { createLogger } from '../_shared/logger.ts';
import { requireAuth, extractBearerToken } from '../_shared/auth.ts';
import { userClient } from '../_shared/db.ts';
import { parseBody, z, TmdbIdSchema } from '../_shared/validation.ts';

const logger = createLogger('watchlist');

const WatchlistInsertSchema = z.object({
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

  // ── GET: full watchlist ────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data: rows, error: dbError } = await client
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (dbError) {
      logger.error('db_error', { user_id: user.id, error: String(dbError) });
      return Errors.internal(corsHeaders);
    }

    return new Response(JSON.stringify({ data: rows ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId },
    });
  }

  // ── POST: add a film (idempotent) ─────────────────────────────────────────
  if (req.method === 'POST') {
    const { data, error } = await parseBody(req, WatchlistInsertSchema);
    if (error) return Errors.validation(corsHeaders, error.format());

    // ON CONFLICT DO NOTHING — safe to call repeatedly; no duplicate rows created
    const { data: row, error: dbError } = await client
      .from('watchlist')
      .upsert(
        {
          user_id: user.id,
          tmdb_id: data.tmdb_id,
          title: data.title,
          poster_path: data.poster_path ?? null,
          added_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,tmdb_id', ignoreDuplicates: true },
      )
      .select()
      .maybeSingle();

    if (dbError) {
      logger.error('db_error', { user_id: user.id, error: String(dbError) });
      return Errors.internal(corsHeaders);
    }

    logger.info('added', { user_id: user.id, tmdb_id: data.tmdb_id });

    // row is null when the film was already in the list (DO NOTHING path)
    return new Response(JSON.stringify(row ?? { already_exists: true, tmdb_id: data.tmdb_id }), {
      status: row ? 201 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId },
    });
  }

  // ── DELETE: remove a film ─────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const tmdbId = TmdbIdSchema.safeParse(url.pathname.split('/').at(-1));
    if (!tmdbId.success) return Errors.validation(corsHeaders, tmdbId.error.format());

    const { data: deleted, error: dbError } = await client
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('tmdb_id', tmdbId.data)
      .select();

    if (dbError) {
      logger.error('db_error', { user_id: user.id, error: String(dbError) });
      return Errors.internal(corsHeaders);
    }

    if (!deleted || deleted.length === 0) {
      return Errors.notFound(corsHeaders, 'Watchlist item');
    }

    logger.info('removed', { user_id: user.id, tmdb_id: tmdbId.data });

    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return Errors.methodNotAllowed(corsHeaders);
});
