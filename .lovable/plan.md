

## Fix: "Manage" Subscription Button Not Opening Stripe Portal

### The Problem

The Manage button works on the backend -- it successfully fetches the Stripe billing portal URL. However, the browser blocks the new tab from opening because `window.open` is called inside an async function (after the network request completes), which breaks the browser's requirement that popups originate from a direct user gesture.

### The Fix

**File:** `src/components/subscription/ManageSubscription.tsx`

Change `window.open(data.url, "_blank")` to `window.location.href = data.url` so the browser navigates to the Stripe portal in the same tab instead of trying to open a blocked popup. The Stripe portal already has a "return URL" configured that brings the user back to the app afterward.

This is a single-line change -- no new files, no database changes, no other components affected.

