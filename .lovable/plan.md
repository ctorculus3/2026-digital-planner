

## Fix Signup Webhook to Work Without a Session

### Problem

After signup, the user has no active session (email confirmation is required first), so `notifySubscriberEvent` exits early at the `if (!session) return` check and never calls the edge function.

### Solution

For the **signup event only**, skip the session requirement and call the edge function using just the anon key (which the Supabase client includes automatically). The edge function also needs to allow unauthenticated requests specifically for the "signup" event.

### Changes

#### 1. `src/lib/notifySubscriberEvent.ts` -- add unauthenticated overload

- Add a new exported function `notifySubscriberEventUnauthenticated(payload)` that calls the edge function **without** an Authorization header
- The existing `notifySubscriberEvent(session, payload)` stays unchanged for update/cancel events that have a session

#### 2. `supabase/functions/notify-subscriber-event/index.ts` -- allow signup without auth

- Change the auth check: if the event is `"signup"`, skip token validation and proceed directly to forwarding
- For `"update"` and `"cancel"` events, keep the existing auth validation
- This is safe because the signup event only sends data the user just typed into the form (email, name) and the webhook URL is secret

#### 3. `src/pages/Landing.tsx` -- use the unauthenticated helper

- Replace the `supabase.auth.getSession().then(...)` block with a direct call to `notifySubscriberEventUnauthenticated(payload)`
- Remove the unnecessary session fetch entirely

### No Existing Features Affected

- Update and cancel events continue to require authentication
- The change is minimal and only affects the signup path
