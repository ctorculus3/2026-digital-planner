
-- 1. Create weekly_assignments table
CREATE TABLE public.weekly_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.teacher_studios(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL,
  week_start date NOT NULL,
  goals text,
  subgoals text,
  repertoire text[] DEFAULT ARRAY[]::text[],
  warmups text[] DEFAULT ARRAY[]::text[],
  scales text[] DEFAULT ARRAY[]::text[],
  additional_tasks text[] DEFAULT ARRAY[]::text[],
  ear_training text[] DEFAULT ARRAY[]::text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (studio_id, student_user_id, week_start)
);

ALTER TABLE public.weekly_assignments ENABLE ROW LEVEL SECURITY;

-- Teachers can SELECT assignments in their studio
CREATE POLICY "Teachers can view assignments"
  ON public.weekly_assignments FOR SELECT
  USING (studio_id IN (
    SELECT id FROM public.teacher_studios WHERE user_id = auth.uid()
  ));

-- Teachers can INSERT assignments in their studio
CREATE POLICY "Teachers can create assignments"
  ON public.weekly_assignments FOR INSERT
  WITH CHECK (studio_id IN (
    SELECT id FROM public.teacher_studios WHERE user_id = auth.uid()
  ));

-- Teachers can UPDATE assignments in their studio
CREATE POLICY "Teachers can update assignments"
  ON public.weekly_assignments FOR UPDATE
  USING (studio_id IN (
    SELECT id FROM public.teacher_studios WHERE user_id = auth.uid()
  ));

-- Teachers can DELETE assignments in their studio
CREATE POLICY "Teachers can delete assignments"
  ON public.weekly_assignments FOR DELETE
  USING (studio_id IN (
    SELECT id FROM public.teacher_studios WHERE user_id = auth.uid()
  ));

-- Students can view their own assignments
CREATE POLICY "Students can view own assignments"
  ON public.weekly_assignments FOR SELECT
  USING (student_user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_weekly_assignments_updated_at
  BEFORE UPDATE ON public.weekly_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Teacher PDF upload: INSERT policy on lesson_pdfs
CREATE POLICY "Teachers can insert student lesson pdfs"
  ON public.lesson_pdfs FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT ts.student_user_id
      FROM public.teacher_students ts
      JOIN public.teacher_studios studio ON studio.id = ts.studio_id
      WHERE studio.user_id = auth.uid() AND ts.status = 'active'
    )
  );

-- 3. Teacher PDF upload: storage policy on lesson-pdfs bucket
CREATE POLICY "Teachers can upload student lesson pdfs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lesson-pdfs'
    AND (storage.foldername(name))[1] IN (
      SELECT ts.student_user_id::text
      FROM public.teacher_students ts
      JOIN public.teacher_studios studio ON studio.id = ts.studio_id
      WHERE studio.user_id = auth.uid() AND ts.status = 'active'
    )
  );
