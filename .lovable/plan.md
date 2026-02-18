

## Fix Manual Speaker Icon Autoplay Block

### The Problem
Clicking the speaker icon calls `speakMessage`, which first fetches audio from the TTS backend (takes several seconds). By the time the fetch returns and `audio.play()` is called, the browser no longer treats it as a user gesture, so playback is blocked with `NotAllowedError`.

### The Fix

**File: `src/components/practice-log/MusicAI.tsx`**

Add `warmUpAudio()` as the first line inside `speakMessage`, before the fetch call. Since the function is invoked directly from a click handler (user gesture), playing the silent audio at that moment unlocks the browser's audio gate for subsequent playback.

**Current code (line ~72):**
```typescript
const speakMessage = useCallback(
    async (text: string, idx: number) => {
      cleanupAudio();
      setLoadingTtsIdx(idx);
```

**Updated code:**
```typescript
const speakMessage = useCallback(
    async (text: string, idx: number) => {
      warmUpAudio();
      cleanupAudio();
      setLoadingTtsIdx(idx);
```

This is a single-line addition. No other files need to change.

### Why This Works

```text
User clicks speaker icon (user gesture)
  -> warmUpAudio() plays silent clip (unlocks audio gate)
  -> fetch TTS audio from backend (async, ~3-5 seconds)
  -> audio.play() succeeds (gate already unlocked)
```

### Dependencies
- `warmUpAudio` must be added to the `speakMessage` dependency array in `useCallback`

