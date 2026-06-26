// Standardised error response factory.
// Every endpoint returns the same ApiError shape so the frontend can
// reliably parse response.error without inspecting HTTP status codes.

export type ErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'method_not_allowed'
  | 'validation_error'
  | 'conflict'
  | 'upstream_unavailable'
  | 'internal_error';

export interface ApiError {
  error: ErrorCode;
  message: string;
  details?: unknown;
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  corsHeaders: Record<string, string>,
  details?: unknown,
): Response {
  const body: ApiError = { error: code, message };
  if (details !== undefined) body.details = details;

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Pre-built error constructors — import Errors and call the right one.
export const Errors = {
  unauthorized: (cors: Record<string, string>): Response =>
    errorResponse('unauthorized', 'Authentication required.', 401, cors),

  forbidden: (cors: Record<string, string>): Response =>
    errorResponse('forbidden', 'You do not have permission to perform this action.', 403, cors),

  notFound: (cors: Record<string, string>, resource = 'Resource'): Response =>
    errorResponse('not_found', `${resource} not found.`, 404, cors),

  methodNotAllowed: (cors: Record<string, string>): Response =>
    errorResponse('method_not_allowed', 'HTTP method not allowed.', 405, cors),

  validation: (cors: Record<string, string>, details: unknown): Response =>
    errorResponse('validation_error', 'Request validation failed.', 422, cors, details),

  conflict: (cors: Record<string, string>, message = 'Resource already exists.'): Response =>
    errorResponse('conflict', message, 409, cors),

  upstreamUnavailable: (cors: Record<string, string>, details?: unknown): Response =>
    errorResponse(
      'upstream_unavailable',
      'An upstream service is temporarily unavailable.',
      503,
      cors,
      details,
    ),

  internal: (cors: Record<string, string>, message = 'An unexpected error occurred.'): Response =>
    errorResponse('internal_error', message, 500, cors),
} as const;
