## Build a Chromatic Tuner

### Overview

Create a real-time chromatic tuner that uses the device microphone to detect musical pitch and display whether the note is flat, in tune, or sharp. The UI will feature a curved gauge with colored indicator segments inspired by the reference image. It should be located underneath the metronome section on the log page.

### How Pitch Detection Works (No AI Needed)

Pitch detection is a classic digital signal processing problem solved with an algorithm called **autocorrelation**. The Web Audio API's `AnalyserNode` captures raw audio data from the microphone, and the autocorrelation algorithm finds the dominant repeating frequency. This runs entirely in the browser -- no server calls, no AI, instant response.

### UI Design (Based on Reference Image)

- **Curved gauge arc** with segments arranged in a semicircle
- Left side labeled with a flat symbol, right side with a sharp symbol
- Center triangle marker at the top
- Segments light up in color based on pitch offset:
  - Red/orange segments on the far edges (very flat/sharp)
  - Yellow segments closer to center (slightly off)
  - Green center segment when in tune
- **Detected note name** displayed large in the center (e.g., "A4", "C#5")
- **Mic button** to start/stop listening
- **"Press mic to begin tuning"** prompt when inactive

### Technical Plan

**New file: `src/components/practice-log/Tuner.tsx**`

1. **Microphone access**: Request `getUserMedia({ audio: true })` on button press
2. **Audio analysis**: Create an `AudioContext` + `AnalyserNode` to capture time-domain data
3. **Pitch detection**: Implement autocorrelation on the `Float32TimeDomainData` to find the fundamental frequency
4. **Note mapping**: Convert the detected frequency to the nearest musical note using the formula: `noteNum = 12 * log2(freq / 440) + 69`, then map to note names (C, C#, D, etc.)
5. **Cents offset**: Calculate how many cents sharp or flat the pitch is from the nearest note (-50 to +50 cents)
6. **Gauge rendering**: Use CSS/SVG to draw the semicircular gauge with ~9 segments that light up based on the cents offset
7. **Animation**: Use `requestAnimationFrame` for smooth, real-time updates
8. **Cleanup**: Stop the microphone stream and close the audio context when the component unmounts or the user stops tuning

**Edit: `src/components/practice-log/PracticeLogForm.tsx**`

- Import and place the `<Tuner />` component below the Metronome section, inside its own card with a "Tuner" label

### Component Structure

```text
Tuner Card
+--------------------------------------+
|  Tuner (label)                       |
|                                      |
|         [Curved Gauge Arc]           |
|      flat (b)    |    sharp (#)      |
|           [ Note Name: A4 ]          |
|        [ Cents offset: +5 ]          |
|                                      |
|    "Press mic to begin tuning"       |
|         [ Mic Button ]               |
+--------------------------------------+
```

### What Stays the Same

- All existing practice log features (metronome, audio recording, notes, etc.) remain untouched
- No new dependencies needed -- pure Web Audio API + React
- No backend/AI calls required