-- Fix login issues: add missing auth_id, fix triggers, no RLS recursion

-- Add auth_id column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'app_users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE app_users ADD COLUMN auth_id UUID UNIQUE;
  END IF;
END $$;

-- Add missing columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'email_verified') THEN
    ALTER TABLE app_users ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'phone') THEN
    ALTER TABLE app_users ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'location') THEN
    ALTER TABLE app_users ADD COLUMN location TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'website') THEN
    ALTER TABLE app_users ADD COLUMN website TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'company_name') THEN
    ALTER TABLE app_users ADD COLUMN company_name TEXT;
  END IF;
END $$;

-- Drop old triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- Safe upsert function without self-query
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (
    auth_id,
    email,
    username,
    email_verified,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL,
    COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner')
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW()
  WHERE app_users.auth_id = EXCLUDED.auth_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update existing users with auth_id
UPDATE app_users 
SET auth_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.email = app_users.email 
  LIMIT 1
)
WHERE auth_id IS NULL;
