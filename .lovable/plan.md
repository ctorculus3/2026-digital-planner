

## Make the Animation Frame Larger

### Problem
The animated HTML ad is designed for full-screen viewing with large typography and generous padding. The current container (`max-w-3xl` with 16:9 aspect ratio) scales it down too much, causing text to be cut off.

### Changes to `src/pages/Landing.tsx`

1. **Widen the container**: Change `max-w-3xl` to `max-w-5xl` to give the iframe more horizontal space.
2. **Adjust aspect ratio**: Change from `16 / 9` to `4 / 3` to give more vertical room for the content scenes that have stacked layouts (features grid, journal mockup, benefits grid).

### Before vs After

```text
Before:  max-w-3xl, 16:9  (~768px x 432px on desktop)
After:   max-w-5xl, 4:3   (~1024px x 768px on desktop)
```

### What Stays the Same
- The iframe `src`, `sandbox`, and `loading` attributes
- The `rounded-xl shadow-lg overflow-hidden` styling
- All other sections of the landing page

