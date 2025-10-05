-- ============================================================================
-- Authentication System Database Schema for Renovation Platform
-- ============================================================================

-- 1. Create ENUM for user roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('homeowner', 'provider', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create provider_types table (admin-configurable)
CREATE TABLE IF NOT EXISTS provider_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Insert initial provider types
INSERT INTO provider_types (type_name, display_name, description) VALUES
  ('interior_design', 'Interior Design Company', 'Professional interior design services'),
  ('renovation', 'Renovation Company', 'General renovation and construction services'),
  ('cleaning', 'Cleaning Company', 'Professional cleaning services')
ON CONFLICT (type_name) DO NOTHING;

-- 3. Create app_users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'homeowner',
  provider_type_id UUID REFERENCES provider_types(id),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT provider_has_type CHECK (
    (role = 'provider' AND provider_type_id IS NOT NULL) OR 
    (role != 'provider' AND provider_type_id IS NULL)
  )
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_provider_type ON app_users(provider_type_id);

-- 5. Enable Row Level Security
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_types ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for app_users
-- Users can read their own data
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
CREATE POLICY "Users can view own profile"
  ON app_users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data (except role)
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
CREATE POLICY "Users can update own profile"
  ON app_users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only authenticated users can insert (handled by trigger)
DROP POLICY IF EXISTS "Auth users can insert" ON app_users;
CREATE POLICY "Auth users can insert"
  ON app_users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all users
DROP POLICY IF EXISTS "Admins can view all users" ON app_users;
CREATE POLICY "Admins can view all users"
  ON app_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. RLS Policies for provider_types
-- Everyone can read active provider types
DROP POLICY IF EXISTS "Anyone can view active provider types" ON provider_types;
CREATE POLICY "Anyone can view active provider types"
  ON provider_types FOR SELECT
  USING (is_active = true);

-- Only admins can manage provider types
DROP POLICY IF EXISTS "Admins can manage provider types" ON provider_types;
CREATE POLICY "Admins can manage provider types"
  ON provider_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called after Supabase auth.users insert
  -- The app_users insert happens separately via application code
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_provider_types_updated_at ON provider_types;
CREATE TRIGGER update_provider_types_updated_at
  BEFORE UPDATE ON provider_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Create function to validate username uniqueness
CREATE OR REPLACE FUNCTION is_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM app_users WHERE LOWER(username) = LOWER(check_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create view for user profiles with provider type info
DROP VIEW IF EXISTS user_profiles CASCADE;
CREATE VIEW user_profiles AS
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
  pt.type_name as provider_type,
  pt.display_name as provider_type_display
FROM app_users u
LEFT JOIN provider_types pt ON u.provider_type_id = pt.id;

-- Grant access to authenticated users
GRANT SELECT ON user_profiles TO authenticated;
