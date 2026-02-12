

## Use Uploaded Clave Sound for Metronome

### Change

Replace the synthesized Web Audio API click with the uploaded `Clave-4.wav` file.

### Steps

1. **Copy the file** into `public/audio/Clave-4.wav` (public folder is best here since we'll load it via `fetch` into an `AudioBuffer` at runtime, not import it as an ES module).

2. **Update `src/components/practice-log/Metronome.tsx`**:
   - On first play, `fetch("/audio/Clave-4.wav")` and decode it into an `AudioBuffer` using `AudioContext.decodeAudioData`. Cache this buffer in a `useRef`.
   - Replace the current `playClick` function body (noise burst + tonal ping) with a simple `AudioBufferSourceNode` that plays the cached buffer each tick.
   - All existing functionality (BPM slider, +/- buttons, auto-check "Used Metronome Today", play/stop, cleanup) stays exactly the same.

### Result

The metronome will play the real clave sample on every beat -- a warm, authentic percussion sound instead of a synthesized click.

