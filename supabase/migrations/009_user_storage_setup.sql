-- Final migration for User Storage and Profile improvements
-- This migration ensures every user has a place to store their files and profile metadata

-- 1. Add avatar column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 2. Create the 'user-assets' bucket in Supabase Storage
-- This bucket will store profile pictures, company logos, and general user files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-assets',
  'user-assets',
  TRUE, -- Public because we want easy access to avatars/logos via URL
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Set up Storage RLS Policies for user-assets
-- Users can only upload/delete files in their own folder (/uid/*)

-- Policy: Allow users to upload files to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update files in their own folder
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public to view files (since bucket is public)
CREATE POLICY "Public can view user assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-assets');
