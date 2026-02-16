

## Add Transposition and Match Sound to the Tuner

### Feature 1: Transposition Buttons

Four toggle buttons (C, Bb, Eb, F) will appear above the tuner gauge. Tapping one selects that instrument key. The detected note name will be transposed accordingly so players of Bb, Eb, or F instruments see note names in their written key.

**Transposition offsets (semitones added to detected MIDI note):**
- C: 0 (concert pitch -- default)
- Bb: +2 (clarinet, trumpet, tenor sax, bass clarinet)
- Eb: +9 (alto sax, alto clarinet, baritone sax)
- F: +5 (French horn)

For example, if the tuner detects a concert Bb, a Bb instrument player will see "C" displayed.

### Feature 2: Match Sound Button

A "Match Sound" toggle button below the gauge. When active:
- The tuner tracks the detected pitch over time
- If the same note (same MIDI note number) is sustained for more than 1 second, the tuner plays back a pure sine wave at that note's exact in-tune frequency through the Web Audio API
- The sine tone plays continuously while the pitch is held, giving the player an audible reference to tune against
- If the pitch changes or signal drops, the sine tone stops
- This lets the user both see (flat/sharp gauge) and hear (reference tone) whether they are in tune

### Technical Changes

#### `src/components/practice-log/Tuner.tsx`

**New state and refs:**
- `transposition` state: `"C" | "Bb" | "Eb" | "F"` (default "C")
- `matchSoundEnabled` state: boolean toggle
- `stablePitchRef`: tracks the last detected MIDI note number and timestamp to detect 1-second sustain
- `oscillatorRef`: holds the active OscillatorNode for the reference sine tone

**Transposition logic:**
- After `frequencyToNote(freq)` computes the concert-pitch note, apply the semitone offset to get the transposed note name
- The cents and gauge remain based on the raw detected frequency (tuning accuracy is always relative to concert pitch)
- Only the displayed note name changes

**Match Sound logic:**
- In the `detect()` loop, after computing the MIDI note number, compare it with `stablePitchRef.current.note`
- If the same note for over 1 second and `matchSoundEnabled` is true:
  - Create an OscillatorNode at the exact in-tune frequency for that note (440 * 2^((midi-69)/12))
  - Connect through a GainNode with gentle fade-in to avoid clicks
  - Store in `oscillatorRef` so it can be stopped when pitch changes
- If pitch changes or signal drops, stop and disconnect the oscillator

**UI additions:**
- A row of 4 toggle buttons (C, Bb, Eb, F) using the existing ToggleGroup component, placed above the mic button
- A "Match Sound" toggle button below the gauge, styled as a small outline button that highlights when active

**Cleanup:**
- Stop oscillator on unmount and when tuner stops listening
- All existing tuner functionality (mic, gauge, note display) preserved exactly as-is

