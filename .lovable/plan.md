

# Switch to the Other Uploaded Video

## Problem
The current video (`Timeline_1.mp4`) appears tinted and has large black borders (letterboxing), likely due to a non-matching aspect ratio or export settings.

## Solution
Replace it with the second uploaded file (`ScreenRecording_02-18-2026_22-49-42_1.mp4`), which is a direct screen recording and should look cleaner without tinting or black bars.

## Steps

1. Copy `user-uploads://ScreenRecording_02-18-2026_22-49-42_1.mp4` to `public/video/practice-daily-demo.mp4`, overwriting the current file.
2. No code changes needed -- the `<video>` element already points to `/video/practice-daily-demo.mp4`.

Single file swap, no code edits.

