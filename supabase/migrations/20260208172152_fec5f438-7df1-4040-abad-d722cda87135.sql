-- Add image_paths array column
ALTER TABLE public.community_posts
  ADD COLUMN image_paths text[];

-- Create community-images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true);

-- Storage RLS: authenticated users can upload to own folder
CREATE POLICY "Users can upload community images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: users can delete own images
CREATE POLICY "Users can delete own community images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );