// Edge Function: profile
// Serves the current user's profile enriched with computed stats that
// PostgREST cannot produce in a single query (watch count, watchlist count,
// review count).
//
// Routes:
//   GET  /functions/v1/profile        → profile + stats
//   PATCH /functions/v1/profile       → update display_name, bio, region
//
// Auth: required for both routes.
// user_id is always derived from the verified JWT — never from the request body.

import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { createLogger } from '../_shared/logger.ts';
import { requireAuth, extractBearerToken } from '../_shared/auth.ts';
import { adminClient, userClient } from '../_shared/db.ts';
import { parseBody, z } from '../_shared/validation.ts';

const logger = createLogger('profile');

const ProfileUpdateSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).nullable().optional(),
  region: z
    .string()
    .length(2)
    .transform((v) => v.toUpperCase())
    .optional(),
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

  logger.info('request', { method: req.method, user_id: user.id, request_id: requestId });

  if (req.method === 'GET') {
    // Fetch profile + aggregate counts in parallel
    const [profileResult, watchedResult, watchlistResult, reviewsResult] = await Promise.all([
      adminClient.from('profiles').select('*').eq('id', user.id).single(),
      adminClient
        .from('watch_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      adminClient
        .from('watchlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      adminClient
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    if (profileResult.error || !profileResult.data) {
      logger.error('profile_not_found', { user_id: user.id, error: String(profileResult.error) });
      return Errors.notFound(corsHeaders, 'Profile');
    }

    const responseBody = {
      ...profileResult.data,
      stats: {
        watched: watchedResult.count ?? 0,
        watchlist: watchlistResult.count ?? 0,
        reviews: reviewsResult.count ?? 0,
      },
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId },
    });
  }

  if (req.method === 'PATCH') {
    const { data, error } = await parseBody(req, ProfileUpdateSchema);
    if (error) return Errors.validation(corsHeaders, error.format());

    // Use user-scoped client so RLS enforces ownership
    const jwt = extractBearerToken(req);
    if (!jwt) return Errors.unauthorized(corsHeaders);
    const client = userClient(jwt);

    const { data: updated, error: updateError } = await client
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError || !updated) {
      logger.error('profile_update_failed', { user_id: user.id, error: String(updateError) });
      return Errors.internal(corsHeaders, 'Failed to update profile.');
    }

    logger.info('profile_updated', { user_id: user.id });

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId },
    });
  }

  return Errors.methodNotAllowed(corsHeaders);
});
