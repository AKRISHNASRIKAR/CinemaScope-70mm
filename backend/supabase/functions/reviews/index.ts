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
import { requireAuth } from '../_shared/auth.ts';
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

  const url = new URL(req.url);

  logger.info('request', { method: req.method, user_id: user.id, request_id: requestId });

  if (req.method === 'GET') {
    const { data: query, error } = parseQueryParams(url, ReviewsQuerySchema);
    if (error) return Errors.validation(corsHeaders, error.format());

    // ── TODO: Business logic ────────────────────────────────────────────────
    //
    // SELECT reviews.*, profiles.username, profiles.avatar_url
    //   FROM reviews
    //   JOIN profiles ON profiles.id = reviews.user_id
    //   WHERE reviews.tmdb_id = query.tmdb_id
    //   ORDER BY reviews.created_at DESC
    //
    // Joining profiles allows the frontend to show reviewer attribution
    // without a second request.
    //
    // ────────────────────────────────────────────────────────────────────────
    return new Response(JSON.stringify({ scaffold: true, tmdb_id: query.tmdb_id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    const { data, error } = await parseBody(req, ReviewUpsertSchema);
    if (error) return Errors.validation(corsHeaders, error.format());

    // ── TODO: Business logic ────────────────────────────────────────────────
    //
    // INSERT INTO reviews (user_id, tmdb_id, title, rating, body)
    //   VALUES (user.id, data.tmdb_id, data.title, data.rating, data.body)
    //   ON CONFLICT (user_id, tmdb_id)
    //   DO UPDATE SET rating = EXCLUDED.rating, body = EXCLUDED.body, updated_at = now()
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
    // DELETE FROM reviews WHERE user_id = user.id AND tmdb_id = tmdbId.data
    // RLS enforces ownership — service role is not needed here.
    //
    // ────────────────────────────────────────────────────────────────────────
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return Errors.methodNotAllowed(corsHeaders);
});
