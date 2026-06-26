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
import { userClient } from '../_shared/db.ts';
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
    // ── TODO: Business logic ────────────────────────────────────────────────
    //
    // 1. SELECT profile FROM profiles WHERE id = user.id
    // 2. SELECT COUNT(*) FROM watch_history WHERE user_id = user.id
    // 3. SELECT COUNT(*) FROM watchlist WHERE user_id = user.id
    // 4. SELECT COUNT(*) FROM reviews WHERE user_id = user.id
    // 5. Return merged object: { ...profile, stats: { watched, watchlist, reviews } }
    //
    // ────────────────────────────────────────────────────────────────────────
    return new Response(JSON.stringify({ scaffold: true, user_id: user.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'PATCH') {
    const { data, error } = await parseBody(req, ProfileUpdateSchema);
    if (error) return Errors.validation(corsHeaders, error.format());

    // ── TODO: Business logic ────────────────────────────────────────────────
    //
    // 1. UPDATE profiles SET ...data WHERE id = user.id RETURNING *
    // 2. Return updated profile row
    //
    // ────────────────────────────────────────────────────────────────────────
    return new Response(JSON.stringify({ scaffold: true, user_id: user.id, data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return Errors.methodNotAllowed(corsHeaders);
});
