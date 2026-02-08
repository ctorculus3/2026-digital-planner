

# Fix: PDF Viewer Showing Blank in Embedded Dialog

## Problem

The Dialog opens correctly when you tap a PDF, but the iframe inside shows a blank white page. This happens because the storage service returns PDF files with security headers (`X-Frame-Options` or `Content-Security-Policy: frame-ancestors`) that block the PDF from loading inside an iframe.

## Solution

Use **Google Docs Viewer** as an intermediary to render the PDF. Google Docs Viewer fetches the PDF from the signed URL and converts it into embeddable HTML that works inside an iframe without any header restrictions.

The signed URL format becomes:
```text
https://docs.google.com/gview?url={SIGNED_URL}&embedded=true
```

## Changes

### 1. `src/components/practice-log/LessonPdfs.tsx`

Update the iframe `src` to wrap the signed URL with Google Docs Viewer:

- Change `<iframe src={pdfViewerUrl}>` to `<iframe src={googleDocsViewerUrl}>`
- The viewer URL is constructed as: `https://docs.google.com/gview?url=${encodeURIComponent(pdfViewerUrl)}&embedded=true`
- Keep the existing "Download" link pointing to the raw signed URL so direct download still works

### 2. `src/pages/SharedPracticeLog.tsx`

Apply the same Google Docs Viewer wrapping:

- Update the iframe `src` in the PDF viewer Dialog to use Google Docs Viewer URL
- Keep the "Download" link pointing to the raw signed URL

## Technical Details

```text
User clicks PDF name
       |
       v
Fetch signed URL from storage (async)
       |
       v
Set pdfViewerUrl state --> Dialog opens
       |
       v
iframe src = Google Docs Viewer URL wrapping the signed URL
       |
       v
Google fetches the PDF and renders it as embeddable HTML
       |
       v
User views PDF inline, or clicks "Download" for raw file
```

Both files need identical changes -- just wrapping the iframe `src` with the Google Docs Viewer URL. The "Download" link continues to use the direct signed URL. No new dependencies are needed.

