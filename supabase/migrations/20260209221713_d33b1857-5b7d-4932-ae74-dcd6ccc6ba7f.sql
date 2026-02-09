UPDATE storage.buckets
SET file_size_limit = 104857600
WHERE id = 'practice-media';

DROP POLICY IF EXISTS "Allow access to shared practice media" ON storage.objects;
CREATE POLICY "Allow access to shared practice media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'practice-media'
    AND EXISTS (
      SELECT 1
      FROM practice_media pm
      JOIN shared_practice_logs spl ON spl.practice_log_id = pm.practice_log_id
      WHERE pm.file_path = objects.name
        AND pm.media_type IN ('audio', 'video')
        AND (spl.expires_at IS NULL OR spl.expires_at > now())
    )
  );