

## Fix Match Sound: Stop Early Return from Killing the Detection Loop

### Root Cause

In the `detect()` function at line 191, there is a defensive check:

```text
if (!ctx) return;
```

This `return` exits the **entire** `detect` function. But `requestAnimationFrame(detect)` is at the very end of `detect()` (line 219). When this `return` fires, the rAF loop stops -- no more pitch detection, no more tuning, nothing. The tuner silently dies.

This happens when:
1. Match Sound is enabled (`matchSoundEnabledRef.current` is true)
2. A note is sustained for 500ms (passes the timing check)
3. `outputCtxRef.current` is null for any reason (e.g., timing edge case, or context was closed)

Even if it only happens once, the entire tuner freezes.

### Fix

Restructure the oscillator creation block so that failing to create sound **never** aborts the detection loop. Replace the early `return` with a simple conditional wrapper -- if there's no output context, skip oscillator creation but keep detecting.

### Technical Changes

**File: `src/components/practice-log/Tuner.tsx`**

**Lines 188-205** -- Wrap oscillator creation in a null check instead of returning:

Before:
```text
if (matchSoundEnabledRef.current && !oscillatorRef.current && (now - stablePitchRef.current.since > 500)) {
  const ctx = outputCtxRef.current;
  if (!ctx) return;          // <-- KILLS THE LOOP
  if (ctx.state === 'suspended') ctx.resume();
  // ... oscillator creation
}
```

After:
```text
if (matchSoundEnabledRef.current && !oscillatorRef.current && (now - stablePitchRef.current.since > 500)) {
  const ctx = outputCtxRef.current;
  if (ctx) {                 // <-- Safe: skip if no ctx, but don't return
    if (ctx.state === 'suspended') ctx.resume();
    // ... oscillator creation (unchanged)
  }
}
```

This is the only code change needed. Everything else (pitch detection, transposition, gauge, button styling, cleanup) stays exactly the same.

### Why previous fixes didn't work

Every previous attempt fixed real issues (separate AudioContext, volume, frequency updates) but this silent loop-killer was present the entire time. The tuner would detect a pitch, try to play sound, hit the `return`, and the whole component would freeze -- no sound, no further detection.

