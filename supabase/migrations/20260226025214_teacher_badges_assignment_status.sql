-- 1. Let teachers read their students' badges
CREATE POLICY "Teachers can view student badges"
ON public.user_badges FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_students ts
    JOIN public.teacher_studios s ON s.id = ts.studio_id
    WHERE ts.student_user_id = user_badges.user_id
    AND s.user_id = auth.uid()
  )
);

-- 2. Add status column to weekly_assignments (draft = not visible to students)
ALTER TABLE public.weekly_assignments
ADD COLUMN status text NOT NULL DEFAULT 'draft'
CHECK (status IN ('draft', 'sent'));
