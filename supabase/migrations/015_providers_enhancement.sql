-- Providers Enhancement Migration
-- Idempotent schema with full directory functionality

-- Create provider_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id),
  provider_type VARCHAR(100) NOT NULL DEFAULT 'service_provider',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to provider_profiles if they don't exist
DO $$ 
BEGIN
  -- Add company_name if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'company_name') THEN
    ALTER TABLE provider_profiles ADD COLUMN company_name VARCHAR(255);
  END IF;
  
  -- Add bio if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'bio') THEN
    ALTER TABLE provider_profiles ADD COLUMN bio TEXT;
  END IF;
  
  -- Add logo_url if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'logo_url') THEN
    ALTER TABLE provider_profiles ADD COLUMN logo_url TEXT;
  END IF;
  
  -- Add price_min if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'price_min') THEN
    ALTER TABLE provider_profiles ADD COLUMN price_min DECIMAL(10,2);
  END IF;
  
  -- Add price_max if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'price_max') THEN
    ALTER TABLE provider_profiles ADD COLUMN price_max DECIMAL(10,2);
  END IF;
  
  -- Add currency if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'currency') THEN
    ALTER TABLE provider_profiles ADD COLUMN currency VARCHAR(10) DEFAULT 'USD';
  END IF;
  
  -- Add experience_years if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'experience_years') THEN
    ALTER TABLE provider_profiles ADD COLUMN experience_years INTEGER;
  END IF;
  
  -- Add team_size if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'team_size') THEN
    ALTER TABLE provider_profiles ADD COLUMN team_size INTEGER;
  END IF;
  
  -- Add founded_year if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'founded_year') THEN
    ALTER TABLE provider_profiles ADD COLUMN founded_year INTEGER;
  END IF;
  
  -- Add social_links if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'social_links') THEN
    ALTER TABLE provider_profiles ADD COLUMN social_links JSONB DEFAULT '{}';
  END IF;
  
  -- Add is_approved if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'is_approved') THEN
    ALTER TABLE provider_profiles ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add location if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'location') THEN
    ALTER TABLE provider_profiles ADD COLUMN location VARCHAR(255);
  END IF;
  
  -- Add tags if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'tags') THEN
    ALTER TABLE provider_profiles ADD COLUMN tags TEXT[];
  END IF;
  
  -- Add rating_avg if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'rating_avg') THEN
    ALTER TABLE provider_profiles ADD COLUMN rating_avg DECIMAL(3,2) DEFAULT 0;
  END IF;
  
  -- Add review_count if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'review_count') THEN
    ALTER TABLE provider_profiles ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add portfolio_count if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'portfolio_count') THEN
    ALTER TABLE provider_profiles ADD COLUMN portfolio_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add follower_count if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'follower_count') THEN
    ALTER TABLE provider_profiles ADD COLUMN follower_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add provider_type if not exists (for existing tables)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_profiles' AND column_name = 'provider_type') THEN
    ALTER TABLE provider_profiles ADD COLUMN provider_type VARCHAR(100) DEFAULT 'service_provider';
  END IF;
END $$;

-- Categories table for services
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider services many-to-many
CREATE TABLE IF NOT EXISTS provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  description TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, category_id)
);

-- Ensure legacy provider_services tables have is_primary column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'provider_services' AND column_name = 'is_primary'
  ) THEN
    ALTER TABLE provider_services ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;
  ELSE
    ALTER TABLE provider_services ALTER COLUMN is_primary SET DEFAULT FALSE;
  END IF;
END $$;

-- Reviews table with detailed ratings
CREATE TABLE IF NOT EXISTS provider_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id),
  project_id UUID REFERENCES portfolios(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  ratings_detail JSONB DEFAULT '{}',
  title VARCHAR(255),
  content TEXT,
  media_urls TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider follows/bookmarks
CREATE TABLE IF NOT EXISTS provider_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, user_id)
);

