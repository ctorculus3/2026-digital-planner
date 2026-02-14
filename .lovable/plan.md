

## Unify Remaining Journal Section Backgrounds

### What Changes

Apply the same unified `--time-section-bg` background to the four sections that were missed: **Music AI**, **Media Tools**, **Metronome**, and **Tuner**.

### Files to Change

**1. `src/components/practice-log/MusicAI.tsx`** (line 147)
- Change `bg-[#d6e8c5]` to `bg-[hsl(var(--time-section-bg))]` on the collapsed card

**2. `src/components/practice-log/MediaTools.tsx`** (line 122)
- Change `bg-[#c8ddc0]` to `bg-[hsl(var(--time-section-bg))]` on the container

**3. `src/components/practice-log/Metronome.tsx`** (line 90)
- Change `bg-muted/30` to `bg-[hsl(var(--time-section-bg))]` on the container

**4. `src/components/practice-log/Tuner.tsx`** (line 189)
- Change `bg-[#103e84]` to `bg-[hsl(var(--time-section-bg))]` on the container
- Update text colors from white/neutral-400 to foreground/muted-foreground so they remain readable on the lighter background:
  - Line 201: `text-neutral-400` to `text-muted-foreground`
  - Line 209: `text-neutral-400` to `text-muted-foreground`
  - Line 226: `text-neutral-400` to `text-muted-foreground`
  - Line 232: `text-white` to `text-foreground`
  - Line 234: `text-neutral-400` to `text-muted-foreground`
  - Line 236: `text-neutral-400` to `text-muted-foreground`
- Update the inactive segment dot color from `hsl(220, 20%, 30%)` to use a border-compatible neutral (e.g., `hsl(0, 0%, 75%)` light / will still look fine in dark mode via opacity)

### No Existing Features Affected

All changes are purely cosmetic -- background and text colors only. No logic, layout, or functionality is modified.

