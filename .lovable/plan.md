

# Fix Login, Free Trial, and Subscription Flow

## Issues Found

After thorough investigation, I identified several bugs causing the subscription and authentication flow to break:

### Bug 1: Post-Checkout Return Not Handled
When a user completes Stripe checkout, they get redirected to `/?checkout=success`. However, **no code detects this URL parameter**. The app just loads normally, and the cached subscription state (which is still "inactive") is displayed -- showing the paywall again even though the user just paid.

### Bug 2: "Already Subscribed? Refresh Status" Button Has a Stale Data Bug
In the SubscriptionGate, the refresh handler checks the subscription status immediately after calling refresh, but it reads the **old value** (from before the refresh), so it always shows the error toast "No active subscription found" even when the refresh actually succeeded.

### Bug 3: Duplicate Subscription Checks on Page Load
Both the auth state listener and the session check fire simultaneously on page load, causing **two parallel calls** to the check-subscription function. This wastes API calls and could lead to race conditions.

### Bug 4: check-subscription Uses Newer API That May Fail
The `getClaims` method used in the check-subscription edge function is a newer API that may not be stable across all token types. Using `getUser` is more reliable.

---

## Fix Plan

### 1. Add Post-Checkout Handling (SubscriptionGate.tsx)

Detect the `?checkout=success` URL parameter when the component mounts. When found:
- Show a "Processing your subscription..." message instead of the paywall
- Poll the subscription status every 2 seconds (up to 5 attempts) until it becomes active
- Show a success toast when the subscription is confirmed
- Clean up the URL parameter

### 2. Fix the Stale Closure Bug (SubscriptionGate.tsx)

Remove the stale status check from `handleRefresh`. Instead, let the subscription state update naturally through React re-rendering. The component will automatically switch from the paywall to the app content when `subscription.status` becomes `'active'`.

### 3. Deduplicate Subscription Checks (AuthContext.tsx)

Restructure the initialization logic so that `onAuthStateChange` is the primary driver. The `getSession` call will only set the initial state without triggering a separate subscription check, preventing duplicate API calls.

### 4. Fix check-subscription Edge Function

Replace the `getClaims` call with the more reliable `getUser` method for token validation, consistent with how the other edge functions work.

### 5. Add Checkout Success URL Cleanup (PracticeLogCalendar.tsx)

Clean up the `?checkout=success` and `?checkout=cancelled` URL parameters after they've been processed to keep the URL tidy.

---

## Technical Details

### File Changes

**src/components/subscription/SubscriptionGate.tsx**
- Import `useEffect`, `useRef`, `useSearchParams` from react-router-dom
- Add post-checkout polling logic with a `useEffect` that:
  - Checks for `checkout=success` in URL params
  - Calls `refreshSubscription` in a retry loop (every 2 seconds, max 5 attempts)
  - Shows success toast when subscription becomes active
  - Shows a "Processing..." UI state during polling
- Fix `handleRefresh` to remove the stale closure check -- just call refresh and show a neutral "Checking..." toast, then let the UI update naturally

**src/contexts/AuthContext.tsx**
- Remove the `fetchSubscription` call from inside `onAuthStateChange` when it fires during initialization (the `getSession` path already handles it)
- Add a flag to track whether initial session has been loaded to prevent duplicate calls
- Add post-checkout refresh support: accept a `retryCount` parameter in `refreshSubscription` for polling

**supabase/functions/check-subscription/index.ts**
- Replace `getClaims` with `getUser` for token validation
- Use the service role key for the Supabase client (consistent with other edge functions)
- Keep all existing functionality (trialing status, product ID, end date)

### Flow After Fix

```text
New User Journey:
1. User signs up on /auth
2. Redirected to / (protected route)
3. SubscriptionGate shows paywall (subscription inactive)
4. User clicks "Start Free Trial"
5. Redirected to Stripe Checkout
6. Completes checkout, redirected to /?checkout=success
7. SubscriptionGate detects checkout=success
8. Shows "Processing your subscription..." spinner
9. Polls check-subscription until active
10. Success toast shown, app content appears

Returning User Journey:
1. User visits / (already has session)
2. Auth loads session, checks subscription
3. If active: shows app immediately
4. If inactive: shows paywall with refresh option
```

### Summary of Changes

| File | Change |
|------|--------|
| SubscriptionGate.tsx | Add post-checkout polling, fix stale refresh bug |
| AuthContext.tsx | Deduplicate subscription checks on init |
| check-subscription/index.ts | Replace getClaims with getUser |

