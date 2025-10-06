CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'homeowner' CHECK (role IN ('homeowner', 'provider', 'admin')),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone TEXT,
  location TEXT,
  website TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  provider_type_id UUID REFERENCES provider_types(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  bio TEXT,
  price_min NUMERIC,
  price_max NUMERIC,
  currency TEXT DEFAULT 'HKD',
  overall_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  experience_years INTEGER DEFAULT 0,
  team_size INTEGER DEFAULT 0,
  founded_year INTEGER,
  is_approved BOOLEAN DEFAULT false,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT,
  area_sqft NUMERIC,
  total_cost NUMERIC,
  currency TEXT DEFAULT 'HKD',
  cover_image_url TEXT,
  images JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  view_count INTEGER DEFAULT 0,
  collect_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  like_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'portfolio')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'portfolio')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

CREATE TABLE IF NOT EXISTS reposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, original_post_id)
);

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
  ratings JSONB NOT NULL DEFAULT '{}',
  overall_rating NUMERIC NOT NULL CHECK (overall_rating >= 0 AND overall_rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, reviewer_id, portfolio_id)
);

CREATE OR REPLACE FUNCTION validate_review_ratings()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT (
    jsonb_typeof(NEW.ratings) = 'object' AND
    (SELECT bool_and(
      key ~ '^[1-5]$' AND 
      jsonb_typeof(value) = 'number' AND 
      (value::text)::numeric >= 0 AND 
      (value::text)::numeric <= 5
    ) FROM jsonb_each(NEW.ratings))
  ) THEN
    RAISE EXCEPTION 'Invalid ratings format. Keys must be 1-5 and values must be numeric 0-5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS provider_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON app_users(username);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON app_users(auth_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_user_id ON provider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_approved ON provider_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_type ON provider_profiles(provider_type_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON portfolios(category_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_status ON portfolios(status);
