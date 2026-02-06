

# Add Media Tools Section

## What's Changing

A new "Media Tools" section will appear directly below the "Repertoire & Exercises" card in the left column. Users can add up to 5 media items per practice day -- either by uploading/dropping an audio file, or by pasting a YouTube video link. Each item displays inline: audio files get an HTML5 audio player, and YouTube links get an embedded video player. Items can be individually deleted.

## Steps

### 1. Create Database Table and Storage Bucket

A new `practice_media` table stores each media reference tied to a practice log. A new private storage bucket (`practice-media`) holds uploaded audio files separately from the repertoire recordings.

### 2. Create the Media Tools Hook

A new `useMediaTools.ts` hook manages fetching, uploading, adding YouTube links, and deleting media items for a given practice log. It handles:
- Querying media items for the current practice log
- Uploading audio files to storage and creating a database record
- Validating and saving YouTube URLs
- Deleting items (removing storage files when applicable)

### 3. Create the Media Tools Component

A new `MediaTools.tsx` component provides:
- A drag-and-drop zone that also works as a file picker (accepts audio files: mp3, wav, m4a, ogg, webm)
- A text input for pasting YouTube URLs with an "Add" button
- For each saved item: an audio player (for uploaded files) or an embedded YouTube iframe (for links), plus a delete button
- A count indicator showing how many of the 5 slots are used

### 4. Integrate into the Practice Log Form

Place the Media Tools section in the left column of `PracticeLogForm.tsx`, directly below the "Repertoire & Exercises" card. It only appears when the practice log has been saved at least once (needs a `practiceLogId`).

### 5. Update the Shared Practice Log

Add a Media Tools display to `SharedPracticeLog.tsx` so shared logs also show audio players and embedded YouTube videos.

### 6. Update the Data Purge Function

Update the `purge-inactive-data` edge function to also clean up files in the `practice-media` bucket and delete rows from the `practice_media` table.

---

## Technical Details

### Database Migration

```sql
-- Create practice_media table
CREATE TABLE public.practice_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_log_id uuid NOT NULL REFERENCES public.practice_logs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('audio', 'youtube')),
  file_path text,
  youtube_url text,
  label text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.practice_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own media"
  ON public.practice_media FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media"
  ON public.practice_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media"
  ON public.practice_media FOR DELETE
  USING (auth.uid() = user_id);

-- Allow viewing media on shared logs
CREATE POLICY "Anyone can view media for shared logs"
  ON public.practice_media FOR SELECT
  USING (
    practice_log_id IN (
      SELECT practice_log_id FROM shared_practice_logs
      WHERE expires_at IS NULL OR expires_at > now()
    )
  );

-- Storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('practice-media', 'practice-media', false);

-- Storage RLS: users can manage their own files
CREATE POLICY "Users can upload media files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'practice-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own media files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'practice-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own media files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'practice-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useMediaTools.ts` | Hook for CRUD operations on practice media (fetch, upload audio, add YouTube URL, delete) |
| `src/components/practice-log/MediaTools.tsx` | UI component with drop zone, YouTube input, audio players, and embedded video players |

### Modified Files

| File | Change |
|------|--------|
| `src/components/practice-log/PracticeLogForm.tsx` | Import and render `MediaTools` below the Repertoire card, passing `practiceLogId` and `userId` |
| `src/pages/SharedPracticeLog.tsx` | Query `practice_media` for the shared log and display audio/YouTube players |
| `supabase/functions/purge-inactive-data/index.ts` | Add cleanup for `practice-media` storage bucket and `practice_media` table rows |

### YouTube URL Handling

The component will extract video IDs from common YouTube URL formats:
- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- `youtube.com/embed/VIDEO_ID`

Embedded players will use the standard `https://www.youtube.com/embed/VIDEO_ID` iframe format with privacy-enhanced mode (`youtube-nocookie.com`).

### Audio Upload Constraints

- Accepted formats: `.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm`
- Maximum file size: 20MB per file
- Files stored at path: `{user_id}/{practice_log_id}/media-{sort_order}.{ext}`

### UI Placement (left column)

```text
+---------------------------+
| Repertoire & Exercises    |
|  (existing, unchanged)    |
+---------------------------+
| Media Tools (NEW)         |
|  [Drop audio or browse]   |
|  [YouTube URL input]      |
|  - Audio player 1    [x]  |
|  - YouTube embed 2   [x]  |
|  2/5 slots used           |
+---------------------------+
```

