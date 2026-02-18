

## Update Drone Section Label and Background

Two small changes to `src/components/practice-log/PracticeLogForm.tsx`:

1. **Rename label** from "Drone" to "Drone Player"
2. **Change background** of the Drone card from `bg-card` to `bg-[hsl(var(--time-section-bg))]` to match the Tuner's warm cream-beige background

### Specific edit

In the Drone section block, change:
```
<div className="bg-card rounded-lg p-3 shadow-sm border border-border">
  <label ...>Drone</label>
```
to:
```
<div className="bg-[hsl(var(--time-section-bg))] rounded-lg p-3 shadow-sm border border-border">
  <label ...>Drone Player</label>
```

No other files need changes.

