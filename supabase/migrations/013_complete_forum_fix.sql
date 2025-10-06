-- ============================================================================
-- COMPLETE FORUM SYSTEM FIX - COMPREHENSIVE SOLUTION
-- This migration fixes all forum issues and adds missing features
-- ============================================================================

-- Drop existing problematic views and policies
DROP VIEW IF EXISTS posts_with_user CASCADE;
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- ============================================================================
-- PART 1: Fix Posts Table and Add Missing Columns
-- ============================================================================

-- Ensure posts table has all required columns
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS repost_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bookmark_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- PART 2: Create/Fix Comments Table with Nested Structure
-- ============================================================================

DROP TABLE IF EXISTS comments CASCADE;

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  like_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- ============================================================================
-- PART 3: Create Likes Table
-- ============================================================================

DROP TABLE IF EXISTS likes CASCADE;

CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('post', 'comment')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- ============================================================================
-- PART 4: Create Bookmarks Table
-- ============================================================================

DROP TABLE IF EXISTS bookmarks CASCADE;

CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'portfolio')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_target ON bookmarks(target_id, target_type);

-- ============================================================================
-- PART 5: Create Reposts/Shares Table
-- ============================================================================

DROP TABLE IF EXISTS reposts CASCADE;

CREATE TABLE reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, original_post_id)
);

CREATE INDEX IF NOT EXISTS idx_reposts_user ON reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_original_post ON reposts(original_post_id);

-- ============================================================================
-- PART 6: Create Post Views Tracking Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_views_post ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user ON post_views(user_id);

-- ============================================================================
-- PART 7: Create Enhanced Posts View with All Data
-- ============================================================================

CREATE OR REPLACE VIEW posts_with_user AS
SELECT 
  p.*,
  u.username,
  u.full_name as user_full_name,
  u.avatar_url as user_avatar,
  u.bio as user_bio,
  c.name as category_name,
  c.slug as category_slug,
  c.icon as category_icon,
  -- Real-time counts
  COALESCE((SELECT COUNT(*) FROM likes WHERE target_id = p.id AND target_type = 'post'), 0) as actual_like_count,
  COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_deleted = false), 0) as actual_comment_count,
  COALESCE((SELECT COUNT(*) FROM reposts WHERE original_post_id = p.id), 0) as actual_repost_count,
  COALESCE((SELECT COUNT(*) FROM bookmarks WHERE target_id = p.id AND target_type = 'post'), 0) as actual_bookmark_count,
  -- User interaction flags (requires auth context)
  CASE 
    WHEN auth.uid() IS NOT NULL THEN
      EXISTS(
        SELECT 1 FROM likes 
        WHERE target_id = p.id 
        AND target_type = 'post' 
        AND user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
      )
    ELSE false
  END as is_liked,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN
      EXISTS(
        SELECT 1 FROM bookmarks 
        WHERE target_id = p.id 
        AND target_type = 'post'
        AND user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
      )
    ELSE false
  END as is_bookmarked,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN
      EXISTS(
        SELECT 1 FROM reposts 
        WHERE original_post_id = p.id 
        AND user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
      )
    ELSE false
  END as is_reposted,
  -- Check if current user is the author
  CASE 
    WHEN auth.uid() IS NOT NULL THEN
      p.user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
    ELSE false
  END as is_own_post
FROM posts p
LEFT JOIN app_users u ON p.user_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_deleted = false;

-- ============================================================================
-- PART 8: Create Comments View with User Info
-- ============================================================================

CREATE OR REPLACE VIEW comments_with_user AS
SELECT 
  c.*,
  u.username,
  u.full_name as user_full_name,
  u.avatar_url as user_avatar,
  -- Real-time like count
  COALESCE((SELECT COUNT(*) FROM likes WHERE target_id = c.id AND target_type = 'comment'), 0) as actual_like_count,
  -- User interaction flags
  CASE 
    WHEN auth.uid() IS NOT NULL THEN
      EXISTS(
        SELECT 1 FROM likes 
        WHERE target_id = c.id 
        AND target_type = 'comment' 
        AND user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
      )
    ELSE false
  END as is_liked,
  -- Check if current user is the author
  CASE 
    WHEN auth.uid() IS NOT NULL THEN
      c.user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
    ELSE false
  END as is_own_comment,
  -- Count of replies
  (SELECT COUNT(*) FROM comments WHERE parent_id = c.id AND is_deleted = false) as reply_count
