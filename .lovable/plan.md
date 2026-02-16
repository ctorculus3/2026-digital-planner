

## Fix Match Sound: Ensure Audio Actually Plays

### Root Causes

1. **AudioContext suspension** -- On mobile browsers (especially iOS Safari), the AudioContext can become suspended. The oscillator is created inside a `requestAnimationFrame` callback, which is NOT a user gesture, so the browser may block audio output. The fix is to explicitly call `ctx.resume()` before starting the oscillator.

2. **Volume too low** -- A gain of `0.15` with a `triangle` waveform is very quiet, borderline inaudible on many devices. Increase to `0.25` for a comfortable but noticeable level.

### Changes in `src/components/practice-log/Tuner.tsx`

#### Fix 1: Resume AudioContext before playing oscillator (line ~189)
Before creating and starting the oscillator, add `await`-free resume call:

```typescript
// Before: just creates oscillator
const ctx = audioCtxRef.current!;

// After: resume context first
const ctx = audioCtxRef.current!;
if (ctx.state === 'suspended') ctx.resume();
```

#### Fix 2: Increase gain volume (line ~194)
```typescript
// Before
gain.gain.setTargetAtTime(0.15, ctx.currentTime, 0.08);

// After
gain.gain.setTargetAtTime(0.25, ctx.currentTime, 0.08);
```

### What stays the same
- All pitch detection, transposition, gauge, and UI unchanged
- Triangle waveform stays (softer sound as requested)
- 500ms threshold and 1-semitone tolerance unchanged
- Cleanup/unmount logic unchanged

