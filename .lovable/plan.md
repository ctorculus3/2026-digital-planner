

# Fix: PDF Viewer Using Embedded Dialog

## Problem

The PDF signed URL works correctly (verified - the file loads fine when accessed directly), but every approach to open it in a new tab (window.open, anchor tag) results in a blank white page. This happens because the app runs inside an iframe with sandbox restrictions that prevent new browser tabs from properly navigating to external storage URLs.

## Solution

Instead of opening a new tab, display the PDF inside a fullscreen dialog using an embedded `<iframe>`. This keeps everything within the app and avoids the sandbox restrictions entirely. A "Download" link is included as a fallback for any edge cases.

## Changes

### 1. `src/components/practice-log/LessonPdfs.tsx`

Replace the `handleOpenPdf` anchor-tag logic with state-driven dialog display:

- Add state for `pdfViewerUrl` and `pdfViewerName`
- When a PDF is clicked, fetch the signed URL and set it in state (opens the dialog)
- Render a fullscreen Dialog containing an `<iframe>` that loads the signed URL
- Include a "Download" link and close button in the dialog header
- Clear state on dialog close

### 2. `src/pages/SharedPracticeLog.tsx`

Apply the same embedded dialog approach:

- Add state for `pdfViewerUrl` and `pdfViewerName`
- Update `handleOpenPdf` to set state instead of creating an anchor
- Add a fullscreen Dialog with embedded `<iframe>` for viewing the PDF

## Technical Details

```text
User clicks PDF name
       |
       v
Fetch signed URL (async)
       |
       v
Set pdfViewerUrl state --> Dialog opens with <iframe src={signedUrl}>
       |
       v
User views PDF inline, or clicks "Download" link
       |
       v
Close dialog --> Clear state
```

The Dialog will use near-fullscreen sizing (`max-w-[95vw] max-h-[95vh]`) so the PDF is easy to read. The iframe naturally renders PDFs using the browser's built-in PDF viewer, no external libraries needed.

Both components need this same fix since they share the same blank-page problem.