FROM comments c
LEFT JOIN app_users u ON c.user_id = u.id
WHERE c.is_deleted = false;

-- ============================================================================
-- PART 8B: Helper Functions for Secure Inserts
-- ============================================================================

DROP FUNCTION IF EXISTS create_post(UUID, TEXT, TEXT, TEXT[], TEXT[]);

CREATE OR REPLACE FUNCTION create_post(
  p_category_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_tags TEXT[] DEFAULT '{}',
  p_media_urls TEXT[] DEFAULT '{}'
) RETURNS posts AS $$
DECLARE
  v_user_id UUID;
  v_post posts;
BEGIN
  v_user_id := (
    SELECT id
    FROM app_users
    WHERE auth_id = auth.uid()
    LIMIT 1
  );

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  INSERT INTO posts (
    user_id,
    category_id,
    title,
    content,
    tags,
    media_urls,
    like_count,
    comment_count,
    repost_count,
    bookmark_count,
    view_count,
    is_pinned,
    is_locked,
    is_deleted
  )
  VALUES (
    v_user_id,
    p_category_id,
    p_title,
    p_content,
    COALESCE(p_tags, '{}'),
    COALESCE(p_media_urls, '{}'),
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false
  )
  RETURNING * INTO v_post;

  RETURN v_post;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION create_post(UUID, TEXT, TEXT, TEXT[], TEXT[]) TO authenticated;

-- ============================================================================
-- PART 9: RLS Policies for Posts
-- ============================================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view posts
DROP POLICY IF EXISTS "posts_select_policy" ON posts;
CREATE POLICY "posts_select_policy" ON posts
  FOR SELECT USING (true);

-- Authenticated users can create posts
DROP POLICY IF EXISTS "posts_insert_policy" ON posts;
CREATE POLICY "posts_insert_policy" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Users can update their own posts
DROP POLICY IF EXISTS "posts_update_policy" ON posts;
CREATE POLICY "posts_update_policy" ON posts
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Users can delete their own posts
DROP POLICY IF EXISTS "posts_delete_policy" ON posts;
CREATE POLICY "posts_delete_policy" ON posts
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================================
-- PART 10: RLS Policies for Comments
-- ============================================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
DROP POLICY IF EXISTS "comments_select_policy" ON comments;
CREATE POLICY "comments_select_policy" ON comments
  FOR SELECT USING (true);

-- Authenticated users can create comments
DROP POLICY IF EXISTS "comments_insert_policy" ON comments;
CREATE POLICY "comments_insert_policy" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Users can update their own comments
DROP POLICY IF EXISTS "comments_update_policy" ON comments;
CREATE POLICY "comments_update_policy" ON comments
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Users can soft delete their own comments
DROP POLICY IF EXISTS "comments_delete_policy" ON comments;
CREATE POLICY "comments_delete_policy" ON comments
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================================
-- PART 11: RLS Policies for Likes
-- ============================================================================

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes
DROP POLICY IF EXISTS "likes_select_policy" ON likes;
CREATE POLICY "likes_select_policy" ON likes
  FOR SELECT USING (true);

-- Authenticated users can create likes
DROP POLICY IF EXISTS "likes_insert_policy" ON likes;
CREATE POLICY "likes_insert_policy" ON likes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Users can delete their own likes
DROP POLICY IF EXISTS "likes_delete_policy" ON likes;
CREATE POLICY "likes_delete_policy" ON likes
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================================
-- PART 12: RLS Policies for Bookmarks
-- ============================================================================

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can only view their own bookmarks
DROP POLICY IF EXISTS "bookmarks_select_policy" ON bookmarks;
CREATE POLICY "bookmarks_select_policy" ON bookmarks
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Authenticated users can create bookmarks
DROP POLICY IF EXISTS "bookmarks_insert_policy" ON bookmarks;
CREATE POLICY "bookmarks_insert_policy" ON bookmarks
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Users can delete their own bookmarks
DROP POLICY IF EXISTS "bookmarks_delete_policy" ON bookmarks;
CREATE POLICY "bookmarks_delete_policy" ON bookmarks
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================================
-- PART 13: RLS Policies for Reposts
-- ============================================================================

ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

