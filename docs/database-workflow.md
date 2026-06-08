# CinemaScope Backend & Database Workflow

This document explains exactly how your local database, Docker, Drizzle, and Supabase all connect together. You don't need to manually configure Dockerfiles or use `psql` to create databases—Supabase automates the heavy lifting!

---

## 1. The Database & Docker (No Dockerfile needed!)

When you use Supabase for local development, you **do not need a custom Dockerfile**.

Instead of manually installing PostgreSQL and creating databases with `psql`, you just run:
```bash
cd backend
npx supabase start
```

**What happens under the hood?**
1. The Supabase CLI uses your installed Docker app (Docker Desktop or OrbStack) to automatically download official Supabase images.
2. It spins up a fully configured PostgreSQL database.
3. It exposes this database locally on port `54322`. 
4. It also spins up a local web UI called **Supabase Studio** at `http://127.0.0.1:54323` where you can view your tables visually.

Your database connection string for local development is always:
`postgresql://postgres:postgres@127.0.0.1:54322/postgres`

---

## 2. How Drizzle Connects

Drizzle is your **ORM** (Object-Relational Mapper). It allows you to define your database tables using TypeScript instead of writing raw SQL.

We already created `backend/drizzle.config.ts` for you. If you look inside it, you'll see it points to the exact local database URL mentioned above:
```typescript
dbCredentials: {
  url: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
}
```

This means Drizzle knows exactly how to talk to the PostgreSQL database that `npx supabase start` just spun up!

---

## 3. Your Daily Workflow (Step-by-Step)

Here is exactly what you will do when you want to create a new table or change your database:

### Step 1: Start your local Supabase stack
Always make sure Docker is running, then run:
```bash
cd backend
npx supabase start
```

### Step 2: Write your Schema in TypeScript
Open `backend/src/db/schema/users.ts` (or create a new file like `movies.ts`). Define your table:
```typescript
import { pgTable, text } from 'drizzle-orm/pg-core';

export const movies = pgTable('movies', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
});
```

### Step 3: Generate the SQL Migration
Tell Drizzle to look at your TypeScript files and generate the raw SQL needed to create the tables.
```bash
cd backend
npx drizzle-kit generate
```
*(This creates a `.sql` file inside `backend/supabase/migrations/`)*

### Step 4: Push the changes to your local database
Apply those SQL changes directly to your running local PostgreSQL database.
```bash
npx drizzle-kit push
```

### Step 5: View your changes!
Open **Supabase Studio** in your browser at `http://127.0.0.1:54323`. 
Click on "Table Editor" and you will see your newly created tables ready to use.

---

## 4. Fixing the Current Version Mismatch

Earlier, when we tried to run `npx drizzle-kit generate`, we hit an error: *"Please install latest version of drizzle-orm"*. 

This happened because the `drizzle-orm` version in your `package.json` is `0.45.2`, but `drizzle-kit` is an older version (`0.31.10`). They must match.

**To fix this, run these exact commands from your root folder:**
```bash
npm install drizzle-orm@latest -w backend
npm install -D drizzle-kit@latest -w backend
```
Once that finishes, your workflow is fully set up and you can proceed to Step 3!
