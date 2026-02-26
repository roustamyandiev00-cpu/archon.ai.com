-- ============================================================
-- Migration: Supabase Storage Buckets aanmaken
-- Datum: 2026-02-26
-- ============================================================
-- Voer dit uit in Supabase SQL Editor (met service_role privileges)
-- ============================================================

-- 1. Bucket voor gebruikersdocumenten (per user, publiek leesbaar via signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-assets',
  'user-assets',
  false,
  52428800, -- 50 MB max per bestand
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    'application/zip'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Bucket voor offerte media (afbeeldingen bij offertes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offerte-media',
  'offerte-media',
  true,  -- Publiek zodat offerte PDFs afbeeldingen kunnen inladen
  10485760, -- 10 MB max per bestand
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- RLS POLICIES voor user-assets bucket
-- ============================================================

-- Gebruikers kunnen alleen bestanden in hun eigen map zien
CREATE POLICY "user_assets_select_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Gebruikers kunnen alleen uploaden naar hun eigen map
CREATE POLICY "user_assets_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Gebruikers kunnen hun eigen bestanden bijwerken
CREATE POLICY "user_assets_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Gebruikers kunnen hun eigen bestanden verwijderen
CREATE POLICY "user_assets_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- RLS POLICIES voor offerte-media bucket (publiek leesbaar)
-- ============================================================

-- Iedereen mag lezen (publieke bucket voor offerte afbeeldingen)
CREATE POLICY "offerte_media_select_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'offerte-media');

-- Alleen authenticated users mogen uploaden
CREATE POLICY "offerte_media_insert_auth"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'offerte-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Eigen bestanden bijwerken
CREATE POLICY "offerte_media_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'offerte-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Eigen bestanden verwijderen
CREATE POLICY "offerte_media_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'offerte-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
