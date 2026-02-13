

## Fix Google Sign-In Redirecting Back to Landing Page

### Problem

After completing Google sign-in, the user lands back on the app but the session hasn't been established yet. The AuthContext tries to detect OAuth returns by checking for URL parameters like `access_token` or `code=`, but the Lovable Cloud OAuth system may not include these for Google. Without detection, loading finishes immediately, the app sees no user, and redirects to the landing page. Apple works because its flow has different timing or URL parameters.

### Solution

Use a `sessionStorage` flag to reliably detect OAuth returns regardless of URL parameters.

### Technical Details

**File: `src/pages/Landing.tsx`**

Before calling `lovable.auth.signInWithOAuth` for both Google and Apple, store a flag:

```typescript
sessionStorage.setItem("oauth_in_progress", "true");
```

**File: `src/contexts/AuthContext.tsx`**

Add the sessionStorage flag to the `isAuthRedirect` detection (around line 103):

```typescript
const isAuthRedirect =
  hash.includes('access_token') ||
  hash.includes('refresh_token') ||
  search.includes('code=') ||
  search.includes('from=oauth') ||
  hash.includes('type=signup') ||
  hash.includes('type=recovery') ||
  sessionStorage.getItem('oauth_in_progress') === 'true';
```

Then clear the flag once a session is successfully established (inside the `onAuthStateChange` callback, after setting the user):

```typescript
if (newSession) {
  sessionStorage.removeItem('oauth_in_progress');
}
```

Also clear it in the fallback timeout to prevent it from persisting on failed attempts.

This ensures the app keeps `loading=true` long enough for the OAuth session to be processed, without relying on URL parameters.

