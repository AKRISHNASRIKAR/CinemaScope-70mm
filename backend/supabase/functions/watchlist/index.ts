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
import { requireAuth } from '../_shared/auth.ts';
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

  const url = new URL(req.url);

  logger.info('request', { method: req.method, user_id: user.id, request_id: requestId });

  if (req.method === 'GET') {
    // ── TODO: Business logic ────────────────────────────────────────────────
    //
    // SELECT * FROM watchlist WHERE user_id = user.id ORDER BY added_at DESC
    //
    // ────────────────────────────────────────────────────────────────────────
    return new Response(JSON.stringify({ scaffold: true, user_id: user.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    const { data, error } = await parseBody(req, WatchlistInsertSchema);
    if (error) return Errors.validation(corsHeaders, error.format());

    // ── TODO: Business logic ────────────────────────────────────────────────
    //
    // INSERT INTO watchlist (user_id, tmdb_id, title, poster_path)
    //   VALUES (user.id, data.tmdb_id, data.title, data.poster_path)
    //   ON CONFLICT (user_id, tmdb_id) DO NOTHING
    //   RETURNING *
    //
    // ────────────────────────────────────────────────────────────────────────
    return new Response(JSON.stringify({ scaffold: true, user_id: user.id, data }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'DELETE') {
    const tmdbId = TmdbIdSchema.safeParse(url.pathname.split('/').at(-1));
    if (!tmdbId.success) return Errors.validation(corsHeaders, tmdbId.error.format());

    // ── TODO: Business logic ────────────────────────────────────────────────
    //
    // DELETE FROM watchlist WHERE user_id = user.id AND tmdb_id = tmdbId.data
    //
    // ────────────────────────────────────────────────────────────────────────
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return Errors.methodNotAllowed(corsHeaders);
});
