-- ============================================================================
-- User Profile Enhancements for Renovation Platform
-- ============================================================================

-- 1. Extend app_users table with profile fields
ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add constraints
ALTER TABLE app_users
ADD CONSTRAINT bio_length CHECK (char_length(bio) <= 500);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_users_location ON app_users(location);

-- 3. Update RLS policies for profile editing
-- Users can update own profile (including bio, location, etc.)
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
CREATE POLICY "Users can update own profile"
  ON app_users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Create function to get user profile with stats
CREATE OR REPLACE FUNCTION get_user_profile_with_stats(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  username TEXT,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  company_name TEXT,
  role TEXT,
  provider_type_id UUID,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  follower_count BIGINT,
  following_count BIGINT,
  post_count BIGINT,
  bookmark_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.avatar_url,
    u.bio,
    u.location,
    u.website,
    u.company_name,
    u.role::TEXT,
    u.provider_type_id,
    u.is_active,
    u.created_at,
    u.updated_at,
    (SELECT COUNT(*) FROM follows WHERE followed_id = user_uuid)::BIGINT as follower_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = user_uuid)::BIGINT as following_count,
    (SELECT COUNT(*) FROM posts WHERE user_id = user_uuid AND is_deleted = false)::BIGINT as post_count,
    (SELECT COUNT(*) FROM bookmarks WHERE user_id = user_uuid)::BIGINT as bookmark_count
  FROM app_users u
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to get user bookmarks with post details
CREATE OR REPLACE FUNCTION get_user_bookmarks(user_uuid UUID)
RETURNS TABLE(
  bookmark_id UUID,
  post_id UUID,
  title TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  author_username TEXT,
  author_avatar TEXT,
  like_count INTEGER,
  comment_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bookmark_id,
    p.id as post_id,
    p.title,
    p.content,
    p.created_at,
    u.username as author_username,
    u.avatar_url as author_avatar,
    p.like_count,
    p.comment_count
  FROM bookmarks b
  JOIN posts p ON b.post_id = p.id
  JOIN app_users u ON p.user_id = u.id
  WHERE b.user_id = user_uuid
  AND p.is_deleted = false
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_profile_with_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_bookmarks(UUID) TO authenticated;
