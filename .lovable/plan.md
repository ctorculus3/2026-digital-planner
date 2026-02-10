

## Brand the Shared Practice Log Page with Practice Daily Logo

Replace the text-only header and footer on the shared practice log page with the Practice Daily brand logo.

### What Changes

1. **Copy the logo image** into `src/assets/practice-daily-logo.png` so it can be imported in React components.

2. **`src/pages/SharedPracticeLog.tsx`** -- two targeted edits:
   - **Header (lines 220-232)**: Replace the text "Music Practice Daily Record Journal" with the Practice Daily logo image, centered, at a reasonable size (around 160-200px wide). Keep the "Shared by" name and date display below it.
   - **Footer (lines 477-481)**: Replace the text "Music Practice Daily Record Journal" with a smaller version of the same logo (around 120px wide).

### No Other Changes

- No database or backend changes needed.
- All existing functionality (media, PDFs, recordings, etc.) remains untouched.
- Only the header and footer text are replaced with the logo image.

