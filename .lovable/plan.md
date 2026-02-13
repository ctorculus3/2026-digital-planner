

## Add a "What Is This?" Statement to the Landing Page

### What

Add a concise, clear statement that explains exactly what Practice Daily is -- placed prominently between the Hero section and the Features section so first-time visitors immediately understand the product.

### Proposed Copy

> **What is Practice Daily?**
> Practice Daily is a digital practice journal for musicians. It helps you plan your sessions, log what you worked on, track your progress over time, and share updates with teachers or peers -- all from one place. Think of it as a planner, notebook, and progress tracker built specifically for daily music practice.

### Where It Goes

The statement will sit as a new section between the Hero (with the scallop divider) and the existing "See Your Practice Come to Life" features section. It will be a simple, centered text block with a heading and a short paragraph -- no cards or icons, just clear communication.

### Technical Details

**File:** `src/pages/Landing.tsx`

- Insert a new `<section>` element after the Hero/ScallopDivider and before the `#features` section (around line 210)
- Simple layout: centered container with an `h2` heading ("What is Practice Daily?") and a `p` description
- Styled consistently with existing sections using `container`, `mx-auto`, `px-4`, `py-16` spacing and `text-muted-foreground` for the body text

No new files, components, or dependencies needed.

