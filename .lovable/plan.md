

# Fix Streak Text Position in Share Badge Dialog

## Problem
From the screenshot, the "Feb 8, 2026" date text overlaps with the bottom of the scaled-up badge, and the "21-day streak" line sits too close to it. The streak section needs more spacing below the badge and proper centering.

## Changes

### `src/components/dashboard/ShareBadgeDialog.tsx`

- Increase the bottom margin on the badge container (change `my-6` to `mt-6 mb-10` or similar) to push the streak text further down and clear the scaled badge
- Ensure the streak line is centered with `justify-center` (it already has this, but verify after spacing fix)
- The "Feb 8, 2026" date appears to come from the `EnamelBadge` component's earned date display -- if it's overlapping, the extra bottom margin on the badge wrapper will resolve this

## Technical Detail

The badge uses `transform: scale(1.8)` which visually enlarges it but doesn't change its layout box size. This causes the elements below to overlap with the visual. Increasing the bottom margin on the badge container compensates for the scaled overflow.

