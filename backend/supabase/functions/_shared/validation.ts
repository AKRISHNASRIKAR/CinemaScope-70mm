// Request validation helpers built on Zod.
// All Edge Functions validate inputs before touching the DB or calling TMDB.
// A validation failure returns 422 with Zod error details so the client
// knows exactly which field failed.

import { z } from 'npm:zod@3';

export { z };
export type { ZodError, ZodSchema } from 'npm:zod@3';

// Parses and validates a JSON request body against a Zod schema.
// Returns { data, error: null } on success or { data: null, error } on failure.
export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T; error: null } | { data: null; error: z.ZodError }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      data: null,
      error: new z.ZodError([
        { code: 'custom', message: 'Request body must be valid JSON.', path: [] },
      ]),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) return { data: null, error: result.error };
  return { data: result.data, error: null };
}

// Parses and validates URL query parameters against a Zod schema.
// All values are strings from URLSearchParams; use z.coerce where needed.
export function parseQueryParams<T>(
  url: URL,
  schema: z.ZodType<T>,
): { data: T; error: null } | { data: null; error: z.ZodError } {
  const params = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) return { data: null, error: result.error };
  return { data: result.data, error: null };
}

// Common reusable schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const TmdbIdSchema = z.coerce.number().int().positive();
