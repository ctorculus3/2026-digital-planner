

## Unify Journal Section Background Colors

### What Changes

Replace the inconsistent colored backgrounds (light green on Time Tracking and Add button, dark navy on Timer) with a single, unified warm cream-beige tone that matches the journal's existing warm palette.

### Recommended Color

**Warm cream-beige**: `hsl(40, 30%, 93%)` for light mode, `hsl(40, 10%, 18%)` for dark mode.

This complements the existing teal header and coral accents without drawing too much attention -- professional, clean, and consistent with the notebook aesthetic.

### Files to Change

**1. `src/index.css`** -- Update the `--time-section-bg` variable to the new unified color:
- Light mode: `--time-section-bg: 40 30% 93%`
- Dark mode: `--time-section-bg: 40 10% 18%`

**2. `src/components/practice-log/PracticeLogForm.tsx`** -- 3 targeted edits:
- Line 448: Remove the hardcoded `bg-[#e4f2e3]`, keep only `bg-[hsl(var(--time-section-bg))]`
- Line 514: Change the Add button's `bg-[#ebf9eb]` to `bg-[hsl(var(--time-section-bg))]`

**3. `src/components/practice-log/Timer.tsx`** -- 1 edit:
- Line ~83: Change `bg-[#103e84]` to `bg-[hsl(var(--time-section-bg))]` and update the text/input colors from white to foreground so they remain readable on the lighter background

### No Existing Features Affected

All changes are purely cosmetic -- background colors only. No logic, layout, or functionality is modified.

