-- Fix login issue: Database error granting user
-- This migration fixes RLS policies and creates missing app_users records

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON app_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON app_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON app_users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON app_users;

-- Step 2: Create security definer function to avoid recursion
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

-- Step 3: Create new non-recursive RLS policies
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

-- Step 4: Fix trigger function with proper type casting
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
  user_role_val user_role;
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
  
  -- Set role with proper type casting
  user_role_val := CASE 
    WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
    WHEN NEW.raw_user_meta_data->>'role' = 'provider' THEN 'provider'::user_role
    ELSE 'homeowner'::user_role
  END;
  
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
    user_role_val,
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
      user_role_val,
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

-- Step 5: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Create app_users records for existing auth.users that don't have them
DO $$
DECLARE
  auth_record RECORD;
  new_username TEXT;
  user_role_val user_role;
BEGIN
  FOR auth_record IN 
    SELECT id, email, raw_user_meta_data, created_at, email_confirmed_at
    FROM auth.users
    WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = auth.users.id)
  LOOP
    -- Generate username
    new_username := COALESCE(
      auth_record.raw_user_meta_data->>'username',
      split_part(auth_record.email, '@', 1)
    );
    
    IF new_username IS NULL OR new_username = '' THEN
      new_username := 'user_' || substring(auth_record.id::text, 1, 8);
    END IF;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM app_users WHERE username = new_username) LOOP
      new_username := new_username || '_' || substring(md5(random()::text), 1, 4);
    END LOOP;
    
    -- Set role
    user_role_val := CASE 
      WHEN auth_record.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
      WHEN auth_record.raw_user_meta_data->>'role' = 'provider' THEN 'provider'::user_role
      ELSE 'homeowner'::user_role
    END;
    
    -- Insert record
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
    ) VALUES (
      auth_record.id,
      new_username,
      auth_record.email,
      user_role_val,
      COALESCE(
        auth_record.raw_user_meta_data->>'fullName',
        auth_record.raw_user_meta_data->>'full_name',
        split_part(auth_record.email, '@', 1)
      ),
      auth_record.raw_user_meta_data->>'phone',
      COALESCE(
        auth_record.raw_user_meta_data->>'avatarUrl',
        auth_record.raw_user_meta_data->>'avatar_url'
      ),
      true,
      COALESCE(auth_record.email_confirmed_at IS NOT NULL, false),
      COALESCE(auth_record.created_at, NOW()),
      NOW()
    );
  END LOOP;
END $$;