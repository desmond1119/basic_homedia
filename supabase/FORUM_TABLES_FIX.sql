-- ============================================================================
-- FORUM TABLES FIX - Create correct tables for forum functionality
-- This creates the tables that the code expects (posts, comments, etc.)
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 0. UPDATE CATEGORIES TABLE (add slug if missing)
-- ============================================================================

-- First, check what columns exist in categories
DO $$
DECLARE
  has_slug BOOLEAN;
  has_display_order BOOLEAN;
  has_updated_at BOOLEAN;
BEGIN
  -- Check existing columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'slug'
  ) INTO has_slug;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'display_order'
  ) INTO has_display_order;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'updated_at'
  ) INTO has_updated_at;
  
  RAISE NOTICE 'Categories table status:';
  RAISE NOTICE '  - has slug: %', has_slug;
  RAISE NOTICE '  - has display_order: %', has_display_order;
  RAISE NOTICE '  - has updated_at: %', has_updated_at;
  
  -- Add updated_at first (needed for triggers that may fire)
  IF NOT has_updated_at THEN
    RAISE NOTICE 'Adding updated_at column...';
    ALTER TABLE categories ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Add slug column
  IF NOT has_slug THEN
    RAISE NOTICE 'Adding slug column...';
    ALTER TABLE categories ADD COLUMN slug TEXT;
    
    -- Generate slugs from existing names
    RAISE NOTICE 'Generating slugs...';
    UPDATE categories 
    SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\u4e00-\u9fa5]+', '-', 'g'), '^-+|-+$', '', 'g'))
    WHERE slug IS NULL OR slug = '';
    
    -- Make slug NOT NULL after populating
    ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
    RAISE NOTICE 'Slug column created and populated';
  ELSE
    RAISE NOTICE 'Slug column already exists, ensuring all rows have values...';
    UPDATE categories 
    SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\u4e00-\u9fa5]+', '-', 'g'), '^-+|-+$', '', 'g'))
    WHERE slug IS NULL OR slug = '';
  END IF;
  
  -- Add display_order if missing
  IF NOT has_display_order THEN
    RAISE NOTICE 'Adding display_order column...';
    ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
  
  RAISE NOTICE 'Categories table update complete!';
END $$;

-- ============================================================================
-- 1. POSTS TABLE
-- ============================================================================

-- Drop existing forum_posts if it exists and create posts table
DROP TABLE IF EXISTS posts CASCADE;
CREATE TABLE posts (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_deleted ON posts(is_deleted);

-- ============================================================================
-- 2. COMMENTS TABLE
-- ============================================================================

DROP TABLE IF EXISTS comments CASCADE;
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  like_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_is_deleted ON comments(is_deleted);

-- ============================================================================
-- 3. LIKES TABLE
-- ============================================================================

DROP TABLE IF EXISTS likes CASCADE;
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_target ON likes(target_id, target_type);

-- ============================================================================
-- 4. BOOKMARKS TABLE
-- ============================================================================

DROP TABLE IF EXISTS bookmarks CASCADE;
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_post_id ON bookmarks(post_id);

-- ============================================================================
-- 5. REPOSTS TABLE
-- ============================================================================

DROP TABLE IF EXISTS reposts CASCADE;
CREATE TABLE reposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, original_post_id)
);

CREATE INDEX idx_reposts_user_id ON reposts(user_id);
CREATE INDEX idx_reposts_post_id ON reposts(original_post_id);

-- ============================================================================
-- 6. VIEWS FOR JOINED DATA
-- ============================================================================

-- posts_with_user view - joins posts with user data
DROP VIEW IF EXISTS posts_with_user CASCADE;
CREATE VIEW posts_with_user AS
SELECT 
  p.*,
  u.username,
  u.avatar_url AS user_avatar,
  u.full_name AS user_full_name,
  c.name AS category_name,
  COALESCE(c.slug, LOWER(REGEXP_REPLACE(c.name, '[^a-zA-Z0-9]+', '-', 'g'))) AS category_slug
FROM posts p
LEFT JOIN app_users u ON p.user_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_deleted = false;

-- comments_with_user view - joins comments with user data
DROP VIEW IF EXISTS comments_with_user CASCADE;
CREATE VIEW comments_with_user AS
SELECT 
  c.*,
  u.username,
  u.avatar_url AS user_avatar,
  u.full_name AS user_full_name
FROM comments c
LEFT JOIN app_users u ON c.user_id = u.id
WHERE c.is_deleted = false;

-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================

