    -- Simple profile system - no complex RPC, no views, direct queries only

    -- Ensure all required columns exist
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS location TEXT;
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS website TEXT;
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS company_name TEXT;

    -- Create index on auth_id for fast lookups
    CREATE INDEX IF NOT EXISTS idx_app_users_auth_id ON app_users(auth_id);

    -- Simple function to get user by auth_id or id
    CREATE OR REPLACE FUNCTION get_user_by_id(user_id UUID)
    RETURNS TABLE (
    id UUID,
    auth_id UUID,
    username TEXT,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role TEXT,
    is_active BOOLEAN,
    email_verified BOOLEAN,
    phone TEXT,
    location TEXT,
    website TEXT,
    company_name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
    ) AS $$
    BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.auth_id,
        u.username,
        u.email,
        u.full_name,
        u.avatar_url,
        u.bio,
        u.role,
        u.is_active,
        u.email_verified,
        u.phone,
        u.location,
        u.website,
        u.company_name,
        u.created_at,
        u.updated_at
    WHERE u.id = user_id OR u.auth_id = user_id
    LIMIT 1;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_stats(UUID);

-- Simple stats calculation (no complex joins)
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE (
  posts_count BIGINT,
  followers_count BIGINT,
  following_count BIGINT,
  bookmarks_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM posts WHERE user_id = get_user_stats.user_id AND is_deleted = false),
    (SELECT COUNT(*) FROM follows WHERE following_id = get_user_stats.user_id),
    (SELECT COUNT(*) FROM follows WHERE follower_id = get_user_stats.user_id),
    (SELECT COUNT(*) FROM bookmarks WHERE user_id = get_user_stats.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
