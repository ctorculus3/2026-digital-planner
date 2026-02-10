

## Update Link Preview Branding to Practice Daily

### What This Fixes

When you share a link to your app in a text message, Slack, Discord, etc., the preview card currently shows the Lovable logo, name, and description. This plan updates it to show Practice Daily branding instead.

### What Changes

1. **Copy the Practice Daily logo** into the `public/images/` folder so it can be referenced as the Open Graph image (OG images must be publicly accessible URLs, not bundled assets).

2. **Update `index.html` meta tags**:
   - Change `<title>` to "Practice Daily"
   - Update `<meta name="description">` to "See your practice come to life"
   - Update `og:title` to "Practice Daily"
   - Update `og:description` to "See your practice come to life"
   - Update `og:image` to point to the Practice Daily logo (e.g., `/images/practice-daily-og.jpeg`)
   - Update `twitter:image` similarly
   - Remove or update `twitter:site` from `@Lovable`

### Important Notes

- Link previews are cached by most platforms. After publishing, previously shared links may still show the old Lovable branding for a while until caches expire.
- The OG image works best at around 1200x630 pixels. The uploaded logo may appear with whitespace or cropping depending on the platform. If you'd like a custom OG-optimized banner image (1200x630 with the logo centered on a styled background), that would be a good follow-up.

### Technical Details

**Files modified:**
- `index.html` -- update all meta tags
- `public/images/practice-daily-og.jpeg` -- copy of uploaded logo

