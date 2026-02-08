

# Fix: Add Missing Storage UPDATE Policies

## What's Happening

Audio file uploads are failing because the storage buckets don't allow overwriting existing files. When a file already exists at the same path, the system needs UPDATE permission, which is currently missing.

## The Fix

A single database migration adds two UPDATE policies -- one for each storage bucket (`practice-media` and `practice-recordings`). These follow the same ownership pattern already used by the existing policies: only the file owner can overwrite their own files.

## Technical Details

### Database Migration

```sql
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

### No Code Changes

The existing upload code already uses `upsert: true` -- it just needs the database permission to complete the operation.

