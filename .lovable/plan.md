

## Add Musicians Illustration to Hero

### What changes

The uploaded illustration (`Never_lose_track_of_practice.png`) will be placed **above** the "Your personal practice journal" headline in the hero section, acting as a welcoming visual banner.

### Steps

1. **Copy the uploaded image** into `src/assets/` as `musicians-banner.png`
2. **Import the image** in `Landing.tsx`
3. **Add an `<img>` tag** above the Header wrapper, inside the hero flex container, with these styles:
   - `w-full max-w-3xl` to keep it reasonably sized and centered
   - `h-auto` for natural proportions
   - No border/shadow -- just the raw illustration
   - A small negative bottom margin (`-mb-4 md:-mb-8`) so the musicians slightly overlap into the headline area, similar to the effect shown in the uploaded image

### Technical Details

**File: `src/pages/Landing.tsx`**

- Add import: `import musiciansBanner from "@/assets/musicians-banner.png";`
- Insert before the Header wrapper (line 220), after the hero container opens:
  ```tsx
  {/* Musicians illustration banner */}
  <div className="w-full flex justify-center -mb-4 md:-mb-8">
    <img
      src={musiciansBanner}
      alt="Illustrated musicians playing various instruments"
      className="w-full max-w-3xl h-auto"
      loading="eager"
    />
  </div>
  ```

No other files or sections are modified.

