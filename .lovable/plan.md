

## Fix: Manage Button Shows Blank Screen

### The Problem

The `window.location.href` redirect navigates inside the preview iframe, but Stripe's billing portal blocks iframe embedding, resulting in a blank white page.

### The Fix

**File:** `src/components/subscription/ManageSubscription.tsx`

Open a new browser window **synchronously** at the start of the click handler (before the async fetch), then set its location once the Stripe URL is returned. This works because:
- The `window.open` call happens in the synchronous part of the click event, so browsers don't block it as a popup
- The portal opens in a new tab (outside the iframe), so Stripe's frame restrictions don't apply

```text
Before (broken):
  1. User clicks Manage
  2. Async fetch fires
  3. window.location.href = url  -->  navigates iframe  -->  blank screen

After (fixed):
  1. User clicks Manage
  2. const newWindow = window.open("", "_blank")   <-- synchronous, not blocked
  3. Async fetch fires
  4. newWindow.location.href = url                  <-- navigates the new tab
  5. If fetch fails, newWindow.close()
```

### Technical Details

In `handleManage`:
- Call `const portal = window.open("", "_blank")` immediately (synchronous, satisfies popup rules)
- After `supabase.functions.invoke("customer-portal")` resolves with a URL, set `portal.location.href = data.url`
- If there's an error, call `portal?.close()` and show the existing toast
- No other files or backend changes needed
