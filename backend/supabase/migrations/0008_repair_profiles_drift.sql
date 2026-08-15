-- Repairs schema drift on public.profiles.
--
-- The remote database had an earlier profiles table applied from a superseded
-- branch (id, username, avatar_url, created_at — no auth.users FK). Because
-- 0000_profiles.sql uses CREATE TABLE IF NOT EXISTS, re-running it silently
-- no-ops against that table, so the missing columns and the foreign key have
-- to be added explicitly here.
--
-- Every statement is idempotent, so this is a no-op on a database that already
-- has the intended 0000_profiles.sql shape.

-- ── Missing columns ───────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio          text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region       char(2)     NOT NULL DEFAULT 'US';
-- updated_at is required by the update_profiles_updated_at trigger (0006);
-- without it every UPDATE on profiles raises "record NEW has no field updated_at".
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now();

-- ── created_at was nullable in the old table ──────────────────────────────
ALTER TABLE public.profiles ALTER COLUMN created_at SET DEFAULT now();
UPDATE public.profiles SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.profiles ALTER COLUMN created_at SET NOT NULL;

-- ── Foreign key to auth.users ─────────────────────────────────────────────
-- Without this, deleting an auth user orphans their profile row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype  = 'f'
      AND conname  = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── Backfill profiles for users who signed up before the trigger existed ──
-- handle_new_user (0006) was never applied on this database, so any existing
-- auth.users row has no matching profile. The uuid fragment guarantees a
-- unique username without needing the trigger's retry loop.
INSERT INTO public.profiles (id, username, avatar_url)
SELECT
  u.id,
  COALESCE(
    NULLIF(
      regexp_replace(
        lower(coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))),
        '[^a-z0-9]', '', 'g'
      ),
      ''
    ),
    'user'
  ) || substr(replace(u.id::text, '-', ''), 1, 6),
  u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (username) DO NOTHING;
