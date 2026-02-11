

## Fix: Stop Crawlers from Following the Redirect

### Root Cause

The `og-share` function uses `<meta http-equiv="refresh">` to redirect users to the app. The problem is that chat app crawlers (iMessage, Slack, Discord) **follow** this redirect because it's a standard HTML redirect mechanism. When they arrive at the `lovable.app` preview domain, that domain serves its own "Lovable" meta tags, which is what shows up in the link preview.

### Solution

Replace the `<meta http-equiv="refresh">` tag with a `<script>` redirect. Crawlers do not execute JavaScript, so they will only see the "Practice Daily" OG tags served by the function. Real users (who have JavaScript enabled) will be redirected instantly.

### Change

**`supabase/functions/og-share/index.ts`** -- one small change:

Replace this line in the HTML template:
```html
<meta http-equiv="refresh" content="0;url=${redirectUrl}" />
```

With a JavaScript redirect in the body:
```html
<script>window.location.replace("${redirectUrl}");</script>
```

This is the only change needed. The rest of the function (OG tags, image URL, database lookup) remains the same.

### Why This Works

| Visitor | Behavior |
|---------|----------|
| Chat crawler (iMessage, Slack) | Reads HTML, sees "Practice Daily" OG tags, does NOT execute JS, stops here |
| Real user in browser | JS executes instantly, redirects to the full app |

