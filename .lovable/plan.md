

## Use Uploaded Sound for Timer Alarm

### What changes

1. **Copy the uploaded MP3** to `public/audio/timer-alarm.mp3` (public folder is appropriate since it will be loaded at runtime via `Audio()`, not imported as an ES module).

2. **Update `src/components/practice-log/Timer.tsx`**:
   - Replace the `playBell` function (which synthesizes a tone via Web Audio API) with a simple `new Audio("/audio/timer-alarm.mp3")` playback.
   - Remove the `AudioContext` ref and all related setup/cleanup code since `Audio()` elements don't require a pre-unlocked context the same way.
   - Keep the rest of the timer logic (presets, countdown, start/stop/reset) exactly as-is.

### Technical detail

The `playBell(ctx)` function and `audioCtxRef` will be replaced with:

```typescript
function playBell() {
  const audio = new Audio("/audio/timer-alarm.mp3");
  audio.play().catch(() => {});
}
```

To ensure the audio plays reliably on mobile browsers (which block autoplay), the `AudioContext` unlock-on-gesture pattern will be kept: create/resume an `AudioContext` on Start click, then when the timer ends, call `audio.play()`. Since the user will have already interacted with the page (clicking Start), the `play()` call should succeed. If extra reliability is needed, a silent `AudioContext` resume on Start can stay as a fallback.

### Files affected
- `public/audio/timer-alarm.mp3` -- new (copied from upload)
- `src/components/practice-log/Timer.tsx` -- edited (swap synth bell for MP3 playback)

