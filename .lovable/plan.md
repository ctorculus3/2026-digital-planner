

## Redesign: Premium Enamel-Pin Style Streak Badges

### Overview

Replace the current simple circle-and-icon badges with rich, colorful, enamel-pin-inspired badge components built entirely with CSS. Each badge will have a distinct color palette, a hexagonal/shield shape with a gold metallic border, gradient backgrounds, and bold typography -- closely matching the reference images.

### Design Details

Each of the 4 streak badges gets a unique color scheme:

| Badge | Color Theme | Accent |
|-------|------------|--------|
| 10 Days | Teal-to-emerald gradient | Gold border, musical note icon |
| 30 Days | Coral-to-rose gradient | Gold border, star accents |
| 50 Days | Purple-to-indigo gradient | Gold border, trophy icon |
| 100 Days | Amber-to-orange gradient | Gold border, crown icon |

Visual features (all CSS, no images):
- Rounded hexagonal / shield clip-path shape
- Gold-toned border using `box-shadow` and border gradients
- Rich gradient backgrounds per badge
- Bold streak number displayed prominently (like "25" in the reference)
- Subtle inner shadow for a 3D "enamel" depth effect
- Unearned badges shown as grayscale/muted silhouettes
- Earned date shown below in small text

### Technical Changes

**File: `src/components/dashboard/BadgeShelf.tsx`**
- Replace the current grid of simple circles with new premium badge components
- Each badge rendered as a `div` with CSS clip-path for the hexagonal shape
- Use inline styles or Tailwind utilities for the per-badge gradient colors
- Keep the same data flow: `badges` prop, `earnedMap` lookup, same `BADGE_CONFIG` array
- Add the streak number (10, 30, 50, 100) as large bold text inside each badge
- Unearned state: grayscale filter + reduced opacity
- No new dependencies required -- pure CSS + Tailwind

**No other files change.** The `BadgeShelf` props interface, the `useDashboardData` hook, and the Dashboard page remain untouched.

