

## Fix Open Graph Previews for Shared Practice Log Links

### Problem

When a shared practice log link (e.g., `https://yourapp.com/shared/abc-123`) is pasted into iMessage, Slack, or other messaging apps, no preview card appears. This is because chat crawlers don't execute JavaScript -- they just fetch the HTML and look for `<meta>` tags, but a React SPA returns a blank `<div id="root">` with no Open Graph metadata.

### Solution

Create a backend function called `og-share` that serves a small HTML page with the correct Open Graph meta tags. The share URL will route through this function first. Chat crawlers will see the metadata and render a preview card. Real browsers will be redirected to the actual app page via JavaScript.

### Flow

```text
User shares link
      |
      v
https://.../functions/v1/og-share?token=abc-123
      |
      +-- Chat crawler (no JS) --> reads OG tags --> shows preview card
      |
      +-- Real browser (JS) --> window.location.replace("/shared/abc-123")
```

### Changes

**1. New file: `supabase/functions/og-share/index.ts`**
- Accepts a `token` query parameter
- Calls `lookup_shared_practice_log` RPC to validate the token and get the sharer's name and practice log date
- Returns an HTML page containing:
  - `og:title` -- "Practice Log by [Name]"
  - `og:description` -- "Practice session on [date]"
  - `og:image` -- the static `/images/practice-daily-og.jpeg` asset
  - `og:type` -- "website"
  - Twitter card tags
- Includes a `<script>` with `window.location.replace(...)` to redirect real browsers to `/shared/[token]`
- Sets `Content-Type: text/html`, `X-Content-Type-Options: nosniff`, and `Cache-Control: no-cache` headers
- Returns a 404-style page for invalid/expired tokens

**2. Modified file: `supabase/config.toml`**
- Add `[functions.og-share]` with `verify_jwt = false` so unauthenticated crawlers can access it

**3. Modified file: `src/hooks/useSharePracticeLog.ts`**
- Update `getShareUrl()` to return the edge function URL instead of the direct app route:
  - From: `${origin}/shared/${token}`
  - To: `https://cbuebvuqpippyiifatkn.supabase.co/functions/v1/og-share?token=${token}`
  - This uses `VITE_SUPABASE_URL` from the environment

**No database changes required.** The existing `lookup_shared_practice_log` RPC already provides everything needed.

