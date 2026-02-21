

# Phase 3: Weekly Assignments, Teacher PDF Uploads, and Teacher Pricing

---

## 1. Weekly Assignments

A new `weekly_assignments` table lets teachers set goals/tasks for a student that automatically pre-fill into the student's practice log when they open a new day.

### Table: `weekly_assignments`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| studio_id | uuid (FK) | References teacher_studios |
| student_user_id | uuid | The student |
| week_start | date | Monday of the target week |
| goals | text | Pre-fill for Main Goals |
| subgoals | text | Pre-fill for Subgoals |
| repertoire | text[] | Pre-fill for Repertoire items |
| warmups | text[] | Pre-fill for Warm-ups |
| scales | text[] | Pre-fill for Scales |
| additional_tasks | text[] | Pre-fill for Additional Tasks |
| ear_training | text[] | Pre-fill for Ear Training |
| notes | text | Optional notes from teacher |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Unique constraint**: `(studio_id, student_user_id, week_start)` -- one assignment per student per week.

### RLS Policies
- Teachers can full CRUD on assignments in their studio
- Students can SELECT assignments addressed to them

### How Pre-fill Works
- When a student opens their practice log for a day with no existing data, the app checks for a `weekly_assignment` covering that week
- If found, the goals, repertoire, scales, warmups, etc. are pre-filled into the form as defaults (the student can still edit them freely)
- A small banner at the top says "This week's assignment from [Teacher Name]" with a link to dismiss/acknowledge

### Teacher UI (on StudentLogView)
- A new "Weekly Assignment" tab or expandable panel on the student log view page
- Teacher can write goals, add repertoire items, scales, etc. for the current week
- Save/update/delete the assignment

### New Files
| File | Purpose |
|------|---------|
| `src/hooks/useWeeklyAssignment.ts` | Hook for teachers to CRUD assignments; hook for students to fetch their current week's assignment |
| `src/components/studio/WeeklyAssignmentPanel.tsx` | Teacher-facing form to create/edit weekly assignments for a student |
| `src/components/practice-log/AssignmentBanner.tsx` | Small banner on student's practice log showing the week's assignment info |

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/StudentLogView.tsx` | Add WeeklyAssignmentPanel below the teacher comment panel |
| `src/components/practice-log/PracticeLogForm.tsx` | On new-day initialization (when no practice log exists), check for a weekly assignment and pre-fill fields; show AssignmentBanner |

---

## 2. Teacher PDF Uploads to Student Logs

Teachers can upload PDFs directly to a student's practice log from the StudentLogView page. This reuses the existing `lesson_pdfs` table and `lesson-pdfs` storage bucket.

### Database Changes
- New RLS policy on `lesson_pdfs` for INSERT: teachers can insert PDFs for their active students
- New storage policy on `lesson-pdfs` bucket: teachers can upload files into their students' storage paths

### How It Works
- On the StudentLogView page, add an upload zone (similar to the existing LessonPdfs component but write-only for the teacher)
- The teacher selects a PDF, it uploads to `{studentUserId}/{practiceLogId}/{filename}` in the `lesson-pdfs` bucket
- A corresponding `lesson_pdfs` row is created with `user_id = studentUserId`
- The student sees the PDF appear in their normal Lesson PDFs section

### New Files
| File | Purpose |
|------|---------|
| `src/components/studio/TeacherPdfUpload.tsx` | Upload component for teachers to add PDFs to a student's log |

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/StudentLogView.tsx` | Add TeacherPdfUpload component below the existing PDF viewer section |

### Storage Policy (migration)
```text
-- Teachers can upload lesson PDFs for their students
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
```

### RLS Policy on lesson_pdfs table
```text
-- Teachers can insert PDFs for their students
CREATE POLICY "Teachers can insert student lesson pdfs"
  ON public.lesson_pdfs FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT ts.student_user_id
      FROM teacher_students ts
      JOIN teacher_studios studio ON studio.id = ts.studio_id
      WHERE studio.user_id = auth.uid() AND ts.status = 'active'
    )
  );
```

---

## 3. Teacher Pricing Tier

Add a dedicated teacher subscription tier at a higher price point, gated by the existing subscription infrastructure.

### Approach
- Create a new Stripe product + price for the teacher plan (e.g., "Practice Daily -- Teacher" at $9.99/month or $99.99/year)
- Update the `SubscriptionGate` and `AuthContext` to recognize the teacher product ID
- Teachers who create a studio are prompted to upgrade to the teacher tier
- The Studio page checks for the teacher subscription tier before allowing studio creation

### Implementation Details
- Add a `TEACHER_PRODUCT_ID` constant alongside the existing subscription product ID
- Modify `check-subscription` edge function response to include the product ID (it already does)
- In `AuthContext`, store the product ID from the subscription check
- In `Studio.tsx`, gate the "Create Studio" flow behind a teacher subscription check
- Add a teacher plan card to the SubscriptionGate or a separate upgrade prompt

### New Files
| File | Purpose |
|------|---------|
| `src/components/studio/TeacherUpgradeCard.tsx` | Card prompting teachers to upgrade to the teacher plan |

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/Studio.tsx` | Check subscription tier; show TeacherUpgradeCard if not on teacher plan |
| `src/contexts/AuthContext.tsx` | Store product_id from check-subscription response |
| `supabase/functions/create-checkout/index.ts` | Accept a `tier` parameter to select the teacher price ID |
| `src/components/subscription/SubscriptionGate.tsx` | (Optional) Add teacher plan option to the paywall |

---

## Technical Summary

### Database Migration (single migration)
1. Create `weekly_assignments` table with RLS
2. Add INSERT policy on `lesson_pdfs` for teachers
3. Add INSERT storage policy on `lesson-pdfs` bucket for teachers

### New Files (4 total)
- `src/hooks/useWeeklyAssignment.ts`
- `src/components/studio/WeeklyAssignmentPanel.tsx`
- `src/components/practice-log/AssignmentBanner.tsx`
- `src/components/studio/TeacherPdfUpload.tsx`
- `src/components/studio/TeacherUpgradeCard.tsx`

### Modified Files (6 total)
- `src/pages/StudentLogView.tsx` -- add assignment panel + PDF upload
- `src/components/practice-log/PracticeLogForm.tsx` -- pre-fill from assignment + banner
- `src/pages/Studio.tsx` -- teacher tier gate
- `src/contexts/AuthContext.tsx` -- store product_id
- `supabase/functions/create-checkout/index.ts` -- teacher tier support
- `src/components/subscription/SubscriptionGate.tsx` -- optional teacher plan display

