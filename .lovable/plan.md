

## Increase Animation Frame to 1100 x 768

### Problem
The current 1024x768 container is still causing text cutoff in the animated ad.

### Changes to `src/pages/Landing.tsx`

1. **Remove `max-w-5xl`** (which caps at 1024px) and replace with an explicit `max-w-[1100px]` using Tailwind's arbitrary value syntax.
2. **Update the aspect ratio** from `4 / 3` to `1100 / 768` to match the new dimensions exactly.

### Code Change (lines ~155-157)

```text
Before:  <div className="mx-auto mt-12 max-w-5xl">
           <div ... style={{ aspectRatio: '4 / 3' }}>

After:   <div className="mx-auto mt-12 max-w-[1100px]">
           <div ... style={{ aspectRatio: '1100 / 768' }}>
```

### What Stays the Same
- The iframe `src`, `sandbox`, `loading`, and class attributes
- All other landing page sections

