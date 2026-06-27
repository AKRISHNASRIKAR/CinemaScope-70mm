# Phase 1 — Monorepo Foundation

> **PR:** #1 · **Branch:** `feat/phase-1-monorepo-foundation` · **Merged to:** `master`

---

## What Is a Monorepo?

A **monorepo** (mono-repository) means a single Git repository that contains multiple distinct projects — in this case, the React frontend and the Node.js/Deno backend — living side-by-side.

**Before Phase 1 (flat structure):**
```
cscope/
├── src/              ← React source (at root)
├── public/
├── index.html
├── vite.config.js
└── package.json      ← mixed frontend + root deps
```

**After Phase 1 (monorepo structure):**
```
cscope/
├── frontend/         ← React workspace
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json  ← frontend-specific deps
│
├── backend/          ← Backend workspace
│   ├── src/
│   ├── supabase/
│   └── package.json  ← backend-specific deps
│
├── package.json      ← workspace root (orchestrates both)
├── .prettierrc       ← shared formatting rules
└── docker-compose.yml
```

**Why monorepo over separate repos?**

| Concern | Separate repos | Monorepo |
|---|---|---|
| Shared type changes | Edit + publish + update in two places | One commit updates both |
| Cross-workspace CI | Two pipeline configs | One pipeline, one PR covers both |
| Onboarding | Clone two repos, configure both | One `git clone`, one `npm install` |
| Atomic changes | Hard to keep in sync | A single commit touches frontend + backend |

---

## npm Workspaces Explained

The root `package.json` uses the `workspaces` field to tell npm about the two sub-packages:

```json
{
  "name": "cinemascope",
  "workspaces": ["frontend", "backend"]
}
```

When you run `npm install` from the root, npm:
1. Reads both `frontend/package.json` and `backend/package.json`
2. Installs all dependencies into the root `node_modules/` (hoisted)
3. Creates symlinks so each workspace can find its deps at `node_modules/<package>`

```
npm install from root
        │
        ├── reads frontend/package.json  →  installs react, vite, swr, etc.
        ├── reads backend/package.json   →  installs drizzle-orm, postgres, zod
        └── hoists everything to root node_modules/
                              │
                    frontend and backend both
                    resolve deps from root node_modules/
```

**Running workspace-specific scripts:**
```bash
npm run dev --workspace=frontend      # runs vite in frontend/
npm run typecheck --workspace=backend # runs tsc in backend/
npm run lint                          # runs lint in BOTH (defined at root)
```

---

## File-by-File Breakdown

### `package.json` (root) — Workspace Orchestrator

```json
{
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "dev":       "npm run dev --workspace=frontend",
    "build":     "npm run build --workspace=frontend",
    "lint":      "npm run lint --workspace=frontend && npm run lint --workspace=backend",
    "format":    "prettier --write ...",
    "typecheck": "npm run typecheck --workspace=backend"
  },
  "devDependencies": {
    "prettier": "^3.4.2"    ← only shared tooling lives here
  }
}
```

**Key point:** The root `package.json` has NO production dependencies — only developer tooling (Prettier) that is shared across both workspaces.

---

### `frontend/package.json` — React Workspace

Contains all the frontend-specific dependencies. Notable change from the old root `package.json`:

| Removed | Added | Reason |
|---|---|---|
| `@auth0/auth0-react` | `@supabase/supabase-js` | Auth0 → Supabase Auth migration |
| `dotenv` | — | Not needed in Vite (uses `import.meta.env`) |

---

### `frontend/.env.example` — Updated Environment Template

Old template exposed `VITE_API_KEY` (TMDB) which was a security problem — Vite bakes env variables starting with `VITE_` into the browser bundle, making the API key visible to anyone who inspects the JavaScript.

```
OLD (insecure):
VITE_API_KEY=your-tmdb-key       ← goes into browser JS bundle!
VITE_BASE_URL=https://api.themoviedb.org/3

NEW (secure):
VITE_SUPABASE_URL=https://project.supabase.co    ← safe: just a URL
VITE_SUPABASE_ANON_KEY=eyJ...                    ← safe: intentionally public
```

The TMDB key moves server-side (into `backend/.env`) and is never exposed to the browser.

---

### `backend/package.json` — Backend Workspace

```json
{
  "name": "@cinemascope/backend",
  "type": "module",              ← ESM modules (import/export, not require)
  "scripts": {
    "typecheck":       "tsc --noEmit",
    "lint":            "eslint src/",
    "db:generate":     "drizzle-kit generate",
    "db:push":         "drizzle-kit push",
    "db:studio":       "drizzle-kit studio",
    "supabase:start":  "supabase start",
    "functions:serve": "supabase functions serve"
  }
}
```

**Key dependencies:**

| Package | What it is | Why |
|---|---|---|
| `drizzle-orm` | TypeScript ORM | Defines DB schema in TypeScript; generates SQL |
| `postgres` | PostgreSQL driver | Drizzle uses this to talk to the DB |
| `zod` | Schema validation | Validates request bodies + query params in Edge Functions |

**Key devDependencies:**

| Package | What it is | Why |
|---|---|---|
| `drizzle-kit` | Drizzle CLI | Generates SQL migrations from schema files |
| `typescript` | TS compiler | Type-checks `src/` files |
| `@typescript-eslint/*` | TS-aware ESLint | Catches type errors at lint time |

