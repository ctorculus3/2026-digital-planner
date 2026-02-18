

## Overlay CTA Buttons on the Hero Image

Move the two buttons from below the image to on top of the image, positioned at the bottom center -- right below the "Includes Music AI Assistant" text that's baked into the illustration.

### Changes to `src/pages/Landing.tsx` (lines 217-231)

**1. Make the image container `relative`** so we can position children over it.

**2. Wrap the buttons in an absolutely positioned div** placed at the bottom center of the image, with some bottom padding so they sit just below the "Includes Music AI Assistant" line.

**3. Remove the `mt-8` spacing** since buttons will now float over the image rather than sit below it.

### Technical detail

```tsx
<div className="container mx-auto px-4 pt-8 pb-12 md:pt-12 md:pb-16 flex flex-col items-center">
  <div className="relative w-full max-w-4xl">
    <img
      src={musiciansHero}
      alt="Practice Daily — a musician's practice journal illustration"
      className="w-full h-auto"
      loading="eager"
    />
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center justify-center gap-3">
      <Button size="lg" className="font-semibold text-base px-8"
        onClick={() => { setIsLogin(false); scrollToAuth(); }}>
        Start Your Free Trial Now
      </Button>
      <Button variant="outline" size="lg" className="font-semibold text-base px-8 bg-white/90"
        onClick={() => { setIsLogin(true); scrollToAuth(); }}>
        Sign in
      </Button>
    </div>
  </div>
</div>
```

Key details:
- `relative` on the wrapper, `absolute bottom-4 left-1/2 -translate-x-1/2` on the button container to center them at the bottom of the image
- `bg-white/90` on the outline button so it stays readable over the illustration
- The `bottom-4` value can be adjusted if we need the buttons higher or lower -- easy to tweak after seeing the result

### Files
- `src/pages/Landing.tsx` -- hero section updated (lines 217-231)

### Preserved
- All button click handlers (sign-up/sign-in mode + scroll to auth)
- Nav bar, all other sections, auth logic unchanged
