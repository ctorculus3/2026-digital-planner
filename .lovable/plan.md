

# Fix: Lesson PDF "Failed to open" Error

## Problem

PDF files with spaces in their names (like "Triplet Approach Note Exercise.pdf") fail to open because the storage path contains spaces. Supabase Storage encodes these differently during upload vs. signed URL generation, causing an "Object not found" error.

## Solution

Sanitize the storage file path by replacing spaces and special characters with hyphens, while keeping the original filename for display in the UI. This matches the same safe-path approach used by Media Tools.

## What Changes

**File: `src/hooks/useLessonPdfs.ts`**

1. Add a filename sanitizer function that:
   - Replaces spaces with hyphens
   - Removes special characters that could cause path issues
   - Preserves the file extension
   - Adds the sort order as a prefix to guarantee uniqueness

2. Update the `uploadPdf` function to use the sanitized path for storage, while continuing to store the original `file.name` in the database `file_name` column for display

Before (problematic):
```text
file path: {userId}/{logId}/Triplet Approach Note Exercise.pdf
```

After (safe):
```text
file path: {userId}/{logId}/pdf-0-triplet-approach-note-exercise.pdf
```

The original filename "Triplet Approach Note Exercise.pdf" still shows in the UI since it comes from the `file_name` database column, not the storage path.

No database migration or other file changes needed -- this is a single-file fix in the hook.

