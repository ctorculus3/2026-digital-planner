

## Fix Match Sound: Make It Actually Play and Sound Softer

### Problem
The Match Sound feature never triggers because pitch detection naturally fluctuates between adjacent MIDI notes frame-by-frame. The current code resets its 1-second timer every time the detected note changes even by 1 semitone, so the threshold is never reached.

### Solution

Three targeted changes in `src/components/practice-log/Tuner.tsx`:

### Change 1: Allow pitch tolerance (plus/minus 1 semitone)
In the `detect()` callback (around line 185), change the stable pitch check from exact match to a tolerance of 1 semitone:
- Current: `stablePitchRef.current.midiNote === midiNote`
- New: `Math.abs(stablePitchRef.current.midiNote - midiNote) <= 1`

When the tone starts, it still uses the originally detected note's frequency, so the reference pitch is accurate.

### Change 2: Reduce wait time from 1000ms to 500ms
On line 187, change the sustain threshold:
- Current: `now - stablePitchRef.current.since > 1000`
- New: `now - stablePitchRef.current.since > 500`

This means the reference tone kicks in after half a second of holding a note, which feels much more responsive.

### Change 3: Use a softer waveform
On line 192, change the oscillator type for a warmer, less harsh sound:
- Current: `osc.type = "sine"`
- New: `osc.type = "triangle"`

Triangle waves have a gentler, more "relaxed" timbre compared to a pure sine.

### What stays the same
- All existing tuner features (mic, gauge, transposition, note display) are untouched
- The tone still fades in smoothly via the GainNode
- The tone still stops when pitch changes significantly or signal drops
- Cleanup on unmount is unchanged

