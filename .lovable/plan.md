
## Fix Intermittent "Failed to Post" Errors

I identified three root causes for the unreliable posting behavior, all in how the backend function and the frontend talk to each other.

### What's happening now

1. **The AI content moderator is too aggressive** -- When you post something casual like "Testing" or "Hello everyone", the AI sometimes rejects it as "off-topic" because it doesn't mention music explicitly. This is the main reason posts fail intermittently -- the same type of message might pass one time and fail the next depending on the AI's interpretation.

2. **Error messages are getting swallowed** -- When the AI does reject a post, the backend returns a special error code (422). But the frontend treats ALL non-success responses the same way, showing a generic "Failed to submit post" message instead of the actual reason (like "Off-topic content"). So you never see WHY a post was rejected.

3. **The authentication method is unreliable** -- The backend uses a method called `getClaims` to verify who you are, which is known to intermittently return empty results even with a valid login session. This can cause random "Unauthorized" failures.

### What will change

**You'll see:**
- Posts will succeed more reliably, especially casual messages and encouragement
- When a post IS rejected by moderation, you'll see the specific reason (e.g., "Contains inappropriate language") instead of a vague error
- No more random authentication failures

### The fixes (3 targeted changes)

**1. Backend function: Fix authentication and response format**
- Replace the unreliable `getClaims` with the standard `getUser` method
- Return success status (200) for ALL business-logic outcomes (moderation rejections, streak failures) with clear `success: true/false` in the response body
- Reserve error status codes only for actual server failures
- This ensures the frontend always receives and can display the specific reason

**2. Backend function: Tune the AI moderator**
- Update the moderation prompt to be more lenient with casual conversation, greetings, encouragement, and short messages
- Add a single retry when the AI service is temporarily unavailable (rate limited or down)
- If moderation still fails after retry, allow the post through rather than blocking it -- the streak requirement already filters out bad actors

**3. Frontend PostComposer: Better error display**
- Update the error handling to read the structured response instead of showing a generic message
- Show the specific moderation rejection reason when applicable
- Display streak-related messages clearly

### Technical details

**File: `supabase/functions/moderate-and-post/index.ts`**

Authentication fix (line 39-48):
```typescript
// Replace getClaims with getUser
const { data: { user }, error: userError } = await userClient.auth.getUser();
if (userError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
const userId = user.id;
```

Response format fix -- all business-logic responses return 200:
```typescript
// Streak failure: return 200 with success: false
return new Response(
  JSON.stringify({
    success: false,
    error: `You need a 10-day practice streak to post. Current streak: ${streak}`,
  }),
  { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
);

// Moderation rejection: return 200 with success: false
return new Response(
  JSON.stringify({
    success: false,
    error: modResult.reason || "Your post was not approved by our content guidelines.",
    moderation_rejected: true,
  }),
  { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
);
```

Moderation prompt update:
```
Be very lenient with: casual greetings, encouragement, questions, 
short messages, test posts, and general community chat. Only reject 
clearly harmful content. When in doubt, approve.
```

Add retry with fallback for AI moderation:
```typescript
// Retry once on transient failure
// If both attempts fail, allow the post through (streak gate provides base filtering)
```

**File: `src/components/community/PostComposer.tsx`**

Update error handling (lines 32-49):
```typescript
if (error) {
  // Try to extract message from error context
  toast({
    title: "Error",
    description: "Failed to submit post. Please try again.",
    variant: "destructive",
  });
  return;
}

// Now data always contains the structured response
if (data && !data.success) {
  toast({
    title: data.moderation_rejected ? "Post not approved" : "Cannot post",
    description: data.error || "Something went wrong.",
    variant: "destructive",
  });
  return;
}
```

### Security notes

- The streak requirement (10-day minimum) already provides strong anti-abuse filtering
- The "approve on moderation failure" fallback is safe because only committed practitioners can post
- Authentication via `getUser` makes a verified server-side call, eliminating token-parsing edge cases
- No RLS policy changes needed -- the edge function uses a service-role client for inserts
