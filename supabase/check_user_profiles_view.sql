-- Check and recreate user_profiles view if needed

-- Check if view exists
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE viewname = 'user_profiles';

-- Drop and recreate the view to ensure it's correct
DROP VIEW IF EXISTS user_profiles CASCADE;

CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  au.id,
  au.username,
  au.email,
  au.role,
  au.full_name,
  au.phone,
  au.avatar_url,
  au.bio,
  au.website,
  au.location,
  au.is_active,
  au.email_verified,
  au.provider_type_id,
  au.created_at,
  au.updated_at,
  -- Provider type info
  pt.type_name as provider_type,
  pt.display_name as provider_type_display,
  -- Company info for providers
  pp.company_name,
  pp.license_number,
  pp.years_experience,
  pp.service_areas,
  pp.price_range_min,
  pp.price_range_max,
  pp.completed_projects,
  pp.average_rating,
  pp.total_reviews,
  pp.is_verified,
  pp.is_approved
FROM app_users au
LEFT JOIN provider_types pt ON au.provider_type_id = pt.id
LEFT JOIN provider_profiles pp ON au.id = pp.user_id;

-- Grant access
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- Test the view
SELECT 
  'View test' as status,
  count(*) as total_profiles
FROM user_profiles;

-- Show sample data
SELECT 
  id,
  username,
  email,
  role,
  provider_type,
  is_active
FROM user_profiles
LIMIT 5;
