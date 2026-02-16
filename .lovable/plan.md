

## Fix Metronome Sound + Tuner "Lock-On" Behavior

### Issue 1: Metronome Silent

The Metronome code has no error handling around the audio loading. If `fetch("/audio/Clave-4.wav")` or `decodeAudioData` fails for any reason, the entire `startMetronome` function silently fails -- no sound, no error message. The `loadClave` function also has a guard (`if (claveBufferRef.current) return`) that prevents retrying after a failed load.

Additionally, the `getAudioContext` helper creates a new AudioContext but never explicitly calls `resume()` as a returned promise -- iOS requires awaiting it.

**Fix:**
- Add try/catch error handling inside `loadClave` so failures are logged and retryable (reset `claveBufferRef.current` to null on failure)
- Await `audioCtxRef.current.resume()` to ensure iOS Safari actually unlocks the context
- Add a fallback oscillator click if the clave sample fails to load, so the metronome always produces some sound

### Issue 2: Tuner "Lock-On" Behavior

Currently, the Match Sound feature updates the oscillator frequency whenever the detected pitch changes. The user wants the tuner to **lock onto the first detected note** and keep playing that reference tone, ignoring mic fluctuations, until a distinctly new pitch (2+ semitones away) is introduced.

**Fix -- changes to the `detect()` function in Tuner.tsx:**
- Add a `lockedMidiNote` ref that stores the note the oscillator is currently playing
- Once the oscillator starts, set `lockedMidiNote` to the current MIDI note
- On subsequent frames, keep displaying the detected pitch visually (gauge + note name) but do NOT update the oscillator frequency unless the detected note is 2+ semitones away from the locked note
- When a new note is 2+ semitones away, stop the current oscillator, reset `lockedMidiNote`, and let the 500ms sustain timer restart for the new note
- When sound stops (no pitch detected), stop the oscillator and clear the lock

### Technical Changes

**File: `src/components/practice-log/Metronome.tsx`**

1. Wrap `loadClave` internals in try/catch; log errors; allow retry by not guarding on a failed load
2. Change `getAudioContext` to return a promise and await `resume()`
3. Add a fallback beep using an oscillator if the clave buffer is null when `playClick` runs

**File: `src/components/practice-log/Tuner.tsx`**

1. Add a new ref: `lockedMidiNoteRef = useRef<number | null>(null)`
2. When the oscillator starts (line ~196), set `lockedMidiNoteRef.current = midiNote`
3. In the "pitch changed" branch (line ~206), check if `|midiNote - lockedMidiNoteRef| >= 2`:
   - If yes: stop oscillator, clear lock, reset `stablePitchRef` for the new note
   - If no: do nothing (ignore the fluctuation, keep playing the locked tone)
4. When pitch is lost (line ~213), clear `lockedMidiNoteRef`
5. On `stopOscillator`, also clear `lockedMidiNoteRef`

