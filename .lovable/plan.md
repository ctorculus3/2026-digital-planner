

# Fix Video Playback: Switch to MP4

## Problem
The `.mov` video format has limited browser support (mainly Safari). The video isn't playing for most users.

## Solution
Replace the `.mov` file with the uploaded `.mp4` file and update the video source path in the landing page.

## Steps

1. Copy `user-uploads://Timeline_1.mp4` to `public/video/practice-daily-demo.mp4`
2. Update the `<video>` element in `src/pages/Landing.tsx` to point to `/video/practice-daily-demo.mp4` instead of `/video/practice-daily-demo.mov`

That single path change (`.mov` to `.mp4`) is the only code modification needed. All other attributes (`loop`, `autoPlay`, `muted`, `controls`, `playsInline`) remain as-is.