CREATE TABLE IF NOT EXISTS provider_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_profiles_type ON provider_profiles(provider_type);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_location ON provider_profiles(location);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_rating ON provider_profiles(rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_approved ON provider_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_price ON provider_profiles(price_min, price_max);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider ON provider_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_rating ON provider_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_follows_user ON provider_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_bookmarks_user ON provider_bookmarks(user_id);

-- Function to update provider rating average
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE provider_profiles
    SET 
      rating_avg = (
        SELECT AVG(rating)::DECIMAL(3,2)
        FROM provider_reviews
        WHERE provider_id = NEW.provider_id
      ),
      review_count = (
        SELECT COUNT(*)
        FROM provider_reviews
        WHERE provider_id = NEW.provider_id
      )
    WHERE id = NEW.provider_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE provider_profiles
    SET 
      rating_avg = COALESCE((
        SELECT AVG(rating)::DECIMAL(3,2)
        FROM provider_reviews
        WHERE provider_id = OLD.provider_id
      ), 0),
      review_count = (
        SELECT COUNT(*)
        FROM provider_reviews
        WHERE provider_id = OLD.provider_id
      )
    WHERE id = OLD.provider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rating updates
DROP TRIGGER IF EXISTS trigger_update_provider_rating ON provider_reviews;
CREATE TRIGGER trigger_update_provider_rating
AFTER INSERT OR UPDATE OR DELETE ON provider_reviews
FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- Function to update follower count
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE provider_profiles
    SET follower_count = follower_count + 1
    WHERE id = NEW.provider_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE provider_profiles
    SET follower_count = follower_count - 1
    WHERE id = OLD.provider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for follower count
DROP TRIGGER IF EXISTS trigger_update_follower_count ON provider_follows;
CREATE TRIGGER trigger_update_follower_count
AFTER INSERT OR DELETE ON provider_follows
FOR EACH ROW EXECUTE FUNCTION update_follower_count();

-- Function to update portfolio count
CREATE OR REPLACE FUNCTION update_portfolio_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE provider_profiles
    SET portfolio_count = portfolio_count + 1
    WHERE id = NEW.provider_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE provider_profiles
    SET portfolio_count = portfolio_count - 1
    WHERE id = OLD.provider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for portfolio count
DROP TRIGGER IF EXISTS trigger_update_portfolio_count ON portfolios;
CREATE TRIGGER trigger_update_portfolio_count
AFTER INSERT OR DELETE ON portfolios
FOR EACH ROW EXECUTE FUNCTION update_portfolio_count();

-- Create provider_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS provider_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to provider_types if they don't exist
DO $$ 
BEGIN
  -- Add display_name if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_types' AND column_name = 'display_name') THEN
    ALTER TABLE provider_types ADD COLUMN display_name VARCHAR(100);
  END IF;
  
  -- Add description if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_types' AND column_name = 'description') THEN
    ALTER TABLE provider_types ADD COLUMN description TEXT;
  END IF;
  
  -- Add is_active if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_types' AND column_name = 'is_active') THEN
    ALTER TABLE provider_types ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Insert default provider types (only name first, then update)
INSERT INTO provider_types (name) VALUES
  ('interior_designer'),
  ('architect'),
  ('contractor'),
  ('landscaper'),
  ('service_provider')
ON CONFLICT (name) DO NOTHING;

-- Update display names and descriptions
UPDATE provider_types SET 
  display_name = CASE 
    WHEN name = 'interior_designer' THEN 'Interior Designer'
    WHEN name = 'architect' THEN 'Architect'
    WHEN name = 'contractor' THEN 'Contractor'
    WHEN name = 'landscaper' THEN 'Landscaper'
    WHEN name = 'service_provider' THEN 'Service Provider'
    ELSE INITCAP(REPLACE(name, '_', ' '))
  END,
  description = CASE 
    WHEN name = 'interior_designer' THEN 'Professional interior design services'
    WHEN name = 'architect' THEN 'Architectural design and planning services'
    WHEN name = 'contractor' THEN 'Construction and renovation services'
    WHEN name = 'landscaper' THEN 'Landscape design and maintenance'
    WHEN name = 'service_provider' THEN 'General home improvement services'
    ELSE NULL
  END
WHERE display_name IS NULL OR description IS NULL;

-- View for providers feed with aggregated data
CREATE OR REPLACE VIEW providers_feed AS
SELECT 
  p.*,
  COALESCE(pt.display_name, INITCAP(REPLACE(p.provider_type, '_', ' '))) as type_display_name,
  pt.description as type_description,
  COALESCE(p.rating_avg, 0) as rating,
  COALESCE(p.review_count, 0) as reviews,
  COALESCE(p.portfolio_count, 0) as portfolios,
  COALESCE(p.follower_count, 0) as followers,
  ARRAY(
    SELECT sc.name 
    FROM provider_services ps
    JOIN service_categories sc ON ps.category_id = sc.id
    WHERE ps.provider_id = p.id
    ORDER BY ps.is_primary DESC, sc.display_order
    LIMIT 5
  ) as services,
  CASE 
    WHEN p.created_at > NOW() - INTERVAL '7 days' THEN 'new'
    WHEN p.rating_avg >= 4.5 THEN 'top_rated'
    WHEN p.portfolio_count >= 10 THEN 'experienced'
    ELSE 'standard'
  END as badge
FROM provider_profiles p
LEFT JOIN provider_types pt ON p.provider_type = pt.name
WHERE p.is_approved = TRUE
ORDER BY p.rating_avg DESC, p.portfolio_count DESC;

-- Insert default service categories
INSERT INTO service_categories (name, slug, icon, display_order) VALUES
  ('Interior Design', 'interior-design', '🏠', 1),
  ('Architecture', 'architecture', '🏗️', 2),
  ('Renovation', 'renovation', '🔨', 3),
  ('Landscaping', 'landscaping', '🌳', 4),
  ('Furniture', 'furniture', '🪑', 5),
  ('Lighting', 'lighting', '💡', 6),
  ('Kitchen & Bath', 'kitchen-bath', '🚿', 7),
  ('Flooring', 'flooring', '🏠', 8),
  ('Painting', 'painting', '🎨', 9),
  ('Smart Home', 'smart-home', '📱', 10)
ON CONFLICT (slug) DO NOTHING;

-- Enable realtime for provider tables
ALTER PUBLICATION supabase_realtime ADD TABLE provider_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE provider_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE provider_follows;
