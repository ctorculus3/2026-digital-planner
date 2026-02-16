

## Fix Metronome Sound + Tuner Sustained Tone

### Problem 1: Metronome Still Silent

The `playClick` function was made `async` to await `getAudioContext()`. However, `setInterval(playClick, ms)` fires an async function without awaiting it, and the AudioContext promise resolution introduces timing issues that cause silent failures on some browsers.

**Fix:** Initialize the AudioContext once during `startMetronome` (which runs in a user gesture) and make `playClick` synchronous again. Store a resolved context reference so `playClick` can use it directly without awaiting.

### Problem 2: Tuner Tone Keeps Cutting Out

When the microphone briefly loses the pitch (even for a split second between breaths or during volume dips), the code immediately stops the oscillator (line 220-223). When pitch returns, the 500ms sustain timer restarts from scratch before the tone can play again, creating a rapid on/off beeping effect.

**Fix:** Add a grace period (e.g., 500ms) before stopping the oscillator when pitch is lost. If pitch returns within that window, cancel the stop and keep playing.

### Technical Changes

**File: `src/components/practice-log/Metronome.tsx`**

1. Remove `async` from `playClick` -- make it synchronous
2. Instead of calling `getAudioContext()` inside `playClick`, use `audioCtxRef.current` directly (it will already be initialized)
3. In `startMetronome`, await `getAudioContext()` once at the start (this is the user gesture) to ensure the context is created and resumed
4. Keep `loadClave` as-is (it already awaits properly)

Key change -- `playClick` becomes:
```
const playClick = useCallback(() => {
  const ctx = audioCtxRef.current;
  if (!ctx) return;
  if (claveBufferRef.current) {
    const source = ctx.createBufferSource();
    source.buffer = claveBufferRef.current;
    source.connect(ctx.destination);
    source.start();
  } else {
    // fallback beep
    ...
  }
}, []);
```

And `startMetronome` adds `await getAudioContext()` before loading clave.

**File: `src/components/practice-log/Tuner.tsx`**

1. Add a `silenceTimeoutRef = useRef<number | null>(null)` for the grace period
2. When pitch is detected (freq > 0), clear any pending silence timeout
3. When pitch is lost (the `else` branch at line 220), instead of immediately calling `stopOscillator()`, set a 500ms timeout that will stop it
4. If pitch returns before the timeout fires, cancel it -- the tone keeps playing uninterrupted
5. Clean up the timeout on unmount and in `stopListening`

Key change in the `detect()` function:
```
} else {
  // Pitch lost — give a grace period before stopping
  setActiveSegment(null);
  if (oscillatorRef.current && !silenceTimeoutRef.current) {
    silenceTimeoutRef.current = window.setTimeout(() => {
      stopOscillator();
      stablePitchRef.current = null;
      silenceTimeoutRef.current = null;
    }, 500);
  } else if (!oscillatorRef.current) {
    stablePitchRef.current = null;
  }
}
```

When pitch is detected again, clear the timeout:
```
if (freq > 0 && freq < 5000) {
  // Cancel any pending silence timeout
  if (silenceTimeoutRef.current) {
    clearTimeout(silenceTimeoutRef.current);
    silenceTimeoutRef.current = null;
  }
  ...
```

