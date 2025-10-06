-- ============================================================================
-- Instagram-like Username System with 14-day Cooldown
-- ============================================================================

-- Add last_username_change column
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS last_username_change TIMESTAMPTZ DEFAULT NOW();

-- Update existing users
UPDATE app_users SET last_username_change = NOW() WHERE last_username_change IS NULL;

-- Function to validate username change cooldown
CREATE OR REPLACE FUNCTION check_username_change_cooldown()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if username is being changed
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    -- Check if 14 days have passed since last change
    IF OLD.last_username_change IS NOT NULL 
       AND NOW() - OLD.last_username_change < INTERVAL '14 days' THEN
      RAISE EXCEPTION 'Username can only be changed once every 14 days. Last changed: %', 
        OLD.last_username_change
        USING ERRCODE = '23505';
    END IF;
    
    -- Update last_username_change timestamp
    NEW.last_username_change = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for username cooldown
DROP TRIGGER IF EXISTS username_change_cooldown ON app_users;
CREATE TRIGGER username_change_cooldown
  BEFORE UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION check_username_change_cooldown();

-- Ensure username is unique (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_username_lower 
ON app_users (LOWER(username));
