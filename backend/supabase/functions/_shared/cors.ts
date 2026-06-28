// CORS helpers for Supabase Edge Functions.
// All browser-to-function requests require explicit CORS headers.
// The allowed-origin list is read from an environment variable so that
// localhost:5173 (Vite dev) and the production domain are both allowed
// without hardcoding either into the function code.

const ALLOWED_ORIGINS: string[] = (
  Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : (ALLOWED_ORIGINS[0] ?? '*');

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, apikey, Content-Type, X-Request-ID',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

// Returns a 204 response for OPTIONS preflight, or null for non-preflight.
// Call this first in every Edge Function and short-circuit if non-null.
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(req),
    });
  }
  return null;
}
