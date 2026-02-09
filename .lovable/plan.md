

## Redesign Practice Time Layout

Reorganize the practice time display into its own distinct section with a centered title, separate from the streak counter.

### Changes

**`src/components/dashboard/StreakCounter.tsx`**

- Remove the practice time grid and divider from the StreakCounter component
- StreakCounter goes back to only showing the flame icon and streak count

**`src/components/dashboard/PracticeTimeSummary.tsx`** (new file)

- Create a new component that displays:
  - A centered title: "Hours of Practice" (using the app's display font)
  - A single horizontal row with all four stats: Today, This Week, This Month, Total
  - Each stat shows the label above and the `H:MM hrs` value below
  - Responsive: on mobile, the four items wrap into a 2x2 grid; on desktop they sit in one row
- Accepts `practiceTime` and `loading` props

**`src/pages/Dashboard.tsx`**

- Import and render the new `PracticeTimeSummary` component below the `StreakCounter`
- Pass `practiceTime` and `loading` to it
- Remove `practiceTime` prop from `StreakCounter` (revert it to streak-only)

### Layout Result

```text
+---------------------------------+
|  [flame] 11 day streak         |
+---------------------------------+
|      Hours of Practice          |
|  Today  This Week  This Month  Total  |
|  1:45   5:37       8:20        12:50  |
+---------------------------------+
```

### Technical Notes

- Reuses the existing `formatTime` helper and `PracticeTime` type from `useDashboardData`
- The `StreakCounter` component signature simplifies back to just `streak` and `loading` props
- No database or hook changes needed -- only UI reorganization

