// JWT verification helpers for Edge Functions.
// Uses the Supabase JS client to verify the bearer token against the project's
// GoTrue instance. The verified user object is then used to enforce RLS and
// derive the user_id for all ownership checks.
//
// Never accept user_id from the request body — always derive it from the
// verified JWT to prevent IDOR vulnerabilities.

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

export interface AuthUser {
  id: string;
  email: string | undefined;
}

function extractToken(req: Request): string | null {
  const header = req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

// Verifies the bearer token and returns the authenticated user.
// Throws an Error with message 'unauthorized' if verification fails.
// Catch this and return Errors.unauthorized(corsHeaders).
export async function requireAuth(req: Request): Promise<AuthUser> {
  const token = extractToken(req);
  if (!token) throw new Error('unauthorized');

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) throw new Error('unauthorized');

  return { id: user.id, email: user.email };
}

// Returns the authenticated user or null — for endpoints that work both
// authenticated and unauthenticated (e.g. the TMDB proxy for public pages).
export async function getOptionalAuth(req: Request): Promise<AuthUser | null> {
  try {
    return await requireAuth(req);
  } catch {
    return null;
  }
}

// Returns the raw bearer token without verification — use only when passing
// the token on to a user-scoped Supabase client (see db.ts).
export function extractBearerToken(req: Request): string | null {
  return extractToken(req);
}
