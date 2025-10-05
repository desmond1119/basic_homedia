-- ============================================================================
-- FIX PROFILE ISSUES - 修復個人檔案頁面問題
-- ============================================================================

-- 1. 確保 user_profiles 視圖包含所有必要欄位
DROP VIEW IF EXISTS public.user_profiles CASCADE;
CREATE VIEW public.user_profiles AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.role,
  u.full_name,
  u.phone,
  u.avatar_url,
  u.is_active,
  u.email_verified,
  u.created_at,
  u.company_name,
  u.logo_url,
  u.bio,
  u.price_range,
  u.social_links,
  u.completed_projects,
  u.experience_years,
  u.team_size,
  u.founded_year,
  u.overall_rating,
  u.total_reviews,
  u.is_approved,
  pt.type_name as provider_type,
  pt.display_name as provider_type_display,
  u.provider_type_id
FROM public.app_users u
LEFT JOIN public.provider_types pt ON u.provider_type_id = pt.id;

GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- 2. 創建或更新 get_user_profile_with_stats 函數
CREATE OR REPLACE FUNCTION public.get_user_profile_with_stats(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  username TEXT,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  company_name TEXT,
  role TEXT,
  provider_type_id UUID,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  follower_count BIGINT,
  following_count BIGINT,
  post_count BIGINT,
  bookmark_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.avatar_url,
    u.bio,
    CAST(NULL AS TEXT) as location,
    CAST(NULL AS TEXT) as website,
    u.company_name,
    u.role::TEXT,
    u.provider_type_id,
    u.is_active,
    u.created_at,
    u.updated_at,
    COALESCE((SELECT COUNT(*) FROM public.follows WHERE followed_id = user_uuid), 0)::BIGINT as follower_count,
    COALESCE((SELECT COUNT(*) FROM public.follows WHERE follower_id = user_uuid), 0)::BIGINT as following_count,
    COALESCE((SELECT COUNT(*) FROM public.posts WHERE user_id = user_uuid AND is_deleted = false), 0)::BIGINT as post_count,
    COALESCE((SELECT COUNT(*) FROM public.bookmarks WHERE user_id = user_uuid), 0)::BIGINT as bookmark_count
  FROM public.app_users u
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_profile_with_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_with_stats(UUID) TO anon;

-- 3. 創建 posts 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_deleted ON public.posts(is_deleted);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts
FOR SELECT USING (is_deleted = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" ON public.posts
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts
FOR DELETE USING (auth.uid() = user_id);

-- 4. 確認執行結果
SELECT 
  'Profile fixes applied successfully!' as status,
  'user_profiles view recreated' as step1,
  'get_user_profile_with_stats function updated' as step2,
  'posts table ensured' as step3;

-- 5. 測試查詢
SELECT 
  'Test: Fetching user profiles' as test_name,
  COUNT(*) as user_count
FROM public.user_profiles;
