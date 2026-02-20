

# Wire Up PR Outreach Webhook for Signup Events

## Overview
Update the `notify-subscriber-event` backend function to also forward signup events to the PR Outreach webhook, so new signups appear in PR Outreach automatically.

---

## What You Need First
Find the **x-webhook-secret** value from your PR Outreach dashboard. This is the secret token that authenticates requests to the webhook endpoint. Once you provide it, it will be stored securely in the backend.

---

## Changes

### 1. Add a New Secret: `PR_OUTREACH_WEBHOOK_SECRET`
Store the x-webhook-secret value securely so the backend function can use it.

### 2. Update `notify-subscriber-event` Edge Function (`supabase/functions/notify-subscriber-event/index.ts`)

After the existing n8n webhook call (line ~56-64), add a second webhook call **only for signup events** that POSTs to:

```
https://hzgwcuefaptbohxvbebi.supabase.co/functions/v1/webhook
```

With:
- Header: `x-webhook-secret` set to the stored secret
- Header: `Content-Type: application/json`  
- Body: the same payload (event, email, name, trial_start, trial_end)

This is also fire-and-forget — errors are logged but don't block the response.

### 3. No Frontend Changes
The frontend already sends signup events with all the required fields (email, name, trial_start, trial_end). No client-side changes needed.

---

## Files Modified
- `supabase/functions/notify-subscriber-event/index.ts` — add PR Outreach webhook call for signup events

## Secrets Added
- `PR_OUTREACH_WEBHOOK_SECRET` — the x-webhook-secret value from PR Outreach

