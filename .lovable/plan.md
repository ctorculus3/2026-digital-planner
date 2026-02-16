

## Add Upgrade Webhook Event

### Overview

Fire an "upgrade" event to the n8n webhook when a user transitions from a trial subscription to a paid subscription. This is detected client-side in the same place where cancellation is already detected.

### How It Works

The `check-subscription` edge function already returns an `is_trialing` flag. By tracking the previous trialing state alongside the existing status ref, we can detect the moment a user goes from `active + trialing` to `active + not trialing` -- that is the upgrade moment.

### Changes

#### 1. `src/contexts/AuthContext.tsx`

- Add a `prevIsTrialingRef` (similar to the existing `prevSubStatusRef`) to track the previous trialing state
- After `fetchSubscription` resolves, check: if previous status was `active` AND `prevIsTrialing` was `true`, and new status is `active` AND `is_trialing` is `false`, fire the upgrade event
- The notify call follows the same fire-and-forget pattern as the existing cancel event

Detection logic (pseudocode):
```text
if prevStatus === 'active'
   AND prevIsTrialing === true
   AND newStatus === 'active'
   AND newIsTrialing === false
   -> fire { event: "upgrade", email: user.email }
```

#### 2. `src/lib/notifySubscriberEvent.ts`

- Add `"upgrade"` to the `event` union type in `SubscriberEventPayload`

### No Other Changes Needed

- The edge function already forwards any event type to the webhook, so no backend changes are required
- The `SubscriptionGate` polling after checkout will naturally trigger the subscription check, which will detect the trial-to-paid transition

