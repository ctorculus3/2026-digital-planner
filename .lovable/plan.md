

## Fix Audio Recording Download Format

The downloaded `.webm` files won't play on many devices because WebM is primarily a video container format and lacks broad native support outside browsers (especially on macOS and Windows media players).

### Root Cause

The MediaRecorder currently prefers `audio/webm`, which browsers handle fine for in-app playback, but when downloaded to the user's computer, most native media players (QuickTime, Windows Media Player, etc.) either don't recognize it or refuse to play it.

### Solution

Change the recording format preference order to prioritize `audio/mp4` (AAC), which is universally playable on all platforms, and only fall back to `audio/webm` if MP4 isn't supported.

### Changes

**`src/hooks/useAudioRecording.ts`**

- Swap the MIME type preference: try `audio/mp4` first, then fall back to `audio/webm`
  - `audio/mp4` produces `.m4a` files which play natively on macOS, Windows, iOS, and Android
  - Safari and most mobile browsers support `audio/mp4`; Chrome/Firefox support `audio/webm`
- Update the upload extension logic to match (already handles both cases)
- No changes needed to the download function — it already detects the type from the blob

**Change in the `startRecording` function (line 96-98):**

```typescript
// Before:
const mimeType = MediaRecorder.isTypeSupported("audio/webm")
  ? "audio/webm"
  : "audio/mp4";

// After:
const mimeType = MediaRecorder.isTypeSupported("audio/mp4")
  ? "audio/mp4"
  : "audio/webm";
```

### Impact

- New recordings will be saved as `.m4a` files (on browsers that support `audio/mp4`) which are universally playable
- Existing `.webm` recordings will continue to work for in-app playback and download (the download function already handles both extensions)
- Chrome on desktop may still fall back to `audio/webm` since it doesn't support `audio/mp4` recording — but Safari, Edge, and mobile browsers will produce `.m4a`

