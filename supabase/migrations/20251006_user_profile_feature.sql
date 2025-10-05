-- User Profile Feature Schema

-- ALTER bookmarks to support type enum
ALTER TABLE public.bookmarks 
ADD COLUMN IF NOT EXISTS bookmark_type TEXT DEFAULT 'post' CHECK (bookmark_type IN ('post', 'image', 'company'));

CREATE INDEX IF NOT EXISTS idx_bookmarks_type ON public.bookmarks(bookmark_type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_type ON public.bookmarks(user_id, bookmark_type);

-- User stats view with realtime counts
DROP VIEW IF EXISTS public.user_stats CASCADE;
CREATE VIEW public.user_stats AS
SELECT 
  u.id AS user_id,
  u.username,
  u.full_name,
  u.avatar_url,
  u.bio,
  COALESCE(followers.count, 0) AS followers_count,
  COALESCE(following.count, 0) AS following_count,
  COALESCE(collected_images.count, 0) AS collected_images_count,
  COALESCE(forum_responses.count, 0) AS forum_responses_count,
  COALESCE(posts.count, 0) AS posts_count
FROM public.app_users u
LEFT JOIN (
  SELECT followed_id AS user_id, COUNT(*) AS count
  FROM public.follows
  GROUP BY followed_id
) followers ON u.id = followers.user_id
LEFT JOIN (
  SELECT follower_id AS user_id, COUNT(*) AS count
  FROM public.follows
  GROUP BY follower_id
) following ON u.id = following.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS count
  FROM public.bookmarks
  WHERE bookmark_type = 'image'
  GROUP BY user_id
) collected_images ON u.id = collected_images.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS count
  FROM public.comments
  GROUP BY user_id
) forum_responses ON u.id = forum_responses.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS count
  FROM public.posts
  GROUP BY user_id
) posts ON u.id = posts.user_id;

-- User collections view for images
DROP VIEW IF EXISTS public.user_collected_images CASCADE;
CREATE VIEW public.user_collected_images AS
SELECT 
  b.user_id,
  b.id AS bookmark_id,
  b.created_at AS collected_at,
  p.id AS portfolio_id,
  p.title,
  p.cover_image_url,
  p.user_id AS provider_id,
  u.company_name AS provider_name,
  u.logo_url AS provider_logo
FROM public.bookmarks b
LEFT JOIN public.portfolios p ON b.post_id = p.id
LEFT JOIN public.app_users u ON p.user_id = u.id
WHERE b.bookmark_type = 'image' AND p.id IS NOT NULL;

-- User collections view for companies
DROP VIEW IF EXISTS public.user_followed_companies CASCADE;
CREATE VIEW public.user_followed_companies AS
SELECT 
  f.follower_id AS user_id,
  f.id AS follow_id,
  f.created_at AS followed_at,
  u.id AS company_id,
  u.username,
  u.company_name,
  u.logo_url,
  u.bio,
  COALESCE(p.portfolios_count, 0) AS portfolios_count,
  COALESCE(r.avg_rating, 0) AS avg_rating
FROM public.follows f
JOIN public.app_users u ON f.followed_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS portfolios_count
  FROM public.portfolios
  WHERE status = 'approved'
  GROUP BY user_id
) p ON u.id = p.user_id
LEFT JOIN (
  SELECT provider_id, AVG(overall_rating) AS avg_rating
  FROM public.provider_reviews
  GROUP BY provider_id
) r ON u.id = r.provider_id
WHERE u.role = 'provider';

-- Function to calculate user badges
CREATE OR REPLACE FUNCTION public.calculate_user_badges(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats RECORD;
  v_badges JSON;
BEGIN
  SELECT * INTO v_stats FROM public.user_stats WHERE user_id = p_user_id;
  
  v_badges := '[]'::JSON;
  
  IF v_stats.collected_images_count >= 100 THEN
    v_badges := json_build_array(
      json_build_object('id', 'top_collector', 'label', 'Top Collector', 'icon', '🏆')
    );
  END IF;
  
  IF v_stats.forum_responses_count >= 50 THEN
    v_badges := v_badges || json_build_array(
      json_build_object('id', 'active_contributor', 'label', 'Active Contributor', 'icon', '💬')
    );
  END IF;
  
  IF v_stats.followers_count >= 100 THEN
    v_badges := v_badges || json_build_array(
      json_build_object('id', 'influencer', 'label', 'Influencer', 'icon', '⭐')
    );
  END IF;
  
  RETURN v_badges;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for user collections
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can create own bookmarks" ON public.bookmarks
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON public.follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);

COMMENT ON VIEW public.user_stats IS 'Aggregated user statistics with realtime counts';
COMMENT ON VIEW public.user_collected_images IS 'User collected portfolio images';
COMMENT ON VIEW public.user_followed_companies IS 'User followed provider companies';
