# Phase 7 — CI/CD & Deployment

> **PR:** #7 · **Branch:** `feat/phase-7-cicd-deployment` · **Merged to:** `master`

---

## What Was Built

A GitHub Actions pipeline that automatically deploys database migrations and Edge Functions on every push to `master`. Vercel handles the frontend separately via its native GitHub integration.

```
Push to master
      │
      ▼
.github/workflows/deploy.yml
      │
      ├─ Job 1: migrate
      │     └─ supabase db push → applies pending SQL migrations
      │
      ├─ Job 2: deploy-functions (needs: migrate)
      │     └─ supabase functions deploy × 5
      │
      └─ Job 3: smoke-test (needs: deploy-functions)
            └─ curl /functions/v1/tmdb/movie/popular → must return 200
```

---

## `deploy.yml` — Pipeline Design Decisions

### Job ordering: migrate before deploy

```yaml
deploy-functions:
  needs: migrate
```

New Edge Function code might depend on new database columns or tables. If functions deployed before migrations ran, the new code would query columns that don't exist yet and return 500 errors. By making `deploy-functions` depend on `migrate`, this race condition is eliminated.

### `cancel-in-progress: false`

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false
```

If two pushes happen in quick succession (e.g., fixing a typo immediately after merging), the default GitHub behavior would cancel the first deploy mid-flight. A deploy interrupted between migration and function deployment would leave the system in an inconsistent state — new schema without new function code. `cancel-in-progress: false` queues the second deploy to run after the first completes.

### `workflow_dispatch`

```yaml
on:
  push:
    branches: [master]
  workflow_dispatch:
```

`workflow_dispatch` adds a "Run workflow" button to the GitHub Actions UI. This lets you re-run a deploy without pushing a dummy commit — useful when Supabase was briefly down and the previous deploy failed.

### `--no-verify-jwt` on the tmdb function

```yaml
supabase functions deploy --no-verify-jwt tmdb
```

By default, Supabase Edge Functions require a valid JWT on every request. The `tmdb` function is intentionally public — the home page, search page, and film pages work without authentication. `--no-verify-jwt` tells Supabase's edge runtime not to reject requests that lack a Bearer token at the routing layer. The function itself handles optional auth via `getOptionalAuth()`.

All other functions (`profile`, `watch-history`, `watchlist`, `reviews`) do NOT use this flag — they require authentication.

### Smoke test

```yaml
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "${{ secrets.SUPABASE_PROJECT_URL }}/functions/v1/tmdb/movie/popular" \
  -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}")
if [ "$STATUS" != "200" ]; then exit 1; fi
```

The smoke test hits the TMDB proxy with the anon key (public endpoint) and asserts a `200` response. If the function has a TypeScript compile error or can't connect to the DB, this catches it within 30 seconds of deployment instead of waiting for a user to report it.

---

## Required GitHub Secrets

Go to: `GitHub repo → Settings → Secrets and variables → Actions → New repository secret`

| Secret name | Where to find it | Notes |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Dashboard → Account → Access tokens | Your personal token; treat like a password |
| `SUPABASE_PROJECT_REF` | Supabase Dashboard → Project Settings → General | The short ID, e.g. `abcxyzabcxyz` (not the full URL) |
| `SUPABASE_DB_PASSWORD` | Supabase Dashboard → Project Settings → Database → Database password | The password you set when creating the project |
| `SUPABASE_PROJECT_URL` | Supabase Dashboard → Project Settings → API → Project URL | Full URL: `https://abcxyzabcxyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon key | Used in the smoke test only |

---

## Frontend Deployment (Vercel)

Vercel handles the React app independently. No GitHub Actions step is needed.

### Initial setup (one-time)

1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**
2. Import from GitHub: select the `CinemaScope-70mm` repo
3. Set **Root Directory** to `frontend`
4. Set **Framework Preset** to `Vite`
5. Add environment variables (Project Settings → Environment Variables):

```
VITE_SUPABASE_URL      = https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key
VITE_GITHUB_URL        = https://github.com/AKRISHNASRIKAR
```

