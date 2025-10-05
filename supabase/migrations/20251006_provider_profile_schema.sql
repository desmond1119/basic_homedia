-- Provider Profile Schema
-- Extends app_users for provider fields, creates reviews/services tables

-- Add provider fields to app_users (already has some fields)
ALTER TABLE public.app_users
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS price_range JSONB DEFAULT '{"min": 0, "max": 0, "currency": "HKD"}',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS completed_projects INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS overall_rating NUMERIC(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Provider Reviews Table
CREATE TABLE IF NOT EXISTS public.provider_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  overall_rating NUMERIC(2,1) NOT NULL CHECK (overall_rating >= 0 AND overall_rating <= 5),
  ratings_breakdown JSONB NOT NULL DEFAULT '{"quality": 0, "communication": 0, "timeliness": 0, "value": 0}',
  review_text TEXT,
  project_type TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider ON public.provider_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_reviewer ON public.provider_reviews(reviewer_id);

-- Provider Services Table
CREATE TABLE IF NOT EXISTS public.provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  service_key TEXT NOT NULL,
  service_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, service_key)
);

CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON public.provider_services(provider_id);

-- Provider Portfolios Table
CREATE TABLE IF NOT EXISTS public.provider_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  project_type TEXT,
  project_year INTEGER,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_portfolios_provider ON public.provider_portfolios(provider_id);

-- View: Provider Full Profile with aggregated data
DROP VIEW IF EXISTS public.provider_full_profiles CASCADE;
CREATE VIEW public.provider_full_profiles AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.full_name,
  u.avatar_url,
  u.role,
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
  u.created_at,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', ps.id,
      'serviceKey', ps.service_key,
      'serviceName', ps.service_name,
      'displayOrder', ps.display_order
    ) ORDER BY ps.display_order)
    FROM public.provider_services ps
    WHERE ps.provider_id = u.id AND ps.is_active = TRUE),
    '[]'::json
  ) AS services,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', pp.id,
      'title', pp.title,
      'description', pp.description,
      'imageUrl', pp.image_url,
      'projectType', pp.project_type,
      'projectYear', pp.project_year,
      'isFeatured', pp.is_featured
    ) ORDER BY pp.is_featured DESC, pp.display_order)
    FROM public.provider_portfolios pp
    WHERE pp.provider_id = u.id),
    '[]'::json
  ) AS portfolios
FROM public.app_users u
WHERE u.role = 'provider';

-- Function: Calculate provider ratings
DROP FUNCTION IF EXISTS public.calculate_provider_ratings(UUID);
CREATE FUNCTION public.calculate_provider_ratings(provider_uuid UUID)
RETURNS TABLE (
  overall_avg NUMERIC,
  ratings_avg JSONB,
  total_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(pr.overall_rating)::numeric, 2) AS overall_avg,
    jsonb_build_object(
      'quality', ROUND(AVG((pr.ratings_breakdown->>'quality')::numeric), 2),
      'communication', ROUND(AVG((pr.ratings_breakdown->>'communication')::numeric), 2),
      'timeliness', ROUND(AVG((pr.ratings_breakdown->>'timeliness')::numeric), 2),
      'value', ROUND(AVG((pr.ratings_breakdown->>'value')::numeric), 2)
    ) AS ratings_avg,
    COUNT(*)::integer AS total_count
  FROM public.provider_reviews pr
  WHERE pr.provider_id = provider_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function: Get provider full profile
DROP FUNCTION IF EXISTS public.get_provider_full_profile(UUID);
CREATE FUNCTION public.get_provider_full_profile(provider_uuid UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  company_name TEXT,
  logo_url TEXT,
  avatar_url TEXT,
  bio TEXT,
  price_range JSONB,
  social_links JSONB,
  completed_projects INTEGER,
  experience_years INTEGER,
  team_size INTEGER,
  founded_year INTEGER,
  overall_rating NUMERIC,
  total_reviews INTEGER,
  ratings_breakdown JSONB,
  services JSONB,
  portfolios JSONB
) AS $$
DECLARE
  ratings_data RECORD;
BEGIN
  SELECT * INTO ratings_data FROM public.calculate_provider_ratings(provider_uuid);
  
  RETURN QUERY
  SELECT 
    pfp.id,
    pfp.username,
    pfp.company_name,
    pfp.logo_url,
    pfp.avatar_url,
    pfp.bio,
    pfp.price_range,
    pfp.social_links,
    pfp.completed_projects,
    pfp.experience_years,
    pfp.team_size,
    pfp.founded_year,
    COALESCE(ratings_data.overall_avg, 0::numeric) AS overall_rating,
    COALESCE(ratings_data.total_count, 0) AS total_reviews,
    COALESCE(ratings_data.ratings_avg, '{}'::jsonb) AS ratings_breakdown,
    pfp.services::jsonb,
    pfp.portfolios::jsonb
  FROM public.provider_full_profiles pfp
  WHERE pfp.id = provider_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update provider ratings on review insert/update/delete
DROP FUNCTION IF EXISTS public.update_provider_ratings() CASCADE;
CREATE FUNCTION public.update_provider_ratings()
RETURNS TRIGGER AS $$
DECLARE
  ratings_data RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT * INTO ratings_data FROM public.calculate_provider_ratings(OLD.provider_id);
  ELSE
    SELECT * INTO ratings_data FROM public.calculate_provider_ratings(NEW.provider_id);
  END IF;

  UPDATE public.app_users
  SET 
    overall_rating = COALESCE(ratings_data.overall_avg, 0),
    total_reviews = COALESCE(ratings_data.total_count, 0),
    updated_at = NOW()
  WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.provider_id ELSE NEW.provider_id END;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_provider_ratings ON public.provider_reviews;
CREATE TRIGGER trigger_update_provider_ratings
AFTER INSERT OR UPDATE OR DELETE ON public.provider_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_provider_ratings();

-- RLS Policies
ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_portfolios ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.provider_reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.provider_reviews
FOR SELECT USING (true);

-- Only authenticated users can create reviews
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.provider_reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.provider_reviews
FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Users can update their own reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON public.provider_reviews;
CREATE POLICY "Users can update own reviews" ON public.provider_reviews
FOR UPDATE USING (auth.uid() = reviewer_id);

-- Users can delete their own reviews
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.provider_reviews;
CREATE POLICY "Users can delete own reviews" ON public.provider_reviews
FOR DELETE USING (auth.uid() = reviewer_id);

-- Anyone can view services
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.provider_services;
CREATE POLICY "Services are viewable by everyone" ON public.provider_services
FOR SELECT USING (true);

-- Providers can manage their own services
DROP POLICY IF EXISTS "Providers can manage own services" ON public.provider_services;
CREATE POLICY "Providers can manage own services" ON public.provider_services
FOR ALL USING (auth.uid() = provider_id);

-- Anyone can view portfolios
DROP POLICY IF EXISTS "Portfolios are viewable by everyone" ON public.provider_portfolios;
CREATE POLICY "Portfolios are viewable by everyone" ON public.provider_portfolios
FOR SELECT USING (true);

-- Providers can manage their own portfolios
DROP POLICY IF EXISTS "Providers can manage own portfolios" ON public.provider_portfolios;
CREATE POLICY "Providers can manage own portfolios" ON public.provider_portfolios
FOR ALL USING (auth.uid() = provider_id);
