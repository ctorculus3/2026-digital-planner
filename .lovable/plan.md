

## Increase Timeout and Skip Slow Moderation

### Changes

**1. Edge Function: Add timeout to AI moderation call** (`supabase/functions/moderate-and-post/index.ts`)

- Add an `AbortSignal.timeout(8000)` (8 seconds) to the `fetch` call inside `callModeration` so it doesn't hang indefinitely waiting for the AI service
- The existing fail-open logic already handles this: if both moderation attempts return `null`, the post is allowed through
- This means if the AI is slow, the post skips moderation and goes straight to insert (the streak gate still filters bad actors)

**2. Client: Increase timeout from 15s to 25s** (`src/components/community/PostComposer.tsx`)

- Change the `setTimeout` in `invokeWithTimeout` from 15000 to 25000ms
- This gives the edge function enough time for: auth check + streak check + moderation attempt (8s) + retry (8s) + insert
- The retry logic in the client stays as-is for additional resilience

### Why This Works

The edge function currently waits indefinitely for the AI moderation API. By adding an 8-second timeout per attempt, the worst-case flow becomes:

```text
Attempt 1 moderation (8s timeout) -> fail
Retry moderation (8s timeout) -> fail
Fail-open: allow post -> insert
Total: ~17s
```

The 25-second client timeout comfortably covers this. Most posts will complete in 2-5 seconds when moderation responds promptly.

