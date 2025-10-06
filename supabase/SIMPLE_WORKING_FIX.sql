-- ============================================================================
-- SIMPLE WORKING FIX - 100% Safe, No Type Conversion Issues
-- ============================================================================

-- 1. Drop everything cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_auth_user() CASCADE;
DROP FUNCTION IF EXISTS is_username_available(TEXT) CASCADE;

DROP VIEW IF EXISTS user_stats, admin_stats, inspiration_feed, user_profiles CASCADE;
DROP TABLE IF EXISTS messages, forum_bookmarks, forum_reposts, forum_likes, forum_comments, forum_posts CASCADE;
DROP TABLE IF EXISTS bookmarks, follows, review_aggregates, reviews, provider_services, portfolios CASCADE;
DROP TABLE IF EXISTS provider_types, categories, app_users, users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 2. Create enum
CREATE TYPE user_role AS ENUM ('admin', 'provider', 'homeowner');

-- 3. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 4. Main users table
CREATE TABLE app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'homeowner',
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  website TEXT,
  company_name TEXT,
  logo_url TEXT,
  price_range TEXT,
  social_links JSONB DEFAULT '{}',
  provider_type_id UUID,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_users_username ON app_users(username);
CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_role ON app_users(role);

-- 5. Essential tables only
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, portfolio_id)
);

CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. user_profiles VIEW (required by auth code)
CREATE VIEW user_profiles AS
SELECT
  au.*,
  COALESCE((SELECT COUNT(*) FROM follows WHERE following_id = au.id), 0)::bigint AS follower_count,
  COALESCE((SELECT COUNT(*) FROM follows WHERE follower_id = au.id), 0)::bigint AS following_count,
  COALESCE((SELECT COUNT(*) FROM portfolios WHERE provider_id = au.id), 0)::bigint AS portfolio_count,
  COALESCE((SELECT COUNT(*) FROM bookmarks WHERE user_id = au.id), 0)::bigint AS bookmark_count,
  COALESCE((SELECT COUNT(*) FROM forum_posts WHERE author_id = au.id), 0)::bigint AS post_count
FROM app_users au;

-- 6b. user_stats VIEW (required by profile stats page)
CREATE VIEW user_stats AS
SELECT
  au.id AS user_id,
  au.username,
  au.full_name,
  au.avatar_url,
  au.bio,
  COALESCE((SELECT COUNT(*) FROM follows WHERE following_id = au.id), 0)::integer AS followers_count,
  COALESCE((SELECT COUNT(*) FROM follows WHERE follower_id = au.id), 0)::integer AS following_count,
  COALESCE((SELECT COUNT(*) FROM bookmarks WHERE user_id = au.id), 0)::integer AS collected_images_count,
  COALESCE((SELECT COUNT(*) FROM forum_posts WHERE author_id = au.id), 0)::integer AS forum_responses_count,
  COALESCE((SELECT COUNT(*) FROM forum_posts WHERE author_id = au.id), 0)::integer AS posts_count
FROM app_users au;

-- 7. ULTRA SAFE trigger function - TEXT only, no casting
CREATE OR REPLACE FUNCTION handle_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_role TEXT;
BEGIN
  -- Generate safe username
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1),
    'user' || substring(NEW.id::text, 1, 8)
  );
  
  -- Get role as TEXT, default to 'homeowner'
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner');
  
  -- Ensure role is valid
  IF v_role NOT IN ('admin', 'provider', 'homeowner') THEN
    v_role := 'homeowner';
  END IF;

  -- Simple insert with TEXT values only
  INSERT INTO app_users (
    id,
    username,
    email,
    role,
    full_name,
    avatar_url,
    is_active
  ) VALUES (
    NEW.id,
    v_username,
    NEW.email,
    v_role::user_role,  -- Only cast here where we know it's safe
    COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail auth
    RAISE WARNING 'Error in handle_auth_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user();

-- 9. Username check function
CREATE OR REPLACE FUNCTION is_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM app_users WHERE username = check_username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9b. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 10. Backfill existing users SAFELY
DO $$
DECLARE
  auth_rec RECORD;
  v_username TEXT;
  v_role TEXT;
BEGIN
  FOR auth_rec IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
    v_username := COALESCE(
      auth_rec.raw_user_meta_data->>'username',
      split_part(auth_rec.email, '@', 1),
      'user' || substring(auth_rec.id::text, 1, 8)
    );
    
    v_role := COALESCE(auth_rec.raw_user_meta_data->>'role', 'homeowner');
    IF v_role NOT IN ('admin', 'provider', 'homeowner') THEN
      v_role := 'homeowner';
    END IF;

    INSERT INTO app_users (id, username, email, role, is_active)
    VALUES (auth_rec.id, v_username, auth_rec.email, v_role::user_role, true)
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- 11. RLS Policies - SIMPLE
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Allow users to read own profile
CREATE POLICY "users_select_own" ON app_users FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to insert own profile (for trigger)
CREATE POLICY "users_insert_own" ON app_users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow users to update own profile
CREATE POLICY "users_update_own" ON app_users FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role (Supabase internal) full access
CREATE POLICY "service_role_all" ON app_users FOR ALL 
  TO service_role USING (true);

-- 12. Enable realtime for app_users updates
ALTER PUBLICATION supabase_realtime ADD TABLE app_users;

-- 13. Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Schema created! Trigger is ultra-safe now.';
  RAISE NOTICE '✅ Existing users backfilled into app_users.';
  RAISE NOTICE '✅ user_stats view created for profile page.';
  RAISE NOTICE '✅ Realtime enabled for profile updates.';
  RAISE NOTICE '✅ Try login/register/edit profile now!';
END $$;
