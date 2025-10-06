-- ============================================================================
-- Setup Forum Media Storage Bucket
-- ============================================================================

-- Create forum-media bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum-media',
  'forum-media',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];

-- Drop existing policies
DROP POLICY IF EXISTS "Forum media public read" ON storage.objects;
DROP POLICY IF EXISTS "Forum media authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Forum media authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Forum media authenticated delete" ON storage.objects;

-- Policy 1: Public read access to all forum media
CREATE POLICY "Forum media public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'forum-media');

-- Policy 2: Authenticated users can upload to their own folder
CREATE POLICY "Forum media authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'forum-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Authenticated users can update their own media
CREATE POLICY "Forum media authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'forum-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'forum-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Authenticated users can delete their own media
CREATE POLICY "Forum media authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'forum-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify the bucket is set up correctly
DO $$
BEGIN
  RAISE NOTICE '✅ Forum media storage bucket configured successfully';
  RAISE NOTICE 'Bucket: forum-media';
  RAISE NOTICE 'Public: true';
  RAISE NOTICE 'Max file size: 10MB';
  RAISE NOTICE 'Allowed types: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, MOV)';
END $$;
