

## Add Download Button to Repertoire Audio Recordings

Add a download icon button next to the existing Play and Delete buttons so users can save their recordings to their computer.

### Changes

**`src/hooks/useAudioRecording.ts`**

- Add a `downloadRecording` function that:
  - Uses the existing signed URL (`audioUrl` state) to fetch the audio file
  - Creates a temporary download link with a descriptive filename (e.g., `repertoire-1.webm`)
  - Triggers the browser's native download dialog
- Export `downloadRecording` from the hook's return object

**`src/components/practice-log/AudioRecorder.tsx`**

- Import the `Download` icon from `lucide-react`
- Destructure `downloadRecording` from the `useAudioRecording` hook
- Add a download button between the Play and Delete buttons in the "has recording" state:

```text
[Play/Pause] [Download] [Delete]
```

- Style it consistently with the existing buttons (ghost variant, `h-7 w-7`, muted foreground color with primary hover)

### Technical Notes

- The signed URL is already fetched and stored in the hook's state when a recording exists, so no additional network call is needed to generate it
- The download uses `fetch()` + `blob()` + temporary anchor element pattern to force a file download (rather than opening in a new tab)
- The filename will be derived from the repertoire index (e.g., `recording-1.webm`) for clarity

