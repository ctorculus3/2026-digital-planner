

## Update Email Verification Redirect URL

### What needs to change

In `src/contexts/AuthContext.tsx`, the `signUp` function currently sets:

```
emailRedirectTo: window.location.origin
```

This needs to be updated to:

```
emailRedirectTo: `${window.location.origin}?verified=true`
```

This way, when a user clicks the verification link in their email (even in a different browser), they'll land on the landing page with `?verified=true` in the URL, which triggers the toast: "Email verified! Please sign in to continue."

### Single-line change

**File:** `src/contexts/AuthContext.tsx`
- Line ~184: Change `emailRedirectTo: window.location.origin` to `` emailRedirectTo: `${window.location.origin}?verified=true` ``

No other files need to change -- the Landing page already has the `useEffect` that reads this parameter and shows the toast.

