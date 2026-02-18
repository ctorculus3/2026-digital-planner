

## Drone Section

Add a 12-note drone player below the Tuner, allowing users to tap any note to play a continuous drone tone from pre-recorded audio files.

### What will be built

A new `DronePlayer` component rendered inside the existing Tuner card (below the tuner controls). It displays a 4x3 grid of note buttons matching the PDF layout:

```text
| C  | Db | D  | Eb |
| E  | F  | F# | G  |
| Ab | A  | Bb | B  |
```

Tapping a note plays the corresponding drone MP3 on loop. Tapping it again (or tapping a different note) stops playback. Only one drone plays at a time.

### File changes

**1. Copy 12 drone audio files to `public/audio/drones/`**

Map uploaded files to consistent names:
- `Drone-C-.mp3` -> `drone-C.mp3`
- `Drone_Db.mp3` -> `drone-Db.mp3`
- `Drone-D.mp3` -> `drone-D.mp3`
- `Drone-Eb.mp3` -> `drone-Eb.mp3`
- `Drone-E.mp3` -> `drone-E.mp3`
- `Drone-F.mp3` -> `drone-F.mp3`
- `Drone-Gb.mp3` -> `drone-Gb.mp3` (used for F#)
- `Drone-G.mp3` -> `drone-G.mp3`
- `Drone-Ab.mp3` -> `drone-Ab.mp3`
- `Drone-A.mp3` -> `drone-A.mp3`
- `Drone-Bb.mp3` -> `drone-Bb.mp3`
- `Drone-B-.mp3` -> `drone-B.mp3`

**2. Create `src/components/practice-log/DronePlayer.tsx`**

- A 4-column, 3-row grid of buttons labeled C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B
- Uses a single `HTMLAudioElement` ref for playback with `loop = true`
- Active note is visually highlighted (e.g., primary/destructive variant)
- Tapping the active note stops it; tapping a different note switches immediately
- Styled consistently with the Tuner section using the same `bg-[hsl(var(--time-section-bg))]` background

**3. Update `src/components/practice-log/Tuner.tsx`**

- Import and render `<DronePlayer />` at the bottom of the Tuner component, below the note display
- Separated by a small label "Drone"

### Technical details

- Audio playback via standard `HTMLAudioElement` with `loop = true` (no Web Audio API needed for simple looped playback)
- Files served from `public/audio/drones/` so no bundling overhead
- Cleanup: stop audio on unmount via `useEffect` return
- The F# button maps to the `drone-Gb.mp3` file (enharmonic equivalent as noted by the user)

