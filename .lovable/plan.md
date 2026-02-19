

# Metronome Update: Time Signatures and Accents

## Overview
Add two new controls to the metronome: a **Time Signature** selector and an **Accent** toggle with pattern options. Accented beats play the uploaded `Hi-Clave-3.wav` sound, while unaccented beats use the existing `Clave-4.wav`.

## New Audio File
- Copy `Hi-Clave-3.wav` to `public/audio/Hi-Clave-3.wav` for use as the accent sound.

## UI Changes (inside `Metronome.tsx`)

### Time Signature Selector
- A horizontally scrollable row of toggle buttons below the BPM display.
- Options: **2/4**, **3/4**, **4/4**, **5/4**, **5/8**, **6/8**, **6/8 (dotted)**, **7/8**
- The 6/8 dotted variant will be labeled "6/8." (with a dot) to distinguish it from regular 6/8.
- Default: 4/4

### Accent Toggle and Pattern Selector
- An on/off toggle for accents (default: off).
- When accents are on, a pattern selector appears if the time signature has multiple accent options.
- Simple time signatures (2/4, 3/4, 4/4) just accent beat 1 -- no pattern choice needed.
- Complex time signatures show selectable patterns:

| Time Signature | Accent Patterns |
|---|---|
| 2/4 | Beat 1 |
| 3/4 | Beat 1 |
| 4/4 | Beat 1 |
| 5/4 | 3+2, 2+3 |
| 5/8 | 3+2, 2+3 |
| 6/8 | 3+3, 2+2+2 |
| 6/8 (dotted) | 2 beats per measure (accent every dotted quarter) |
| 7/8 | 3+4, 4+3, 3+2+2, 2+2+3 |

## Playback Logic Changes

### Beat Tracking
- Add a beat counter that tracks the current position within the measure.
- On each tick, determine if the current beat is accented based on the selected pattern.

### Accent Sound
- Load `Hi-Clave-3.wav` alongside the existing `Clave-4.wav` at startup.
- On each tick:
  - If accents are **on** and the beat is an accent beat: play `Hi-Clave-3.wav`
  - Otherwise: play `Clave-4.wav` (existing behavior)

### Subdivision Handling for x/8 Time Signatures
- For 5/8, 6/8, and 7/8: each "beat" in the interval corresponds to an eighth note, so the interval is calculated as `60000 / bpm` where BPM refers to the eighth-note pulse.
- For 6/8 dotted: the BPM represents the dotted-quarter pulse (2 beats per measure), with subdivisions handled internally (3 eighth notes per dotted quarter).

## Technical Details

### Data Structure for Accent Patterns
```typescript
const TIME_SIGNATURES = {
  "2/4": { beats: 2, subdivision: 4, patterns: [[1, 0]] },
  "3/4": { beats: 3, subdivision: 4, patterns: [[1, 0, 0]] },
  "4/4": { beats: 4, subdivision: 4, patterns: [[1, 0, 0, 0]] },
  "5/4": { beats: 5, subdivision: 4, patterns: [[1, 0, 0, 1, 0], [1, 0, 1, 0, 0]] }, // 3+2, 2+3
  "5/8": { beats: 5, subdivision: 8, patterns: [[1, 0, 0, 1, 0], [1, 0, 1, 0, 0]] },
  "6/8": { beats: 6, subdivision: 8, patterns: [[1, 0, 0, 1, 0, 0], [1, 0, 1, 0, 1, 0]] }, // 3+3, 2+2+2
  "6/8.": { beats: 6, subdivision: 8, patterns: [[1, 0, 0, 1, 0, 0]] }, // dotted quarter grouping
  "7/8": { beats: 7, subdivision: 8, patterns: [[1,0,0,1,0,0,0], [1,0,0,0,1,0,0], [1,0,0,1,0,1,0], [1,0,1,0,1,0,0]] },
};
```

### State Additions
- `timeSig`: selected time signature key (default "4/4")
- `accentOn`: boolean toggle (default false)
- `accentPatternIndex`: which pattern variant is selected (default 0)
- `beatIndexRef`: ref tracking current beat position in the measure

### Modified Tick Function
```typescript
const playTick = async () => {
  const pattern = TIME_SIGNATURES[timeSig].patterns[accentPatternIndex];
  const isAccent = accentOn && pattern[beatIndexRef.current] === 1;
  // Play hi-clave for accent, regular clave otherwise
  playSound(isAccent ? hiClaveBuffer : claveBuffer);
  beatIndexRef.current = (beatIndexRef.current + 1) % pattern.length;
};
```

### Files Modified
- `src/components/practice-log/Metronome.tsx` -- all changes contained here
- `public/audio/Hi-Clave-3.wav` -- new file (copy from upload)

All existing functionality (BPM slider, start/stop, iOS audio unlock, onStart callback, cleanup) is fully preserved.
