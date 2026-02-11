

## Fix Link Preview Branding for Shared Practice Logs

### Problem

When a shared practice log link is pasted into a chat app (iMessage, Slack, Discord, etc.), the link preview shows "Lovable" branding instead of "Practice Daily." This happens because:

- Chat app crawlers fetch the raw HTML and read the `<meta>` tags
- The app is a single-page application, so every route returns the same `index.html`
- The `lovable.app` preview domain may inject its own branding

### Solution

Create a backend function called `og-share` that acts as a "landing page" for shared links. When a crawler visits the link, it gets a small HTML page with the correct Practice Daily branding and dynamic details (sharer name, date). When a real user visits, they see the same page but with a redirect to the full app.

### How It Works

```text
User pastes link in chat
        |
Chat app crawler fetches URL
        |
   /shared/:token
        |
  og-share function
        |
  Returns HTML with:
  - og:title = "Practice Daily"
  - og:description = "Practice log shared by [Name] - [Date]"
  - og:image = /images/practice-daily-og.jpeg
  - Meta refresh redirect to the SPA
```

### Changes

**1. New backend function: `supabase/functions/og-share/index.ts`**

- Accepts GET requests with the share token as a query parameter
- Looks up the share token in the database to get the sharer's name and log date
- Returns a minimal HTML page with:
  - Correct `og:title`, `og:description`, and `og:image` meta tags branded as "Practice Daily"
  - A `<meta http-equiv="refresh">` tag that redirects browsers to the SPA's `/shared/:token` route after 0 seconds
  - A simple "Redirecting..." message as fallback
- If the token is invalid/expired, returns generic Practice Daily branding with a redirect

**2. Update share link generation: `src/hooks/useSharePracticeLog.ts`**

- Change `getShareUrl()` to point to the backend function URL instead of the SPA route directly
- The new URL format: `https://{supabase-url}/functions/v1/og-share?token={share_token}`
- This ensures that when users copy the share link, it goes through the backend function first

**3. No changes to the existing SharedPracticeLog page**

- The SPA route `/shared/:token` continues to work exactly as before
- The backend function simply redirects to it after serving the OG tags

### Why This Works

Chat app crawlers (which don't run JavaScript) will see the correct Practice Daily branding in the meta tags. Real users will be instantly redirected to the full interactive shared practice log page. This approach works regardless of whether the app is on the `lovable.app` domain or a custom domain.

