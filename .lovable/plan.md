

## Add Video File Support to Media Tools

Extend the Media Tools section to accept video files (mp4, mov, webm) in addition to the existing audio files, and render an inline video player for uploaded videos.

### Changes

**`src/hooks/useMediaTools.ts`**

- Add video MIME types to the accepted list: `video/mp4`, `video/quicktime`, `video/webm`
- Add video extensions to the accepted list: `.mp4`, `.mov`
- Update the `uploadAudio` function (rename conceptually but keep backward compatible) to handle video files:
  - Detect whether the file is audio or video based on MIME type
  - Set `media_type` to `"video"` for video files, `"audio"` for audio files
- Update the `MediaItem` type to include `"video"` as a valid `media_type`

**`src/components/practice-log/MediaTools.tsx`**

- Update the drop zone label from "Drop audio file or click to browse" to "Drop audio/video file or click to browse"
- Update the file input `accept` attribute to include video types: `.mp4,.mov,.webm,video/*`
- Import the `Video` icon from `lucide-react`
- Add a video player rendering case in `MediaItemCard`:
  - For `media_type === "video"`, render a `<video>` element with controls (similar pattern to the AudioPlayer component, using a signed URL)
  - Show the `Video` icon in the item header
- Rename the `AudioPlayer` component to `MediaPlayer` or add a parallel `VideoPlayer` component that fetches a signed URL and renders a `<video controls>` element

### Technical Notes

- Video files will use the same `practice-media` storage bucket and 20MB size limit
- The existing RLS policies on `practice_media` table already support this since `media_type` is a plain text column with no constraint
- No database migration needed -- `media_type` is an unconstrained text field
- The 5-item limit per practice log still applies across all media types

