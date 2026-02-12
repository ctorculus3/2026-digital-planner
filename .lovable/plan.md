

## Tuner UI Redesign

### Changes to `src/components/practice-log/Tuner.tsx`

#### 1. Layout: Centered, stacked design
- Change the outer container from a horizontal `flex items-center gap-2` row to a centered vertical column layout.
- The mic button + "Tap mic" label will be grouped together (mic on top, label below).
- The circle gauge will be centered in the middle.
- The note display will remain below or beside the gauge.

#### 2. "Tap mic" text moved under the microphone button
- Move the "Tap mic" / "Listening..." text from the right-side note display area to directly beneath the mic button.
- Group the mic button and its label into a small vertical flex column.

#### 3. Replace arc segments with circles
- Replace the current SVG arc/path segments with 9 circles arranged in a horizontal row (or slight arc).
- Each circle represents a tuning segment from flat to sharp.
- Brighter, more saturated colors for better visibility:
  - Far flat: bright red `hsl(0, 100%, 60%)`
  - Flat: bright orange `hsl(25, 100%, 60%)`
  - Slightly flat: bright amber `hsl(45, 100%, 55%)`
  - Almost: bright yellow `hsl(55, 100%, 55%)`
  - In tune: bright green `hsl(140, 90%, 50%)`
  - Then mirror for sharp side
- Active circle gets full opacity + a glow/shadow effect; inactive circles are dimmed.

#### 4. Centered layout
- The entire tuner content (mic + label, circles, note display) will be centered within the blue container using `flex flex-col items-center`.

### What stays the same
- All audio logic (autoCorrelate, frequencyToNote, centsToSegmentIndex) is untouched.
- All state management, refs, start/stop listening logic preserved.
- The dark blue background `bg-[#103e84]` stays.
- The flat/sharp symbols remain at the ends of the circle row.
