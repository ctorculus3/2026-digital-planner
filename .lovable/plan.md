

## Fix Match Sound Audio + Button Styling

### Problem 1: No Audible Sound
Console logs prove oscillators ARE being created, but they're immediately destroyed. Here's what happens each cycle:
1. User holds a note for 500ms -- oscillator created
2. Next frame: natural pitch fluctuation exceeds 1-semitone tolerance -- else branch fires, `stopOscillator()` kills it
3. Timer resets, wait another 500ms, repeat

Each oscillator lives only ~16ms (one animation frame), far too short to hear.

### Fix: Keep oscillator alive during pitch changes
Once an oscillator is playing, only stop it when there's **silence** (no pitch detected), not when the pitch shifts. The reference tone should persist as long as the user is playing any note. When the detected note changes significantly, update the oscillator's frequency instead of destroying and recreating it.

**In the `detect()` callback:**
- When pitch is detected and an oscillator is already playing: update `oscillatorRef.current.frequency.value` to the new note instead of stopping
- Only stop the oscillator in the "no pitch detected" branch (the outer else on line 211-215)
- Remove `stopOscillator()` from the "pitch changed" inner else branch (line 208)

### Problem 2: Button styling mismatch
The mic button uses `variant="destructive"` (red) when on and `variant="default"` when off. The Match Sound button uses `variant="default"` when on and `variant="outline"` when off -- inconsistent.

### Fix: Match the mic button pattern
- On state: `variant="destructive"` (red, like mic-off)
- Off state: `variant="default"` (primary color, like mic-on)
- Make it a round icon-style button like the mic button for visual consistency

### Technical Details

**File: `src/components/practice-log/Tuner.tsx`**

**Change 1 -- Keep oscillator alive (lines 186-210):**
```
if (stablePitchRef.current && Math.abs(...) <= 1) {
  if (matchSoundEnabledRef.current && !oscillatorRef.current && ...) {
    // create oscillator (unchanged)
  }
} else {
  // REMOVE: stopOscillator();
  // KEEP: stablePitchRef.current = { midiNote, since: now };
  // ADD: if oscillator exists, update its frequency to new note
  if (oscillatorRef.current) {
    oscillatorRef.current.frequency.value = midiToFrequency(midiNote);
  }
}
```

The oscillator only stops when:
- No pitch detected (silence) -- line 213
- User disables Match Sound -- button onClick
- User stops listening -- stopListening()

**Change 2 -- Button styling (lines 334-354):**
```
<Button
  type="button"
  variant={matchSoundEnabled ? "destructive" : "default"}
  size="sm"
  className="text-xs h-7 gap-1"
  ...
>
```

**Change 3 -- Remove debug console.log (line 193)**

### What stays the same
- All pitch detection, transposition, gauge, note display unchanged
- Triangle waveform, 500ms initial threshold, 1-semitone tolerance unchanged
- Dedicated output AudioContext approach unchanged
- All cleanup/unmount logic unchanged