---

### `backend/tsconfig.json` — TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,   ← arr[0] returns T | undefined (not T)
    "noImplicitReturns": true,          ← every function branch must return
    "skipLibCheck": true                ← don't type-check node_modules
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "supabase"]  ← supabase/ is Deno, not Node
}
```

**Why `noUncheckedIndexedAccess`?** This catches a very common bug:
```typescript
// WITHOUT the flag — TypeScript thinks arr[0] is always a string:
const arr: string[] = [];
const first: string = arr[0];  // compiles fine, but crashes at runtime!

// WITH the flag — TypeScript correctly types arr[0] as string | undefined:
const first = arr[0];          // type: string | undefined
if (first) console.log(first); // must check before use
```

---

### `backend/eslint.config.js` — Linting Rules

Uses ESLint 9's flat config format. Key rules enforced:

| Rule | What it catches |
|---|---|
| `@typescript-eslint/explicit-function-return-type` | Functions without declared return types |
| `@typescript-eslint/no-explicit-any` | `any` usage (forces proper typing) |
| `@typescript-eslint/consistent-type-imports` | Mixes `import type` and regular `import` |
| `no-console` | Warns on `console.log` (use the structured logger instead) |

---

### `.prettierrc` — Code Formatting

Shared across frontend and backend via the root config:

```json
{
  "semi": true,          ← always semicolons
  "singleQuote": true,   ← 'strings' not "strings"
  "tabWidth": 2,         ← 2-space indentation
  "printWidth": 100,     ← wrap lines at 100 chars
  "trailingComma": "all" ← trailing commas in multi-line objects/arrays
}
```

Prettier is an **opinionated formatter** — it reformats code to a consistent style on every save. This eliminates style debates in code reviews: if it compiles, Prettier makes it look right.

---

### `backend/Dockerfile` — CI Containerisation

```
┌─────────────────────────────────────────────────────┐
│                   Multi-stage Build                  │
│                                                      │
│  Stage: deps         Stage: typecheck   Stage: migrate│
│  ──────────────      ──────────────     ─────────────│
│  npm ci --omit=dev   tsc --noEmit       drizzle push │
│  (prod deps only)    (CI gate)          (DB migrate) │
└─────────────────────────────────────────────────────┘
```

**Multi-stage build** means each stage only includes what it needs:
- `deps` — production node_modules for the smallest runtime image
- `typecheck` — full dev deps needed to run `tsc`
- `migrate` — runs `drizzle-kit push` against a target database URL

The application itself (Supabase Edge Functions + PostgreSQL) is **not deployed via Docker** — Supabase handles that. The Dockerfile is for CI/CD pipelines that need to type-check and run migrations programmatically.

---

### `docker-compose.yml` — Local Dev Convenience

Provides an alternative way to run the frontend without installing Node.js locally:

```yaml
services:
  frontend:
    image: node:22-alpine          ← uses official Node image
    volumes:
      - ./frontend:/app            ← mounts your source code live
    command: npm run dev -- --host 0.0.0.0
    ports:
      - '5173:5173'
    environment:
      VITE_SUPABASE_URL: http://host.docker.internal:54321
```

`host.docker.internal` is the Docker DNS name for the host machine — it lets the containerised frontend reach the Supabase local stack running natively on your Mac.

---

### `.gitignore` Updates

Three new patterns added:

```gitignore
ARCHITECTURE.md          ← stays on disk, never committed
docs/                    ← same — local notes only
docker/data/             ← Docker volume data (large, not for version control)
```

Why gitignore the architecture doc? It's a **living design document** that changes frequently during development and contains implementation decisions that would clutter commit history. It's more useful as a local reference than as a versioned artifact.

---

## Architecture Diagram — After Phase 1

```
┌─────────────────────────────────────────────────────┐
│                   CinemaScope Monorepo               │
│                                                      │
│   ┌─────────────────┐    ┌──────────────────────┐   │
│   │   frontend/      │    │      backend/         │   │
│   │                 │    │                      │   │
│   │  React + Vite   │    │  Drizzle ORM + Zod   │   │
│   │  Tailwind CSS   │    │  Supabase CLI        │   │
│   │  SWR            │    │  TypeScript strict   │   │
│   │                 │    │  Edge Functions      │   │
│   │  npm workspace  │    │  npm workspace       │   │
│   └─────────────────┘    └──────────────────────┘   │
│                                                      │
│   Shared: .prettierrc, root package.json, .gitignore │
└─────────────────────────────────────────────────────┘
               │                    │
               ▼                    ▼
         Vercel CDN           Supabase Platform
         (frontend)        (DB + Auth + Functions)
```

---

## What This Phase Achieved

- **Git history is clean.** All 52 frontend files were moved with `git mv`, so `git log -- frontend/src/App.jsx` shows the full history before the rename.
- **`npm install` at root** installs everything for both workspaces.
- **Linting + formatting** are configured and enforced from day one.
- **The TMDB API key is no longer in any frontend env template** — the architectural decision to move it server-side is reflected in the file structure from this phase forward.
- **CI can run in Docker** without the developer's machine configuration.
