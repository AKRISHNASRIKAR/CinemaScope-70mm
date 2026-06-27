# Phase 3 — Edge Function Shared Utilities

> **PR:** #3 · **Branch:** `feat/phase-3-shared-utilities` · **Merged to:** `master`

---

## What Are Supabase Edge Functions?

**Edge Functions** are serverless TypeScript functions that run on Supabase's infrastructure (powered by Deno). They are:

- **Stateless** — each invocation is independent; no shared memory between requests
- **Deno-based** — use `Deno.serve()`, import from `npm:` specifiers, no `node_modules`
- **Fast to start** — no cold-start penalty like traditional Lambda functions
- **Co-located with the database** — the function and PostgreSQL run in the same Supabase data center, making DB queries extremely fast

```
Browser                    Supabase Edge Runtime           PostgreSQL
   │                              │                            │
   │  POST /functions/v1/tmdb/... │                            │
   │─────────────────────────────▶│                            │
   │                              │  SELECT FROM tmdb_cache    │
   │                              │───────────────────────────▶│
   │                              │◀───────────────────────────│
   │◀─────────────────────────────│                            │
   │  JSON response               │                            │
```

---

## Why `_shared/`?

All five Edge Functions need the same boilerplate: CORS handling, JWT verification, error responses, input validation, logging. Without a shared module, you would copy-paste 100+ lines into each function.

```
WITHOUT _shared/:
  tmdb/index.ts        ← copy of CORS code
  profile/index.ts     ← copy of CORS code
  watch-history/index.ts ← copy of CORS code
  ...

  If you find a CORS bug: fix it in 5 places. Miss one. Bug survives.

WITH _shared/:
  _shared/cors.ts      ← CORS logic defined once
  tmdb/index.ts        ← import { getCorsHeaders } from '../_shared/cors.ts'
  profile/index.ts     ← same import
  ...

  Fix the bug once. All functions get the fix immediately.
```

Deno resolves `'../path/to/module.ts'` imports using relative file paths — no npm install, no bundler. The shared modules are simply TypeScript files imported by relative path.

---

## Module Breakdown

### `logger.ts` — Structured Logging

**Problem with `console.log`:** Raw log messages are hard to search and filter.

```
console.log("TMDB request to /movie/550")   ← hard to query
console.log("user abc123 called profile")   ← unstructured, inconsistent
```

**Solution — structured JSON logging:**

```typescript
export function createLogger(fnName: string): Logger {
  const write = (level: Level, msg: string, extra?: Record<string, unknown>) => {
    const entry = {
      level,          // "info" | "warn" | "error" | "debug"
      fn: fnName,     // which function logged this
      ts: new Date().toISOString(),  // ISO 8601 timestamp
      msg,            // human-readable message
      ...extra,       // any additional fields (request_id, user_id, etc.)
    };
    console.log(JSON.stringify(entry));
  };
  // ...
}
```

**Usage in an Edge Function:**
```typescript
const logger = createLogger('tmdb');
logger.info('request', { path: '/movie/550', request_id: 'abc-123', cache: 'HIT' });
```

**Output (one line of JSON):**
```json
{"level":"info","fn":"tmdb","ts":"2026-06-27T10:23:45.123Z","msg":"request","path":"/movie/550","request_id":"abc-123","cache":"HIT"}
```

**Why this matters:** Supabase Dashboard captures all stdout from Edge Functions. With structured JSON, you can filter by `fn:"tmdb"` to see only TMDB proxy logs, or `level:"error"` to see only errors, across all functions simultaneously.

**`request_id` propagation:**
```
Browser adds header:  X-Request-ID: abc-123-xyz
Edge Function reads:  req.headers.get('X-Request-ID')
Logger includes:      ...logger.info('request', { request_id: 'abc-123-xyz' })

Now every log line for that HTTP request shares the same ID.
Filter logs by request_id → see the complete trace for one request.
```

---

### `cors.ts` — Cross-Origin Resource Sharing

**What is CORS?** Browsers enforce a security policy called Same-Origin Policy: JavaScript on `cinemascope.vercel.app` cannot make fetch requests to `project.supabase.co` unless the server explicitly permits it via CORS headers.

```
Browser JS at cinemascope.vercel.app
        │
        │  fetch('https://project.supabase.co/functions/v1/tmdb/movie/550')
        │
        ▼
Browser checks: is this cross-origin? YES
Browser sends:  OPTIONS preflight request first
                Origin: https://cinemascope.vercel.app
        │
        ▼ supabase edge function
        handleCors(req) → returns 204 with headers:
          Access-Control-Allow-Origin:  https://cinemascope.vercel.app
          Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
          Access-Control-Allow-Headers: Authorization, Content-Type
        │
        ▼ browser
        Sees the Allow-Origin header matches its origin → permits the real request
```

**Key design decision — `ALLOWED_ORIGINS` env var:**

