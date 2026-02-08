

# Remove Download Link from PDF Viewer Dialog

## Why

The Download link doesn't work due to browser sandbox restrictions (same issue that originally caused blank pages). Since the Google Docs Viewer already provides its own built-in download option in the top-right corner of the viewer, the custom Download link is redundant and broken.

## Changes

### 1. `src/components/practice-log/LessonPdfs.tsx`

- Remove the `<a>` download link from the DialogHeader
- Remove the `Download` icon import (if no longer used elsewhere)
- Simplify the DialogHeader to just show the file name

### 2. `src/pages/SharedPracticeLog.tsx`

- Remove the `<a>` download link from the DialogHeader
- Remove the `Download` icon import
- Simplify the DialogHeader to just show the file name

## Result

The PDF viewer dialog will show a clean header with just the file name and close button. Users can still download the PDF using the Google Docs Viewer's built-in download button within the viewer itself.

