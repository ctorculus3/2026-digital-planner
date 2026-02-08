
-- Create lesson_pdfs table
CREATE TABLE public.lesson_pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_log_id UUID NOT NULL REFERENCES public.practice_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_pdfs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_pdfs table
CREATE POLICY "Users can view their own lesson pdfs"
  ON public.lesson_pdfs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson pdfs"
  ON public.lesson_pdfs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson pdfs"
  ON public.lesson_pdfs FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view pdfs for shared logs"
  ON public.lesson_pdfs FOR SELECT
  USING (
    practice_log_id IN (
      SELECT practice_log_id FROM shared_practice_logs
      WHERE expires_at IS NULL OR expires_at > now()
    )
  );

-- Create private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-pdfs', 'lesson-pdfs', false);

-- Storage RLS policies
CREATE POLICY "Users can upload lesson pdfs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lesson-pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own lesson pdfs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lesson-pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own lesson pdfs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lesson-pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own lesson pdfs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'lesson-pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
