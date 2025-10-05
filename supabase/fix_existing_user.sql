-- Quick fix for existing users who can't login
-- This script specifically handles users that exist in auth.users but not in app_users

-- Step 1: Check current state
SELECT 
  'Before Fix' as stage,
  (SELECT count(*) FROM auth.users) as total_auth_users,
  (SELECT count(*) FROM app_users) as total_app_users,
  (SELECT count(*) 
   FROM auth.users au 
   WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)
  ) as missing_app_users;

-- Step 2: Temporarily disable RLS for easier debugging
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- Step 3: Create app_users for ALL auth.users that don't have one
INSERT INTO app_users (
  id,
  username,
  email,
  role,
  full_name,
  phone,
  avatar_url,
  is_active,
  email_verified,
  created_at,
  updated_at
)
SELECT 
  au.id,
  -- Generate unique username
  COALESCE(
    au.raw_user_meta_data->>'username',
    split_part(au.email, '@', 1) || '_' || substring(md5(au.id::text), 1, 4)
  ) as username,
  au.email,
  -- Cast role to user_role enum
  CASE 
    WHEN au.raw_user_meta_data->>'role' IN ('admin', 'provider', 'homeowner') 
    THEN (au.raw_user_meta_data->>'role')::user_role
    ELSE 'homeowner'::user_role
  END as role,
  COALESCE(
    au.raw_user_meta_data->>'fullName',
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1)
  ) as full_name,
  au.raw_user_meta_data->>'phone' as phone,
  COALESCE(
    au.raw_user_meta_data->>'avatarUrl',
    au.raw_user_meta_data->>'avatar_url'
  ) as avatar_url,
  true as is_active,
  COALESCE(au.email_confirmed_at IS NOT NULL, false) as email_verified,
  COALESCE(au.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM app_users WHERE id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Re-enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the fix
SELECT 
  'After Fix' as stage,
  (SELECT count(*) FROM auth.users) as total_auth_users,
  (SELECT count(*) FROM app_users) as total_app_users,
  (SELECT count(*) 
   FROM auth.users au 
   WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)
  ) as missing_app_users;

-- Step 6: Show all users
SELECT 
  au.email,
  au.created_at as auth_created,
  apu.username,
  apu.role,
  apu.is_active,
  apu.created_at as app_user_created,
  CASE 
    WHEN apu.id IS NOT NULL THEN 'OK'
    ELSE 'MISSING APP_USER'
  END as status
FROM auth.users au
LEFT JOIN app_users apu ON au.id = apu.id
ORDER BY au.created_at DESC;