

## Fix: Race Condition Causing Paywall Redirect After Sign-In

### Root Cause Analysis

The current retry logic added in the previous fix doesn't address the actual root cause. The problem is a **race condition between concurrent subscription checks**, not individual check failures.

Here's what happens:

1. When you sign in (or refresh the page), Supabase's `onAuthStateChange` can fire **multiple events** in quick succession (e.g., `SIGNED_IN` followed by `TOKEN_REFRESHED`, or `INITIAL_SESSION` overlapping with `getSession()`)
2. Each event triggers a separate `fetchSubscription()` call
3. These calls run concurrently -- the first one might succeed and set status to `active`, but the **second one** (arriving slightly later) could fail due to a transient timing issue
4. The second call's failure **overwrites** the first call's success, setting status back to `inactive`
5. Result: you see the paywall even though the subscription check actually succeeded once

This explains why **refreshing sometimes works** -- on refresh, the timing of events is slightly different, and you only get one call instead of two racing calls.

### The Fix

Add a **generation counter** to `fetchSubscription` so that only the **most recent** call's result is ever applied. If a newer call starts while an older one is in-flight, the older one's result is silently discarded.

```text
Call A starts (generation 1) ─── network request ─── succeeds ─── checks: am I still latest? NO (gen is now 2) ─── discarded
Call B starts (generation 2) ─── network request ─── succeeds ─── checks: am I still latest? YES ─── applied as 'active'
```

This eliminates ALL race conditions regardless of how many times `onAuthStateChange` fires.

### What Changes

**Only one file changes: `src/contexts/AuthContext.tsx`**

- Add a `fetchIdRef` (useRef) to track the latest subscription check generation
- At the start of each `fetchSubscription` call, increment the ref and capture the value as `myId`
- Before applying any result (setting subscription status), check if `myId` still matches `fetchIdRef.current`
- If it doesn't match, the call was superseded by a newer one -- discard the result silently
- Apply the same check before retrying, so stale retries are also skipped

### What Stays the Same

- The `check-subscription` edge function (working correctly)
- The `SubscriptionGate` component (including polling, refresh, and error handling)
- The `create-checkout` guard (409 for already-subscribed users)
- The `initialSessionLoaded` ref (still used to prevent redundant calls during initialization)
- All other auth flow logic (sign-in, sign-up, sign-out)
- The retry mechanism (still retries once after 1 second, but now only if the call hasn't been superseded)

### Technical Details

The generation counter pattern works like this:

```text
fetchIdRef.current starts at 0

Call from onAuthStateChange(SIGNED_IN):
  myId = ++fetchIdRef.current  (myId = 1)
  ... network request in flight ...

Call from onAuthStateChange(TOKEN_REFRESHED):  
  myId = ++fetchIdRef.current  (myId = 2)
  ... network request in flight ...

First call completes:
  myId (1) !== fetchIdRef.current (2) --> result DISCARDED

Second call completes:
  myId (2) === fetchIdRef.current (2) --> result APPLIED
```

This is a minimal, surgical change -- roughly 10 lines added/modified in a single file. No structural changes to the auth flow.
