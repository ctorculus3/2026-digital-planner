

## Fix: Google Sign-In Loop and Post-Verification Dead End

### Problem

Two related auth flow issues share the same root cause -- a race condition between page routing and session establishment:

1. **Google sign-in loop**: After OAuth redirect, the app tries to load `/dashboard` before the session is ready, so `ProtectedRoute` kicks the user back to `/auth`.
2. **Email verification dead-end**: After clicking the verification link, the user lands on the landing page with no indication of what to do next.

### Solution

#### 1. Add a brief grace period for OAuth/verification redirects

In `AuthContext.tsx`, detect when the page loads with OAuth or email verification tokens in the URL (hash fragments like `#access_token=...` or `?code=...`). When detected, keep `loading: true` a bit longer to give `onAuthStateChange` time to process the incoming session before routing decisions are made.

#### 2. Improve `PublicRoute` behavior

In `App.tsx`, update `PublicRoute` so that when a user arrives at `/auth` already authenticated (e.g., after email verification establishes a session), they are redirected to `/dashboard` immediately -- which then shows the subscription paywall.

#### 3. Add post-verification messaging

If the email verification redirect doesn't produce a session (e.g., the link was opened in a different browser), show a toast on the landing page telling the user "Email verified! Please sign in to continue."

### Technical Changes

**`src/contexts/AuthContext.tsx`**
- Detect auth-related URL fragments/params on initial load (e.g., `#access_token`, `?code=`)
- When detected, extend the initial `loading` state to wait for `onAuthStateChange` to fire, preventing premature routing
- Add a slightly longer fallback timeout (e.g., 8 seconds) for these cases

**`src/pages/Landing.tsx`**
- Check URL for `?verified=true` or similar indicator and show a toast saying "Email verified! Please sign in."
- This handles the edge case where verification happens in a different browser

**`src/App.tsx`**
- No structural changes needed; the existing `PublicRoute` already redirects authenticated users to `/`. The fix in `AuthContext` will ensure the session is ready before this check runs.

### Expected User Flows After Fix

**Google Sign-In:**
1. User clicks "Continue with Google"
2. Completes Google auth
3. Redirected back to site -- spinner shows briefly while session establishes
4. Automatically lands on the Free Trial paywall (or dashboard if subscribed)

**Email/Password Sign-Up:**
1. User creates account, sees "Check your email" toast
2. Clicks verification link in email
3. Redirected back to site -- session is established automatically
4. Lands on the Free Trial paywall