-- Anyone can view reposts
DROP POLICY IF EXISTS "reposts_select_policy" ON reposts;
CREATE POLICY "reposts_select_policy" ON reposts
  FOR SELECT USING (true);

-- Authenticated users can create reposts
DROP POLICY IF EXISTS "reposts_insert_policy" ON reposts;
CREATE POLICY "reposts_insert_policy" ON reposts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Users can delete their own reposts
DROP POLICY IF EXISTS "reposts_delete_policy" ON reposts;
CREATE POLICY "reposts_delete_policy" ON reposts
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
  );

-- ============================================================================
-- PART 14: Create Trigger Functions for Counters
-- ============================================================================

-- Update post counts on like/unlike
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.target_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_like_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Update comment count on comment insert/delete
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = NEW.post_id;
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_deleted = false THEN
      UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Update repost count
CREATE OR REPLACE FUNCTION update_post_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET repost_count = repost_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET repost_count = GREATEST(0, repost_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_repost_count
AFTER INSERT OR DELETE ON reposts
FOR EACH ROW EXECUTE FUNCTION update_post_repost_count();

-- Update bookmark count
CREATE OR REPLACE FUNCTION update_post_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET bookmark_count = bookmark_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET bookmark_count = GREATEST(0, bookmark_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_bookmark_count
AFTER INSERT OR DELETE ON bookmarks
FOR EACH ROW EXECUTE FUNCTION update_post_bookmark_count();

-- ============================================================================
-- PART 15: Create Storage Policies for Forum Media
-- ============================================================================

-- Ensure forum-media bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum-media',
  'forum-media',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];

-- Drop existing policies
DROP POLICY IF EXISTS "Forum media is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload forum media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own forum media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own forum media" ON storage.objects;

-- Create new policies
CREATE POLICY "Forum media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum-media');

CREATE POLICY "Authenticated users can upload forum media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'forum-media' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own forum media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'forum-media' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = (SELECT id::text FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
);

CREATE POLICY "Users can delete their own forum media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'forum-media' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = (SELECT id::text FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
);
-- ============================================================================
-- PART 16: Insert Sample Categories if None Exist
-- ============================================================================

INSERT INTO categories (name, slug, description, icon, display_order)
SELECT * FROM (VALUES
  ('General Discussion', 'general', 'General topics and discussions', '💬', 1),
  ('Design Inspiration', 'design', 'Share and discover design ideas', '🎨', 2),
  ('Home Improvement', 'home-improvement', 'DIY projects and renovations', '🔨', 3),
  ('Interior Design', 'interior', 'Room layouts and decorating tips', '🏠', 4),
  ('Kitchen & Bath', 'kitchen-bath', 'Kitchen and bathroom renovations', '🚿', 5),
  ('Garden & Outdoor', 'garden', 'Landscaping and outdoor spaces', '🌿', 6),
  ('Smart Home', 'smart-home', 'Home automation and technology', '🤖', 7),
  ('Sustainability', 'sustainability', 'Eco-friendly and green living', '♻️', 8)
) AS v(name, slug, description, icon, display_order)
WHERE NOT EXISTS (SELECT 1 FROM categories);

-- ============================================================================
-- PART 17: Grant Permissions
-- ============================================================================
GRANT ALL ON posts TO authenticated;
GRANT ALL ON comments TO authenticated;
GRANT ALL ON likes TO authenticated;
GRANT ALL ON bookmarks TO authenticated;
GRANT ALL ON reposts TO authenticated;
GRANT ALL ON post_views TO authenticated;
GRANT SELECT ON posts_with_user TO authenticated;
GRANT SELECT ON comments_with_user TO authenticated;
GRANT SELECT ON posts TO anon;
GRANT SELECT ON comments TO anon;
GRANT SELECT ON posts_with_user TO anon;
GRANT SELECT ON comments_with_user TO anon;
