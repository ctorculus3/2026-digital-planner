

## Fix Video Upload -- Bucket Size Limit and Shared Access

The video upload is failing silently because **the storage bucket has a default 50MB file size limit** enforced server-side. Even though the app-side check was raised to 100MB, the bucket rejects the file, and the error gets caught and shown as a generic "Failed to upload audio file" toast (which may be easy to miss).

### Changes

**Database Migration (SQL)**

1. Update the `practice-media` bucket file size limit to 100MB (104857600 bytes):
```text
UPDATE storage.buckets
SET file_size_limit = 104857600
WHERE id = 'practice-media';
```

2. Fix the shared practice media storage policy to also allow video files (currently it only matches `media_type = 'audio'`):
```text
DROP POLICY "Allow access to shared practice media" ON storage.objects;
CREATE POLICY "Allow access to shared practice media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'practice-media'
    AND EXISTS (
      SELECT 1
      FROM practice_media pm
      JOIN shared_practice_logs spl ON spl.practice_log_id = pm.practice_log_id
      WHERE pm.file_path = objects.name
        AND pm.media_type IN ('audio', 'video')
        AND (spl.expires_at IS NULL OR spl.expires_at > now())
    )
  );
```

**`src/hooks/useMediaTools.ts`**

- Update the `deleteMedia` function: it currently only deletes storage files when `media_type === "audio"`. Change the condition to also include `"video"` so video files are properly cleaned up from storage on deletion.

**`src/components/practice-log/MediaTools.tsx`**

- Update the upload error toast from "Failed to upload audio file" to "Failed to upload file" for clarity.

### No other code changes needed
The upload logic, video detection, and player rendering are already correct from the previous implementation.

