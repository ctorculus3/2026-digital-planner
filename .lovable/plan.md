

# Fix Metronome Sound

## Problem
The metronome visually starts (button changes to stop icon, checkbox toggles) but produces no audible sound. This is likely caused by iOS/mobile browsers silently blocking audio when the `AudioContext` loses its user-gesture context during async operations.

## Root Cause
In `startMetronome`, two `await` calls happen between the user's tap gesture and the first `playClick()`:

```
await getAudioContext();   // creates + resumes AudioContext
await loadClave();         // fetches + decodes WAV file (network I/O)
playClick();               // <-- by now, iOS may have re-suspended the context
```

iOS requires AudioContext operations to happen synchronously within a user gesture. The network fetch in `loadClave()` breaks that chain.

## Solution
Ensure the `AudioContext` is explicitly resumed right before playing, and add a silent buffer "unlock" technique for iOS:

### Changes to `src/components/practice-log/Metronome.tsx`:

1. **Add an AudioContext resume before `playClick`** -- In the `playClick` function, check if the context is suspended and resume it. This catches cases where iOS re-suspends the context after async work.

2. **Pre-warm the AudioContext with a silent buffer** -- After creating the AudioContext on user gesture, immediately play a silent buffer (a common iOS unlock trick). This "unlocks" the context before the async clave fetch happens.

3. **Add a resume call in `startMetronome` after the async operations** -- Right before calling `playClick()`, explicitly resume the AudioContext again.

### Technical Details

```typescript
// In playClick, add a resume guard:
const playClick = useCallback(async () => {
  const ctx = audioCtxRef.current;
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  // ... rest of play logic
}, []);

// In startMetronome, after getAudioContext(), play a silent buffer to unlock iOS:
const ctx = await getAudioContext();
// Unlock iOS audio with silent buffer
const silentBuffer = ctx.createBuffer(1, 1, ctx.sampleRate);
const silentSource = ctx.createBufferSource();
silentSource.buffer = silentBuffer;
silentSource.connect(ctx.destination);
silentSource.start();

// After loadClave, resume again before playing:
await loadClave();
if (!isPlayingRef.current) return;
if (audioCtxRef.current?.state === 'suspended') {
  await audioCtxRef.current.resume();
}
playClick(); // Now the context is guaranteed to be running
```

4. **Make the interval callback handle suspended state** -- Since `setInterval` callbacks also lose gesture context, ensure the interval's `playClick` handles this gracefully.

These are targeted changes to the existing `Metronome.tsx` file only. No other files are affected. All existing functionality (BPM slider, start/stop, checkbox toggle, cleanup) is preserved.
