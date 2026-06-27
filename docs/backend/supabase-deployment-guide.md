# Supabase Connection & Deployment Guide

> **Audience:** You, after cloning this repo or setting up a new environment.
> **Goal:** Get the full stack (frontend + Edge Functions + database) working end-to-end.
> **Time:** ~30 minutes for a fresh setup.

---

## What Variables Do You Need?

There are **two separate variable sets**: frontend (Vite/Vercel) and backend (Supabase Vault).

### Frontend Variables (Vite)

These go in `frontend/.env.local` for development, or Vercel environment variables for production.

| Variable | Where to find it | Example value |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → **Project URL** | `https://abcxyzabcxyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → **anon / public key** | `eyJhbGciOiJIUzI1...` |
| `VITE_GITHUB_URL` | Your GitHub profile URL | `https://github.com/AKRISHNASRIKAR` |

**These are safe to expose** — the anon key can only do what Row Level Security allows.

### Backend Variables (Supabase Vault)

These are secrets stored inside Supabase. They are injected into Edge Functions at runtime and **never** appear in your codebase or Vite bundle.

| Secret name | Where to find it | How to set it |
|---|---|---|
| `TMDB_API_KEY` | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) | Supabase Dashboard → Edge Functions → Secrets |
| `ALLOWED_ORIGINS` | Your Vercel URL + localhost | Supabase Dashboard → Edge Functions → Secrets |

The following are **auto-injected by Supabase** — you never need to set them manually:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

---

## Step-by-Step Setup

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or sign up — it's free)
2. Click **New project**
3. Fill in:
   - **Name:** `cinemascope` (or any name)
   - **Database password:** generate a strong one and **save it** — you'll need it for the CI/CD pipeline
   - **Region:** pick the one closest to your users (e.g. `ap-south-1` for India)
4. Click **Create new project** and wait ~2 minutes for provisioning

### Step 2 — Get Your API Keys

1. In your project: **Project Settings** → **API**
2. Copy:
   - **Project URL** → this is your `VITE_SUPABASE_URL`
   - **anon / public** key → this is your `VITE_SUPABASE_ANON_KEY`
3. Also copy the **service_role** key (keep it private — only used in CI/CD secrets)

### Step 3 — Configure Frontend Locally

```bash
# Create the local env file (not committed to git)
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local`:
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GITHUB_URL=https://github.com/AKRISHNASRIKAR
```

### Step 4 — Run Database Migrations

You need the Supabase CLI installed:
```bash
npm install -g supabase
supabase login  # opens a browser, links your account
```

Then link and push migrations:
```bash
cd backend
supabase link --project-ref your-project-ref
supabase db push
```

This runs all migrations in order:
```
0000_profiles.sql         → creates profiles table
0001_watch_history.sql    → creates watch_history table
0002_watchlist.sql        → creates watchlist table
0003_reviews.sql          → creates reviews table
0004_tmdb_cache.sql       → creates tmdb_cache table
0005_rls_policies.sql     → enables RLS on all tables
0006_handle_new_user.sql  → creates the trigger that auto-creates profiles on signup
0007_pg_cron.sql          → schedules nightly cache cleanup
```

**Verify:** Supabase Dashboard → Table Editor → you should see all 5 tables.

### Step 5 — Add Edge Function Secrets

In the Supabase Dashboard: **Edge Functions** → **Secrets** → **Add new secret**

| Secret | Value |
|---|---|
| `TMDB_API_KEY` | Your TMDB API key from [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |
| `ALLOWED_ORIGINS` | `http://localhost:5173` (add your Vercel URL later when you deploy) |

Or via CLI:
```bash
cd backend
supabase secrets set TMDB_API_KEY="your-tmdb-key" --project-ref your-project-ref
supabase secrets set ALLOWED_ORIGINS="http://localhost:5173" --project-ref your-project-ref
```

### Step 6 — Deploy Edge Functions

```bash
cd backend

# Deploy each function (--no-verify-jwt on tmdb allows public/unauthenticated access)
supabase functions deploy tmdb --no-verify-jwt --project-ref your-project-ref
supabase functions deploy profile --project-ref your-project-ref
supabase functions deploy watch-history --project-ref your-project-ref
supabase functions deploy watchlist --project-ref your-project-ref
supabase functions deploy reviews --project-ref your-project-ref
```

**Test the proxy:**
```bash
curl "https://your-project-ref.supabase.co/functions/v1/tmdb/movie/popular" \
  -H "Authorization: Bearer your-anon-key"
# Should return JSON with popular movies from TMDB (or X-Cache: HIT on repeated calls)
```

### Step 7 — Configure Authentication

#### Enable OAuth Providers

**Google OAuth:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → Create a project
2. APIs & Services → Credentials → Create credentials → OAuth client ID
3. Application type: **Web application**
4. Authorized redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`
5. Copy the Client ID and Client Secret
6. Supabase Dashboard → **Authentication** → **Providers** → **Google** → paste them in → Enable

**GitHub OAuth:**
1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Homepage URL: `https://your-vercel-domain.vercel.app`
3. Authorization callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Copy Client ID and generate a Client Secret
5. Supabase Dashboard → **Authentication** → **Providers** → **GitHub** → paste them in → Enable

#### Set Redirect URLs

Supabase Dashboard → **Authentication** → **URL Configuration**:
```
Site URL:         https://your-vercel-domain.vercel.app
                  (use http://localhost:5173 for local dev)

Redirect URLs:
  http://localhost:5173/**
  https://your-vercel-domain.vercel.app/**
```

### Step 8 — Test Locally

```bash
# Terminal 1
cd frontend && npm run dev
# App runs at http://localhost:5173
```

1. Open http://localhost:5173
2. Homepage should load with films from TMDB (via proxy)
3. Click **Log In** → Google/GitHub sign-in should work
4. After sign-in, visit `/profile` — your name and email should appear

### Step 9 — Deploy Frontend to Vercel

1. Push your code to GitHub (make sure `frontend/.env.local` is in `.gitignore`)
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import your repo
3. Configuration:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
4. Environment variables (Project Settings → Environment Variables):
   ```
   VITE_SUPABASE_URL      = https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key
   VITE_GITHUB_URL        = https://github.com/AKRISHNASRIKAR
   ```
5. Click **Deploy** — Vercel builds and deploys in ~1 minute

After getting your Vercel URL:
- Add it to `ALLOWED_ORIGINS` in Supabase Secrets: `supabase secrets set ALLOWED_ORIGINS="http://localhost:5173,https://your-app.vercel.app"`
- Add it to Supabase Authentication → URL Configuration → Redirect URLs

### Step 10 — Set Up CI/CD (Optional but Recommended)

The GitHub Actions pipeline in `.github/workflows/deploy.yml` automates Steps 4 and 6 on every push to master.

Add these secrets to GitHub (Settings → Secrets → Actions):

| Secret | Value |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens → Generate new token |
| `SUPABASE_PROJECT_REF` | Your project reference ID (e.g. `abcxyzabcxyz`) |
| `SUPABASE_DB_PASSWORD` | The database password from Step 1 |
| `SUPABASE_PROJECT_URL` | `https://your-project-ref.supabase.co` |
| `SUPABASE_ANON_KEY` | Your anon key (same as `VITE_SUPABASE_ANON_KEY`) |

After adding secrets, push anything to master — the pipeline runs automatically.

---

## Local Development with Supabase Local Stack

For full local development (including auth and Edge Functions running locally):

```bash
# Requires: Docker Desktop running

cd backend
supabase start
# Starts PostgreSQL, Auth, Edge Functions, Studio, and Inbucket locally

# Local endpoints:
# Supabase URL:    http://127.0.0.1:54321
# Supabase Studio: http://127.0.0.1:54323
# Email testing:   http://127.0.0.1:54324 (catches magic link emails)
```

