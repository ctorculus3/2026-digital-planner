

## Pull Headline Closer to Banner

### What changes

Reduce the gap between the full-width musicians banner and the "Your personal practice journal" headline by increasing the negative bottom margin on the banner and removing the top padding on the container below it.

### Technical Details

**File: `src/pages/Landing.tsx`**

1. **Line 220** -- Increase the banner's negative bottom margin from `-mb-4 md:-mb-8` to `-mb-8 md:-mb-16` so it pulls the content below upward more aggressively.

2. **Line 229** -- Remove top padding from the container: change `pt-8 pb-12 md:pt-12 md:pb-16` to `pt-0 pb-12 md:pt-0 md:pb-16`. This eliminates the extra whitespace above the headline without affecting the bottom spacing or horizontal alignment.

These are padding/margin-only changes so the flex alignment, centering, and responsive behavior remain completely intact.

