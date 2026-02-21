
-- Add 'teacher' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';

-- Teacher studios table
CREATE TABLE public.teacher_studios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  studio_name text NOT NULL,
  invite_code text NOT NULL UNIQUE,
  max_students integer NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.teacher_studios ENABLE ROW LEVEL SECURITY;

-- Teacher-student relationships
CREATE TABLE public.teacher_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.teacher_studios(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  UNIQUE(studio_id, student_user_id)
);
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

-- RLS: teacher_studios
CREATE POLICY "Teachers can view own studio"
  ON public.teacher_studios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can insert own studio"
  ON public.teacher_studios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can update own studio"
  ON public.teacher_studios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can lookup studios by invite code"
  ON public.teacher_studios FOR SELECT
  USING (true);

CREATE POLICY "Teachers can view their students"
  ON public.teacher_students FOR SELECT
  USING (studio_id IN (
    SELECT id FROM public.teacher_studios WHERE user_id = auth.uid()
  ));

CREATE POLICY "Students can view own membership"
  ON public.teacher_students FOR SELECT
  USING (student_user_id = auth.uid());

CREATE POLICY "Students can leave studio"
  ON public.teacher_students FOR DELETE
  USING (student_user_id = auth.uid());

CREATE POLICY "Teachers can remove students"
  ON public.teacher_students FOR DELETE
  USING (studio_id IN (
    SELECT id FROM public.teacher_studios WHERE user_id = auth.uid()
  ));

-- Teachers can view student practice logs
CREATE POLICY "Teachers can view student practice logs"
  ON public.practice_logs FOR SELECT
  USING (
    user_id IN (
      SELECT ts.student_user_id
      FROM public.teacher_students ts
      JOIN public.teacher_studios studio ON studio.id = ts.studio_id
      WHERE studio.user_id = auth.uid()
        AND ts.status = 'active'
    )
  );

-- Teachers can view student profiles (for display names)
CREATE POLICY "Teachers can view student profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT ts.student_user_id
      FROM public.teacher_students ts
      JOIN public.teacher_studios studio ON studio.id = ts.studio_id
      WHERE studio.user_id = auth.uid()
        AND ts.status = 'active'
    )
  );

-- Security-definer function: join studio by invite code
CREATE OR REPLACE FUNCTION public.join_studio_by_code(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_studio_id uuid;
  v_studio_name text;
  v_max int;
  v_current int;
BEGIN
  SELECT id, studio_name, max_students
  INTO v_studio_id, v_studio_name, v_max
  FROM public.teacher_studios
  WHERE invite_code = upper(trim(p_invite_code));

  IF v_studio_id IS NULL THEN
    RETURN json_build_object('error', 'Invalid invite code');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.teacher_students
    WHERE studio_id = v_studio_id AND student_user_id = auth.uid()
  ) THEN
    RETURN json_build_object('error', 'Already joined this studio');
  END IF;

  SELECT COUNT(*) INTO v_current
  FROM public.teacher_students
  WHERE studio_id = v_studio_id AND status = 'active';

  IF v_current >= v_max THEN
    RETURN json_build_object('error', 'Studio is full');
  END IF;

  INSERT INTO public.teacher_students (studio_id, student_user_id)
  VALUES (v_studio_id, auth.uid());

  RETURN json_build_object('success', true, 'studio_name', v_studio_name);
END;
$$;

-- Security-definer function: create teacher studio
CREATE OR REPLACE FUNCTION public.create_teacher_studio(p_studio_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_studio_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.teacher_studios WHERE user_id = auth.uid()) THEN
    RETURN json_build_object('error', 'You already have a studio');
  END IF;

  LOOP
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.teacher_studios WHERE invite_code = v_code
    );
  END LOOP;

  INSERT INTO public.teacher_studios (user_id, studio_name, invite_code)
  VALUES (auth.uid(), p_studio_name, v_code)
  RETURNING id INTO v_studio_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'teacher')
  ON CONFLICT DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'studio_id', v_studio_id,
    'invite_code', v_code
  );
END;
$$;
