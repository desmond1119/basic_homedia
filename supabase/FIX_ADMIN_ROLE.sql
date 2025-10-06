-- ============================================================================
-- Fix Admin Role for n46angle@gmail.com
-- ============================================================================

-- 1. Check current role
SELECT id, email, username, role FROM app_users WHERE email = 'n46angle@gmail.com';

-- 2. Update to admin role
UPDATE app_users 
SET role = 'admin'::user_role,
    updated_at = NOW()
WHERE email = 'n46angle@gmail.com';

-- 3. Verify the update
SELECT id, email, username, role FROM app_users WHERE email = 'n46angle@gmail.com';

-- 4. Also update in user_profiles view (it will reflect automatically)
-- Check user_profiles
SELECT id, email, username, role FROM user_profiles WHERE email = 'n46angle@gmail.com';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Admin role updated for n46angle@gmail.com';
  RAISE NOTICE '✅ Please logout and login again to refresh the session';
END $$;