CREATE INDEX IF NOT EXISTS idx_portfolios_created ON portfolios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_deleted ON posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_target ON bookmarks(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON reposts(original_post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_ratings ON reviews USING GIN(ratings);
CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_images ON portfolios USING GIN(images);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_social ON provider_profiles USING GIN(social_links);

CREATE OR REPLACE VIEW inspiration_feed AS
SELECT 
  p.id,
  p.title,
  p.description,
  p.cover_image_url,
  p.images,
  p.view_count,
  p.collect_count,
  p.created_at,
  u.id AS provider_id,
  u.username AS provider_username,
  u.company_name AS provider_company,
  pp.logo_url AS provider_logo,
  pp.overall_rating AS provider_rating,
  pp.total_reviews AS provider_review_count,
  c.name AS category_name,
  c.slug AS category_slug
FROM portfolios p
JOIN app_users u ON p.user_id = u.id
LEFT JOIN provider_profiles pp ON u.id = pp.user_id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.status = 'approved' AND u.is_active = true;

CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id AS user_id,
  u.username,
  u.role,
  COUNT(DISTINCT f1.id) AS followers_count,
  COUNT(DISTINCT f2.id) AS following_count,
  COUNT(DISTINCT p.id) AS posts_count,
  COUNT(DISTINCT b.id) AS bookmarks_count,
  COUNT(DISTINCT c.id) AS comments_count,
  COUNT(DISTINCT po.id) AS portfolios_count
FROM app_users u
LEFT JOIN follows f1 ON u.id = f1.following_id
LEFT JOIN follows f2 ON u.id = f2.follower_id
LEFT JOIN posts p ON u.id = p.user_id AND p.is_deleted = false
LEFT JOIN bookmarks b ON u.id = b.user_id
LEFT JOIN comments c ON u.id = c.user_id AND c.is_deleted = false
LEFT JOIN portfolios po ON u.id = po.user_id
GROUP BY u.id, u.username, u.role;

CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM app_users WHERE is_active = true) AS total_users,
  (SELECT COUNT(*) FROM app_users WHERE role = 'provider' AND is_active = true) AS total_providers,
  (SELECT COUNT(*) FROM app_users WHERE role = 'homeowner' AND is_active = true) AS total_homeowners,
  (SELECT COUNT(*) FROM posts WHERE is_deleted = false) AS total_posts,
  (SELECT COUNT(*) FROM comments WHERE is_deleted = false) AS total_comments,
  (SELECT COUNT(*) FROM portfolios WHERE status = 'approved') AS total_portfolios,
  (SELECT COUNT(*) FROM portfolios WHERE status = 'pending') AS pending_portfolios,
  (SELECT COUNT(*) FROM reviews) AS total_reviews,
  (SELECT AVG(overall_rating) FROM provider_profiles WHERE total_reviews > 0) AS avg_provider_rating;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION atomic_increment_count(
  table_name TEXT,
  count_column TEXT,
  where_column TEXT,
  where_value UUID,
  delta INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = GREATEST(0, %I + $1) WHERE %I = $2',
    table_name, count_column, count_column, where_column
  ) USING delta, where_value;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    PERFORM atomic_increment_count('posts', 'comment_count', 'id', NEW.post_id, 1);
  ELSIF TG_OP = 'DELETE' AND OLD.is_deleted = false THEN
    PERFORM atomic_increment_count('posts', 'comment_count', 'id', OLD.post_id, -1);
  ELSIF TG_OP = 'UPDATE' AND NEW.is_deleted != OLD.is_deleted THEN
    PERFORM atomic_increment_count('posts', 'comment_count', 'id', NEW.post_id, CASE WHEN NEW.is_deleted THEN -1 ELSE 1 END);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'post' THEN
      PERFORM atomic_increment_count('posts', 'like_count', 'id', NEW.target_id, 1);
    ELSIF NEW.target_type = 'comment' THEN
      PERFORM atomic_increment_count('comments', 'like_count', 'id', NEW.target_id, 1);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'post' THEN
      PERFORM atomic_increment_count('posts', 'like_count', 'id', OLD.target_id, -1);
    ELSIF OLD.target_type = 'comment' THEN
      PERFORM atomic_increment_count('comments', 'like_count', 'id', OLD.target_id, -1);
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    PERFORM atomic_increment_count('posts', 'bookmark_count', 'id', NEW.target_id, 1);
  ELSIF TG_OP = 'INSERT' AND NEW.target_type = 'portfolio' THEN
    PERFORM atomic_increment_count('portfolios', 'collect_count', 'id', NEW.target_id, 1);
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    PERFORM atomic_increment_count('posts', 'bookmark_count', 'id', OLD.target_id, -1);
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'portfolio' THEN
    PERFORM atomic_increment_count('portfolios', 'collect_count', 'id', OLD.target_id, -1);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM atomic_increment_count('posts', 'repost_count', 'id', NEW.original_post_id, 1);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM atomic_increment_count('posts', 'repost_count', 'id', OLD.original_post_id, -1);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_provider_ratings()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
BEGIN
  SELECT 
    AVG(overall_rating),
    COUNT(*)
  INTO avg_rating, review_count
  FROM reviews
  WHERE provider_id = COALESCE(NEW.provider_id, OLD.provider_id);

  UPDATE provider_profiles
  SET 
    overall_rating = COALESCE(avg_rating, 0),
    total_reviews = review_count
  WHERE user_id = COALESCE(NEW.provider_id, OLD.provider_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_provider_project_count()
RETURNS TRIGGER AS $$
DECLARE
  provider_id UUID;
  project_count INTEGER;
BEGIN
  provider_id := COALESCE(NEW.user_id, OLD.user_id);
  
  SELECT COUNT(*) INTO project_count
  FROM portfolios
  WHERE user_id = provider_id AND status = 'approved';

  UPDATE provider_profiles
  SET completed_projects = project_count
  WHERE user_id = provider_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO app_users (auth_id, email, username, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION broadcast_category_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('category_changes', json_build_object(
    'operation', TG_OP,
    'id', COALESCE(NEW.id, OLD.id),
    'name', COALESCE(NEW.name, OLD.name)
  )::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION broadcast_provider_type_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('provider_type_changes', json_build_object(
    'operation', TG_OP,
    'id', COALESCE(NEW.id, OLD.id),
    'name', COALESCE(NEW.name, OLD.name)
  )::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON app_users;
DROP TRIGGER IF EXISTS provider_profiles_updated_at ON provider_profiles;
DROP TRIGGER IF EXISTS provider_types_updated_at ON provider_types;
DROP TRIGGER IF EXISTS categories_updated_at ON categories;
DROP TRIGGER IF EXISTS portfolios_updated_at ON portfolios;
DROP TRIGGER IF EXISTS posts_updated_at ON posts;
DROP TRIGGER IF EXISTS comments_updated_at ON comments;
DROP TRIGGER IF EXISTS messages_updated_at ON messages;
DROP TRIGGER IF EXISTS reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS validate_ratings_trigger ON reviews;
DROP TRIGGER IF EXISTS comment_count_trigger ON comments;
DROP TRIGGER IF EXISTS like_count_trigger ON likes;
DROP TRIGGER IF EXISTS bookmark_count_trigger ON bookmarks;
DROP TRIGGER IF EXISTS repost_count_trigger ON reposts;
DROP TRIGGER IF EXISTS review_rating_trigger ON reviews;
DROP TRIGGER IF EXISTS portfolio_project_count_trigger ON portfolios;
DROP TRIGGER IF EXISTS category_broadcast_trigger ON categories;
DROP TRIGGER IF EXISTS provider_type_broadcast_trigger ON provider_types;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER provider_profiles_updated_at BEFORE UPDATE ON provider_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER provider_types_updated_at BEFORE UPDATE ON provider_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER validate_ratings_trigger BEFORE INSERT OR UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION validate_review_ratings();
CREATE TRIGGER comment_count_trigger AFTER INSERT OR UPDATE OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();
CREATE TRIGGER like_count_trigger AFTER INSERT OR DELETE ON likes FOR EACH ROW EXECUTE FUNCTION update_like_count();
CREATE TRIGGER bookmark_count_trigger AFTER INSERT OR DELETE ON bookmarks FOR EACH ROW EXECUTE FUNCTION update_bookmark_count();
CREATE TRIGGER repost_count_trigger AFTER INSERT OR DELETE ON reposts FOR EACH ROW EXECUTE FUNCTION update_repost_count();
CREATE TRIGGER review_rating_trigger AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_provider_ratings();
CREATE TRIGGER portfolio_project_count_trigger AFTER INSERT OR UPDATE OR DELETE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_provider_project_count();
CREATE TRIGGER category_broadcast_trigger AFTER INSERT OR UPDATE OR DELETE ON categories FOR EACH ROW EXECUTE FUNCTION broadcast_category_change();
CREATE TRIGGER provider_type_broadcast_trigger AFTER INSERT OR UPDATE OR DELETE ON provider_types FOR EACH ROW EXECUTE FUNCTION broadcast_provider_type_change();
CREATE TRIGGER on_auth_user_created AFTER INSERT OR UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_auth_user();