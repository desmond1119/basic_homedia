    -- ============================================================================
    -- COMPLETE FORUM SYSTEM WITH ALL FEATURES
    -- This migration sets up a comprehensive forum system with likes, bookmarks,
    -- reposts, and proper user mapping
    -- ============================================================================

    -- ============================================================================
    -- PART 1: Create Missing Tables for Forum Features
    -- ============================================================================

-- Create likes table if not exists
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

-- Create bookmarks table if not exists (using target_id to match existing schema)
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'portfolio')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

-- Create reposts table if not exists (using original_post_id to match existing schema)
CREATE TABLE IF NOT EXISTS reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, original_post_id)
);

    -- ============================================================================
    -- PART 2: Add Missing Columns to Posts Table
    -- ============================================================================

-- Note: Counter columns (like_count, comment_count, repost_count, view_count) 
-- already exist in posts table from migration 001, so no need to add them

    -- ============================================================================
    -- PART 3: Create Enhanced View for Posts with User Info
    -- ============================================================================

    DROP VIEW IF EXISTS posts_with_user CASCADE;

    CREATE VIEW posts_with_user AS
    SELECT 
    p.id,
    p.user_id,
    p.category_id,
    p.title,
    p.content,
    p.tags,
    p.media_urls,
    p.like_count,
    p.comment_count,
    p.repost_count,
    p.bookmark_count,
    p.view_count,
    p.is_pinned,
    p.is_deleted,
    p.created_at,
    p.updated_at,
    u.username,
    u.full_name as user_full_name,
    u.avatar_url as user_avatar,
    c.name as category_name,
    c.slug as category_slug,
    c.icon as category_icon,
    COALESCE(
        (SELECT COUNT(*) FROM likes WHERE target_id = p.id AND target_type = 'post'),
        0
    ) as actual_like_count,
    COALESCE(
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_deleted = false),
        0
    ) as actual_comment_count,
    COALESCE(
        (SELECT COUNT(*) FROM reposts WHERE original_post_id = p.id),
        0
    ) as actual_repost_count,
    EXISTS(
        SELECT 1 FROM likes 
        WHERE target_id = p.id 
        AND target_type = 'post' 
        AND user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
    ) as is_liked,
    EXISTS(
        SELECT 1 FROM bookmarks 
        WHERE target_id = p.id 
        AND target_type = 'post'
        AND user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
    ) as is_bookmarked,
    EXISTS(
        SELECT 1 FROM reposts 
        WHERE original_post_id = p.id 
        AND user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
    ) as is_reposted
    FROM posts p
    LEFT JOIN app_users u ON p.user_id = u.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_deleted = false;

    -- ============================================================================
    -- PART 4: Create View for Comments with User Info
    -- ============================================================================

    DROP VIEW IF EXISTS comments_with_user CASCADE;

    CREATE VIEW comments_with_user AS
    SELECT 
    cm.id,
    cm.post_id,
    cm.user_id,
    cm.parent_id,
    cm.content,
    cm.media_urls,
    cm.like_count,
    cm.is_deleted,
    cm.created_at,
    cm.updated_at,
    u.username,
    u.full_name as user_full_name,
    u.avatar_url as user_avatar,
    COALESCE(
        (SELECT COUNT(*) FROM likes WHERE target_id = cm.id AND target_type = 'comment'),
        0
    ) as actual_like_count,
    EXISTS(
        SELECT 1 FROM likes 
        WHERE target_id = cm.id 
        AND target_type = 'comment' 
        AND user_id = (SELECT id FROM app_users WHERE auth_id = auth.uid() LIMIT 1)
    ) as is_liked
    FROM comments cm
    LEFT JOIN app_users u ON cm.user_id = u.id
    WHERE cm.is_deleted = false;

    -- ============================================================================
    -- PART 5: Create RLS Policies for New Tables
    -- ============================================================================

    -- Enable RLS on new tables
    ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

    -- Likes policies
    DROP POLICY IF EXISTS "likes_select_public" ON likes;
    CREATE POLICY "likes_select_public"
    ON likes FOR SELECT
    TO public
    USING (true);

    DROP POLICY IF EXISTS "likes_insert_authenticated" ON likes;
    CREATE POLICY "likes_insert_authenticated"
    ON likes FOR INSERT
    TO authenticated
    WITH CHECK (
    EXISTS (
        SELECT 1 FROM app_users
        WHERE app_users.id = likes.user_id
        AND app_users.auth_id = auth.uid()
    )
    );

    DROP POLICY IF EXISTS "likes_delete_own" ON likes;
    CREATE POLICY "likes_delete_own"
    ON likes FOR DELETE
    TO authenticated
    USING (
    EXISTS (
        SELECT 1 FROM app_users
        WHERE app_users.id = likes.user_id
        AND app_users.auth_id = auth.uid()
    )
    );

    -- Bookmarks policies
    DROP POLICY IF EXISTS "bookmarks_select_own" ON bookmarks;
    CREATE POLICY "bookmarks_select_own"
    ON bookmarks FOR SELECT
    TO authenticated
    USING (
    EXISTS (
        SELECT 1 FROM app_users
        WHERE app_users.id = bookmarks.user_id
        AND app_users.auth_id = auth.uid()
    )
    );

    DROP POLICY IF EXISTS "bookmarks_insert_authenticated" ON bookmarks;
    CREATE POLICY "bookmarks_insert_authenticated"
    ON bookmarks FOR INSERT
    TO authenticated
    WITH CHECK (
    EXISTS (
        SELECT 1 FROM app_users
        WHERE app_users.id = bookmarks.user_id
        AND app_users.auth_id = auth.uid()
    )
    );

    DROP POLICY IF EXISTS "bookmarks_delete_own" ON bookmarks;
    CREATE POLICY "bookmarks_delete_own"
    ON bookmarks FOR DELETE
    TO authenticated
    USING (
    EXISTS (
        SELECT 1 FROM app_users
        WHERE app_users.id = bookmarks.user_id
        AND app_users.auth_id = auth.uid()
    )
    );

    -- Reposts policies
    DROP POLICY IF EXISTS "reposts_select_public" ON reposts;
    CREATE POLICY "reposts_select_public"
    ON reposts FOR SELECT
    TO public
    USING (true);

    DROP POLICY IF EXISTS "reposts_insert_authenticated" ON reposts;
    CREATE POLICY "reposts_insert_authenticated"
    ON reposts FOR INSERT
    TO authenticated
    WITH CHECK (
    EXISTS (
        SELECT 1 FROM app_users
        WHERE app_users.id = reposts.user_id
        AND app_users.auth_id = auth.uid()
    )
    );

    DROP POLICY IF EXISTS "reposts_delete_own" ON reposts;
    CREATE POLICY "reposts_delete_own"
    ON reposts FOR DELETE
    TO authenticated
    USING (
    EXISTS (
        SELECT 1 FROM app_users
        WHERE app_users.id = reposts.user_id
        AND app_users.auth_id = auth.uid()
    )
    );

    -- ============================================================================
    -- PART 6: Create Functions for Forum Actions
    -- ============================================================================

    -- Function to toggle like
    CREATE OR REPLACE FUNCTION toggle_like(
    p_user_id UUID,
    p_target_id UUID,
    p_target_type VARCHAR(50)
    )
    RETURNS BOOLEAN AS $$
    DECLARE
    v_exists BOOLEAN;
    BEGIN
    -- Check if like exists
    SELECT EXISTS(
        SELECT 1 FROM likes 
        WHERE user_id = p_user_id 
        AND target_id = p_target_id 
        AND target_type = p_target_type
    ) INTO v_exists;
    
    IF v_exists THEN
        -- Remove like
        DELETE FROM likes 
        WHERE user_id = p_user_id 
        AND target_id = p_target_id 
        AND target_type = p_target_type;
        
        -- Update count if it's a post
        IF p_target_type = 'post' THEN
        UPDATE posts 
        SET like_count = GREATEST(0, like_count - 1)
        WHERE id = p_target_id;
        END IF;
        
        RETURN false;
    ELSE
        -- Add like
        INSERT INTO likes (user_id, target_id, target_type)
        VALUES (p_user_id, p_target_id, p_target_type);
        
        -- Update count if it's a post
        IF p_target_type = 'post' THEN
        UPDATE posts 
        SET like_count = like_count + 1
        WHERE id = p_target_id;
        END IF;
        
        RETURN true;
    END IF;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Function to toggle bookmark
    CREATE OR REPLACE FUNCTION toggle_bookmark(
    p_user_id UUID,
    p_post_id UUID
    )
    RETURNS BOOLEAN AS $$
    DECLARE
    v_exists BOOLEAN;
    BEGIN
    -- Check if bookmark exists
    SELECT EXISTS(
        SELECT 1 FROM bookmarks 
        WHERE user_id = p_user_id 
        AND target_id = p_post_id
        AND target_type = 'post'
    ) INTO v_exists;
    
    IF v_exists THEN
        -- Remove bookmark
        DELETE FROM bookmarks 
        WHERE user_id = p_user_id 
        AND target_id = p_post_id
        AND target_type = 'post';
        
        RETURN false;
    ELSE
        -- Add bookmark
        INSERT INTO bookmarks (user_id, target_id, target_type)
        VALUES (p_user_id, p_post_id, 'post');
        
        RETURN true;
    END IF;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Function to toggle repost
    CREATE OR REPLACE FUNCTION toggle_repost(
    p_user_id UUID,
    p_post_id UUID,
    p_comment TEXT DEFAULT NULL
    )
    RETURNS BOOLEAN AS $$
    DECLARE
    v_exists BOOLEAN;
    BEGIN
    -- Check if repost exists
    SELECT EXISTS(
        SELECT 1 FROM reposts 
        WHERE user_id = p_user_id 
        AND original_post_id = p_post_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- Remove repost
        DELETE FROM reposts 
        WHERE user_id = p_user_id 
        AND original_post_id = p_post_id;
        
        -- Update count
        UPDATE posts 
        SET repost_count = GREATEST(0, repost_count - 1)
        WHERE id = p_post_id;
        
        RETURN false;
    ELSE
        -- Add repost
        INSERT INTO reposts (user_id, original_post_id, comment)
        VALUES (p_user_id, p_post_id, p_comment);
        
        -- Update count
        UPDATE posts 
        SET repost_count = repost_count + 1
        WHERE id = p_post_id;
        
        RETURN true;
    END IF;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Function to increment view count
    CREATE OR REPLACE FUNCTION increment_view_count(p_post_id UUID)
    RETURNS VOID AS $$
    BEGIN
    UPDATE posts 
    SET view_count = view_count + 1
    WHERE id = p_post_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- ============================================================================
    -- PART 7: Create Triggers to Update Counts
    -- ============================================================================

    -- Trigger to update comment count
    CREATE OR REPLACE FUNCTION update_comment_count()
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
    END IF;
    RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS update_post_comment_count ON comments;
    CREATE TRIGGER update_post_comment_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_count();

    -- ============================================================================
    -- PART 8: Create Indexes for Performance
    -- ============================================================================

    CREATE INDEX IF NOT EXISTS idx_likes_user_target ON likes(user_id, target_id, target_type);
    CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_id, target_type);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user_target ON bookmarks(user_id, target_id, target_type);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_target ON bookmarks(target_id, target_type);
    CREATE INDEX IF NOT EXISTS idx_reposts_user_post ON reposts(user_id, original_post_id);
    CREATE INDEX IF NOT EXISTS idx_reposts_post ON reposts(original_post_id);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
    CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

    -- ============================================================================
    -- PART 9: Grant Permissions
    -- ============================================================================

    GRANT ALL ON likes TO authenticated;
    GRANT SELECT ON likes TO anon;
    GRANT ALL ON bookmarks TO authenticated;
    GRANT ALL ON reposts TO authenticated;
    GRANT SELECT ON reposts TO anon;
    GRANT EXECUTE ON FUNCTION toggle_like TO authenticated;
    GRANT EXECUTE ON FUNCTION toggle_bookmark TO authenticated;
    GRANT EXECUTE ON FUNCTION toggle_repost TO authenticated;
    GRANT EXECUTE ON FUNCTION increment_view_count TO authenticated, anon;

    -- ============================================================================
    -- Migration Complete
    -- ============================================================================
