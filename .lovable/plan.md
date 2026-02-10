

## Fix: Photos Not Loading on Shared Practice Logs

### Problem

The storage policy that allows anonymous access to shared practice media files only permits `'audio'` and `'video'` types. Photos are excluded, so signed URLs for photo files return access denied for unauthenticated viewers.

The relevant policy is in `supabase/migrations/20260209221713_...sql`:
```
pm.media_type IN ('audio', 'video')
```

### Fix

**Single database migration** to update the storage policy to also include `'photo'`:

```sql
DROP POLICY IF EXISTS "Allow access to shared practice media" ON storage.objects;
CREATE POLICY "Allow access to shared practice media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'practice-media'
    AND EXISTS (
      SELECT 1
      FROM practice_media pm
      JOIN shared_practice_logs spl ON spl.practice_log_id = pm.practice_log_id
      WHERE pm.file_path = objects.name
        AND pm.media_type IN ('audio', 'video', 'photo')
        AND (spl.expires_at IS NULL OR spl.expires_at > now())
    )
  );
```

No code changes needed -- the `SharedPracticeLog.tsx` rendering is already correct. Only this storage access policy needs updating.
