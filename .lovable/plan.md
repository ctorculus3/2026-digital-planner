

## Replace Animation Ad with Updated Version

The user has provided an updated HTML animation file (`practice-daily-ad.html`) already designed for the 1024x768 display area. This is a straightforward file swap.

### What Changes

1. **Overwrite `public/images/practice-daily-ad.html`** with the new uploaded file. The new ad is hardcoded to 1024x768 dimensions, matching the current iframe container (`max-w-5xl` with `4:3` aspect ratio).

### What Stays the Same

- No changes to `src/pages/Landing.tsx` -- the iframe already points to `/images/practice-daily-ad.html` with the correct container size.
- All other landing page sections remain untouched.

### Technical Detail

The new ad uses a fixed `1024x768` container internally (lines 27-32) instead of viewport units, so it will render crisply within the existing iframe without any text cutoff.

