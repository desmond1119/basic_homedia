-- ============================================================================
-- Avatar Display Fix - Execute this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Ensure avatars bucket is public and has correct settings
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'avatars';

-- Step 2: Drop all existing storage policies for avatars
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update an avatar" ON storage.objects;

-- Step 3: Create new policies with correct permissions

-- Allow ANYONE (including anonymous) to view avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update avatars
CREATE POLICY "Anyone can update an avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Step 4: Verify existing avatar URLs in app_users table
-- This will show all users with avatar URLs
SELECT 
  id,
  username,
  avatar_url,
  CASE 
    WHEN avatar_url IS NULL THEN 'No avatar'
    WHEN avatar_url LIKE '%/storage/v1/object/public/avatars/%' THEN 'Valid URL format'
    ELSE 'Invalid URL format'
  END as url_status
FROM app_users
WHERE avatar_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: If you need to fix existing URLs (run only if needed)
-- Uncomment the following if your URLs are in wrong format:
/*
UPDATE app_users
SET avatar_url = REPLACE(
  avatar_url,
  'old-domain.com',
  'your-supabase-project.supabase.co'
)
WHERE avatar_url LIKE '%old-domain.com%';
*/
