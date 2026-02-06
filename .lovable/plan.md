

# Fix: Add Missing Storage UPDATE Policies

## Root Cause

The storage upload fails with "new row violates row-level security policy" because:

1. The upload code uses `upsert: true`, which tries to overwrite a file if it already exists at the same path
2. Overwriting requires an **UPDATE** policy on `storage.objects`
3. Neither the `practice-media` nor `practice-recordings` bucket has an UPDATE policy -- only INSERT, SELECT, and DELETE
4. On Feb 5, uploads worked because every file was brand new (INSERT path). Once a file exists at a path, subsequent upserts trigger the UPDATE path and fail

### How the duplicate path happens

When the Media Tools component re-renders (e.g. navigating between days), the media items list briefly starts empty. If you upload during that window, `getNextSortOrder()` returns 0, generating the same path (`media-0.m4a`) as an existing file. The upsert then tries to update the existing storage object and fails.

## Fix

Add UPDATE policies for both storage buckets. This is a single database migration -- no code changes needed.

### Database Migration

Add two new policies to `storage.objects`:

```text
-- Allow users to update/overwrite their own media files
CREATE POLICY "Users can update their own media files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'practice-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update/overwrite their own recordings
CREATE POLICY "Users can update own recordings"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'practice-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

These policies follow the exact same pattern as the existing INSERT/SELECT/DELETE policies for each bucket -- only the owner (matched by the first folder in the file path being equal to `auth.uid()`) can overwrite their own files.

### What This Fixes

- Audio file uploads via Media Tools will succeed even when a file already exists at the path
- Re-recording audio in Repertoire and Exercises will also work reliably
- No code changes are needed -- the existing `upsert: true` flag will work as intended once the UPDATE policy is in place

