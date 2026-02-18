

## Replace Hero with Uploaded Image

A simple swap: remove the entire two-column hero layout and replace it with the uploaded illustration displayed as a full-width image, with two connected buttons below it.

### Changes to `src/pages/Landing.tsx`

**1. Copy the uploaded image into the project**
- Save `user-uploads://Musicians_practice_journal_hero_section.png` to `src/assets/musicians-hero.png`

**2. Replace the hero section (lines 216-253)**

Remove the entire two-column grid (headline, subtitle, AI badge, screenshot in browser mockup, ScallopDivider) and replace with:

- The uploaded image displayed full-width inside the hero container
- Two buttons centered below the image:
  - **"Start Your Free Trial Now"** (primary) -- calls `setIsLogin(false)` then `scrollToAuth()`
  - **"Sign in"** (outline) -- calls `setIsLogin(true)` then `scrollToAuth()`
- Keep `bg-background` for a clean white background behind the image

**3. Cleanup**
- Remove the `journalScreenshot` import since it's no longer used in the hero (check if it's used elsewhere first)
- Remove the `ScallopDivider` usage from the hero if it's no longer visually appropriate with the new image
- Remove unused icon imports (`Sparkles`) if no longer referenced

### Files
- `src/assets/musicians-hero.png` -- new (copied from upload)
- `src/pages/Landing.tsx` -- hero section replaced

### Preserved
- Nav bar stays as-is
- All other sections unchanged
- Auth logic, scroll behavior, JSON-LD all preserved

