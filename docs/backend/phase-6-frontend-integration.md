# Phase 6 — Frontend Integration

> **PR:** #6 · **Branch:** `feat/phase-6-frontend-integration` · **Merged to:** `master`

---

## What Was Built

Phase 6 connects the React frontend to the backend built in Phases 1–5. Two changes cover the entire migration:

1. **Replace Auth0 with Supabase Auth** — swap `useAuth0` for `useSession` across all auth surfaces
2. **Route TMDB calls through the Edge Function proxy** — update `fetcher.js` to send requests to `/functions/v1/tmdb/*` instead of calling TMDB directly

All other frontend code — SWR, Suspense, component structure, styling — is unchanged.

---

## File Changes

| File | Change | Why |
|---|---|---|
| `frontend/src/lib/supabase.js` | **New** | Supabase client singleton + `FUNCTIONS_URL` export |
| `frontend/src/hooks/useSession.js` | **New** | Auth hook replacing `useAuth0` |
| `frontend/src/hooks/useWatchHistory.js` | **New** | Watch history CRUD against Edge Function |
| `frontend/src/hooks/useWatchlist.js` | **New** | Watchlist CRUD with `isInWatchlist` utility |
| `frontend/src/providers/AppAuthProvider.jsx` | **Replaced** | No-op passthrough (Supabase manages state internally) |
| `frontend/src/components/ui/ProtectedRoute.jsx` | **Updated** | `useAuth0` → `useSession` |
| `frontend/src/pages/LoginPage.jsx` | **Updated** | Google + GitHub OAuth + magic link form |
| `frontend/src/pages/Profile.jsx` | **Updated** | Supabase user metadata instead of Auth0 user |
| `frontend/src/lib/api/fetcher.js` | **Updated** | Routes TMDB paths through Edge Function proxy |

---

## 1. `supabase.js` — The Client Singleton

```javascript
// frontend/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,       // keeps the user logged in across page reloads
      autoRefreshToken: true,     // silently refreshes the JWT before it expires
      detectSessionInUrl: true,   // processes OAuth redirect callbacks automatically
    },
  }
);

// All Edge Function requests go to this base URL
export const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
```

**Why a singleton?** Creating multiple `supabase` instances would result in multiple WebSocket connections (for Realtime), multiple session caches, and potential race conditions on token refresh. Import from `@/lib/supabase` everywhere.

**Why is the anon key safe in the browser?** The anon key is not a secret. It identifies your project but cannot bypass Row Level Security policies. Every query it makes is subject to RLS — authenticated users can only see their own data, and unauthenticated users can only access publicly-readable tables.

---

## 2. `useSession.js` — The Auth Hook

```javascript
export function useSession() {
  const [session, setSession] = useState(undefined); // undefined = still loading

  useEffect(() => {
    // Read existing session from localStorage immediately
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });

    // Subscribe to future auth events (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe(); // clean up on unmount
  }, []);

  return { session, user: session?.user ?? null, isAuthenticated: !!session, ... };
}
```

### Why `undefined` instead of `null` for the initial session state?

```
undefined → "we don't know yet" (still reading from localStorage)
null      → "we know, and there is no session" (user is logged out)

ProtectedRoute checks:
  if (isLoading) → show spinner
  if (!isAuthenticated) → redirect to /login

isLoading = session === undefined  ← never redirect before we know the auth state
```

If the initial state were `null`, `ProtectedRoute` would redirect to `/login` on every page load before the session could be read — forcing a login page flash even for authenticated users.

### OAuth sign-in flow

```
User clicks "Continue with Google"
  ↓
signInWithGoogle() → supabase.auth.signInWithOAuth({ provider: 'google' })
  ↓
Browser redirects to Google consent screen
  ↓
User approves → Google redirects back to ${window.location.origin}/?code=...
  ↓
detectSessionInUrl: true intercepts the code, exchanges it for tokens
  ↓
onAuthStateChange fires with event='SIGNED_IN', session=<new session>
  ↓
LoginPage useEffect detects isAuthenticated=true → navigate('/')
```

---

## 3. `fetcher.js` — TMDB Proxy Routing

### Before (direct TMDB)

```javascript
// Bakes the API key into the JS bundle:
return `${BASE_URL}${url}?api_key=${API_KEY}&language=en-US`;
```

### After (Edge Function proxy)

```javascript
function buildTmdbProxyUrl(path) {
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${FUNCTIONS_URL}/tmdb/${clean}`;
}

