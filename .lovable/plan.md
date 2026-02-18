

## Separate Drone Section from Tuner

### Overview
Move the Drone player out of the Tuner component into its own independent section in the practice log form, and make the drone note buttons larger and equally spaced.

### Changes

**1. `src/components/practice-log/Tuner.tsx`**
- Remove the `DronePlayer` import and the drone section at the bottom (the "Drone" label and `<DronePlayer />` component)

**2. `src/components/practice-log/DronePlayer.tsx`**
- Make buttons larger: increase height from `h-8` to `h-10` and text from `text-xs` to `text-sm`
- Use `flex-1` on each button so they stretch equally across the full width of the grid
- The grid already uses `grid-cols-4` with `gap-1.5`, which ensures equal spacing

**3. `src/components/practice-log/PracticeLogForm.tsx`**
- Import `DronePlayer`
- Add a new independent card section for "Drone" right after (or near) the Tuner section, styled the same way as other sections:
  ```
  <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
    <label className="font-display text-sm text-muted-foreground mb-1 block">Drone</label>
    <DronePlayer />
  </div>
  ```

### Result
- Tuner section contains only the tuner (mic, pitch display, match sound)
- Drone section appears as its own card with a "Drone" header
- Note buttons are larger and evenly distributed across the width
