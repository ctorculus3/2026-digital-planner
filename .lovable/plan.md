

## Fix: Add 'video' to database check constraint

The video file uploads to storage successfully, but then the database INSERT into `practice_media` fails because the `media_type` column has a CHECK constraint that only allows `'audio'` and `'youtube'` -- it does not include `'video'`.

### Root Cause
```
CHECK ((media_type = ANY (ARRAY['audio'::text, 'youtube'::text])))
```

### Fix

**Database Migration (SQL)**

Drop and recreate the check constraint to include `'video'`:

```text
ALTER TABLE practice_media DROP CONSTRAINT practice_media_media_type_check;
ALTER TABLE practice_media ADD CONSTRAINT practice_media_media_type_check 
  CHECK (media_type = ANY (ARRAY['audio'::text, 'video'::text, 'youtube'::text]));
```

### No code changes needed
The application code already correctly sets `media_type: "video"` for video files. This is purely a database constraint issue.
