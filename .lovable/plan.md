

## Pull Headline As Tight As Possible to Banner

### What changes

Increase the negative bottom margin on the banner to the maximum safe value that won't cause the headline text to overlap the illustration on any screen size. Since the banner image scales proportionally (`w-full h-auto`), it shrinks on smaller screens -- so the negative margin also needs to scale proportionally. Using viewport-width units (`vw`) instead of fixed `rem` values ensures the overlap stays consistent across all breakpoints.

### Technical Details

**File: `src/pages/Landing.tsx`**

1. **Line 220** -- Replace the Tailwind negative-margin classes with an inline `style` using viewport-relative units:
   - Change: `className="w-full -mb-8 md:-mb-16"`
   - To: `className="w-full" style={{ marginBottom: '-3vw' }}`

   Using `-3vw` means the margin scales with the viewport width, just like the image does. On a 1440px screen this is ~43px; on a 375px phone it's ~11px. This keeps the headline close without ever overlapping the illustration, regardless of screen size.

2. **Line 229** -- No change needed; top padding is already `pt-0`.

Only the margin value on one `div` changes. No layout, alignment, or responsive behavior is affected.

