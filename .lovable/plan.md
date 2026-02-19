

# Add Media Tools Bullet to Landing Page "See It in Action" Section

## Overview
Add a new benefit bullet point to the benefits list beside the demo video, highlighting the ability to attach YouTube videos, audio, photos, and video directly to your practice log.

## Change

**File: `src/pages/Landing.tsx` (line ~338, insert after "Upload lesson PDFs")**

Add a new entry to the benefits array:

```typescript
{ title: "Attach media to your log", desc: "Embed YouTube videos, upload audio, photos, and video for reference listening — all stored with your daily entry." },
```

The final array will have 8 items instead of 7. No layout changes needed — the list will simply grow by one row.

## Files Modified
- `src/pages/Landing.tsx` — add one object to the benefits array (text-only, no logic changes)

