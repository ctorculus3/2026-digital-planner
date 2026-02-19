

# Auto-Loop Video + Make It Larger

## Changes (single file: `src/pages/Landing.tsx`)

1. **Add `loop`, `autoPlay`, and `muted`** to the `<video>` tag so the demo plays continuously without user interaction (browsers require `muted` for autoplay to work).

2. **Make the video larger** by changing the grid ratio from equal 50/50 to roughly 60/40, giving the video more space:
   - Change `grid-cols-1 lg:grid-cols-2` to `grid-cols-1 lg:grid-cols-5`
   - Video column: `lg:col-span-3` (60%)
   - Benefits column: `lg:col-span-2` (40%)
   - Widen container from `max-w-6xl` to `max-w-7xl`

## Technical Detail

Update the video element (around line 324):
```tsx
<video
  src="/video/practice-daily-demo.mov"
  controls
  playsInline
  preload="metadata"
  loop
  autoPlay
  muted
  className="w-full rounded-xl shadow-lg"
  aria-label="Practice Daily product demo"
/>
```

Update the grid (around line 319):
```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
  {/* Video - 3/5 width */}
  <div className="lg:col-span-3">
    ...
  </div>
  {/* Benefits - 2/5 width */}
  <div className="lg:col-span-2 space-y-5">
    ...
  </div>
</div>
```

No other files are affected.

