

## Plan: Fix Hero Button Overlap + White Landing Page Background

### 1. Percentage-based button positioning on hero image
Currently the buttons use a fixed `bottom-20` (5rem) position. On small screens where the image shrinks, this can cause overlap with the illustration content.

**Fix:** Change from fixed `bottom-20` to percentage-based positioning (`bottom-[15%]`) so the buttons scale proportionally with the image height.

### 2. White landing page background
Currently the page uses `bg-background` which maps to a warm cream (`hsl(0 0% 96%)`). We will override this to pure white (`bg-white`) on the landing page wrapper and the nav/hero sections, without changing the global design system.

---

### Technical Details

**File: `src/pages/Landing.tsx`**

- Line 198: Change `bg-background` to `bg-white` on the root `div`
- Line 200: Change `bg-background/95` and `bg-background/80` on the nav to `bg-white/95` and `bg-white/80`
- Line 216: Change `bg-background` on the hero section to `bg-white`
- Line 225: Change `bottom-20` to `bottom-[15%]` on the button overlay container so it scales with the image

All other sections remain unchanged. This is a landing-page-only change -- the rest of the app keeps the existing cream background.
