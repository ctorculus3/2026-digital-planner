

## Add n8n Subscriber Webhook Integration

### Overview

Create a backend function that forwards subscriber lifecycle events (signup, profile update, cancellation) to an external n8n webhook. The webhook call is fire-and-forget so it never blocks the user experience.

### Secret Required

You will be asked to provide the **N8N_SUBSCRIBER_WEBHOOK_URL** secret -- this is the n8n webhook URL that will receive the event payloads.

### Changes

#### 1. New edge function: `supabase/functions/notify-subscriber-event/index.ts`

- Accepts a JSON body with fields: `event`, `email`, `name`, `trial_start`, `trial_end`, `marketing_opt_in`
- Reads `N8N_SUBSCRIBER_WEBHOOK_URL` from secrets
- POSTs the payload to that URL with `Content-Type: application/json`
- Returns success even if the n8n call fails (logs the error but responds 200)
- Uses `verify_jwt = false` in `config.toml` but validates the auth token in code (same pattern as other functions)

#### 2. Update `supabase/config.toml`

- Add `[functions.notify-subscriber-event]` with `verify_jwt = false`

#### 3. Create a helper: `src/lib/notifySubscriberEvent.ts`

A small async helper function that wraps the edge function call. It catches all errors silently (console.warn only) so callers don't need try/catch and the user flow is never interrupted.

```text
notifySubscriberEvent(session, payload) -> Promise<void>
```

#### 4. Update `src/pages/Landing.tsx` -- signup event

After a successful `signUp()` call (line ~139), fire:

```text
event: "signup"
email, name (from form fields)
trial_start: now
trial_end: now + 7 days
marketing_opt_in: false (no opt-in checkbox exists yet)
```

This call is non-blocking -- it runs in the background after the success toast.

#### 5. Update `src/components/practice-log/UserMenu.tsx` -- update event

After a successful name change (inside `handleSaveName`, line ~75), fire:

```text
event: "update"
email: user.email
name: new trimmed name
```

#### 6. Add cancel event -- two options

Cancellation happens via the Stripe Customer Portal (external), so the app doesn't directly know when it occurs. The simplest approach: fire a "cancel" event when the subscription status transitions from active/trialing to inactive.

- **In `src/contexts/AuthContext.tsx`**: After `fetchSubscription` resolves with `subscribed: false` and the previous status was `active`, call the notify function with `event: "cancel"`. This detects cancellation regardless of how it happened (portal, Stripe dashboard, trial expiry).

### Marketing Opt-In Note

There is currently no marketing opt-in checkbox in the signup form. The `marketing_opt_in` field will default to `false`. If you'd like to add an opt-in checkbox to the signup form, that can be done as a follow-up.

### No Existing Features Affected

All changes are additive. The webhook calls are fire-and-forget and will not affect auth flow, subscription checking, or any existing UI behavior.

