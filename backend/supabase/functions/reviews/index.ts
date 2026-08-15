// Edge Function: reviews
// Manages film reviews (rating 1-10 + optional written review body).
//
// Routes:
//   GET    /functions/v1/reviews?tmdb_id=<id>   → all reviews for a film (public to authenticated)
//   POST   /functions/v1/reviews                → create or update own review (upsert)
//   DELETE /functions/v1/reviews/:tmdbId        → delete own review
//
// Auth: required for all routes.
// GET is authenticated (not anon) to prevent unauthenticated scraping.
// Reviews are publicly readable by all authenticated users (social discovery).
// Write operations are restricted to the review owner by RLS.

import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { createLogger } from '../_shared/logger.ts';
import { requireAuth, extractBearerToken } from '../_shared/auth.ts';
import { userClient } from '../_shared/db.ts';
import { parseBody, parseQueryParams, z, TmdbIdSchema } from '../_shared/validation.ts';

const logger = createLogger('reviews');

const ReviewUpsertSchema = z.object({
  tmdb_id: TmdbIdSchema,
  title: z.string().min(1).max(500),
  rating: z.number().int().min(1).max(10),
  body: z.string().max(5_000).nullable().optional(),
});

const ReviewsQuerySchema = z.object({
  tmdb_id: z.coerce.number().int().positive(),
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

  // ── GET: all reviews for a film, joined with reviewer profiles ────────────
  if (req.method === 'GET') {
    const { data: query, error } = parseQueryParams(url, ReviewsQuerySchema);
    if (error) return Errors.validation(corsHeaders, error.format());

    // Join reviews with profiles to return reviewer attribution in one query.
    // Avoids N+1 requests from the frontend fetching each reviewer separately.
    const { data: rows, error: dbError } = await client
      .from('reviews')
      .select('*, profiles(username, avatar_url, display_name)')
      .eq('tmdb_id', query.tmdb_id)
      .order('created_at', { ascending: false });

    if (dbError) {
      logger.error('db_error', { tmdb_id: query.tmdb_id, error: String(dbError) });
      return Errors.internal(corsHeaders);
    }

    return new Response(JSON.stringify({ data: rows ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId },
    });
  }

  // ── POST: create or update own review ─────────────────────────────────────
  if (req.method === 'POST') {
    const { data, error } = await parseBody(req, ReviewUpsertSchema);
    if (error) return Errors.validation(corsHeaders, error.format());

    const now = new Date().toISOString();

    const { data: row, error: dbError } = await client
      .from('reviews')
      .upsert(
        {
          user_id: user.id,
          tmdb_id: data.tmdb_id,
          title: data.title,
          rating: data.rating,
          body: data.body ?? null,
          created_at: now,
          updated_at: now,
        },
        {
          onConflict: 'user_id,tmdb_id',
        },
      )
      .select()
      .single();

    if (dbError || !row) {
      logger.error('db_error', { user_id: user.id, error: String(dbError) });
      return Errors.internal(corsHeaders);
    }

    logger.info('upserted', { user_id: user.id, tmdb_id: data.tmdb_id, rating: data.rating });

    return new Response(JSON.stringify(row), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId },
    });
  }

  // ── DELETE: remove own review ─────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const tmdbId = TmdbIdSchema.safeParse(url.pathname.split('/').at(-1));
    if (!tmdbId.success) return Errors.validation(corsHeaders, tmdbId.error.format());

    // RLS enforces ownership — the client can only delete their own reviews.
    const { data: deleted, error: dbError } = await client
      .from('reviews')
      .delete()
      .eq('user_id', user.id)
      .eq('tmdb_id', tmdbId.data)
      .select();

    if (dbError) {
      logger.error('db_error', { user_id: user.id, error: String(dbError) });
      return Errors.internal(corsHeaders);
    }

    if (!deleted || deleted.length === 0) {
      return Errors.notFound(corsHeaders, 'Review');
    }

    logger.info('deleted', { user_id: user.id, tmdb_id: tmdbId.data });

    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return Errors.methodNotAllowed(corsHeaders);
});
