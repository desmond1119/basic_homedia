-- Inspiration Feed Feature
-- Migration: 006_inspiration_feed

-- 1. Extend provider portfolios with inspirational metadata
ALTER TABLE provider_portfolios ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;
ALTER TABLE provider_portfolios ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE provider_portfolios ADD COLUMN IF NOT EXISTS price_min NUMERIC(12,2);
ALTER TABLE provider_portfolios ADD COLUMN IF NOT EXISTS price_max NUMERIC(12,2);
ALTER TABLE provider_portfolios ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD';
ALTER TABLE provider_portfolios ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE provider_portfolios ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::JSONB;

-- 2. Sponsored flag for providers
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 3. Interaction tables
CREATE TABLE IF NOT EXISTS inspiration_collects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES provider_portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (portfolio_id, user_id)
);

CREATE TABLE IF NOT EXISTS inspiration_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES provider_portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (portfolio_id, user_id)
);

-- 4. Helpful indexes for filters and lookups
CREATE INDEX IF NOT EXISTS idx_portfolios_project_type ON provider_portfolios(project_type);
CREATE INDEX IF NOT EXISTS idx_portfolios_location ON provider_portfolios(location);
CREATE INDEX IF NOT EXISTS idx_portfolios_tags ON provider_portfolios USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_collects_portfolio ON inspiration_collects(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_likes_portfolio ON inspiration_likes(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_collects_user ON inspiration_collects(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON inspiration_likes(user_id);

-- 5. Inspiration feed view combining portfolio and provider metadata
CREATE OR REPLACE VIEW inspiration_feed AS
SELECT
  p.id,
  p.provider_id,
  p.title,
  p.description,
  p.image_url,
  COALESCE(p.gallery_images, '[]'::JSONB) AS gallery_images,
  p.project_type,
  p.project_year,
  p.location,
  p.price_min,
  p.price_max,
  p.currency_code,
  COALESCE(p.tags, ARRAY[]::TEXT[]) AS tags,
  p.is_featured,
  p.pinned,
  p.created_at,
  p.updated_at,
  u.company_name,
  u.logo_url,
  u.avatar_url,
  u.username,
  u.overall_rating,
  u.total_reviews,
  u.is_sponsored,
  u.is_verified,
  u.role,
  COALESCE(col.collect_count, 0)::BIGINT AS collect_count,
  COALESCE(lk.like_count, 0)::BIGINT AS like_count,
  COALESCE(pin.pin_rank, 0)::INT AS pin_rank
FROM provider_portfolios p
JOIN app_users u ON u.id = p.provider_id AND u.role = 'provider'
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS collect_count
  FROM inspiration_collects ic
  WHERE ic.portfolio_id = p.id
) col ON TRUE
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS like_count
  FROM inspiration_likes il
  WHERE il.portfolio_id = p.id
) lk ON TRUE
LEFT JOIN LATERAL (
  SELECT CASE WHEN p.pinned THEN 1 ELSE 0 END AS pin_rank
) pin ON TRUE;

-- 6. Row level security policies
ALTER TABLE inspiration_collects ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read inspiration_collects" ON inspiration_collects
  FOR SELECT
  USING (true);

CREATE POLICY "Users manage own inspiration_collects" ON inspiration_collects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read inspiration_likes" ON inspiration_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users manage own inspiration_likes" ON inspiration_likes
  FOR ALL USING (auth.uid() = user_id);

-- 7. Grant access to authenticated users for interactions
GRANT SELECT ON inspiration_feed TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON inspiration_collects TO authenticated;
GRANT SELECT, INSERT, DELETE ON inspiration_likes TO authenticated;
