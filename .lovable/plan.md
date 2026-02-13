

## Fix OAuth "redirect_uri is not allowed" Error

### Problem

The Google and Apple sign-in buttons pass `redirect_uri: window.location.origin + "?from=oauth"` to the Lovable Cloud OAuth system. Even though the base published URL is listed as allowed, the `?from=oauth` query parameter makes the full URI not match exactly, causing the "redirect_uri is not allowed" error.

### Solution

Remove the `?from=oauth` query parameter from the redirect URI in both the Google and Apple sign-in calls. The AuthContext already detects OAuth returns via `access_token` and `code=` in the URL (which the auth system adds automatically), so the `?from=oauth` hint is redundant.

### Technical Details

**File:** `src/pages/Landing.tsx`

Two changes:

1. **Google sign-in** (around line 127): Change `redirect_uri` from  
   `${window.location.origin}?from=oauth` to `${window.location.origin}`

2. **Apple sign-in** (around line 247): Same change -- remove `?from=oauth`

No other files need to change. The `AuthContext.tsx` detection logic for `search.includes('from=oauth')` can stay since it's just one of several checks and doesn't cause harm.

