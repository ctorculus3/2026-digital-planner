
# Video + Scrolling Benefits Section

## Overview
Replace the current "See It in Action" section with a split-layout: the product demo video on one side and scrolling benefit points on the other. On mobile, it stacks vertically (video on top, benefits below).

## Layout
- **Desktop**: Two-column grid (video left, benefits right)
- **Mobile**: Single column, video stacked above benefits
- Video plays inline with controls, using a `<video>` tag with the uploaded `.mov` files
- Benefits list scrolls/animates through key selling points with check icons

## Steps

1. **Copy video file** to `public/video/practice-daily-demo.mov` (pick the best of the two uploads -- likely `PracticeDaily.mov`)
2. **Update the "See It in Action" section** in `src/pages/Landing.tsx`:
   - Replace the centered iframe layout with a `grid grid-cols-1 lg:grid-cols-2` split
   - Left column: responsive `<video>` element with controls, rounded corners, shadow
   - Right column: list of benefit points with check-mark icons, styled to match the existing design language (header-bg accent color)
3. **Benefit points** will include items like:
   - Track your daily practice sessions
   - Set goals and build streaks
   - Built-in metronome, tuner, and drone player
   - Share progress with teachers
   - AI-powered music coaching
   - Upload lesson PDFs
   - Dashboard with stats and badges

## Technical Details

- The video will be placed in `public/video/` since it's a large media file best served statically rather than bundled
- Uses a native `<video>` tag with `controls`, `playsinline`, `preload="metadata"` for performance
- The benefit points use the existing `Check` icon from lucide-react and `header-bg` color tokens
- Section heading ("See It in Action") and subtitle remain above the split layout
- Existing iframe for the animated ad HTML will be removed (replaced by the real demo video)
- Only the "See It in Action" section (lines 307-326) is modified; all other sections remain untouched
