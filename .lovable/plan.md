

## Fix Practice Daily Ad Display on iPhone

### Problem
The ad iframe content overflows and looks cut off on mobile devices. The iframe container uses a fixed 4:3 aspect ratio, but the ad content (designed for 100vh/100vw) doesn't scale properly inside the narrow mobile iframe. Text, emoji icons, and navigation controls overlap or get clipped.

### Solution
Two targeted changes to fix the mobile rendering:

### 1. Landing Page (`src/pages/Landing.tsx`)
- Change the iframe container to use a taller aspect ratio on mobile (e.g., 3:4 portrait) while keeping 4:3 on desktop
- Use a responsive approach: default to `aspect-ratio: 3/4` and switch to `4/3` at `md:` breakpoint
- This gives the ad content more vertical space on phones

### 2. Ad HTML (`public/images/practice-daily-ad.html`)
- Enhance the mobile media query (currently at line 601) to scale down font sizes, icons, and grid layouts for small screens
- Reduce emoji icon sizes, tighten spacing, and ensure the benefits/problem grids stack to single columns on narrow viewports
- Ensure the control buttons don't overlap content on small screens

### Files affected
- `src/pages/Landing.tsx` -- update the iframe container's aspect ratio to be responsive (portrait on mobile, landscape on desktop)
- `public/images/practice-daily-ad.html` -- expand the `@media (max-width: 480px)` block with more aggressive scaling for small-screen rendering