// /movie/550 → https://<project>.supabase.co/functions/v1/tmdb/movie/550
// No API key in the URL. The Edge Function adds it server-side.
```

The fetcher also attaches the current session JWT:

```javascript
const authHeader = await getAuthHeader();
// Authorization: Bearer eyJhbG...  (if logged in)
// No Authorization header          (if logged out, for public pages)
```

This enables the Edge Function to:
1. Return TMDB data for unauthenticated users (home, search — public pages)
2. Log watch history when authenticated users visit a film page (future feature)

### Zero frontend component changes

All components (`FilmPage`, `Hero`, `GenreRow`, etc.) use SWR with `fetcher`. They pass paths like `/movie/550` and expect to receive the same JSON shape from TMDB. The Edge Function returns exactly the same JSON — so no component code changes.

---

## 4. `LoginPage.jsx` — Supabase OAuth UI

The new login page offers three sign-in methods:

```
┌────────────────────────────────────┐
│         Welcome to CinemaScope     │
│                                    │
│  [G] Continue with Google          │
│  [GH] Continue with GitHub         │
│                                    │
│  ────────── or ──────────          │
│                                    │
│  [email input________________]     │
│  [   Send magic link          ]    │
│                                    │
└────────────────────────────────────┘
```

**Why magic link?** Users who don't want to share OAuth access can sign in with just an email address. The magic link is a one-time token sent to their inbox — no password to remember, no OAuth scope to approve.

**Error handling** — the form captures Supabase auth errors and displays them inline:
```javascript
const { error: err } = await signInWithMagicLink(magicEmail.trim());
if (err) setError(err.message); // e.g. "Email rate limit exceeded"
```

---

## 5. `Profile.jsx` — Supabase User Metadata

Auth0 stored user data in `user.name`, `user.picture`, `user.email_verified`. Supabase stores it differently:

| Field | Auth0 | Supabase |
|---|---|---|
| Display name | `user.name` | `user.user_metadata.full_name` or `.name` |
| Avatar | `user.picture` | `user.user_metadata.avatar_url` or `.picture` |
| Email | `user.email` | `user.email` |
| Email verified | `user.email_verified` (boolean) | `user.email_confirmed_at` (timestamp or null) |
| Auth provider | N/A | `user.app_metadata.provider` |
| Joined date | `user.updated_at` | `user.created_at` |

The mapping in `Profile.jsx`:
```javascript
const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email;
const provider = user?.app_metadata?.provider ?? 'email';
const emailConfirmed = !!user?.email_confirmed_at;
```

The `??` chain handles both Google (sends `full_name`) and GitHub (sends `name`) OAuth providers.

---

## 6. New Hooks: `useWatchHistory` and `useWatchlist`

These hooks wrap the Edge Function calls with SWR for caching and provide a clean API for components to use.

### `useWatchHistory`

```javascript
const { history, pagination, isLoading, logWatch, removeWatch } = useWatchHistory({ page: 1 });

// Log a film as watched (called from FilmPage useEffect):
await logWatch({ tmdb_id: 550, title: "Fight Club", poster_path: "/pB8BM..." });

// Remove from history:
await removeWatch(550);
```

### `useWatchlist`

```javascript
const { watchlist, isLoading, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

// Check before rendering the "Add" / "Remove" button on a film card:
const inList = isInWatchlist(550); // true | false

// Toggle:
if (inList) await removeFromWatchlist(550);
else await addToWatchlist({ tmdb_id: 550, title: "Fight Club", poster_path: "/..." });
```

Both hooks call `globalMutate(key)` after write operations to refresh the SWR cache — the list updates immediately without a page reload.

---

## Environment Variables Required

Add these to `frontend/.env.local` (not committed):

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Remove (no longer needed):
```bash
# VITE_API_KEY=...   ← moved to Supabase Vault
# VITE_BASE_URL=...  ← replaced by FUNCTIONS_URL in supabase.js
# VITE_AUTH0_DOMAIN=...
# VITE_AUTH0_CLIENT_ID=...
```

---

## What This Phase Achieved

- **Auth0 removed** — `useAuth0` is gone from all components; Supabase session replaces it
- **TMDB key secured** — removed from Vite env; all TMDB requests now go through the proxy
- **Login page upgraded** — Google + GitHub OAuth + magic link in one cohesive UI
- **Two new data hooks** — `useWatchHistory` and `useWatchlist` ready for components to consume
- **Zero component regressions** — `fetcher.js` returns the same JSON shapes; SWR, Suspense, and ErrorBoundary are unchanged