-- Function to check if user liked a target
CREATE OR REPLACE FUNCTION user_liked_target(
  user_uuid UUID,
  target_uuid UUID,
  target_type_str TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM likes 
    WHERE user_id = user_uuid 
    AND target_id = target_uuid 
    AND target_type = target_type_str
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update post counts when comments are added/deleted
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_deleted != OLD.is_deleted THEN
    IF NEW.is_deleted THEN
      UPDATE posts 
      SET comment_count = GREATEST(0, comment_count - 1)
      WHERE id = NEW.post_id;
    ELSE
      UPDATE posts 
      SET comment_count = comment_count + 1 
      WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update like counts
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'post' THEN
      UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'comment' THEN
      UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'post' THEN
      UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'comment' THEN
      UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update bookmark counts
CREATE OR REPLACE FUNCTION update_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET bookmark_count = bookmark_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET bookmark_count = GREATEST(0, bookmark_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update repost counts
CREATE OR REPLACE FUNCTION update_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET repost_count = repost_count + 1 WHERE id = NEW.original_post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET repost_count = GREATEST(0, repost_count - 1) WHERE id = OLD.original_post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Comment count triggers
DROP TRIGGER IF EXISTS comment_count_trigger ON comments;
CREATE TRIGGER comment_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Like count triggers
DROP TRIGGER IF EXISTS like_count_trigger ON likes;
CREATE TRIGGER like_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_like_count();

-- Bookmark count triggers
DROP TRIGGER IF EXISTS bookmark_count_trigger ON bookmarks;
CREATE TRIGGER bookmark_count_trigger
  AFTER INSERT OR DELETE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_bookmark_count();

-- Repost count triggers
DROP TRIGGER IF EXISTS repost_count_trigger ON reposts;
CREATE TRIGGER repost_count_trigger
  AFTER INSERT OR DELETE ON reposts
  FOR EACH ROW EXECUTE FUNCTION update_repost_count();

-- Updated_at triggers
DROP TRIGGER IF EXISTS posts_updated_at ON posts;
CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF EXISTS comments_updated_at ON comments;
CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

-- Posts policies
DROP POLICY IF EXISTS "Anyone can view non-deleted posts" ON posts;
CREATE POLICY "Anyone can view non-deleted posts" ON posts
  FOR SELECT USING (is_deleted = false);

DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts" ON posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Comments policies
DROP POLICY IF EXISTS "Anyone can view non-deleted comments" ON comments;
CREATE POLICY "Anyone can view non-deleted comments" ON comments
  FOR SELECT USING (is_deleted = false);

DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Likes policies
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can manage own likes" ON likes;
CREATE POLICY "Users can manage own likes" ON likes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Bookmarks policies
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
CREATE POLICY "Users can view own bookmarks" ON bookmarks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own bookmarks" ON bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON bookmarks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reposts policies
DROP POLICY IF EXISTS "Anyone can view reposts" ON reposts;
CREATE POLICY "Anyone can view reposts" ON reposts
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can manage own reposts" ON reposts;
CREATE POLICY "Users can manage own reposts" ON reposts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 10. STORAGE BUCKET FOR FORUM MEDIA
-- ============================================================================

-- Create storage bucket for forum media if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-media', 'forum-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
DROP POLICY IF EXISTS "Anyone can view forum media" ON storage.objects;
CREATE POLICY "Anyone can view forum media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'forum-media');

DROP POLICY IF EXISTS "Authenticated users can upload forum media" ON storage.objects;
CREATE POLICY "Authenticated users can upload forum media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'forum-media');

DROP POLICY IF EXISTS "Users can update own forum media" ON storage.objects;
CREATE POLICY "Users can update own forum media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'forum-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own forum media" ON storage.objects;
CREATE POLICY "Users can delete own forum media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'forum-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Forum tables created successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Updated existing tables:';
  RAISE NOTICE '  ✅ categories (added slug, display_order)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Created tables:';
  RAISE NOTICE '  ✅ posts';
  RAISE NOTICE '  ✅ comments';
  RAISE NOTICE '  ✅ likes';
  RAISE NOTICE '  ✅ bookmarks';
  RAISE NOTICE '  ✅ reposts';
  RAISE NOTICE '';
  RAISE NOTICE '👁️  Created views:';
  RAISE NOTICE '  ✅ posts_with_user';
  RAISE NOTICE '  ✅ comments_with_user';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Created functions:';
  RAISE NOTICE '  ✅ user_liked_target()';
  RAISE NOTICE '  ✅ Auto-update counters (triggers)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Created RLS policies:';
  RAISE NOTICE '  ✅ Posts (view, create, update, delete)';
  RAISE NOTICE '  ✅ Comments (view, create, update, delete)';
  RAISE NOTICE '  ✅ Likes, Bookmarks, Reposts';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Storage:';
  RAISE NOTICE '  ✅ forum-media bucket configured';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Users can now post in /forum!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
