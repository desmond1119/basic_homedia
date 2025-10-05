-- Manual Migration Application
-- Copy and run this in Supabase Dashboard SQL Editor
-- URL: https://supabase.com/dashboard/project/jufwllhkgtvovyazgxld/sql

-- ========================================
-- 1. Add Provider Approved Status
-- ========================================
ALTER TABLE public.app_users
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_app_users_approved ON public.app_users(is_approved) WHERE role = 'provider';

COMMENT ON COLUMN public.app_users.is_approved IS 'Admin approval status for provider profiles';

-- ========================================
-- 2. Portfolio Feature Tables
-- ========================================

-- Categories table with hierarchy
CREATE TABLE IF NOT EXISTS public.portfolio_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.portfolio_categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_categories_parent ON public.portfolio_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_categories_active ON public.portfolio_categories(is_active);

-- Portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  address TEXT,
  area_sqft NUMERIC(10,2),
  total_cost NUMERIC(15,2),
  currency TEXT DEFAULT 'HKD',
  description TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  collects_count INTEGER DEFAULT 0,
  impressions_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_status ON public.portfolios(status);
CREATE INDEX IF NOT EXISTS idx_portfolios_featured ON public.portfolios(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_portfolios_created ON public.portfolios(created_at DESC);

-- Portfolio images table
CREATE TABLE IF NOT EXISTS public.portfolio_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.portfolio_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  file_type TEXT DEFAULT 'image',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_images_portfolio ON public.portfolio_images(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_category ON public.portfolio_images(category_id);

-- Portfolio collects (user saves)
CREATE TABLE IF NOT EXISTS public.portfolio_collects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portfolio_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_collects_portfolio ON public.portfolio_collects(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_collects_user ON public.portfolio_collects(user_id);

-- Portfolio impressions (views)
CREATE TABLE IF NOT EXISTS public.portfolio_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_impressions_portfolio ON public.portfolio_impressions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_impressions_date ON public.portfolio_impressions(created_at DESC);

-- View: Portfolio with images and stats
DROP VIEW IF EXISTS public.portfolio_feed CASCADE;
CREATE VIEW public.portfolio_feed AS
SELECT 
  p.id,
  p.user_id,
  p.title,
  p.address,
  p.area_sqft,
  p.total_cost,
  p.currency,
  p.description,
  p.cover_image_url,
  p.status,
  p.collects_count,
  p.impressions_count,
  p.is_featured,
  p.created_at,
  p.updated_at,
  u.username,
  u.company_name,
  u.logo_url,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', pi.id,
      'imageUrl', pi.image_url,
      'description', pi.description,
      'categoryId', pi.category_id,
      'displayOrder', pi.display_order,
      'fileType', pi.file_type
    ) ORDER BY pi.display_order)
    FROM public.portfolio_images pi
    WHERE pi.portfolio_id = p.id),
    '[]'::json
  ) AS images
FROM public.portfolios p
JOIN public.app_users u ON p.user_id = u.id
WHERE p.status = 'approved';

-- Function: Increment collect count
CREATE OR REPLACE FUNCTION public.increment_portfolio_collects()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.portfolios
  SET collects_count = collects_count + 1
  WHERE id = NEW.portfolio_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_portfolio_collects ON public.portfolio_collects;
CREATE TRIGGER trigger_increment_portfolio_collects
AFTER INSERT ON public.portfolio_collects
FOR EACH ROW EXECUTE FUNCTION public.increment_portfolio_collects();

-- Function: Decrement collect count
CREATE OR REPLACE FUNCTION public.decrement_portfolio_collects()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.portfolios
  SET collects_count = GREATEST(0, collects_count - 1)
  WHERE id = OLD.portfolio_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_portfolio_collects ON public.portfolio_collects;
CREATE TRIGGER trigger_decrement_portfolio_collects
AFTER DELETE ON public.portfolio_collects
FOR EACH ROW EXECUTE FUNCTION public.decrement_portfolio_collects();

-- Function: Record impression
CREATE OR REPLACE FUNCTION public.record_portfolio_impression(
  p_portfolio_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.portfolio_impressions (portfolio_id, user_id, ip_address, user_agent)
  VALUES (p_portfolio_id, p_user_id, p_ip_address, p_user_agent);
  
  UPDATE public.portfolios
  SET impressions_count = impressions_count + 1
  WHERE id = p_portfolio_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_collects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_impressions ENABLE ROW LEVEL SECURITY;

-- Portfolios policies
DROP POLICY IF EXISTS "Public can view approved portfolios" ON public.portfolios;
CREATE POLICY "Public can view approved portfolios" ON public.portfolios
FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Providers can view own portfolios" ON public.portfolios;
CREATE POLICY "Providers can view own portfolios" ON public.portfolios
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Providers can create portfolios" ON public.portfolios;
CREATE POLICY "Providers can create portfolios" ON public.portfolios
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Providers can update own portfolios" ON public.portfolios;
CREATE POLICY "Providers can update own portfolios" ON public.portfolios
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Providers can delete own portfolios" ON public.portfolios;
CREATE POLICY "Providers can delete own portfolios" ON public.portfolios
FOR DELETE USING (auth.uid() = user_id);

-- Portfolio images policies
DROP POLICY IF EXISTS "Public can view images of approved portfolios" ON public.portfolio_images;
CREATE POLICY "Public can view images of approved portfolios" ON public.portfolio_images
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id AND status = 'approved'
  )
);

DROP POLICY IF EXISTS "Providers can view own portfolio images" ON public.portfolio_images;
CREATE POLICY "Providers can view own portfolio images" ON public.portfolio_images
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Providers can manage own portfolio images" ON public.portfolio_images;
CREATE POLICY "Providers can manage own portfolio images" ON public.portfolio_images
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id AND user_id = auth.uid()
  )
);

-- Categories policies
DROP POLICY IF EXISTS "Public can view active categories" ON public.portfolio_categories;
CREATE POLICY "Public can view active categories" ON public.portfolio_categories
FOR SELECT USING (is_active = TRUE);

-- Collects policies
DROP POLICY IF EXISTS "Authenticated users can collect" ON public.portfolio_collects;
CREATE POLICY "Authenticated users can collect" ON public.portfolio_collects
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own collects" ON public.portfolio_collects;
CREATE POLICY "Users can view own collects" ON public.portfolio_collects
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own collects" ON public.portfolio_collects;
CREATE POLICY "Users can delete own collects" ON public.portfolio_collects
FOR DELETE USING (auth.uid() = user_id);

-- Impressions policies (public can insert, only system reads)
DROP POLICY IF EXISTS "Public can record impressions" ON public.portfolio_impressions;
CREATE POLICY "Public can record impressions" ON public.portfolio_impressions
FOR INSERT WITH CHECK (TRUE);

-- Insert default categories
INSERT INTO public.portfolio_categories (name, parent_id, display_order) VALUES
('Residential', NULL, 1),
('Commercial', NULL, 2),
('Kitchen', NULL, 3),
('Bathroom', NULL, 4),
('Living Room', NULL, 5),
('Bedroom', NULL, 6)
ON CONFLICT DO NOTHING;
