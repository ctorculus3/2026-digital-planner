

## Add Lesson PDFs to Landing Page

### What Changes

The landing page is missing mention of the Lesson PDFs feature. This update adds it to both the feature cards and the pricing checklist.

### Changes to `src/pages/Landing.tsx`

1. **Add a new feature card** to the `features` array:
   - Icon: `FolderOpen` (already imported)
   - Title: "Lesson PDFs"
   - Description: "Upload and store lesson PDFs directly in your practice log. View them anytime, anywhere — no more lost sheets."

2. **Add a new pricing checklist item** to the `pricingFeatures` array:
   - "Lesson PDF uploads with cloud storage & viewing"

3. No layout changes needed -- the grid will accommodate 9 cards (3 rows of 3 on large screens, which may look slightly uneven). Alternatively, we can keep the grid balanced by using `lg:grid-cols-3` instead of `lg:grid-cols-4` for a clean 3x3 layout, or keep `lg:grid-cols-4` and accept a partial last row.

### What Stays the Same

- All other feature cards, testimonials, hero, pricing toggle, auth section, and footer remain untouched.
- No other files are modified.
