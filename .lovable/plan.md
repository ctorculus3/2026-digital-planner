

## Replace App Mockup with Animated Journal Preview

### What Changes

The placeholder div-based mockup under "See Your Practice Come to Life" will be replaced with an animated WebP image showing a real, filled-in practice journal. This gives visitors an authentic preview of the app experience.

### Requirements

- **You upload an animated WebP** (or GIF) of the journal via the chat. It will be saved to the project's public assets.

### Changes to `src/pages/Landing.tsx`

1. **Remove** the entire div-based mock content inside the browser chrome card (the placeholder bars, grid of day letters, skeleton lines, etc.).
2. **Replace** with an `<img>` tag pointing to the uploaded animated WebP file.
3. **Keep** the browser chrome wrapper (the dots + URL bar) around the image for a polished framing effect.
4. The image will be wrapped in an aspect-ratio container to prevent layout shift while loading.

### Rough Structure

```text
+--------------------------------------+
|  (o) (o) (o)   practicedaily.app     |   <-- browser chrome (kept)
+--------------------------------------+
|                                      |
|   [Animated WebP of filled journal]  |   <-- new image replaces divs
|                                      |
+--------------------------------------+
```

### What Stays the Same

- The "See Your Practice Come to Life" heading and subtitle
- The browser chrome wrapper styling
- All feature cards below the mockup
- Every other section on the landing page
