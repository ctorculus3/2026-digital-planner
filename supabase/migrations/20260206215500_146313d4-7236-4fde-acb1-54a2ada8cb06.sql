-- Allow users to update/overwrite their own media files
CREATE POLICY "Users can update their own media files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'practice-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update/overwrite their own recordings
CREATE POLICY "Users can update own recordings"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'practice-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );