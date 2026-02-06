-- Create practice_media table
CREATE TABLE public.practice_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_log_id uuid NOT NULL REFERENCES public.practice_logs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('audio', 'youtube')),
  file_path text,
  youtube_url text,
  label text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.practice_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own media"
  ON public.practice_media FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media"
  ON public.practice_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media"
  ON public.practice_media FOR DELETE
  USING (auth.uid() = user_id);

-- Allow viewing media on shared logs
CREATE POLICY "Anyone can view media for shared logs"
  ON public.practice_media FOR SELECT
  USING (
    practice_log_id IN (
      SELECT practice_log_id FROM shared_practice_logs
      WHERE expires_at IS NULL OR expires_at > now()
    )
  );

-- Storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('practice-media', 'practice-media', false);

-- Storage RLS: users can manage their own files
CREATE POLICY "Users can upload media files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'practice-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own media files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'practice-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own media files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'practice-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );