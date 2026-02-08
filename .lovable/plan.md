

# Lesson PDFs Section

## Overview

Add a new "Lesson PDF's" section to the practice log form where users can upload, view, and manage PDF files. The section sits in the right column underneath Notes and Focus, starts with 4 entry slots, and can expand to 10. Users can drag-and-drop or browse to upload PDFs, tap to open them in a new popup window, and delete them as needed.

## What You'll See

- A new card section labeled **Lesson PDF's** in the right column, positioned right below Notes and Focus
- Each row shows the PDF name with a clickable link and a delete button
- A drag-and-drop zone (or click-to-browse) to add PDFs
- A counter showing how many of the 10 slots are used (e.g., "2/10")
- An "Add" button to reveal more rows (4 visible initially, up to 10)
- Tapping a PDF name opens it in a new browser popup; closing the popup returns you to your journal

## Technical Details

### 1. Database: New `lesson_pdfs` table

Create a table to track PDF metadata per practice log:

```sql
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

ALTER TABLE public.lesson_pdfs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own lesson pdfs"
  ON public.lesson_pdfs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson pdfs"
  ON public.lesson_pdfs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson pdfs"
  ON public.lesson_pdfs FOR DELETE
  USING (auth.uid() = user_id);

-- Allow viewing PDFs for shared logs
CREATE POLICY "Anyone can view pdfs for shared logs"
  ON public.lesson_pdfs FOR SELECT
  USING (
    practice_log_id IN (
      SELECT practice_log_id FROM shared_practice_logs
      WHERE expires_at IS NULL OR expires_at > now()
    )
  );
```

### 2. Storage: New `lesson-pdfs` private bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-pdfs', 'lesson-pdfs', false);

-- RLS policies for file access
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
```

File path structure: `{user_id}/{practice_log_id}/{filename}`

### 3. New hook: `src/hooks/useLessonPdfs.ts`

Follows the same pattern as `useMediaTools.ts`:
- Fetches PDF records from `lesson_pdfs` table for a given practice log
- `uploadPdf(file)` -- validates file type/size (PDF only, 20MB max), uploads to storage bucket, inserts DB record
- `deletePdf(item)` -- removes storage file and DB record
- `getSignedPdfUrl(filePath)` -- creates a 1-hour signed URL for viewing
- `ensurePracticeLog()` -- auto-creates a practice log if one doesn't exist (same approach as MediaTools)
- Tracks `itemCount` vs `maxItems` (10)

### 4. New component: `src/components/practice-log/LessonPdfs.tsx`

UI structure:
- Header row with "Lesson PDF's" label and item counter
- Drag-and-drop zone (accepts `.pdf` files only) with click-to-browse fallback
- List of uploaded PDFs, each row showing:
  - PDF icon + file name (clickable -- opens signed URL via `window.open()` in a new popup)
  - Delete button (X icon)
- "Add" button to expand visible slots from 4 to 10

Props mirror the MediaTools pattern:
```typescript
interface LessonPdfsProps {
  practiceLogId: string | undefined;
  userId: string;
  logDate: string;
  onPracticeLogCreated?: () => void;
}
```

### 5. Integration into PracticeLogForm

Insert the `LessonPdfs` component in the right column, immediately after the Notes and Focus section (line ~526 in PracticeLogForm.tsx), before the Metronome checkbox. The placement order becomes:

1. Notes and Focus
2. **Lesson PDF's** (new)
3. Used Metronome Today
4. Ear Training
5. Additional Tasks
6. Music Listening

### 6. Data retention

The existing purge logic (90-day inactivity cleanup) should be extended to also clear the `lesson-pdfs` storage bucket and `lesson_pdfs` table records for inactive users, consistent with the current policy for `practice-media` and `practice-recordings`.

### Files Changed

| File | Action |
|------|--------|
| Database migration | New `lesson_pdfs` table + RLS policies + storage bucket |
| `src/hooks/useLessonPdfs.ts` | New hook for PDF CRUD operations |
| `src/components/practice-log/LessonPdfs.tsx` | New UI component |
| `src/components/practice-log/PracticeLogForm.tsx` | Import and render `LessonPdfs` in right column |
| `supabase/functions/purge-inactive-data/index.ts` | Add cleanup for `lesson-pdfs` bucket and `lesson_pdfs` table |

