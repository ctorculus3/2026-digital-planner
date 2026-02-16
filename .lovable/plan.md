

## Fix: Metronome Won't Stop

### Root Causes

1. **Missing effect cleanup (line 94-100):** The effect that restarts the interval when BPM changes never returns a cleanup function. If React re-runs this effect for any reason, the previously created interval is only cleared if `intervalRef.current` still points to it -- but stop may have already nulled it out, leaving orphaned intervals running.

2. **Async race condition in `startMetronome`:** Because `startMetronome` is `async` (awaiting AudioContext and clave loading), the user can press stop while the function is still awaiting. The stop clears the interval and sets `isPlaying = false`, but then `startMetronome` finishes its await, creates a NEW interval, and sets `isPlaying = true` -- overriding the stop.

### Fix (single file: `Metronome.tsx`)

1. **Add a playing ref** (`isPlayingRef`) that tracks the play state synchronously (not just via React state). This lets `startMetronome` check after each `await` whether stop was pressed during the wait.

2. **Guard `startMetronome` after each await:** After `await getAudioContext()` and `await loadClave()`, check `isPlayingRef.current` -- if false, bail out immediately without creating an interval.

3. **Update `stopMetronome`** to set `isPlayingRef.current = false` so the async guard works.

4. **Add a cleanup return** to the BPM effect so it clears its own interval when the effect re-runs or the component unmounts.

### Technical Details

```text
Changes in src/components/practice-log/Metronome.tsx:

1. Add ref:
   const isPlayingRef = useRef(false);

2. In startMetronome, after each await:
   await getAudioContext();
   if (!isPlayingRef.current) return;  // user pressed stop during await
   await loadClave();
   if (!isPlayingRef.current) return;
   ... set interval ...

3. In startMetronome, set isPlayingRef.current = true BEFORE the awaits

4. In stopMetronome, set isPlayingRef.current = false

5. Add cleanup to BPM effect:
   useEffect(() => {
     if (isPlaying) {
       if (intervalRef.current) clearInterval(intervalRef.current);
       const ms = 60000 / bpm;
       intervalRef.current = window.setInterval(playClick, ms);
     }
     return () => {
       if (intervalRef.current) {
         clearInterval(intervalRef.current);
         intervalRef.current = null;
       }
     };
   }, [bpm, isPlaying, playClick]);
```

These changes are minimal and only affect the timing/lifecycle logic -- no changes to audio, UI, or any other component.

