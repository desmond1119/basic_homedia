-- Fix infinite recursion in app_users RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON app_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON app_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON app_users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON app_users;

-- Create security definer function to check user permissions without recursion
CREATE OR REPLACE FUNCTION public.is_user_allowed(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN auth.uid() = user_id;
END;
$$;

-- Create new RLS policies using security definer function
CREATE POLICY "Users can view their own profile"
  ON app_users
  FOR SELECT
  USING (public.is_user_allowed(id));

CREATE POLICY "Users can insert their own profile"
  ON app_users
  FOR INSERT
  WITH CHECK (public.is_user_allowed(id));

CREATE POLICY "Users can update their own profile"
  ON app_users
  FOR UPDATE
  USING (public.is_user_allowed(id))
  WITH CHECK (public.is_user_allowed(id));

-- Recreate auth trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_username TEXT;
BEGIN
  -- Generate username from metadata or email
  generated_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1),
    'user_' || substring(NEW.id::text, 1, 8)
  );
  
  -- Ensure username is unique by appending random string if needed
  WHILE EXISTS (SELECT 1 FROM app_users WHERE username = generated_username) LOOP
    generated_username := generated_username || '_' || substring(md5(random()::text), 1, 4);
  END LOOP;
  
  INSERT INTO public.app_users (
    id,
    username,
    email,
    full_name,
    phone,
    avatar_url,
    role,
    provider_type_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    generated_username,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'avatarUrl', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'homeowner'::user_role),
    (NEW.raw_user_meta_data->>'providerTypeId')::uuid,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), app_users.username),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), app_users.full_name),
    phone = COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), app_users.phone),
    avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), app_users.avatar_url),
    role = COALESCE((NULLIF(NEW.raw_user_meta_data->>'role', ''))::user_role, app_users.role),
    provider_type_id = COALESCE((NEW.raw_user_meta_data->>'providerTypeId')::uuid, app_users.provider_type_id),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
