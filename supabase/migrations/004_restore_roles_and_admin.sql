-- Restore provider and admin roles

-- Drop existing constraint if any
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;

-- Add proper role constraint
ALTER TABLE app_users ADD CONSTRAINT app_users_role_check 
  CHECK (role IN ('homeowner', 'provider', 'admin'));

-- Update trigger to properly set role from metadata
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

-- Set admin role for specific email
UPDATE app_users SET role = 'admin' WHERE email = 'n46angle@gmail.com';
