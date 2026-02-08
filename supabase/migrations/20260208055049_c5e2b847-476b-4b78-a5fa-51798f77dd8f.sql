-- Allow public download of lesson PDFs that belong to shared (non-expired) practice logs
CREATE POLICY "Allow public access to shared lesson pdfs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.lesson_pdfs lp
    JOIN public.shared_practice_logs spl ON spl.practice_log_id = lp.practice_log_id
    WHERE lp.file_path = name
    AND (spl.expires_at IS NULL OR spl.expires_at > now())
  )
);