```typescript
const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS')
  .split(',')  // "http://localhost:5173,https://cinemascope.vercel.app"
```

Development: `http://localhost:5173`
Production: `https://cinemascope.vercel.app`

Both are allowed without any code changes — just environment variable configuration. Never use `Access-Control-Allow-Origin: *` (wildcard) in production because it allows any website to make authenticated requests to your API using a victim user's browser.

**`handleCors` usage pattern** (every Edge Function):
```typescript
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Short-circuit: respond to OPTIONS preflight immediately
  const preflight = handleCors(req);
  if (preflight) return preflight;  // ← exits before any auth/logic

  // ... rest of function
});
```

---

### `errors.ts` — Standardised Error Responses

**Problem:** Without a standard error shape, the frontend has to handle many different formats:

```typescript
// Without standardisation — three different error formats:
{ message: "Not found" }
{ error: "Unauthorized", statusCode: 401 }
{ code: 422, details: [...] }

// The frontend needs different handling for each.
```

**Solution — `ApiError` type used everywhere:**
```typescript
interface ApiError {
  error: ErrorCode;   // machine-readable: "unauthorized", "not_found", etc.
  message: string;    // human-readable: "Authentication required."
  details?: unknown;  // optional extra info (Zod validation errors, etc.)
}
```

**Frontend can now reliably do:**
```typescript
const res = await fetch('/functions/v1/profile');
const data = await res.json();
if ('error' in data) {
  switch (data.error) {
    case 'unauthorized': redirect('/login'); break;
    case 'not_found':    show404(); break;
    case 'validation_error': showFieldErrors(data.details); break;
  }
}
```

**`Errors.*` factory pattern:**
```typescript
// Instead of building the response object each time:
return errorResponse('unauthorized', 'Authentication required.', 401, corsHeaders);

// Use the shorthand:
return Errors.unauthorized(corsHeaders);
// or:
return Errors.notFound(corsHeaders, 'Review');
// or:
return Errors.validation(corsHeaders, zodError.format());
```

**Full error code taxonomy:**

