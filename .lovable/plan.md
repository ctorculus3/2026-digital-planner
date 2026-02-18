

## Replace Hero Image and Restore CTA Buttons

### What changes

**1. Replace the hero image asset**
- Copy `user-uploads://Musical_journey_practice_journal_illustration.png` to `src/assets/musicians-hero.png` (overwriting the current file)
- This new image already contains the illustration, headline, subtitle, and "Includes Music AI Assistant" line

**2. Add the original CTA buttons back inside the hero (under the image)**
- Add a "Start Your Free Trial Now" primary button and a "Sign in" outline button directly below the image
- These will use `size="lg"` with the original styling (`font-semibold text-base px-8`)
- "Start Your Free Trial Now" sets sign-up mode and scrolls to auth
- "Sign in" sets login mode and scrolls to auth

**3. Remove the current link-style buttons**
- Delete the existing `variant="link"` buttons that are currently below the image

### Technical detail

**File: `src/assets/musicians-hero.png`** -- overwritten with the new uploaded image

**File: `src/pages/Landing.tsx`** (lines 224-231) -- replace the link buttons with:

```tsx
<div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
  <Button size="lg" className="font-semibold text-base px-8" onClick={() => { setIsLogin(false); scrollToAuth(); }}>
    Start Your Free Trial Now
  </Button>
  <Button variant="outline" size="lg" className="font-semibold text-base px-8" onClick={() => { setIsLogin(true); scrollToAuth(); }}>
    Sign in
  </Button>
</div>
```

### Preserved
- Nav bar, all other sections, auth logic, scroll behavior unchanged
- Only the hero section is affected

