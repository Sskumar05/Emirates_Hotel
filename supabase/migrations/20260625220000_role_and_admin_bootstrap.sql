
-- ============================================================
-- Migration: role column in profiles + first-user admin bootstrap
-- ============================================================

-- 1. Add 'role' column to profiles (default 'user')
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('admin', 'staff', 'user'));

-- 2. Add a helper function: returns true if the calling user is admin via profiles
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'admin'
  );
$$;

-- 3. Replace handle_new_user so it:
--    a) inserts the profile row
--    b) if this is the very first user → set role = 'admin'
--       AND insert into user_roles for backwards compatibility
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role TEXT := 'user';
BEGIN
  -- Check if this is the first user ever registered
  IF NOT EXISTS (SELECT 1 FROM public.profiles) THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    v_role
  )
  ON CONFLICT (id) DO UPDATE
    SET email        = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        role         = CASE WHEN public.profiles.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END;

  -- Keep user_roles table in sync for any legacy queries
  IF v_role = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Make sure the trigger exists (it was defined in the first migration;
-- use CREATE OR REPLACE via DROP + CREATE to be idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS: admins can read ALL profiles
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- 5. RLS: admins can update any profile's role
CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
