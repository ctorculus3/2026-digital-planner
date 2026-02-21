
CREATE TABLE public.teacher_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.teacher_studios(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(studio_id, student_user_id, log_date)
);
ALTER TABLE public.teacher_comments ENABLE ROW LEVEL SECURITY;

-- Teachers can manage comments in their studio
CREATE POLICY "Teachers can view their comments"
  ON public.teacher_comments FOR SELECT
  USING (studio_id IN (
    SELECT id FROM public.teacher_studios WHERE user_id = auth.uid()
  ));

CREATE POLICY "Teachers can insert comments"
  ON public.teacher_comments FOR INSERT
  WITH CHECK (studio_id IN (
    SELECT id FROM public.teacher_studios WHERE user_id = auth.uid()
  ));

CREATE POLICY "Teachers can update their comments"
  ON public.teacher_comments FOR UPDATE
  USING (studio_id IN (
    SELECT id FROM public.teacher_studios WHERE user_id = auth.uid()
  ));

CREATE POLICY "Teachers can delete their comments"
  ON public.teacher_comments FOR DELETE
  USING (studio_id IN (
    SELECT id FROM public.teacher_studios WHERE user_id = auth.uid()
  ));

-- Students can read comments on their own logs
CREATE POLICY "Students can view comments on their logs"
  ON public.teacher_comments FOR SELECT
  USING (student_user_id = auth.uid());

-- Teachers can view media for their students' logs
CREATE POLICY "Teachers can view student media"
  ON public.practice_media FOR SELECT
  USING (
    user_id IN (
      SELECT ts.student_user_id
      FROM teacher_students ts
      JOIN teacher_studios studio ON studio.id = ts.studio_id
      WHERE studio.user_id = auth.uid() AND ts.status = 'active'
    )
  );

-- Teachers can view PDFs for their students' logs
CREATE POLICY "Teachers can view student lesson pdfs"
  ON public.lesson_pdfs FOR SELECT
  USING (
    user_id IN (
      SELECT ts.student_user_id
      FROM teacher_students ts
      JOIN teacher_studios studio ON studio.id = ts.studio_id
      WHERE studio.user_id = auth.uid() AND ts.status = 'active'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_teacher_comments_updated_at
  BEFORE UPDATE ON public.teacher_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
