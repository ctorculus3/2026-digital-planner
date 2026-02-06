
# Add Audio Recording to Repertoire Items

## Overview

Add a record button next to each repertoire item that allows users to record audio of their practice. Recordings will be saved to cloud storage and linked to the specific repertoire item for future playback.

## How It Works

1. User clicks the **record button** (microphone icon) next to a repertoire item
2. Browser requests microphone permission (one-time)
3. Recording starts - button turns red, shows recording indicator
4. User clicks **stop** - recording ends
5. Audio is uploaded to cloud storage automatically
6. A **play button** appears to listen back to the recording
7. Users can **delete** and **re-record** as needed

---

## Technical Approach

### Browser Recording
Uses the browser's built-in **MediaRecorder API** - no external libraries needed. Works in all modern browsers (Chrome, Firefox, Safari, Edge).

### Storage
Audio files will be stored in a dedicated storage bucket. Each recording is named with the practice log ID and repertoire index for easy retrieval.

### Database
Add a new column to track which repertoire items have recordings and their file paths.

---

## Changes Required

### 1. Create Storage Bucket

Create a private storage bucket for audio recordings with proper access policies:

```sql
-- Create bucket for practice recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('practice-recordings', 'practice-recordings', false);

-- Allow authenticated users to upload their own recordings
CREATE POLICY "Users can upload own recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'practice-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own recordings
CREATE POLICY "Users can read own recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'practice-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own recordings
CREATE POLICY "Users can delete own recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'practice-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 2. Update Database Schema

Add a column to track recording file paths for each repertoire item:

```sql
ALTER TABLE practice_logs 
ADD COLUMN repertoire_recordings text[] DEFAULT '{}';
```

This array stores the storage path for each repertoire item (empty string if no recording).

### 3. Create Recording Component

**New file:** `src/components/practice-log/AudioRecorder.tsx`

A reusable component that handles:
- Microphone permission request
- Start/stop recording
- Upload to storage
- Playback of existing recordings
- Delete functionality

```typescript
interface AudioRecorderProps {
  practiceLogId: string;
  userId: string;
  index: number;
  existingRecordingPath: string | null;
  onRecordingComplete: (path: string) => void;
  onRecordingDeleted: () => void;
}
```

### 4. Create Recording Hook

**New file:** `src/hooks/useAudioRecording.ts`

Encapsulates recording logic:
- MediaRecorder setup
- Audio blob management
- Upload to storage
- Signed URL generation for playback

### 5. Update Practice Log Form

**File:** `src/components/practice-log/PracticeLogForm.tsx`

Add recording buttons to each repertoire row:

**Current:**
```tsx
<div key={index} className="flex items-center gap-2">
  <Checkbox ... />
  <Input ... />
</div>
```

**New:**
```tsx
<div key={index} className="flex items-center gap-2">
  <Checkbox ... />
  <Input ... />
  <AudioRecorder
    practiceLogId={practiceLog?.id}
    userId={user.id}
    index={index}
    existingRecordingPath={repertoireRecordings[index]}
    onRecordingComplete={(path) => updateRepertoireRecording(index, path)}
    onRecordingDeleted={() => updateRepertoireRecording(index, '')}
  />
</div>
```

### 6. Update Hook

**File:** `src/hooks/usePracticeLog.ts`

Add `repertoire_recordings` to the interface and save/load logic.

---

## User Interface

Each repertoire row will have these possible states:

| State | Icons Shown |
|-------|-------------|
| No recording | Microphone icon (muted) |
| Recording in progress | Stop button (red, pulsing) |
| Has recording | Play button + Delete button |
| Playing | Pause button + Delete button |

The icons will be small and unobtrusive to maintain the clean form layout.

---

## File Structure

Audio files are organized by user ID and practice log:

```
practice-recordings/
  └── {user_id}/
      └── {practice_log_id}/
          └── repertoire-{index}.webm
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Database | Add `repertoire_recordings` column (text[]) |
| Storage | Create `practice-recordings` bucket with RLS policies |
| `src/hooks/useAudioRecording.ts` | New hook for recording logic |
| `src/components/practice-log/AudioRecorder.tsx` | New component for record/play UI |
| `src/hooks/usePracticeLog.ts` | Add recording paths to interface and payload |
| `src/components/practice-log/PracticeLogForm.tsx` | Add AudioRecorder to each repertoire row |

---

## Browser Compatibility

The MediaRecorder API is supported in:
- Chrome 49+
- Firefox 25+
- Safari 14.1+
- Edge 79+

For older browsers, the record button will be hidden with a graceful fallback.

---

## Storage Considerations

- Audio is recorded in WebM format (efficient compression)
- Typical 1-minute recording: ~500KB to 1MB
- Users can delete recordings to manage storage
- Files are private and only accessible by the owner
