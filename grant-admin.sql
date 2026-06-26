-- ============================================================
-- Grant Admin Role to Existing User
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- STEP 1: Find your user's ID by their email address
-- Replace 'your-email@example.com' with the email you used to sign up
SELECT id, email, created_at
FROM auth.users
WHERE email = 'sshathiskumar54@gmail.com';

-- STEP 2: After noting the user ID from Step 1, run this insert
-- Replace 'PASTE-USER-ID-HERE' with the actual UUID from Step 1
INSERT INTO public.user_roles (user_id, role)
VALUES ('PASTE-USER-ID-HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- STEP 3: Verify the role was inserted
SELECT ur.user_id, ur.role, au.email
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id;

-- ============================================================
-- ALTERNATIVE: Grant admin to ALL existing users (first-time setup)
-- Uncomment and run only if you want every existing user to be admin
-- ============================================================
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'::app_role FROM auth.users
-- ON CONFLICT (user_id, role) DO NOTHING;
