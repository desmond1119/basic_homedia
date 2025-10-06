-- Forum Enhancement Migration
-- Idempotent schema with full forum functionality

-- Create forum_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  comment_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to forum_posts if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_posts' AND column_name = 'is_pinned') THEN
    ALTER TABLE forum_posts ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_posts' AND column_name = 'is_deleted') THEN
    ALTER TABLE forum_posts ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_posts' AND column_name = 'upvote_count') THEN
    ALTER TABLE forum_posts ADD COLUMN upvote_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_posts' AND column_name = 'downvote_count') THEN
    ALTER TABLE forum_posts ADD COLUMN downvote_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_posts' AND column_name = 'report_count') THEN
    ALTER TABLE forum_posts ADD COLUMN report_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Comments table with nesting support
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id),
  parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  upvote_count INTEGER DEFAULT 0,
  downvote_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table for posts and comments
CREATE TABLE IF NOT EXISTS forum_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- Reports table
CREATE TABLE IF NOT EXISTS forum_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES app_users(id),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES app_users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- User mentions table
CREATE TABLE IF NOT EXISTS forum_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES app_users(id),
  mentioner_id UUID NOT NULL REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_pinned ON forum_posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent_id ON forum_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_post_id ON forum_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_comment_id ON forum_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_forum_reports_status ON forum_reports(status);

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE forum_posts 
      SET upvote_count = upvote_count + CASE WHEN NEW.vote_type = 'upvote' THEN 1 ELSE 0 END,
          downvote_count = downvote_count + CASE WHEN NEW.vote_type = 'downvote' THEN 1 ELSE 0 END
      WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE forum_comments
      SET upvote_count = upvote_count + CASE WHEN NEW.vote_type = 'upvote' THEN 1 ELSE 0 END,
          downvote_count = downvote_count + CASE WHEN NEW.vote_type = 'downvote' THEN 1 ELSE 0 END
      WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE forum_posts 
      SET upvote_count = upvote_count - CASE WHEN OLD.vote_type = 'upvote' THEN 1 ELSE 0 END,
          downvote_count = downvote_count - CASE WHEN OLD.vote_type = 'downvote' THEN 1 ELSE 0 END
      WHERE id = OLD.post_id;
    ELSIF OLD.comment_id IS NOT NULL THEN
      UPDATE forum_comments
      SET upvote_count = upvote_count - CASE WHEN OLD.vote_type = 'upvote' THEN 1 ELSE 0 END,
          downvote_count = downvote_count - CASE WHEN OLD.vote_type = 'downvote' THEN 1 ELSE 0 END
      WHERE id = OLD.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE forum_posts 
      SET upvote_count = upvote_count + 
            CASE WHEN NEW.vote_type = 'upvote' AND OLD.vote_type = 'downvote' THEN 1
                 WHEN NEW.vote_type = 'downvote' AND OLD.vote_type = 'upvote' THEN -1
                 ELSE 0 END,
          downvote_count = downvote_count + 
            CASE WHEN NEW.vote_type = 'downvote' AND OLD.vote_type = 'upvote' THEN 1
                 WHEN NEW.vote_type = 'upvote' AND OLD.vote_type = 'downvote' THEN -1
                 ELSE 0 END
      WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE forum_comments
      SET upvote_count = upvote_count + 
            CASE WHEN NEW.vote_type = 'upvote' AND OLD.vote_type = 'downvote' THEN 1
                 WHEN NEW.vote_type = 'downvote' AND OLD.vote_type = 'upvote' THEN -1
                 ELSE 0 END,
          downvote_count = downvote_count + 
            CASE WHEN NEW.vote_type = 'downvote' AND OLD.vote_type = 'upvote' THEN 1
                 WHEN NEW.vote_type = 'upvote' AND OLD.vote_type = 'downvote' THEN -1
                 ELSE 0 END
      WHERE id = NEW.comment_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vote counts
DROP TRIGGER IF EXISTS trigger_update_vote_counts ON forum_votes;
CREATE TRIGGER trigger_update_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON forum_votes
FOR EACH ROW EXECUTE FUNCTION update_vote_counts();

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts 
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts 
    SET comment_count = comment_count - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment count
DROP TRIGGER IF EXISTS trigger_update_comment_count ON forum_comments;
CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON forum_comments
FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- View for forum feed with aggregated data
CREATE OR REPLACE VIEW forum_feed AS
SELECT 
  p.id,
  p.user_id,
  p.title,
  p.content,
  p.category,
  p.tags,
  p.media_urls,
  p.is_pinned,
  p.is_deleted,
  p.created_at,
  p.updated_at,
  COALESCE(p.comment_count, 0) as comment_count,
  COALESCE(p.like_count, 0) as like_count,
  COALESCE(p.view_count, 0) as view_count,
  COALESCE(p.upvote_count, 0) as upvote_count,
  COALESCE(p.downvote_count, 0) as downvote_count,
  COALESCE(p.report_count, 0) as report_count,
  u.username,
  u.avatar_url,
  COALESCE(u.full_name, u.username) as display_name,
  COALESCE(p.upvote_count, 0) - COALESCE(p.downvote_count, 0) as score,
  CASE 
    WHEN p.created_at > NOW() - INTERVAL '24 hours' THEN 'new'
    WHEN (COALESCE(p.upvote_count, 0) - COALESCE(p.downvote_count, 0)) > 10 THEN 'hot'
    ELSE 'normal'
  END as post_status
FROM forum_posts p
JOIN app_users u ON p.user_id = u.id
WHERE p.is_deleted = FALSE
ORDER BY p.is_pinned DESC, p.created_at DESC;

-- Enable realtime for forum tables (with error handling)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_comments;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_votes;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Storage bucket for forum media
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-media', 'forum-media', true)
ON CONFLICT (id) DO NOTHING;
