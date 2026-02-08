

# Fix: Blank PDF Popup Window

## Problem

When a user clicks a PDF name, the popup window opens blank. This happens because `window.open()` is called **after** an async network request (to fetch the signed URL). Browsers require `window.open()` to happen synchronously within the original click event -- once an `await` runs, the user gesture context expires, and the browser opens a restricted/blank window.

## Solution

Open the popup window immediately (synchronously) when the user clicks, then update its location once the signed URL arrives. This is a standard pattern for handling async content in popups.

## What Changes

**File: `src/components/practice-log/LessonPdfs.tsx`** -- update the `handleOpenPdf` function only.

Current code (broken):
```typescript
const handleOpenPdf = useCallback(
  async (item: LessonPdfItem) => {
    const url = await getSignedPdfUrl(item.file_path);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      toast.error("Failed to open PDF");
    }
  },
  [getSignedPdfUrl]
);
```

Fixed code:
```typescript
const handleOpenPdf = useCallback(
  async (item: LessonPdfItem) => {
    // Open window synchronously to preserve user gesture context
    const newWindow = window.open("", "_blank");
    const url = await getSignedPdfUrl(item.file_path);
    if (url && newWindow) {
      newWindow.location.href = url;
    } else {
      newWindow?.close();
      toast.error("Failed to open PDF");
    }
  },
  [getSignedPdfUrl]
);
```

This is a single function change in one file -- no other files or database changes needed.
