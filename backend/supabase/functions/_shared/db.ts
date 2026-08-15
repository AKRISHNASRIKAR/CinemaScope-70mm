// Supabase client factory for Edge Functions.
// Two clients are provided:
//
// adminClient — uses the service_role key, bypasses RLS.
//   Use ONLY for operations that should not be user-scoped:
//   - tmdb_cache writes (cache is not user-owned)
//   - Internal admin operations
//   Never expose this client's responses directly to the user.
//
// userClient(jwt) — uses the anon key + user JWT, operates within RLS.
//   Use for all user-owned data (profiles, watch_history, watchlist, reviews).
//   RLS policies enforce row-level isolation at the database layer.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Singleton admin client — safe to share across requests in the same isolate.
export const adminClient: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// Per-request user-scoped client. Creates a new client each call so that
// the user's JWT is correctly forwarded and RLS is evaluated per-request.
export function userClient(jwt: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });
}

// JSON response helper — keeps function code concise.
export function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}
