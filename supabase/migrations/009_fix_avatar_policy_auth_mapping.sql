-- ============================================================================
-- Align avatar storage policies with auth/app_users identifiers
-- This migration ensures authenticated users can manage files in their
-- `avatars` folder even when folder names use the `app_users.id` value.
-- ============================================================================

-- Drop legacy policies if they exist
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated delete" ON storage.objects;

-- Helper condition to map the storage folder to the authenticated user
-- A user is allowed when the first folder segment matches their `app_users.id`
-- and their Supabase auth UID matches `app_users.auth_id`.

-- Policy: Public read access to all avatars
CREATE POLICY "Avatar public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload into their avatar folder
CREATE POLICY "Avatar authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1
    FROM public.app_users au
    WHERE au.auth_id = auth.uid()
      AND (storage.foldername(name))[1] = au.id::text
  )
);

-- Policy: Authenticated users can update their own avatar files
CREATE POLICY "Avatar authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1
    FROM public.app_users au
    WHERE au.auth_id = auth.uid()
      AND (storage.foldername(name))[1] = au.id::text
  )
)
WITH CHECK (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1
    FROM public.app_users au
    WHERE au.auth_id = auth.uid()
      AND (storage.foldername(name))[1] = au.id::text
  )
);

-- Policy: Authenticated users can delete their own avatar files
CREATE POLICY "Avatar authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1
    FROM public.app_users au
    WHERE au.auth_id = auth.uid()
      AND (storage.foldername(name))[1] = au.id::text
  )
);

-- Confirmation notice
DO $$
BEGIN
  RAISE NOTICE 'Avatar storage policies aligned with app_users identifiers';
END $$;
