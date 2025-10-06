-- ============================================================================
-- COMPLETE SCHEMA FIX: Matches existing codebase (app_users + user_profiles)
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop everything
DROP VIEW IF EXISTS user_stats, admin_stats, inspiration_feed, user_profiles CASCADE;
DROP TABLE IF EXISTS messages, forum_bookmarks, forum_reposts, forum_likes, forum_comments, forum_posts, bookmarks, follows, review_aggregates, reviews, provider_services, portfolios, provider_types, categories, app_users, users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create enum
CREATE TYPE user_role AS ENUM ('admin', 'provider', 'homeowner');

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Main users table (app_users - matches your code)
CREATE TABLE app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'homeowner',
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
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

-- Provider types
CREATE TABLE provider_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Portfolios
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT,
  area NUMERIC,
  cost NUMERIC,
  currency TEXT DEFAULT 'CNY',
  cover_image TEXT,
  images JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  project_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolios_provider_id ON portfolios(provider_id);
CREATE INDEX idx_portfolios_status ON portfolios(status);

-- Provider services
CREATE TABLE provider_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, category_id)
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  ratings JSONB NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(portfolio_id, reviewer_id)
);

CREATE TABLE review_aggregates (
  portfolio_id UUID PRIMARY KEY REFERENCES portfolios(id) ON DELETE CASCADE,
  total_reviews INTEGER DEFAULT 0,
  average_ratings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Follows
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Bookmarks
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, portfolio_id)
);

-- Forum posts
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX idx_forum_posts_status ON forum_posts(status);

-- Forum comments
CREATE TABLE forum_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forum likes
CREATE TABLE forum_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id, comment_id)
);

-- Forum reposts
CREATE TABLE forum_reposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Forum bookmarks
CREATE TABLE forum_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_profiles VIEW (required by your code)
CREATE VIEW user_profiles AS
SELECT
  au.*,
  COALESCE((SELECT COUNT(*) FROM follows WHERE following_id = au.id), 0) AS follower_count,
  COALESCE((SELECT COUNT(*) FROM follows WHERE follower_id = au.id), 0) AS following_count,
  COALESCE((SELECT COUNT(*) FROM portfolios WHERE provider_id = au.id AND status = 'published'), 0) AS portfolio_count,
  COALESCE((SELECT COUNT(*) FROM bookmarks WHERE user_id = au.id), 0) AS bookmark_count,
  COALESCE((SELECT COUNT(*) FROM forum_posts WHERE author_id = au.id AND status = 'published'), 0) AS post_count
FROM app_users au;

-- Auth trigger function
CREATE OR REPLACE FUNCTION handle_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
  provider_type_uuid UUID;
  role_value user_role := 'homeowner';
BEGIN
  generated_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1),
    'user' || substring(NEW.id::text, 1, 8)
  );

  -- Safely parse provider type id
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data ? 'providerTypeId' THEN
    BEGIN
      provider_type_uuid := NULLIF(NEW.raw_user_meta_data->>'providerTypeId', '')::uuid;
    EXCEPTION
      WHEN others THEN
        provider_type_uuid := NULL;
    END;
  END IF;

  -- Safely parse role
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data ? 'role' THEN
    BEGIN
      role_value := (NEW.raw_user_meta_data->>'role')::user_role;
    EXCEPTION
      WHEN others THEN
        role_value := 'homeowner';
    END;
  END IF;

  INSERT INTO app_users (id, username, email, role, full_name, avatar_url, phone, provider_type_id)
  VALUES (
    NEW.id,
    generated_username,
    NEW.email,
    role_value,
    COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'phone',
    provider_type_uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user();

-- Username check function
CREATE OR REPLACE FUNCTION is_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM app_users WHERE username = check_username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON app_users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON app_users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON app_users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Public can view providers" ON app_users FOR SELECT TO public USING (role = 'provider' AND is_active = true);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published portfolios" ON portfolios FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Providers can manage own" ON portfolios FOR ALL TO authenticated USING (auth.uid() = provider_id);

-- Backfill existing auth users into app_users
DO $$
DECLARE
  auth_user RECORD;
  generated_username TEXT;
  role_value user_role;
  provider_type_uuid UUID;
  full_name TEXT;
  avatar_url TEXT;
  phone TEXT;
BEGIN
  FOR auth_user IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
  LOOP
    generated_username := COALESCE(
      auth_user.raw_user_meta_data->>'username',
      split_part(auth_user.email, '@', 1),
      'user' || substring(auth_user.id::text, 1, 8)
    );

    BEGIN
      role_value := (auth_user.raw_user_meta_data->>'role')::user_role;
    EXCEPTION
      WHEN others THEN
        role_value := 'homeowner';
    END;

    BEGIN
      provider_type_uuid := NULLIF(auth_user.raw_user_meta_data->>'providerTypeId', '')::uuid;
    EXCEPTION
      WHEN others THEN
        provider_type_uuid := NULL;
    END;

    full_name := COALESCE(auth_user.raw_user_meta_data->>'fullName', auth_user.raw_user_meta_data->>'full_name');
    avatar_url := auth_user.raw_user_meta_data->>'avatar_url';
    phone := auth_user.raw_user_meta_data->>'phone';

    INSERT INTO app_users (id, username, email, role, full_name, avatar_url, phone, provider_type_id)
    VALUES (
      auth_user.id,
      generated_username,
      auth_user.email,
      COALESCE(role_value, 'homeowner'),
      full_name,
      avatar_url,
      phone,
      provider_type_uuid
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Schema created successfully! user_profiles view is ready.';
END $$;
