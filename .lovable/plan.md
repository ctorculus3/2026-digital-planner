

# Implement Recording Safeguards

## Overview

Add two safeguards to protect storage usage and costs:
1. **Automatic cleanup** - Delete audio files when practice logs are purged
2. **5-minute recording limit** - Auto-stop recordings to prevent very large files

---

## Changes Required

### 1. Add Recording Time Limit

**File:** `src/hooks/useAudioRecording.ts`

Add a timer that automatically stops recording after 5 minutes (300 seconds).

**Changes:**
- Add a `recordingDuration` state to track elapsed time
- Add a timer ref to count seconds
- Auto-stop when 5 minutes is reached
- Return the duration for UI display (optional visual indicator)

```typescript
const MAX_RECORDING_SECONDS = 300; // 5 minutes

// Add state for tracking duration
const [recordingDuration, setRecordingDuration] = useState(0);
const timerRef = useRef<NodeJS.Timeout | null>(null);

// In startRecording, add timer logic:
timerRef.current = setInterval(() => {
  setRecordingDuration(prev => {
    if (prev >= MAX_RECORDING_SECONDS - 1) {
      stopRecording();
      return 0;
    }
    return prev + 1;
  });
}, 1000);

// In stopRecording, clear the timer:
if (timerRef.current) {
  clearInterval(timerRef.current);
  timerRef.current = null;
}
setRecordingDuration(0);
```

---

### 2. Add Storage Cleanup to Purge Function

**File:** `supabase/functions/purge-inactive-data/index.ts`

Before deleting practice logs, fetch the recording paths and delete the corresponding storage files.

**Changes:**
- Query practice logs to get all `repertoire_recordings` paths for users being deleted
- Delete storage objects from the `practice-recordings` bucket
- Then delete the practice log database records

```typescript
// Before deleting practice logs, collect all recording paths
const { data: logsToDelete } = await supabase
  .from("practice_logs")
  .select("id, user_id, repertoire_recordings")
  .in("user_id", usersToDelete);

// Collect all non-empty recording paths
const recordingPaths: string[] = [];
for (const log of logsToDelete || []) {
  const recordings = log.repertoire_recordings || [];
  for (const path of recordings) {
    if (path && path.trim()) {
      recordingPaths.push(path);
    }
  }
}

// Delete storage files
if (recordingPaths.length > 0) {
  const { error: storageError } = await supabase.storage
    .from("practice-recordings")
    .remove(recordingPaths);
  
  if (storageError) {
    logStep("Warning: Failed to delete some recordings", { error: storageError.message });
  } else {
    logStep("Deleted recordings", { count: recordingPaths.length });
  }
}

// Then delete the practice logs (existing code)
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| `src/hooks/useAudioRecording.ts` | Add 5-minute auto-stop timer with duration tracking |
| `supabase/functions/purge-inactive-data/index.ts` | Delete storage files before purging practice logs |

---

## Benefits

| Safeguard | Benefit |
|-----------|---------|
| 5-minute limit | Prevents single recordings from exceeding ~5-10 MB |
| Storage cleanup | Prevents orphaned files from accumulating when logs are purged |

---

## Optional Enhancement

The recording duration is tracked internally. If you'd like, I can also display a visual timer (e.g., "Recording: 0:45 / 5:00") next to the stop button so users know how much time remains.

