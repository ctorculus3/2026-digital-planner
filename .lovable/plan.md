

## Improve Metronome Sound to Be More Percussive

### Problem
The current metronome uses a single oscillator with a frequency sweep (800Hz to 400Hz), which sounds electronic/synthetic.

### Solution
Replace the single oscillator with a layered approach that produces a warmer, more natural "wood block" click:

**File: `src/components/practice-log/Metronome.tsx`**

Update the `playClick` function to use:

1. **Noise burst** -- Create a short burst of white noise using an `AudioBuffer` filled with random samples, filtered through a `BiquadFilterNode` (bandpass around 1000-2000Hz). This gives the attack a natural, non-tonal quality.
2. **Shorter, sharper envelope** -- Reduce the duration from 80ms to around 30-40ms with a steeper gain decay, making it snappier.
3. **Optional tonal layer** -- A very brief high-frequency ping (1200Hz) at low volume that decays in ~15ms to add a slight "tap" character without sounding electronic.

The result will sound closer to a wooden click or rimshot rather than an electronic beep.

### Technical Detail

```text
Current:  Single oscillator 800->400Hz over 80ms (sounds like a synth boop)
Proposed: White noise burst (bandpass filtered) + brief tonal ping, both ~30ms
```

Only the `playClick` function body changes. No other files affected. All existing functionality (BPM control, auto-check, play/stop) remains untouched.

