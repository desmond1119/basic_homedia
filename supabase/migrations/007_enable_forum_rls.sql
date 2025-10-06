-- ============================================================================
-- Enable RLS and Create Policies for Forum Tables
-- ============================================================================

-- Enable RLS on forum tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;

DROP POLICY IF EXISTS "Bookmarks are viewable by owner" ON bookmarks;
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON bookmarks;

DROP POLICY IF EXISTS "Reposts are viewable by everyone" ON reposts;
DROP POLICY IF EXISTS "Users can manage their own reposts" ON reposts;

-- ============================================================================
-- POSTS POLICIES
-- ============================================================================

-- Everyone can view non-deleted posts
CREATE POLICY "Posts are viewable by everyone"
ON posts FOR SELECT
TO public
USING (is_deleted = false);

-- Authenticated users can insert posts
CREATE POLICY "Users can insert their own posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete (soft delete) their own posts
CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- CATEGORIES POLICIES
-- ============================================================================

-- Everyone can view active categories
CREATE POLICY "Categories are viewable by everyone"
ON categories FOR SELECT
TO public
USING (is_active = true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- COMMENTS POLICIES
-- ============================================================================

-- Everyone can view non-deleted comments
CREATE POLICY "Comments are viewable by everyone"
ON comments FOR SELECT
TO public
USING (is_deleted = false);

-- Authenticated users can insert comments
CREATE POLICY "Users can insert their own comments"
ON comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- LIKES POLICIES
-- ============================================================================

-- Everyone can view likes
CREATE POLICY "Likes are viewable by everyone"
ON likes FOR SELECT
TO public
USING (true);

-- Users can manage their own likes
CREATE POLICY "Users can manage their own likes"
ON likes FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- BOOKMARKS POLICIES
-- ============================================================================

-- Users can only view their own bookmarks
CREATE POLICY "Bookmarks are viewable by owner"
ON bookmarks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can manage their own bookmarks
CREATE POLICY "Users can manage their own bookmarks"
ON bookmarks FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- REPOSTS POLICIES
-- ============================================================================

-- Everyone can view reposts
CREATE POLICY "Reposts are viewable by everyone"
ON reposts FOR SELECT
TO public
USING (true);

-- Users can manage their own reposts
CREATE POLICY "Users can manage their own reposts"
ON reposts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Forum RLS policies created successfully';
  RAISE NOTICE 'Tables with RLS enabled:';
  RAISE NOTICE '  - posts';
  RAISE NOTICE '  - comments';
  RAISE NOTICE '  - categories';
  RAISE NOTICE '  - likes';
  RAISE NOTICE '  - bookmarks';
  RAISE NOTICE '  - reposts';
END $$;
