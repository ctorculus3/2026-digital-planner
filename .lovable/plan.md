

# Fix: Image Posting Not Working in Community

## What's Happening

After thorough investigation:

- **The backend is working correctly** -- direct testing confirms posts with images are accepted (HTTP 201).
- **Storage policies are properly configured** for the community-images bucket.
- **The PostComposer UI renders correctly** with the image attachment button visible.

The issue is likely a combination of two frontend problems:

1. **React ref warnings from ImageGallery are destabilizing the page**: The console shows repeated "Function components cannot be given refs" errors from the image lightbox Dialog. While technically warnings, these indicate the Dialog component isn't properly set up, which can cause subtle rendering/interaction issues on the page -- especially with elements like the hidden file input that relies on ref-based programmatic clicks.

2. **The file input click may silently fail**: If `fileInputRef.current` is null at the moment the ImagePlus button is clicked (due to a React re-render timing issue), the `?.click()` optional chain silently does nothing -- no error, no feedback, just "nothing happened."

## Fixes (2 files)

### 1. Fix ImageGallery ref warnings and add missing accessibility

**File**: `src/components/community/ImageGallery.tsx`

- Add a visually hidden `DialogTitle` to the lightbox Dialog (required by Radix for accessibility, and its absence can cause ref-handling issues)
- Add `DialogDescription` for screen readers
- These additions resolve the "Function components cannot be given refs" warnings that appear on every render

### 2. Make PostComposer image selection more robust

**File**: `src/components/community/PostComposer.tsx`

- Add a fallback in the ImagePlus button click handler: if `fileInputRef.current` is null, show a toast telling the user to try again rather than silently doing nothing
- Add `console.log` breadcrumbs at key points (image select, submit start, upload start) to help debug if issues persist
- Keep all existing functionality exactly as-is (inputKey reset, auth toast, cleanup, etc.)

## Technical Details

| File | Change | Purpose |
|------|--------|---------|
| `ImageGallery.tsx` | Add `DialogTitle` + `DialogDescription` (visually hidden) | Fix ref warnings, proper accessibility |
| `PostComposer.tsx` | Add null-check toast on ImagePlus click | Prevent silent failures when ref is null |
| `PostComposer.tsx` | Add console.log at file-select and submit | Enable debugging if issue recurs |

No database, storage, or edge function changes are needed.
