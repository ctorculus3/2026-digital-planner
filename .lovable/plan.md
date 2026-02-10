

## Fix: Community Post Timeout on Longer Content

### Problem

The `moderate-and-post` function calls an AI moderation API, which can sometimes be slow (especially for longer text). When this happens, the browser request times out before the function responds, and the user sees "Failed to submit post" even though the content is perfectly fine.

### Solution

Two changes to make this more resilient:

**1. Add a timeout + retry in PostComposer** (`src/components/community/PostComposer.tsx`)

Wrap the `supabase.functions.invoke` call with an `AbortController` timeout (e.g., 15 seconds). If it times out, automatically retry once. If both attempts fail, show a "Taking longer than expected, please try again" message instead of the generic error.

**2. Show specific error messages**

When the edge function returns `moderation_rejected: true`, show the actual rejection reason from `data.error` so the user knows *why* the post was rejected rather than just seeing "Failed to submit post."

### Technical Details

**File: `src/components/community/PostComposer.tsx`**

- Create a helper that invokes the edge function with an `AbortSignal.timeout(15000)`
- On timeout (AbortError), retry once automatically
- On moderation rejection, display the specific reason from the response
- On persistent timeout, show "This is taking longer than expected. Please try again."
- No backend/edge function changes needed -- the function itself works fine; the issue is purely client-side timeout

