

# Add "Forgot Your Password?" to the Sign-In Form

## Overview
Add a password reset flow so users can recover their accounts. This involves three changes:

1. A "Forgot your password?" link on the sign-in form
2. A forgot-password state in the Landing page that sends a reset email
3. A new `/reset-password` page where users set their new password

---

## 1. Landing Page — Forgot Password Link and Flow (`src/pages/Landing.tsx`)

- Add a new state variable `forgotPassword` (boolean, default false)
- Below the password field (line ~493), show a "Forgot your password?" button that only appears when `isLogin` is true — clicking it sets `forgotPassword = true`
- When `forgotPassword` is true, the auth card changes to show:
  - A title like "Reset Your Password"
  - Just the email field (no password field)
  - A "Send Reset Link" button that calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
  - A "Back to Sign In" link to return to the normal login form
- Show a toast confirming the reset email was sent

## 2. New Reset Password Page (`src/pages/ResetPassword.tsx`)

- Detects the `type=recovery` token in the URL hash (Supabase appends this automatically)
- Shows a simple form with "New Password" and "Confirm Password" fields
- Calls `supabase.auth.updateUser({ password })` to save the new password
- On success, shows a toast and redirects to `/auth`

## 3. Route Registration (`src/App.tsx`)

- Import and add a public route for `/reset-password` pointing to the new `ResetPassword` page
- This route must NOT be behind `ProtectedRoute` or `PublicRoute` — it needs to be accessible regardless of auth state since the user arrives via an email link

---

## Files Modified
- `src/pages/Landing.tsx` — add forgot-password toggle, email-only form state, and reset email logic
- `src/pages/ResetPassword.tsx` — new page for setting a new password
- `src/App.tsx` — add `/reset-password` route

