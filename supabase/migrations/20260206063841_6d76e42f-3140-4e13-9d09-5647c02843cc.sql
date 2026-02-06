-- Add column to track recording file paths for each repertoire item
ALTER TABLE practice_logs 
ADD COLUMN repertoire_recordings text[] DEFAULT '{}';

-- Create bucket for practice recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('practice-recordings', 'practice-recordings', false);

-- Allow authenticated users to upload their own recordings
CREATE POLICY "Users can upload own recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'practice-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own recordings
CREATE POLICY "Users can read own recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'practice-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own recordings
CREATE POLICY "Users can delete own recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'practice-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);