# Getting Started — Running the Backend Locally

This guide takes you from a fresh clone to a fully working local backend with Supabase running on your machine and the Edge Functions serving requests.

---

## Prerequisites

Install these before starting:

| Tool | Version | How to get it |
|---|---|---|
| Node.js | 22+ | `brew install node` or [nodejs.org](https://nodejs.org) |
| Docker Desktop | Latest | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) — must be running |
| Supabase CLI | Latest | `brew install supabase/tap/supabase` |
| Deno | Latest | `brew install deno` |

Verify everything is installed:
```bash
node --version        # v22.x.x
docker --version      # Docker version 27.x
supabase --version    # 2.x.x
deno --version        # deno 2.x.x
```

**Docker must be running** (open Docker Desktop) before any `supabase` commands work.

---

## Step 1 — Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd cscope

# Install all workspace dependencies (frontend + backend) from root:
npm install
```

npm workspaces installs everything in one command. You'll see a single `node_modules/` at the repo root with symlinks for both workspaces.

---

## Step 2 — Start Supabase Locally

```bash
cd backend
supabase start
```

This command:
1. Pulls Docker images for PostgreSQL, GoTrue (auth), PostgREST, and the Edge Runtime (~2 minutes on first run)
2. Starts all services in Docker containers
3. Prints connection details:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGc...
service_role key: eyJhbGc...
```

**Save these values** — you'll need them for the `.env` file in the next step.

---

## Step 3 — Configure Environment Variables

```bash
# Still in backend/
cp .env.example .env
```

Open `backend/.env` and fill in the values from the `supabase start` output:

```bash
# PostgreSQL direct connection (for drizzle-kit migrations)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Supabase local API
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase start output>

# TMDB — get a free key at https://www.themoviedb.org/settings/api
TMDB_API_KEY=your-tmdb-api-key-here

# CORS — allowed origins for Edge Functions
ALLOWED_ORIGINS=http://localhost:5173
```

**Where to get a TMDB API key:**
1. Create a free account at themoviedb.org
2. Go to Settings → API → Create → Developer
3. Copy the "API Key (v3 auth)" value

---

## Step 4 — Run Database Migrations

```bash
# From backend/
npm run db:push
```

This runs `drizzle-kit push` which applies all migration files in `supabase/migrations/` to the local PostgreSQL database in order.

Expected output:
```
[✓] Changes applied:
  - Created table public.profiles
  - Created table public.watch_history
  - Created table public.watchlist
  - Created table public.reviews
  - Created table public.tmdb_cache
  - Applied RLS policies
  - Created triggers (handle_new_user, set_updated_at)
  - Scheduled pg_cron job
```

**Verify the schema in Supabase Studio:**
Open http://127.0.0.1:54323 → Table Editor. You should see all 5 tables.

Alternatively with Drizzle Studio:
```bash
npm run db:studio   # opens a browser UI showing the schema
```

---

## Step 5 — Configure Edge Function Environment Variables

Edge Functions (Deno) read environment variables differently from Node.js. They use `Deno.env.get('KEY')` and are configured via a separate file:

```bash
# Create the secrets file for local serving:
mkdir -p supabase/functions
cat > supabase/.env.local << EOF
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<your anon key>
SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
TMDB_API_KEY=<your TMDB key>
ALLOWED_ORIGINS=http://localhost:5173
EOF
```

---

## Step 6 — Serve Edge Functions Locally

```bash
# From backend/
npm run functions:serve
```

Or with the env file explicitly:
```bash
supabase functions serve --env-file supabase/.env.local
```

Output:
```
Setting up Edge Functions runtime...
Serving functions at http://127.0.0.1:54321/functions/v1/<function-name>
```

The five functions are now available at:
```
http://127.0.0.1:54321/functions/v1/tmdb/movie/550
http://127.0.0.1:54321/functions/v1/profile
http://127.0.0.1:54321/functions/v1/watch-history
http://127.0.0.1:54321/functions/v1/watchlist
http://127.0.0.1:54321/functions/v1/reviews
```

---

## Step 7 — Test the TMDB Proxy

