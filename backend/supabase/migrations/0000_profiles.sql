-- profiles table
-- Mirrors auth.users(id) 1-to-1. A row is created automatically by the
-- handle_new_user trigger (migration 0006) when a new auth user signs up.
-- No client INSERT policy — only the trigger can create profile rows.

CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     text        NOT NULL UNIQUE,
  display_name text,
  bio          text,
  avatar_url   text,
  region       char(2)     NOT NULL DEFAULT 'US',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
