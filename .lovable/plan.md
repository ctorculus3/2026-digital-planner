

# Fix: Auto-Create Practice Log When Uploading Media

## The Problem

Currently, if you navigate to a day that hasn't been saved yet and try to upload audio or add a YouTube link, you get an error: "Please save your practice log first." This is a poor experience -- users shouldn't have to think about saving before they can use Media Tools.

## The Solution

When a user uploads media on a day that doesn't have a practice log yet, the app will automatically create a minimal (empty) practice log record for that day, then attach the media to it. This happens silently in the background -- the user just sees their upload succeed.

## How It Works

```text
User drops audio file on Feb 3 (no practice log saved yet)
  --> useMediaTools detects practiceLogId is undefined
  --> Automatically creates an empty practice log for Feb 3
  --> Gets back the new practice_log ID
  --> Uploads the audio file and links it to that ID
  --> Refreshes the practice log query so the form picks up the new record
```

## What Changes

### 1. useMediaTools hook (`src/hooks/useMediaTools.ts`)

- Accept two new parameters: `logDate` (the date string like "2026-02-06") and a callback `onPracticeLogCreated` that the form can use to refresh its data.
- Add an internal `ensurePracticeLog` function that:
  - If `practiceLogId` is already set, returns it immediately
  - If not, creates a minimal practice log via upsert (user_id + log_date with empty defaults) and returns the new ID
- Update `uploadAudio` and `addYouTubeLink` to call `ensurePracticeLog()` instead of showing an error when practiceLogId is missing.

### 2. PracticeLogForm (`src/components/practice-log/PracticeLogForm.tsx`)

- Pass the `logDate` string and a refresh callback to `MediaTools`.
- The refresh callback invalidates the practice-log query so the form picks up the newly created record and its ID.
- Change the rendering condition from `practiceLog?.id && user` to just `user` (as previously planned) so Media Tools always appears.

### 3. MediaTools component (`src/components/practice-log/MediaTools.tsx`)

- Pass the new `logDate` and `onPracticeLogCreated` props through to the `useMediaTools` hook.

## Technical Details

### The `ensurePracticeLog` function (added to `useMediaTools.ts`)

```text
ensurePracticeLog():
  1. If practiceLogId exists, return it
  2. Otherwise, upsert into practice_logs with:
     - user_id, log_date (required fields)
     - All other fields use database defaults (empty arrays, nulls)
     - onConflict: "user_id,log_date" (safe if log was created between checks)
  3. Query back the record to get the ID
  4. Update local state with the new ID
  5. Call onPracticeLogCreated() so the form refreshes
  6. Return the new ID
```

### Props changes

- `MediaTools` component: adds `logDate: string` and `onPracticeLogCreated?: () => void`
- `useMediaTools` hook: adds `logDate: string` and `onPracticeLogCreated?: () => void` parameters

### No database changes needed

The existing `practice_logs` table already has sensible defaults for all optional columns (empty arrays, nulls, false for booleans). An upsert with just `user_id` and `log_date` will create a valid, minimal record.

