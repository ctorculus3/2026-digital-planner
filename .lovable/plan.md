

## Make Auto-Speak Default and Fix Autoplay with AudioContext

### The Problem
The `warmUpAudio()` approach using `new Audio()` with a silent clip is unreliable -- browsers may still block it or not keep the gate open long enough through the async TTS fetch. The user also wants auto-speak on by default.

### The Fix (2 changes in one file)

**File: `src/components/practice-log/MusicAI.tsx`**

**1. Default auto-speak to ON**
Change `useState(false)` to `useState(true)` for the `autoSpeak` state (line 38).

**2. Replace `warmUpAudio` with a persistent AudioContext approach**
The Web Audio API's `AudioContext` is more reliable than `new Audio()` for unlocking playback. Once resumed during a user gesture, it stays unlocked for the entire page session. The fix:

- Create a shared `AudioContext` ref (persists across renders)
- On user gesture (Send click or speaker icon click), call `audioContext.resume()` to unlock it
- For TTS playback, decode the fetched audio into the AudioContext and play via `AudioBufferSourceNode` instead of `new Audio(url)`
- This completely avoids the `NotAllowedError` since the context is already unlocked

```text
Flow:
  User clicks Send or Speaker icon (user gesture)
    -> audioContext.resume() (unlocks permanently for session)
    -> fetch TTS audio
    -> audioContext.decodeAudioData(buffer)
    -> sourceNode.start() (plays immediately, no restriction)
```

### Technical Details

- Add `audioContextRef = useRef<AudioContext | null>(null)` and a helper `getAudioContext()` that lazily creates it
- Replace `warmUpAudio()` with `getAudioContext().resume()` 
- In `speakMessage`: fetch audio as `ArrayBuffer`, decode with `audioContext.decodeAudioData()`, play with `createBufferSource()`
- `cleanupAudio` stops the source node instead of pausing an HTML Audio element
- Remove `blobUrlRef` (no longer needed -- no object URLs)
- Keep the fallback toast for edge cases but it should rarely trigger

### No other files change
- Backend edge function stays the same
- No database changes

