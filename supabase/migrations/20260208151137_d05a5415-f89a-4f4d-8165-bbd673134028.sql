
-- Allow public access to practice recordings associated with valid shared practice logs
CREATE POLICY "Allow access to shared practice recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'practice-recordings'
  AND EXISTS (
    SELECT 1 FROM public.practice_logs pl
    JOIN public.shared_practice_logs spl ON spl.practice_log_id = pl.id
    WHERE name = ANY(pl.repertoire_recordings)
    AND (spl.expires_at IS NULL OR spl.expires_at > now())
  )
);

-- Allow public access to practice media audio files associated with valid shared practice logs
CREATE POLICY "Allow access to shared practice media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'practice-media'
  AND EXISTS (
    SELECT 1 FROM public.practice_media pm
    JOIN public.shared_practice_logs spl ON spl.practice_log_id = pm.practice_log_id
    WHERE pm.file_path = name
    AND pm.media_type = 'audio'
    AND (spl.expires_at IS NULL OR spl.expires_at > now())
  )
);
