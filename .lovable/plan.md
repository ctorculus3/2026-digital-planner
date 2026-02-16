

## Fix Metronome Sound: Resume AudioContext on User Gesture

### Root Cause

The Metronome's `getAudioContext()` function creates an `AudioContext` lazily but never calls `.resume()` on it. On iOS Safari (and increasingly on other browsers), a new `AudioContext` starts in `suspended` state and must be resumed during a user gesture to produce sound.

The Metronome was likely working before because the browser auto-resumed it in certain conditions, but that behavior is not guaranteed.

### Fix

Add `.resume()` to the `getAudioContext` helper so the context is always active when used.

### Technical Changes

**File: `src/components/practice-log/Metronome.tsx`**

**Lines 18-23** -- Add resume call inside `getAudioContext`:

Before:
```
const getAudioContext = useCallback(() => {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new AudioContext();
  }
  return audioCtxRef.current;
}, []);
```

After:
```
const getAudioContext = useCallback(() => {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new AudioContext();
  }
  if (audioCtxRef.current.state === 'suspended') {
    audioCtxRef.current.resume();
  }
  return audioCtxRef.current;
}, []);
```

This is safe because `getAudioContext` is only called from `loadClave` and `playClick`, both of which originate from the user's button click (a valid gesture). Everything else in the Metronome stays exactly the same.