6. Click **Deploy**

### Automatic deployments

After the initial setup, Vercel watches the `master` branch. Every push triggers a new frontend build automatically — no GitHub Action needed.

**Preview deployments:** Vercel also creates a preview URL for every pull request. This is useful for reviewing frontend changes before merging.

---

## Vercel + Supabase CORS

The `ALLOWED_ORIGINS` environment variable in the Edge Function controls which domains can call the functions from a browser:

```
# Development
ALLOWED_ORIGINS=http://localhost:5173

# Production (add your Vercel domain)
ALLOWED_ORIGINS=http://localhost:5173,https://cinemascope.vercel.app
```

Set this in Supabase Dashboard → Edge Functions → Secrets (or via CLI):
```bash
supabase secrets set ALLOWED_ORIGINS="http://localhost:5173,https://cinemascope.vercel.app" \
  --project-ref your-project-ref
```

---

## Supabase Auth Callback URL

For OAuth (Google, GitHub) to work in production, Supabase needs to know your frontend domain.

Supabase Dashboard → Authentication → URL Configuration:

```
Site URL:         https://cinemascope.vercel.app
Redirect URLs:    https://cinemascope.vercel.app/**
                  http://localhost:5173/**
```

The `**` wildcard covers any path after the domain, which is needed for the post-OAuth redirect to work on both the homepage (`/`) and any deep link.

---

## Full Deployment Checklist

Use this checklist when deploying from scratch to a fresh Supabase project:

### Supabase setup

- [ ] Create a new Supabase project at [supabase.com](https://supabase.com)
- [ ] Note the Project URL and anon key (Project Settings → API)
- [ ] Note the database password (Project Settings → Database)
- [ ] Set the TMDB API key in Vault: Dashboard → Edge Functions → Secrets → `TMDB_API_KEY`
- [ ] Set `ALLOWED_ORIGINS` secret with your Vercel domain
- [ ] Enable Google OAuth: Dashboard → Authentication → Providers → Google → add Client ID + Secret
- [ ] Enable GitHub OAuth: Dashboard → Authentication → Providers → GitHub → add Client ID + Secret
- [ ] Set Site URL and Redirect URLs (Authentication → URL Configuration)

### GitHub setup

- [ ] Add all 5 GitHub Secrets listed in the table above
- [ ] Trigger the first deploy: push to master or use `workflow_dispatch`
- [ ] Verify all 3 jobs pass (migrate, deploy-functions, smoke-test)

### Vercel setup

- [ ] Import the repo, set root directory to `frontend`
- [ ] Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables
- [ ] Deploy and verify the app loads at the Vercel URL
- [ ] Add the Vercel URL to `ALLOWED_ORIGINS` in Supabase

### Verification

- [ ] Visit the production URL — homepage loads with film data (TMDB proxy working)
- [ ] Sign in with Google — OAuth redirect works, profile page shows user name
- [ ] Visit a film page — film data loads (Edge Function + cache working)
- [ ] Add a film to watchlist — POST to watchlist Edge Function succeeds

---

## Free Tier Budget

| Service | Free limit | Usage at launch | Notes |
|---|---|---|---|
| Supabase DB | 500 MB | ~10 MB | Generous headroom |
| Edge Function invocations | 2M / month | ~50K at low traffic | Cache absorbs most repeated requests |
| Auth MAU | 50,000 | <100 at launch | |
| Vercel bandwidth | 100 GB / month | ~2 GB | |
| GitHub Actions minutes | 2,000 / month | ~10 min/deploy | Only triggered on push to master |

The first paid upgrade would be Supabase Pro ($25/month) at roughly 5,000–10,000 DAU for additional storage and function invocations.

---

## What This Phase Achieved

- **Fully automated backend deploys** — push to master and the pipeline handles everything
- **Zero-downtime migration strategy** — migrations run before new function code
- **Smoke test on every deploy** — deployment failures caught within 30 seconds
- **Complete deployment checklist** — reproducible setup from scratch on any new environment
