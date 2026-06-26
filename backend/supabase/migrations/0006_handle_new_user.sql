-- Trigger: handle_new_user
-- Creates a public.profiles row automatically whenever a new auth.users row
-- is inserted. Runs as SECURITY DEFINER so it can bypass RLS to insert the
-- profile row — the authenticated role has no INSERT policy on profiles.
--
-- Username generation:
--   1. Derive a base from the OAuth display name or email prefix.
--   2. Strip non-alphanumeric characters and lowercase.
--   3. Ensure minimum length of 3 characters.
--   4. Append an incrementing numeric suffix until the username is unique.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username  text;
  final_username text;
  counter        int := 0;
BEGIN
  base_username := lower(regexp_replace(
    coalesce(
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    '[^a-z0-9]', '', 'g'
  ));

  IF length(base_username) < 3 THEN
    base_username := 'user' || base_username;
  END IF;

  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter        := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Trigger: update_updated_at_column
-- Keeps updated_at current on tables that track last-modified time.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
