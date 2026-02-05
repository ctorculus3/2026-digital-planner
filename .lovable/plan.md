
# Fix: Subscription-Aware Login Flow

## Problem Summary
After signing in, users land on the paywall because navigation happens before the subscription check completes. The current code navigates when the user session is detected, but the Stripe API call to verify subscription status takes longer.

## Solution Overview
Restructure the login flow to explicitly wait for the subscription check to complete before navigating. This eliminates the race condition entirely.

## Implementation Steps

### 1. Modify Auth.tsx Login Flow
Change the login handler to:
- Call `signIn()` as before
- Instead of waiting for auth state via `useEffect`, explicitly wait for `checkSubscription()` to complete
- Only then trigger navigation

This makes the flow synchronous from the user's perspective: they click Sign In, see a loading state, and only navigate once we know their subscription status.

### 2. Remove the `justSignedIn` State Machine
The current `justSignedIn` + `useEffect` pattern is fragile because it depends on timing. Replace it with a direct, awaitable flow.

### 3. Update Navigation Logic
After the subscription check completes:
- If subscribed: navigate to `/` (journal)
- If not subscribed: navigate to `/?sub=pending` so SubscriptionGate shows the paywall immediately without another check

### 4. Simplify SubscriptionGate
Remove the redundant subscription check on mount since we've already verified status before navigation.

## Technical Details

### Changes to `src/pages/Auth.tsx`

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) throw error;

      toast({
        title: "Signed in",
        description: "Checking your subscription...",
      });

      // Wait a moment for session to propagate, then check subscription
      await new Promise(r => setTimeout(r, 500));
      
      // Explicitly check subscription and wait for result
      const isSubscribed = await checkSubscription();
      
      // Navigate based on actual subscription status
      if (isSubscribed) {
        window.location.href = "/";
      } else {
        window.location.href = "/?show_paywall=1";
      }
      return;
    } else {
      // ... signup logic unchanged
    }
  } catch (error) {
    // ... error handling unchanged
  } finally {
    setLoading(false);
  }
};
```

### Changes to `src/contexts/AuthContext.tsx`

Export `checkSubscription` so it can be called directly from Auth.tsx (already done).

Ensure `checkSubscription` returns reliably by:
- Removing the early `initialCheckDone` bailout during the actual check
- Making sure concurrent calls are properly deduplicated (already fixed)

### Changes to `src/components/subscription/SubscriptionGate.tsx`

Add handling for `?show_paywall=1` query param to skip the initial loading state when we already know the user isn't subscribed.

## Why This Approach Works

1. **No race condition**: We explicitly await the subscription check before navigating
2. **Predictable UX**: User sees "Checking your subscription..." then lands in the right place
3. **Safari compatible**: Hard navigation (`window.location.href`) works reliably
4. **Simpler code**: Removes the `justSignedIn` state machine and timing-dependent logic

## Files to Modify
- `src/pages/Auth.tsx` - Restructure login flow
- `src/components/subscription/SubscriptionGate.tsx` - Handle query param for immediate paywall
- `src/contexts/AuthContext.tsx` - Minor cleanup (optional)

## Testing Steps
1. Sign in on iPad Safari with a subscribed account - should go to journal
2. Sign in on iPad Safari with a non-subscribed account - should go to paywall
3. Refresh the page after login - should stay on correct page
4. Test "Already subscribed? Refresh status" button on paywall
