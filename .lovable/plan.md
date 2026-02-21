

# Teacher Collaboration Tools - Phase 1: Foundation

This is a large feature set. To keep things manageable and shippable, I recommend building it in **3 phases**. This plan covers **Phase 1: the core foundation** -- database schema, teacher-student linking, and the Studio dashboard.

---

## Phases Overview

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Database, invite codes, Studio dashboard (student list with streaks/status) | **This plan** |
| **Phase 2** | Read-only log review, comments on daily logs | Future |
| **Phase 3** | Weekly assignments, teacher PDF uploads to student logs, premium tier pricing | Future |

---

## Phase 1 Deliverables

### 1. New Database Tables

**`teacher_studios`** -- One row per teacher account, stores invite code and settings.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK auth.users) | The teacher's user ID |
| studio_name | text | e.g. "Ms. Johnson's Studio" |
| invite_code | text (unique) | 6-character alphanumeric code |
| max_students | int | Default 20 |
| created_at | timestamptz | |

**`teacher_students`** -- Links a student to a teacher's studio.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| studio_id | uuid (FK teacher_studios) | |
| student_user_id | uuid (FK auth.users) | |
| joined_at | timestamptz | |
| status | text | 'active' or 'removed' |

RLS policies:
- Teachers can read/manage their own studio and its student list
- Students can read their own membership and the studio they belong to
- Students can insert (join via invite code) -- validated by a security-definer function
- Students can delete their own membership (leave studio)

**Security-definer function: `join_studio_by_code(p_invite_code text)`**
- Looks up the studio, checks max student count, inserts the relationship
- Prevents a student from joining the same studio twice
- Returns the studio name on success

### 2. New Role: `teacher`

Add `'teacher'` to the existing `app_role` enum. This allows role-based access control via the existing `has_role()` function and `user_roles` table. Teachers get this role when they create a studio.

### 3. New Routes & Pages

- **`/studio`** -- Teacher's Studio dashboard (protected, requires `teacher` role)
- Add "Studio" to `DashboardNav` for users with the teacher role

### 4. Studio Dashboard Page

A new page showing:
- Studio name and invite code (with copy button)
- A shareable join link: `{origin}/join/{invite_code}`
- Student list table with columns:
  - Student name (from profiles)
  - Current streak (via `get_practice_streak` RPC)
  - This week's practice time (calculated from `practice_logs`)
  - Traffic-light status indicator:
    - Green: practiced today or yesterday
    - Yellow: missed 1-2 days
    - Red: 3+ days missed

### 5. Student Join Flow

- New route **`/join/:code`** -- a simple page where a logged-in student confirms joining a studio
- Also accessible via a "Join a Studio" option in the student's settings/user menu
- Students can enter a code manually or visit the link

### 6. "Create Studio" Flow

- Available from User Menu or a prompt when visiting `/studio`
- Simple form: studio name (required)
- Auto-generates a 6-char invite code
- Adds the `teacher` role to the user via a security-definer function

### 7. Student-Side Visibility

- In the student's User Menu, show "My Studio: [Studio Name]" if linked
- Option to leave the studio

---

## Technical Details

### Database Migration SQL

```text
-- Add 'teacher' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';

-- Teacher studios table
CREATE TABLE public.teacher_studios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Students need to look up studios by invite code (for joining)
CREATE POLICY "Authenticated users can lookup studios by invite code"
  ON public.teacher_studios FOR SELECT
  USING (true);
  -- Scoped to authenticated users by default RLS

-- RLS: teacher_students
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
```

### Security-Definer Functions

**`join_studio_by_code`** -- handles the join flow safely:

```text
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
  WHERE invite_code = p_invite_code;

  IF v_studio_id IS NULL THEN
    RETURN json_build_object('error', 'Invalid invite code');
  END IF;

  -- Check if already joined
  IF EXISTS (
    SELECT 1 FROM public.teacher_students
    WHERE studio_id = v_studio_id AND student_user_id = auth.uid()
  ) THEN
    RETURN json_build_object('error', 'Already joined this studio');
  END IF;

  -- Check capacity
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
```

**`create_teacher_studio`** -- creates the studio and grants the teacher role:

```text
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
  -- Check if user already has a studio
  IF EXISTS (SELECT 1 FROM public.teacher_studios WHERE user_id = auth.uid()) THEN
    RETURN json_build_object('error', 'You already have a studio');
  END IF;

  -- Generate unique 6-char code
  LOOP
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.teacher_studios WHERE invite_code = v_code
    );
  END LOOP;

  INSERT INTO public.teacher_studios (user_id, studio_name, invite_code)
  VALUES (auth.uid(), p_studio_name, v_code)
  RETURNING id INTO v_studio_id;

  -- Grant teacher role if not already present
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'teacher')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'studio_id', v_studio_id,
    'invite_code', v_code
  );
END;
$$;
```

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Studio.tsx` | Teacher Studio dashboard page |
| `src/pages/JoinStudio.tsx` | Student join flow page (`/join/:code`) |
| `src/components/studio/StudentList.tsx` | Student table with streaks and status indicators |
| `src/components/studio/CreateStudioDialog.tsx` | Dialog for creating a new studio |
| `src/components/studio/InviteCodeCard.tsx` | Displays invite code with copy functionality |
| `src/components/studio/JoinStudioDialog.tsx` | Dialog for students to enter an invite code |
| `src/hooks/useStudioData.ts` | Hook for fetching studio and student data |
| `src/hooks/useStudentStudio.ts` | Hook for student's studio membership |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/studio` and `/join/:code` routes |
| `src/components/dashboard/DashboardNav.tsx` | Conditionally show "Studio" tab for teachers |
| `src/components/practice-log/UserMenu.tsx` | Add "My Studio" / "Join a Studio" options |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

### Practice Log Access for Teachers (Phase 1 Prep)

For Phase 1, the teacher dashboard only shows **summary data** (streaks and weekly time) which can be fetched via RPC functions or by querying `practice_logs` with a new RLS policy:

```text
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
```

This same policy will enable the full read-only log review in Phase 2.

---

## What This Does NOT Include (Phases 2 & 3)

- Tapping into a student's full log (Phase 2)
- Comments on daily logs (Phase 2)
- Weekly assignments pre-filling student goals (Phase 3)
- Teacher uploading PDFs to student logs (Phase 3)
- Teacher-specific Stripe pricing tier (Phase 3)
