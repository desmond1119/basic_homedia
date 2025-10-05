-- Complete Diagnostic and Fix for Login Issue
-- Execute this step by step in Supabase SQL Editor

-- ==========================================
-- STEP 1: Diagnose Current State
-- ==========================================

-- Check existing users
SELECT 'Auth Users' as check_type, count(*) as count FROM auth.users
UNION ALL
SELECT 'App Users' as check_type, count(*) FROM app_users
UNION ALL
SELECT 'Orphaned Auth Users' as check_type, count(*) 
FROM auth.users au 
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id);

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'app_users';

-- Check existing policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'app_users';

-- Check trigger
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'app_users'::regclass;

-- ==========================================
-- STEP 2: Temporary Disable RLS for Testing
-- ==========================================

-- Disable RLS temporarily to test
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 3: Fix Orphaned Auth Users
-- ==========================================

-- Create app_users records for any auth users that don't have them
DO $$
DECLARE
  auth_user RECORD;
  new_username TEXT;
BEGIN
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)
  LOOP
    -- Generate username
    new_username := COALESCE(
      auth_user.raw_user_meta_data->>'username',
      split_part(auth_user.email, '@', 1),
      'user_' || substring(auth_user.id::text, 1, 8)
    );
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM app_users WHERE username = new_username) LOOP
      new_username := new_username || '_' || substring(md5(random()::text), 1, 4);
    END LOOP;
    
    -- Insert
    INSERT INTO app_users (
      id, username, email, role, 
      full_name, phone, avatar_url,
      created_at, updated_at
    )
    VALUES (
      auth_user.id,
      new_username,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'role', 'homeowner')::user_role,
      COALESCE(
        auth_user.raw_user_meta_data->>'fullName',
        auth_user.raw_user_meta_data->>'full_name',
        ''
      ),
      auth_user.raw_user_meta_data->>'phone',
      COALESCE(
        auth_user.raw_user_meta_data->>'avatarUrl',
        auth_user.raw_user_meta_data->>'avatar_url'
      ),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created app_user for: %', auth_user.email;
  END LOOP;
END $$;

-- ==========================================
-- STEP 4: Clean Up and Recreate Policies
-- ==========================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON app_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON app_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON app_users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON app_users;
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
DROP POLICY IF EXISTS "Auth users can insert" ON app_users;
DROP POLICY IF EXISTS "Admins can view all users" ON app_users;

-- Create security definer function (no recursion)
CREATE OR REPLACE FUNCTION public.is_user_allowed(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid() = user_id;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_user_allowed(uuid) TO authenticated;

-- Re-enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "allow_select_own"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (public.is_user_allowed(id));

CREATE POLICY "allow_insert_own"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_user_allowed(id));

CREATE POLICY "allow_update_own"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (public.is_user_allowed(id))
  WITH CHECK (public.is_user_allowed(id));

-- Allow admins to view all
CREATE POLICY "allow_admin_select_all"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.id = auth.uid() AND au.role = 'admin'
    )
  );

-- ==========================================
-- STEP 5: Fix Trigger Function
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_username TEXT;
  username_suffix TEXT;
  attempt INTEGER := 0;
BEGIN
  -- Generate base username
  generated_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Fallback if empty
  IF generated_username IS NULL OR generated_username = '' THEN
    generated_username := 'user_' || substring(NEW.id::text, 1, 8);
  END IF;
  
  -- Ensure uniqueness with loop protection
  WHILE EXISTS (SELECT 1 FROM app_users WHERE username = generated_username) AND attempt < 10 LOOP
    username_suffix := substring(md5(random()::text || attempt::text), 1, 4);
    generated_username := split_part(COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), '_', 1) || '_' || username_suffix;
    attempt := attempt + 1;
  END LOOP;
  
  -- Insert with all fields
  INSERT INTO public.app_users (
    id,
    username,
    email,
    full_name,
    phone,
    avatar_url,
    role,
    provider_type_id,
    is_active,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    generated_username,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'avatarUrl', NEW.raw_user_meta_data->>'avatar_url'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner')::user_role,
    (NEW.raw_user_meta_data->>'providerTypeId')::uuid,
    true,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = CASE 
      WHEN NEW.raw_user_meta_data->>'username' IS NOT NULL 
      THEN NEW.raw_user_meta_data->>'username'
      ELSE app_users.username
    END,
    full_name = COALESCE(
      NULLIF(EXCLUDED.full_name, ''),
      app_users.full_name
    ),
    phone = COALESCE(
      NEW.raw_user_meta_data->>'phone',
      app_users.phone
    ),
    avatar_url = COALESCE(
      NULLIF(EXCLUDED.avatar_url, ''),
      app_users.avatar_url
    ),
    role = COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      app_users.role
    ),
    provider_type_id = COALESCE(
      (NEW.raw_user_meta_data->>'providerTypeId')::uuid,
      app_users.provider_type_id
    ),
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, app_users.email_verified),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block auth
    RAISE WARNING 'Error in handle_new_user for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- STEP 6: Verify Fix
-- ==========================================

SELECT 
  'Final Check' as status,
  (SELECT count(*) FROM auth.users) as auth_users,
  (SELECT count(*) FROM app_users) as app_users,
  (SELECT count(*) FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)) as orphans,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'app_users') as policies,
  (SELECT count(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') as triggers;

-- List all app_users
SELECT id, username, email, role, is_active, created_at 
FROM app_users 
ORDER BY created_at DESC 
LIMIT 10;
