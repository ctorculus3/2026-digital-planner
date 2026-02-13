

## Fix: OAuth Redirect Loop for Apple (and Google)

### Root Cause

The current `isAuthRedirect` detection in `AuthContext.tsx` looks for URL hash fragments like `#access_token` or query params like `?code=`. However, Lovable Cloud OAuth works differently:

1. User clicks "Continue with Apple/Google"
2. Browser goes to the OAuth provider
3. Provider redirects to Lovable's `/~oauth` handler
4. `/~oauth` processes the tokens and redirects to `redirect_uri`
5. The app loads at `redirect_uri` with **no auth-related URL params**

Because there are no hash fragments, `isAuthRedirect` is `false`, so `AuthContext` doesn't hold the `loading` state long enough for the session to be retrieved. The `ProtectedRoute` sees `loading=false` + `user=null` and kicks the user back to `/auth` (the landing page).

### Solution

Add a `?from=oauth` query parameter to the `redirect_uri` in both the Google and Apple sign-in handlers. Then update `AuthContext.tsx` to recognize this as an auth redirect, keeping `loading=true` until the session is confirmed.

### Changes

**`src/pages/Landing.tsx`** (2 changes)
- Google sign-in handler (line 156): Change `redirect_uri` from `window.location.origin` to `` `${window.location.origin}?from=oauth` ``
- Apple sign-in handler (line 425): Change `redirect_uri` from `window.location.origin` to `` `${window.location.origin}?from=oauth` ``

**`src/contexts/AuthContext.tsx`** (1 change)
- Add `search.includes('from=oauth')` to the `isAuthRedirect` condition (line 103-108)

### Why This Works

When the user returns from Apple/Google OAuth, the URL will be `https://yourapp.com?from=oauth`. The `AuthContext` will detect this, keep `loading=true` for up to 8 seconds, and wait for `getSession()` or `onAuthStateChange` to establish the session before any routing decisions are made.

