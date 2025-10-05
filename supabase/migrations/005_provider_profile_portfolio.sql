-- Provider Profile & Portfolio Feature
-- Migration: 005_provider_profile_portfolio

-- Extend app_users for provider profile data
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS price_range JSONB DEFAULT '{}';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 0;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS completed_projects INTEGER DEFAULT 0;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS overall_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Provider services table
CREATE TABLE IF NOT EXISTS provider_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_key TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_provider_services_provider ON provider_services(provider_id);
CREATE INDEX idx_provider_services_active ON provider_services(is_active);

-- Provider portfolios table
CREATE TABLE IF NOT EXISTS provider_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  project_type TEXT,
  project_year INTEGER,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolios_provider ON provider_portfolios(provider_id);
CREATE INDEX idx_portfolios_featured ON provider_portfolios(is_featured);
CREATE INDEX idx_portfolios_order ON provider_portfolios(display_order);

-- Provider reviews table with multi-dimensional ratings
CREATE TABLE IF NOT EXISTS provider_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  ratings_breakdown JSONB NOT NULL DEFAULT '{}',
  review_text TEXT,
  project_type TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_provider ON provider_reviews(provider_id);
CREATE INDEX idx_reviews_reviewer ON provider_reviews(reviewer_id);
CREATE INDEX idx_reviews_rating ON provider_reviews(overall_rating);
CREATE INDEX idx_reviews_created ON provider_reviews(created_at DESC);

-- Function to calculate average ratings with breakdown
CREATE OR REPLACE FUNCTION calculate_provider_ratings(provider_uuid UUID)
RETURNS TABLE(
  overall_avg DECIMAL(3,2),
  total_count INTEGER,
  ratings_avg JSONB
) AS $$
DECLARE
  design_avg DECIMAL(3,2);
  construction_avg DECIMAL(3,2);
  service_avg DECIMAL(3,2);
  communication_avg DECIMAL(3,2);
  timeline_avg DECIMAL(3,2);
  value_avg DECIMAL(3,2);
BEGIN
  SELECT 
    AVG(overall_rating)::DECIMAL(3,2),
    COUNT(*)::INTEGER,
    AVG((ratings_breakdown->>'design')::DECIMAL)::DECIMAL(3,2),
    AVG((ratings_breakdown->>'construction')::DECIMAL)::DECIMAL(3,2),
    AVG((ratings_breakdown->>'service')::DECIMAL)::DECIMAL(3,2),
    AVG((ratings_breakdown->>'communication')::DECIMAL)::DECIMAL(3,2),
    AVG((ratings_breakdown->>'timeline')::DECIMAL)::DECIMAL(3,2),
    AVG((ratings_breakdown->>'value')::DECIMAL)::DECIMAL(3,2)
  INTO 
    overall_avg, 
    total_count,
    design_avg,
    construction_avg,
    service_avg,
    communication_avg,
    timeline_avg,
    value_avg
  FROM provider_reviews
  WHERE provider_id = provider_uuid;

  ratings_avg := jsonb_build_object(
    'design', COALESCE(design_avg, 0),
    'construction', COALESCE(construction_avg, 0),
    'service', COALESCE(service_avg, 0),
    'communication', COALESCE(communication_avg, 0),
    'timeline', COALESCE(timeline_avg, 0),
    'value', COALESCE(value_avg, 0)
  );

  RETURN QUERY SELECT 
    COALESCE(overall_avg, 0.00),
    COALESCE(total_count, 0),
    ratings_avg;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update provider ratings on review insert/update/delete
CREATE OR REPLACE FUNCTION update_provider_ratings_trigger()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE app_users
  SET 
    overall_rating = (SELECT overall_avg FROM calculate_provider_ratings(COALESCE(NEW.provider_id, OLD.provider_id))),
    total_reviews = (SELECT total_count FROM calculate_provider_ratings(COALESCE(NEW.provider_id, OLD.provider_id)))
  WHERE id = COALESCE(NEW.provider_id, OLD.provider_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ratings_on_review ON provider_reviews;
CREATE TRIGGER trg_update_ratings_on_review
AFTER INSERT OR UPDATE OR DELETE ON provider_reviews
FOR EACH ROW
EXECUTE FUNCTION update_provider_ratings_trigger();

-- View for provider full profile with stats
CREATE OR REPLACE VIEW provider_full_profiles AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.full_name,
  u.company_name,
  u.logo_url,
  u.avatar_url,
  u.bio,
  u.price_range,
  u.social_links,
  u.team_size,
  u.founded_year,
  u.experience_years,
  u.completed_projects,
  u.overall_rating,
  u.total_reviews,
  u.role,
  u.created_at,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('id', id, 'name', service_name, 'key', service_key) ORDER BY display_order)
     FROM provider_services 
     WHERE provider_id = u.id AND is_active = true),
    '[]'::jsonb
  ) as services,
  COALESCE(
    (SELECT jsonb_agg(service_data)
     FROM (
       SELECT jsonb_build_object('id', id, 'title', title, 'imageUrl', image_url, 'projectType', project_type, 'projectYear', project_year) as service_data
       FROM provider_portfolios 
       WHERE provider_id = u.id
       ORDER BY display_order, created_at DESC
       LIMIT 12
     ) sub),
    '[]'::jsonb
  ) as portfolios
FROM app_users u
WHERE u.role = 'provider';

-- RLS Policies
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_reviews ENABLE ROW LEVEL SECURITY;

-- Services policies
CREATE POLICY "Public can view active services" ON provider_services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Providers can manage own services" ON provider_services
  FOR ALL USING (auth.uid() = provider_id);

-- Portfolios policies
CREATE POLICY "Public can view portfolios" ON provider_portfolios
  FOR SELECT USING (true);

CREATE POLICY "Providers can manage own portfolios" ON provider_portfolios
  FOR ALL USING (auth.uid() = provider_id);

-- Reviews policies
CREATE POLICY "Public can view reviews" ON provider_reviews
  FOR SELECT USING (true);

CREATE POLICY "Homeowners can create reviews" ON provider_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update own reviews" ON provider_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can delete own reviews" ON provider_reviews
  FOR DELETE USING (auth.uid() = reviewer_id);

-- Function to get full provider profile
CREATE OR REPLACE FUNCTION get_provider_full_profile(provider_uuid UUID)
RETURNS TABLE(
  id UUID,
  username TEXT,
  company_name TEXT,
  logo_url TEXT,
  avatar_url TEXT,
  bio TEXT,
  price_range JSONB,
  social_links JSONB,
  team_size INTEGER,
  founded_year INTEGER,
  experience_years INTEGER,
  completed_projects INTEGER,
  overall_rating DECIMAL(3,2),
  total_reviews INTEGER,
  ratings_breakdown JSONB,
  services JSONB,
  portfolios JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.company_name,
    p.logo_url,
    p.avatar_url,
    p.bio,
    p.price_range,
    p.social_links,
    p.team_size,
    p.founded_year,
    p.experience_years,
    p.completed_projects,
    p.overall_rating,
    p.total_reviews,
    (SELECT ratings_avg FROM calculate_provider_ratings(provider_uuid)) as ratings_breakdown,
    p.services,
    p.portfolios
  FROM provider_full_profiles p
  WHERE p.id = provider_uuid;
END;
$$ LANGUAGE plpgsql;
