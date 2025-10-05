-- Admin Dashboard Schema

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing categories table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'categories' 
                 AND column_name = 'parent_id') THEN
    ALTER TABLE public.categories ADD COLUMN parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'categories' 
                 AND column_name = 'featured') THEN
    ALTER TABLE public.categories ADD COLUMN featured BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'categories' 
                 AND column_name = 'display_order') THEN
    ALTER TABLE public.categories ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_featured ON public.categories(featured) WHERE featured = TRUE;

-- Provider types table (if not exists from previous migrations)
CREATE TABLE IF NOT EXISTS public.provider_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update admin role
UPDATE public.app_users SET role = 'admin' WHERE email = 'n46angle@gmail.com';

-- Admin stats view
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT COUNT(*) FROM public.app_users) AS total_users,
  (SELECT COUNT(*) FROM public.app_users WHERE role = 'provider') AS total_providers,
  (SELECT COUNT(*) FROM public.app_users WHERE role = 'homeowner') AS total_homeowners,
  (SELECT COUNT(*) FROM public.posts WHERE is_deleted = FALSE) AS total_posts,
  (SELECT COUNT(*) FROM public.provider_reviews) AS total_reviews,
  (SELECT COUNT(*) FROM public.portfolios WHERE status = 'pending') AS pending_portfolios,
  (SELECT COUNT(*) FROM public.app_users WHERE created_at > NOW() - INTERVAL '7 days') AS new_users_week,
  (SELECT COUNT(*) FROM public.app_users WHERE created_at > NOW() - INTERVAL '30 days') AS new_users_month;

GRANT SELECT ON public.admin_stats TO authenticated;

-- Global settings table
CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.app_users(id)
);

INSERT INTO public.global_settings (setting_key, setting_value) VALUES
  ('site_name', '"Homedia"'),
  ('dark_mode', 'false'),
  ('featured_categories', '[]')
ON CONFLICT (setting_key) DO NOTHING;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_provider_types_updated_at ON public.provider_types;
CREATE TRIGGER update_provider_types_updated_at
  BEFORE UPDATE ON public.provider_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories
FOR SELECT TO public USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Anyone can view settings" ON public.global_settings;
CREATE POLICY "Anyone can view settings" ON public.global_settings
FOR SELECT TO public USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.global_settings;
CREATE POLICY "Admins can manage settings" ON public.global_settings
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_types;
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_settings;