```bash
# Test the TMDB proxy (no auth required):
curl "http://127.0.0.1:54321/functions/v1/tmdb/movie/550" | jq .title

# Expected: "Fight Club"
# Check headers:
curl -I "http://127.0.0.1:54321/functions/v1/tmdb/movie/550"
# X-Cache: MISS  (first call — fetched from TMDB)

# Call again:
curl -I "http://127.0.0.1:54321/functions/v1/tmdb/movie/550"
# X-Cache: HIT   (second call — served from tmdb_cache table)
```

---

## Step 8 — Connect the Frontend

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<your anon key from supabase start>
```

Start the frontend:
```bash
npm run dev
```

Open http://localhost:5173. The frontend is now connected to your local Supabase instance.

---

## Local Architecture at This Point

```
Your Machine
│
├── Docker (managed by Supabase CLI)
│   ├── PostgreSQL :54322    ← database
│   ├── GoTrue (Auth) :54321/auth    ← handles login/signup
│   ├── PostgREST :54321/rest    ← auto REST API from tables
│   └── Supabase Edge Runtime :54321/functions
│
├── Node.js (terminal 1)
│   └── supabase functions serve    ← your Edge Functions (live reload)
│
├── Node.js (terminal 2)
│   └── npm run dev --workspace=frontend    ← Vite dev server :5173
│
└── Supabase Studio → http://127.0.0.1:54323    ← browser UI
```

---

## Useful Commands

```bash
# Stop Supabase (preserves data):
supabase stop

# Stop and reset database (erases all data):
supabase stop --no-backup

# View Edge Function logs:
supabase functions logs tmdb --scroll

# Reset database to migrations (re-run all migrations on a fresh DB):
supabase db reset

# Type-check the backend:
npm run typecheck --workspace=backend

# Lint:
npm run lint --workspace=backend

# Open Drizzle Studio (schema browser):
npm run db:studio --workspace=backend
```

---

## Connecting to Production Supabase

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New project"
3. Choose a region close to your users
4. Set a strong database password (save it — you'll need it for `DATABASE_URL`)

### Step 2 — Get Your Production Credentials

In the Supabase Dashboard for your project:
- **Settings → API** → copy `Project URL` and both `anon` + `service_role` keys
- **Settings → Database → Connection string** → copy the URI (this is your `DATABASE_URL`)

The URI looks like:
```
postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

Replace `<password>` with your database password.

### Step 3 — Apply Migrations to Production

```bash
# From backend/
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres \
  npm run db:push
```

This applies all 8 migration files to the production database.

### Step 4 — Enable pg_cron (Production)

The `0007_pg_cron.sql` migration requires the `pg_cron` extension. Enable it in the Supabase Dashboard:
- **Database → Extensions** → search for "pg_cron" → toggle on

Then re-run migrations or apply `0007_pg_cron.sql` manually via the SQL Editor.

### Step 5 — Deploy Edge Functions

```bash
# Log in to Supabase CLI:
supabase login

# Link to your production project:
supabase link --project-ref <your-project-ref>

# Deploy all functions:
supabase functions deploy tmdb
supabase functions deploy profile
supabase functions deploy watch-history
supabase functions deploy watchlist
supabase functions deploy reviews
```

### Step 6 — Set Production Secrets

```bash
supabase secrets set TMDB_API_KEY=your-tmdb-key
supabase secrets set ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
# SUPABASE_URL and keys are injected automatically in production
```

### Step 7 — Update Frontend for Production

In `frontend/.env.production` (or Vercel environment variables):
```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<production anon key>
```

---

## Troubleshooting

### `supabase start` fails
- Ensure Docker Desktop is running and has at least 4GB RAM allocated (Docker Desktop → Settings → Resources)
- Run `supabase stop --no-backup && supabase start` to reset

### Edge Function can't find `TMDB_API_KEY`
- Verify `supabase/.env.local` exists and has the key
- Run `supabase functions serve --env-file supabase/.env.local` explicitly

### `npm run db:push` shows no changes
- Run `supabase db reset` to wipe the database and re-apply all migrations from scratch

### TypeScript errors in `supabase/functions/`
- These files are Deno (not Node.js) and use `Deno.serve()`, `npm:` imports, etc.
- They are excluded from `backend/tsconfig.json` intentionally — use `deno check` instead:
  ```bash
  deno check supabase/functions/tmdb/index.ts
  ```

### CORS errors in browser
- Verify `ALLOWED_ORIGINS` in `supabase/.env.local` includes `http://localhost:5173`
- Confirm the Edge Functions are running (`supabase functions serve` is active in a terminal)
