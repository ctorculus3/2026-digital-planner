

## Increase Media Tools File Size Limit to 100MB

Raise the maximum upload size from 20MB to 100MB so video files can be uploaded successfully.

### Change

**`src/hooks/useMediaTools.ts`**

- Update the `MAX_FILE_SIZE` constant from `20 * 1024 * 1024` (20MB) to `100 * 1024 * 1024` (100MB)
- Update the error message from "File size must be under 20MB" to "File size must be under 100MB"

This is a two-line change with no other side effects -- the storage bucket and RLS policies don't enforce a size limit on the application side.

