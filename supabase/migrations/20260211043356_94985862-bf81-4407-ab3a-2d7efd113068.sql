CREATE POLICY "Users can upload og-share HTML"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = 'og-shares'
);

CREATE POLICY "Users can delete og-share HTML"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = 'og-shares'
);