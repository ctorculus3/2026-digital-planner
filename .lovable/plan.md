

## Make Musicians Banner Full Width

### What changes

Remove the `max-w-3xl` constraint on the banner image so it stretches to the full width of the viewport. The banner currently sits inside a `container` div (max ~1400px), so we also need to break it out of that container using negative margins or move it above the container.

### Technical Details

**File: `src/pages/Landing.tsx`**

- Move the banner `div` **above** the `container` div (line 219) but still inside the `<section>` so it spans full viewport width
- Remove `max-w-3xl` from the image class, keep `w-full h-auto`
- Remove the `flex justify-center` wrapper since it will just be full-width
- Adjust negative bottom margin to pull the headline closer to the banner

Resulting structure:

```tsx
<section className="bg-white">
  {/* Musicians illustration banner — full width */}
  <div className="w-full -mb-4 md:-mb-8">
    <img
      src={musiciansBanner}
      alt="Illustrated musicians playing various instruments"
      className="w-full h-auto"
      loading="eager"
    />
  </div>

  <div className="container mx-auto px-4 pt-8 pb-12 md:pt-12 md:pb-16 flex flex-col items-center gap-4 md:gap-6">
    {/* Header — headline + subtitle + CTAs */}
    ...
  </div>
</section>
```

No other files are modified.
