

# Phase 2: Read-Only Log Review and Teacher Comments

Building on the Phase 1 foundation (studio, invite codes, student list), this phase adds the ability for teachers to view student practice logs and leave comments.

---

## Deliverables

### 1. Student Log Viewer (Read-Only)

When a teacher taps a student's name in the Studio dashboard, they navigate to a read-only view of that student's practice log for a given date -- reusing the same layout as the existing `SharedPracticeLog` page but with date navigation.

**Route**: `/studio/student/:studentId`

**Features**:
- Date navigation (prev/next day, today button) -- same as the student's own journal
- Full read-only display of all log sections: goals, subgoals, time, warm-ups, scales, repertoire (with completion status and recordings), ear training, music listening, additional tasks, notes, lesson PDFs, and media
- Teacher comment panel at the bottom (see below)
- Back button to return to the Studio dashboard

### 2. Teacher Comments on Daily Logs

A new `teacher_comments` table lets teachers leave comments on a specific student's log for a specific date.

**Table: `teacher_comments`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| studio_id | uuid (FK teacher_studios) | |
| student_user_id | uuid (FK auth.users) | The student |
| log_date | date | Which day this comment is for |
| comment | text | The teacher's message |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Unique constraint**: `(studio_id, student_user_id, log_date)` -- one comment per student per day per studio.

**RLS Policies**:
- Teachers can SELECT, INSERT, UPDATE, DELETE their own studio's comments
- Students can SELECT comments on their own logs

### 3. Student-Side: Viewing Teacher Comments

On the student's own practice log form (`PracticeLogForm`), if a teacher comment exists for that day, display it in a subtle card at the top or bottom of the log -- read-only, styled distinctly (e.g., a bordered card with a graduation cap icon and the teacher's name).

---

## Technical Details

### Database Migration

```text
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
```

### New Files

| File | Purpose |
|------|---------|
| `src/pages/StudentLogView.tsx` | Read-only log viewer with date navigation and comment panel |
| `src/components/studio/TeacherCommentPanel.tsx` | Textarea for teachers to write/edit/delete a comment for the current day |
| `src/components/practice-log/TeacherCommentCard.tsx` | Read-only card shown on student's practice log when a teacher comment exists |
| `src/hooks/useTeacherComment.ts` | Hook to fetch/save/delete a teacher comment for a given student + date |
| `src/hooks/useStudentLogView.ts` | Hook to fetch a student's practice log, media, and PDFs for a given date (teacher perspective) |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/studio/student/:studentId` route |
| `src/components/studio/StudentList.tsx` | Make student names clickable (link to `/studio/student/:studentId`) |
| `src/components/practice-log/PracticeLogForm.tsx` | Add `TeacherCommentCard` display when a comment exists for the current date |

### Student Log Viewer Approach

The `StudentLogView` page will:
1. Verify the current user is a teacher and the student belongs to their studio (via `useStudioData` or a targeted query)
2. Fetch the student's `practice_logs` entry for the selected date (already permitted by the Phase 1 RLS policy on `practice_logs`)
3. Fetch associated `practice_media` and `lesson_pdfs` -- these will need **new RLS policies** so teachers can view them:

```text
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
```

4. Render the log in a read-only layout similar to `SharedPracticeLog` but with date navigation and the comment panel

### Teacher Comment on Student Side

In `PracticeLogForm`, after the form loads for a given date, a small query checks for any teacher comment on that date. If found, a `TeacherCommentCard` renders showing the teacher's name (from profiles) and the comment text, styled as a non-editable card with a graduation cap icon.

---

## What This Does NOT Include (Phase 3)

- Weekly assignments pre-filling student goals
- Teacher uploading PDFs directly to a student's log
- Teacher-specific Stripe pricing tier