| Code | HTTP | When |
|---|---|---|
| `unauthorized` | 401 | No valid JWT in Authorization header |
| `forbidden` | 403 | Valid JWT but no permission (e.g. another user's resource) |
| `not_found` | 404 | Resource doesn't exist |
| `method_not_allowed` | 405 | Wrong HTTP verb (e.g. PUT to an endpoint that only accepts GET/POST) |
| `validation_error` | 422 | Request body or query params failed Zod validation |
| `conflict` | 409 | Trying to create something that already exists |
| `upstream_unavailable` | 503 | TMDB API is down or rate-limited |
| `internal_error` | 500 | Unhandled exception — logged server-side, generic message to client |

---

### `auth.ts` — JWT Verification

**What is a JWT?** A JSON Web Token is a base64-encoded, cryptographically signed string that Supabase Auth issues after login. It contains the user's ID, email, and expiry time.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiJ1c2VyLXV1aWQiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJleHAiOjE3NTEwMDAwMDB9.
HMAC_SIGNATURE

┌──────────────┬────────────────────────────────────────────┐
│ Header       │ { "alg": "HS256", "typ": "JWT" }           │
│ Payload      │ { "sub": "user-uuid",                      │
│              │   "email": "john@example.com",              │
│              │   "exp": 1751000000 }                       │
│ Signature    │ HMAC(header + payload, supabase_jwt_secret) │
└──────────────┴────────────────────────────────────────────┘
```

**Verification flow:**
```
Edge Function receives: Authorization: Bearer eyJ...
        │
        ├── Extract token from header
        ├── Create Supabase client with token as auth header
        ├── Call client.auth.getUser()
        │     └── Supabase verifies signature against jwt_secret
        │         Checks token hasn't expired
        │         Returns user object
        └── Return { id: user.id, email: user.email }
```

**`requireAuth` vs `getOptionalAuth`:**

```typescript
// requireAuth: throws 'unauthorized' if no valid token
// Use on protected endpoints (profile, watch-history, etc.)
const user = await requireAuth(req);
// user.id is always a valid, verified UUID here

// getOptionalAuth: returns null if no valid token
// Use on public endpoints that work logged-in or logged-out
const user = await getOptionalAuth(req);
if (user) { /* logged-in experience */ }
else       { /* public experience */ }
```

**Critical security rule:** `user_id` is **always** derived from `user.id` (the verified JWT), never from `req.body.user_id`. This prevents IDOR (Insecure Direct Object Reference):

```typescript
// ❌ WRONG — user could pass someone else's user_id in the body:
const { user_id } = await req.json();
await db.delete(reviews).where(eq(reviews.user_id, user_id));

// ✅ CORRECT — user_id comes from the verified JWT:
const user = await requireAuth(req);
await db.delete(reviews).where(eq(reviews.user_id, user.id));
// user.id is from the JWT signature — cannot be forged
```

---

### `validation.ts` — Request Validation with Zod

**What is Zod?** A TypeScript-first schema validation library. You define the shape of valid input; Zod checks incoming data against it and returns either the parsed data or a detailed error.

```typescript
// Define the schema once:
const ReviewSchema = z.object({
  tmdb_id: z.number().int().positive(),
  rating:  z.number().int().min(1).max(10),
  body:    z.string().max(5000).nullable().optional(),
});

// Validate at runtime:
const result = ReviewSchema.safeParse(requestBody);
if (!result.success) {
  // result.error.format() gives structured error info:
  // { rating: { _errors: ["Number must be less than or equal to 10"] } }
}
// result.data is typed as { tmdb_id: number, rating: number, body: string | null | undefined }
```

**`parseBody` — discriminated union return type:**

```typescript
// Returns one of two shapes — caller must handle both:
type Result<T> =
  | { data: T;    error: null     }   // success
  | { data: null; error: ZodError }   // validation failure

// Usage in Edge Function:
const { data, error } = await parseBody(req, ReviewSchema);
if (error) return Errors.validation(corsHeaders, error.format());
// TypeScript now knows data is not null — fully typed from this point
```

**`PaginationSchema` and `TmdbIdSchema`** are reusable schemas shared across all functions:
```typescript
const PaginationSchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
// z.coerce.number() converts "1" (string from URL) → 1 (number) automatically
```

---

### `db.ts` — Database Client Factory

Two clients with different permission levels:

```
┌──────────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                            │
│                                                                  │
│   ┌──────────────────┐           ┌──────────────────────────┐   │
│   │   adminClient    │           │    userClient(jwt)        │   │
│   │                 │           │                          │   │
│   │  service_role   │           │  anon key + user JWT     │   │
│   │  key            │           │                          │   │
│   │  ─────────────  │           │  ─────────────────────   │   │
│   │  BYPASSES RLS   │           │  OPERATES WITHIN RLS     │   │
│   │                 │           │                          │   │
│   │  Use for:       │           │  Use for:                │   │
│   │  - tmdb_cache   │           │  - profiles              │   │
│   │    writes       │           │  - watch_history         │   │
│   │  - admin ops    │           │  - watchlist             │   │
│   │                 │           │  - reviews               │   │
│   └──────────────────┘           └──────────────────────────┘   │
│                                                                  │
│   RLS policies enforce row-level ownership for userClient        │
│   Even a bug cannot bypass RLS — it's enforced at DB level       │
└──────────────────────────────────────────────────────────────────┘
```

**Why singleton `adminClient` but per-request `userClient`?**

```typescript
// adminClient is created once at module load time — safe because
// the service role key is always the same, and there's no user context.
export const adminClient = createClient(url, serviceRoleKey, { ... });

// userClient must be created per-request because each request has a
// different user's JWT. Creating it once with a shared client would
// mean requests could leak into each other's auth context.
export function userClient(jwt: string) {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}
```

`jsonResponse` is a small helper to keep Edge Function code concise:
```typescript
// Without helper:
return new Response(JSON.stringify(data), {
  status: 200,
  headers: { 'Content-Type': 'application/json', ...corsHeaders }
});

// With helper:
return jsonResponse(data, 200, corsHeaders);
```

---

## How the Modules Compose

Every Edge Function follows this exact structure:

```typescript
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { createLogger } from '../_shared/logger.ts';
import { requireAuth } from '../_shared/auth.ts';
import { parseBody, z } from '../_shared/validation.ts';
import { userClient } from '../_shared/db.ts';

const logger = createLogger('function-name');

Deno.serve(async (req) => {
  const cors    = getCorsHeaders(req);    // 1. CORS headers for this request

  const pre = handleCors(req);           // 2. OPTIONS preflight short-circuit
  if (pre) return pre;

  const user = await requireAuth(req);   // 3. JWT verification (throws 'unauthorized')
  // ... wrapped in try/catch → Errors.unauthorized(cors)

  const { data, error } = await parseBody(req, Schema); // 4. Validate input
  if (error) return Errors.validation(cors, error.format());

  logger.info('action', { user_id: user.id }); // 5. Structured log

  // 6. Business logic (queries db using userClient(jwt))

  return new Response(JSON.stringify(result), { // 7. Typed response
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
});
```

---

## What This Phase Achieved

- **Zero code duplication** across all five Edge Functions — each shared concern is a single file
- **Consistent error shape** — the frontend needs only one error-handling pattern
- **Traceable requests** via `request_id` correlation across logs
- **Defense-in-depth auth** — JWT verified before any database operation
- **Typed validation** — invalid input is rejected with structured errors before any logic runs
- **Correct RLS scoping** — `adminClient` used only where intended; `userClient` is the default
