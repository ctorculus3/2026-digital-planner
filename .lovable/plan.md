

## "Copy From" Button -- Copy a Previous Day's Practice Log

### Overview
Add a "Copy" button next to the Share button that opens a calendar popup. When the user picks a date, all content from that day's practice log is copied into the current day -- including text fields, media files, PDFs, and audio recordings.

### UI Changes

**File: `src/components/practice-log/PracticeLogForm.tsx`**
- Add a new `CopyFromButton` component next to the existing `ShareButton`
- The button shows a calendar icon with "Copy" label

**New file: `src/components/practice-log/CopyFromButton.tsx`**
- A button that opens a Dialog containing a Calendar (same shadcn Calendar component used elsewhere)
- Calendar highlights days that have existing practice logs (reuses `get_practiced_dates` database function)
- On date selection, triggers the copy operation with a loading spinner
- Shows a confirmation toast on success

### Copy Logic

**New file: `src/hooks/useCopyPracticeLog.ts`**

This hook handles the full copy operation:

1. **Fetch source log** -- Query `practice_logs` for the selected date
2. **Copy text fields** -- Copy goals, subgoals, warmups, scales, repertoire, notes, metronome_used, additional_tasks, ear_training, music_listening (and their completion arrays). Does NOT copy start_time, stop_time, or total_time (those are session-specific)
3. **Ensure target log exists** -- Upsert a practice log for the current date
4. **Save text fields** -- Upsert the copied data into the current day's log
5. **Copy media files** (practice_media table + `practice-media` bucket):
   - For each media item from the source log:
     - If it's a file (audio/video/photo): download from storage, re-upload under the new log ID path
     - If it's a YouTube link: just insert a new DB row pointing to the same URL
6. **Copy lesson PDFs** (lesson_pdfs table + `lesson-pdfs` bucket):
   - Download each PDF from storage, re-upload under the new log ID path
   - Insert new DB rows with the new paths
7. **Copy audio recordings** (repertoire_recordings array + `practice-recordings` bucket):
   - For each non-empty recording path, download and re-upload under the new log ID
   - Update the repertoire_recordings array with the new paths
8. **Refresh the form** -- Invalidate the practice-log query so the form reloads with copied data

### Important Behaviors
- Copy OVERWRITES the current day's text fields (user is warned via a confirmation dialog if the current day already has content)
- Media/PDFs are ADDED (not replaced) -- if the target day already has media, copied items are appended up to the max limits
- Times (start/stop/total) are NOT copied since they're session-specific
- Completion checkboxes are copied as-is from the source

### Technical Details

**Storage file copying approach:**
Since the Supabase JS client doesn't have a server-side copy, the approach is:
1. Create a signed URL for the source file
2. Fetch the file as a blob
3. Upload the blob to the new path with `upsert: true`

This runs client-side and works within the existing RLS policies since the user owns both source and destination files.

**Files to create:**
- `src/components/practice-log/CopyFromButton.tsx` -- UI component with calendar dialog
- `src/hooks/useCopyPracticeLog.ts` -- Copy logic hook

**Files to modify:**
- `src/components/practice-log/PracticeLogForm.tsx` -- Add CopyFromButton next to ShareButton

**No database changes needed** -- all existing tables, buckets, and RLS policies support this feature.

### Complexity Considerations
- Copying large media files (up to 500MB each) client-side could be slow -- a progress indicator will be shown
- The copy operation should be wrapped in proper error handling so partial failures don't leave orphaned data
- Max limits (5 media, 10 PDFs) are respected -- if source has more items than the target can accept, excess items are skipped with a warning
