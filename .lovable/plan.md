

## Use Uploaded Image as App Preview on Landing Page

### What Changes

Replace the div-based placeholder mockup in the "See Your Practice Come to Life" section with the uploaded screenshot image. This serves as a temporary preview until an animated WebP is ready.

### Steps

1. **Copy the image** to `public/images/practice-daily-preview.png` (public folder since it's a large marketing asset that doesn't benefit from bundling).

2. **Edit `src/pages/Landing.tsx`**: Remove the mock content divs inside the browser chrome card (the placeholder bars, day-letter grid, skeleton lines, and two mini-cards) and replace with a single `<img>` tag pointing to `/images/practice-daily-preview.png`.

3. **Remove the browser chrome wrapper** entirely -- the uploaded image already shows device frames and context, so wrapping it in a fake browser bar would look redundant. Instead, display the image cleanly with rounded corners and subtle shadow.

### Technical Detail

```text
Before:
  <div className="rounded-xl border ...">
    <div> (browser chrome dots + URL bar) </div>
    <div> (skeleton placeholder divs) </div>
  </div>

After:
  <img
    src="/images/practice-daily-preview.png"
    alt="Practice Daily app showing dashboard and journal views"
    className="rounded-xl shadow-lg w-full"
    loading="lazy"
  />
```

### What Stays the Same

- Section heading "See Your Practice Come to Life" and subtitle
- All feature cards below the preview
- Every other section on the landing page
- This image can later be swapped for an animated WebP with no structural changes
