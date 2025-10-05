-- ============================================================================
-- COMPLETE DATABASE FIX - Run this in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/jufwllhkgtvovyazgxld/sql
-- ============================================================================

-- 1. Add missing columns to app_users
ALTER TABLE public.app_users
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS price_range JSONB DEFAULT '{"min": 0, "max": 0, "currency": "HKD"}',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS completed_projects INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS overall_rating NUMERIC(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;

-- 2. Recreate user_profiles view with all necessary fields
DROP VIEW IF EXISTS public.user_profiles CASCADE;
CREATE VIEW public.user_profiles 
WITH (security_invoker = false)
AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.role,
  u.full_name,
  u.phone,
  u.avatar_url,
  u.is_active,
  u.email_verified,
  u.created_at,
  u.company_name,
  u.logo_url,
  u.bio,
  u.price_range,
  u.social_links,
  u.completed_projects,
  u.experience_years,
  u.team_size,
  u.founded_year,
  u.overall_rating,
  u.total_reviews,
  u.is_approved,
  pt.type_name as provider_type,
  pt.display_name as provider_type_display
FROM public.app_users u
LEFT JOIN public.provider_types pt ON u.provider_type_id = pt.id;

-- Grant access to authenticated users and anonymous users
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- Add RLS policy for the view (views inherit table RLS)
-- We need to ensure the underlying app_users table allows the queries

-- 3. Fix RLS policies for registration
-- Drop and recreate the INSERT policy for new registrations
DROP POLICY IF EXISTS "Auth users can insert" ON public.app_users;
CREATE POLICY "Auth users can insert" ON public.app_users
FOR INSERT
WITH CHECK (
  auth.uid() = id
  OR auth.role() = 'service_role'
);

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
CREATE POLICY "Users can view own profile" ON public.app_users
FOR SELECT USING (
  auth.uid() = id
  OR auth.role() = 'service_role'
);

-- Add policy for viewing other providers (public profiles)
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.app_users;
CREATE POLICY "Anyone can view provider profiles" ON public.app_users
FOR SELECT USING (role = 'provider' AND is_active = true);

-- Fix admin function
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT role = 'admin' INTO v_is_admin
  FROM public.app_users
  WHERE id = p_user_id;

  RETURN COALESCE(v_is_admin, false);
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

-- Admins can view all users
DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;
CREATE POLICY "Admins can view all users" ON public.app_users
FOR SELECT USING (public.is_admin(auth.uid()));

-- 4. Ensure username check function exists
CREATE OR REPLACE FUNCTION public.is_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.app_users WHERE LOWER(username) = LOWER(check_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO anon;

-- 5. Create necessary tables if they don't exist
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON public.follows(followed_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view follows" ON public.follows;
CREATE POLICY "Users can view follows" ON public.follows
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create follows" ON public.follows;
CREATE POLICY "Users can create follows" ON public.follows
FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete own follows" ON public.follows;
CREATE POLICY "Users can delete own follows" ON public.follows
FOR DELETE USING (auth.uid() = follower_id);

-- 6. Create bookmarks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  post_id UUID,
  bookmark_type TEXT DEFAULT 'post' CHECK (bookmark_type IN ('post', 'image', 'company')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id, bookmark_type)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post ON public.bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_type ON public.bookmarks(bookmark_type);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can create own bookmarks" ON public.bookmarks
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
FOR DELETE USING (auth.uid() = user_id);

-- 7. Create a test admin user (optional - comment out if not needed)
-- This will help you debug by having an admin account
-- Password: admin123456
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@basie.test',
  '$2a$10$K8K8K8K8K8K8K8K8K8K8K.',  -- Replace with actual bcrypt hash
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.app_users (id, username, email, role, full_name, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'admin@basie.test',
  'admin',
  'System Administrator',
  true
) ON CONFLICT (id) DO NOTHING;
*/

-- 8. Verify the setup
SELECT 
  'app_users table' as check_item,
  COUNT(*) as count,
  'Should have columns: company_name, logo_url, bio, etc.' as note
FROM public.app_users
UNION ALL
SELECT 
  'user_profiles view' as check_item,
  COUNT(*) as count,
  'Should return data without errors' as note
FROM public.user_profiles
UNION ALL
SELECT 
  'provider_types' as check_item,
  COUNT(*) as count,
  'Should have at least 3 types' as note
FROM public.provider_types;

-- 9. Test registration flow
SELECT 
  'is_username_available' as function_test,
  public.is_username_available('testuser123') as available,
  'Should return true for new usernames' as note;

-- Done!
SELECT 'Database schema fix complete!' as status;
