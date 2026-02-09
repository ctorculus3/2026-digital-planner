

## Fix: Subscribed Users Incorrectly Seeing the Paywall

### Problem

When logging in as ctorculus@mac.com (which has an active free trial), the paywall is displayed instead of the dashboard. The backend correctly returns `subscribed: true`, so the issue is in how the frontend handles the subscription check -- particularly when switching between accounts.

### Root Cause

In `AuthContext.tsx`, the `fetchSubscription` function has no retry logic. If the single subscription check fails (network hiccup, timing issue during account switch), the status is permanently set to `inactive` and the paywall appears. The user must manually click "Refresh status" to recover.

### Changes

**1. Add retry logic to `fetchSubscription` in `src/contexts/AuthContext.tsx`**

- If `fetchSubscription` encounters an error or the `supabase.functions.invoke` call fails, automatically retry once after a 1-second delay before setting the status to `inactive`
- Add `console.warn` logging when errors occur so future issues are easier to diagnose
- This is a small, targeted change to the existing `fetchSubscription` callback -- no other code in this file changes

**2. Guard against double-subscribing in `supabase/functions/create-checkout/index.ts`**

- After looking up the Stripe customer, check if they already have an active or trialing subscription
- If they do, return a clear error message (e.g., `"You already have an active subscription"`) instead of trying to create a new checkout session that fails with a confusing error
- This prevents the "No checkout URL received" error that appears when a subscribed user is incorrectly shown the paywall and clicks "Start Free Trial"

**3. Show a friendlier error in `src/components/subscription/SubscriptionGate.tsx`**

- In the `handleSubscribe` error handler, detect the "already subscribed" error from the backend and automatically trigger a subscription status refresh instead of showing a generic error toast
- This way, if a subscribed user somehow reaches the paywall and clicks subscribe, the app self-corrects by re-checking and letting them through

### What stays the same

- The `check-subscription` edge function is unchanged (it works correctly)
- The `PlanToggle` component and plan selection logic are unchanged
- The `ManageSubscription` component is unchanged
- All existing subscription status flow, polling logic, and post-checkout handling are preserved

### Technical details

The retry in `fetchSubscription` will be a simple single retry with a 1-second delay:

```text
attempt 1 fails -> wait 1s -> attempt 2 fails -> set inactive
attempt 1 fails -> wait 1s -> attempt 2 succeeds -> set active
attempt 1 succeeds -> set active (no retry needed)
```

The active-subscription guard in `create-checkout` checks Stripe subscriptions with status `active` or `trialing` before creating a checkout session, returning HTTP 409 with a descriptive message if one exists.

