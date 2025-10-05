-- ============================================================================
-- Forum System Database Schema for Renovation Platform
-- Modern discussion forum with categories, posts, comments, likes, follows, messages, reposts, bookmarks
-- ============================================================================

-- 1. Create categories table (admin-created)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial categories
INSERT INTO categories (name, slug, description) VALUES
  ('Renovation Q&A', 'renovation_qa', 'Ask and answer renovation questions'),
  ('Renovation Unboxing', 'renovation_unboxing', 'Share your renovation product reviews'),
  ('Good Stuff Recommendations', 'good_stuff_recommendations', 'Recommend great products and services'),
  ('Maintenance Issues', 'maintenance_issues', 'Discuss common maintenance problems and solutions');

-- 2. Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT title_not_empty CHECK (char_length(title) > 0 AND char_length(title) <= 300),
  CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

-- 3. Create comments table (supports nested comments)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  like_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

-- 4. Create likes table (polymorphic for posts and comments)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, target_id, target_type)
);

-- 5. Create follows table
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

-- 6. Create messages table (private messaging)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_read BOOLEAN DEFAULT false,
  is_deleted_by_sender BOOLEAN DEFAULT false,
  is_deleted_by_receiver BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT content_not_empty CHECK (char_length(content) > 0),
  CHECK (sender_id != receiver_id)
);

-- 7. Create reposts table
CREATE TABLE reposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, original_post_id)
);

-- 8. Create bookmarks table
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, post_id)
);

-- 9. Create indexes for performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_likes_target ON likes(target_id, target_type);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_followed ON follows(followed_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_reposts_user ON reposts(user_id);
CREATE INDEX idx_reposts_post ON reposts(original_post_id);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- 10. Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies for categories
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 12. RLS Policies for posts
CREATE POLICY "Anyone can view non-deleted posts"
  ON posts FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can delete posts"
  ON posts FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin')
  );

-- 13. RLS Policies for comments
CREATE POLICY "Anyone can view non-deleted comments"
  ON comments FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can delete comments"
  ON comments FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin')
  );

-- 14. RLS Policies for likes
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 15. RLS Policies for follows
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own follows"
  ON follows FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- 16. RLS Policies for messages
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own sent messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 17. RLS Policies for reposts
CREATE POLICY "Anyone can view reposts"
  ON reposts FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own reposts"
  ON reposts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 18. RLS Policies for bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks"
  ON bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 19. Create triggers to update counts
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_like_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'comment' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'comment' THEN
    UPDATE comments SET like_count = like_count - 1 WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_like_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_count();

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comment_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

CREATE OR REPLACE FUNCTION update_post_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET repost_count = repost_count + 1 WHERE id = NEW.original_post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET repost_count = repost_count - 1 WHERE id = OLD.original_post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_repost_count_trigger
  AFTER INSERT OR DELETE ON reposts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_repost_count();

CREATE OR REPLACE FUNCTION update_post_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET bookmark_count = bookmark_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET bookmark_count = bookmark_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_bookmark_count_trigger
  AFTER INSERT OR DELETE ON bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_post_bookmark_count();

-- 20. Create updated_at triggers
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 21. Create views for easier querying
CREATE VIEW posts_with_user AS
SELECT 
  p.*,
  u.username,
  u.avatar_url as user_avatar,
  u.full_name as user_full_name,
  c.name as category_name,
  c.slug as category_slug
FROM posts p
JOIN app_users u ON p.user_id = u.id
JOIN categories c ON p.category_id = c.id
WHERE p.is_deleted = false;

CREATE VIEW comments_with_user AS
SELECT 
  c.*,
  u.username,
  u.avatar_url as user_avatar,
  u.full_name as user_full_name
FROM comments c
JOIN app_users u ON c.user_id = u.id
WHERE c.is_deleted = false;

-- Grant access to authenticated users
GRANT SELECT ON posts_with_user TO authenticated;
GRANT SELECT ON comments_with_user TO authenticated;

-- 22. Create function to check if user liked a target
CREATE OR REPLACE FUNCTION user_liked_target(target_uuid UUID, target_type_str TEXT, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM likes
    WHERE target_id = target_uuid
    AND target_type = target_type_str
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 23. Create function to check if user follows another user
CREATE OR REPLACE FUNCTION user_follows(follower_uuid UUID, followed_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = follower_uuid
    AND followed_id = followed_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 24. Create function to get follower/following counts
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE(
  follower_count BIGINT,
  following_count BIGINT,
  post_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM follows WHERE followed_id = user_uuid)::BIGINT as follower_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = user_uuid)::BIGINT as following_count,
    (SELECT COUNT(*) FROM posts WHERE user_id = user_uuid AND is_deleted = false)::BIGINT as post_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