Update `frontend/.env.local` for local stack:
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRFA0NiK7urOL8O3wJiLFas_Vf5uEmNOQMoQoAllJgA
# ^ this is the standard local anon key — same across all local Supabase installs
```

Run Edge Functions locally:
```bash
cd backend
supabase functions serve --env-file .env.local
```

Stop when done:
```bash
supabase stop
```

---

## Best Free Backend Hosting Options

This project is designed for Supabase (free tier), but here's an honest comparison of alternatives:

| Platform | What it offers | Free tier | Best for |
|---|---|---|---|
| **Supabase** ✅ (this project) | PostgreSQL + Auth + Edge Functions + Storage | 500MB DB, 2M fn invocations/month, 50K auth MAU | Full-stack with Postgres + Serverless |
| **Railway** | PostgreSQL + any Node/Deno service | $5/month credit (enough for light use) | If you want a traditional Node.js API server |
| **Neon** | PostgreSQL only (serverless) | 0.5 GB storage, 191 compute hours/month | If you only need Postgres and handle everything else yourself |
| **PlanetScale** | MySQL (Vitess) | Discontinued free tier in 2024 — avoid | — |
| **Render** | Node.js web services | 750 hours/month free, spins down on idle | Simple REST API; slow cold starts after idle |
| **Fly.io** | Run any Docker container | 3 shared VMs free | Full control, but more ops overhead |
| **Cloudflare Workers** | Edge serverless (V8 isolates) | 100K requests/day free | Lowest cold-start latency globally; no built-in DB |

### Why Supabase is the right choice for this project

1. **All-in-one:** Auth + Database + Edge Functions + Storage — no stitching services together
2. **No cold starts:** Supabase Edge Functions use persistent Deno isolates, not spin-up-on-request Lambda
3. **RLS for free:** Row Level Security means auth enforcement at the database layer costs nothing extra
4. **pg_cron:** The scheduled cache cleanup job requires `pg_cron`, which Supabase provides on the free tier
5. **Realtime ready:** When the "social" phase (Phase 3 in the scalability roadmap) comes, Supabase Realtime is already configured in `config.toml`

The first paid Supabase upgrade (Pro at $25/month) unlocks:
- 8GB database storage
- Point-in-time recovery (PITR)
- 500K Edge Function invocations/month
- Daily database backups

Upgrade when you hit ~5,000 DAU or need PITR for compliance.

---

## Troubleshooting

### "supabase: command not found"
```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

### "Error: relation 'profiles' does not exist"
You haven't run the migrations yet. Run `supabase db push` from the `backend/` directory.

### "AuthApiError: Invalid API key"
You're using the wrong key. The `anon` key goes in the frontend. The `service_role` key is backend-only — never put it in `VITE_*` variables.

### CORS errors in the browser console
Your `ALLOWED_ORIGINS` secret doesn't include your frontend domain. Update it:
```bash
supabase secrets set ALLOWED_ORIGINS="http://localhost:5173,https://your-app.vercel.app" \
  --project-ref your-project-ref
```
Then redeploy the functions.

### Magic link emails not arriving (local dev)
Magic link emails are captured by Inbucket in local development. Check http://127.0.0.1:54324 — the email is there.

### OAuth redirect fails in production
Your Vercel domain is not in the Supabase Authentication → URL Configuration → Redirect URLs list. Add `https://your-app.vercel.app/**`.

### TMDB proxy returns 503
The `TMDB_API_KEY` secret is not set in Supabase Vault. Add it via Dashboard → Edge Functions → Secrets or:
```bash
supabase secrets set TMDB_API_KEY="your-key" --project-ref your-project-ref
supabase functions deploy tmdb --no-verify-jwt --project-ref your-project-ref
```
