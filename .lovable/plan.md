
# Fix: Auto-Navigate When Subscription Becomes True

## Root Cause

After the hard navigation to `/`, the page reloads and AuthContext reinitializes. During this initialization:

1. `subscription.subscribed` starts as `false`
2. The async subscription check runs in the background
3. If SubscriptionGate renders before the check completes, it shows the paywall
4. When the check completes and sets `subscribed: true`, SubscriptionGate re-renders and shows children
5. **However**, if the user lands on the paywall first, there's no automatic navigation away when subscription becomes true

Looking at the network logs, the subscription check IS returning `subscribed: true` - the state just isn't being reflected in the UI properly due to render timing.

## Solution

Add a `useEffect` in SubscriptionGate that watches for the subscription status to become `true` and automatically navigates to a clean URL (removing the `show_paywall=1` param). This ensures that even if the paywall briefly flashes, it will redirect to the journal once the subscription is verified.

## Implementation

### Changes to `src/components/subscription/SubscriptionGate.tsx`

Add a new effect after the existing effects:

```typescript
// Auto-navigate away from paywall when subscription becomes active
useEffect(() => {
  if (subscription.subscribed && subscription.initialCheckDone && user) {
    // If we're showing the paywall but user is subscribed, redirect to clean URL
    if (showPaywallParam) {
      // Remove the show_paywall param and go to journal
      window.location.href = "/";
    }
  }
}, [subscription.subscribed, subscription.initialCheckDone, user, showPaywallParam]);
```

This effect:
- Only runs when `subscribed` becomes true
- Only navigates if we have the `show_paywall=1` param (meaning we came from login thinking user wasn't subscribed)
- Uses hard navigation for Safari compatibility

### Why This Works

1. User signs in
2. Auth.tsx calls `checkSubscription()` which might return `true` or `false` depending on timing
3. Navigation happens to `/` or `/?show_paywall=1`
4. Page reloads, AuthContext runs its own subscription check
5. If user IS subscribed, `subscription.subscribed` becomes `true`
6. The new effect detects this and navigates to clean `/` URL
7. User lands on journal

This creates a "self-correcting" flow - even if we incorrectly land on the paywall, we automatically redirect to the journal once we know the user is subscribed.

## Files to Modify

- `src/components/subscription/SubscriptionGate.tsx` - Add auto-navigation effect

## Testing Steps

1. Sign in with a subscribed account
2. You should land on the journal (possibly with a brief flash of paywall/loading)
3. If you see the paywall, it should automatically redirect to journal within 1-2 seconds
4. Sign in with a non-subscribed account - should stay on paywall
