

## Fix: Storage RLS Policy Blocking OG HTML Upload

### Root Cause

The upload to `community-images/og-shares/{token}.html` is silently failing because the storage INSERT policy requires the first folder in the path to be the user's auth ID. The path `og-shares/...` doesn't match, so RLS blocks the upload with a 403.

### Solution

Two changes needed:

**1. Add a storage RLS policy for the `og-shares/` folder**

Allow authenticated users to INSERT and DELETE files in the `og-shares/` path:

```sql
CREATE POLICY "Users can upload og-share HTML"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = 'og-shares'
);

CREATE POLICY "Users can delete og-share HTML"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = 'og-shares'
);
```

**2. No code changes needed**

The existing `useSharePracticeLog.ts` code is already correct -- it uploads to `og-shares/{token}.html` and cleans up on revoke. Once the RLS policy allows the upload, everything will work.

### Testing

After the policy is added:
1. Revoke the existing share link (from the Share dialog)
2. Generate a new share link -- this will trigger the upload
3. Send the new link in a fresh iMessage conversation
4. The preview should show "Practice Daily" with the correct description and image
