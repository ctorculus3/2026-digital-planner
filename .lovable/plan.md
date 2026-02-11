

## New Approach: Static HTML Files in Storage

### The Real Problem

The Edge Function gateway **always** overrides `Content-Type` to `text/plain`, regardless of what headers we set. iMessage sees "Text Document" and never parses the OG tags. This is a platform limitation we cannot work around from inside the function.

### Solution: Generate Static HTML and Store It in the Public Bucket

Instead of serving dynamic HTML from an Edge Function (whose headers we can't control), we'll:

1. **When a share link is created**, generate a small static HTML file containing the OG tags
2. **Upload that HTML file** to the public `community-images` bucket (which serves files with correct MIME types)
3. **Point the share URL** at the storage file instead of the Edge Function

Storage serves files with proper `Content-Type: text/html` based on the `.html` extension -- no gateway interference.

### How It Works

```text
User creates share link
        |
        v
Hook generates static HTML with OG tags
        |
        v
Uploads to: community-images/og-shares/{token}.html
        |
        v
Share URL becomes: https://.../storage/v1/object/public/community-images/og-shares/{token}.html
        |
        v
Crawler fetches URL -> gets text/html -> reads OG tags -> shows "Practice Daily" preview
User's browser -> JS redirect -> full app at /shared/{token}
```

### Changes

**1. Update `src/hooks/useSharePracticeLog.ts`**

In the `createShare` function, after inserting the share record:
- Fetch the user's display name from the `profiles` table
- Build a small HTML string with OG meta tags and a JS redirect
- Upload it to `community-images/og-shares/{shareToken}.html`
- Update `getShareUrl()` to return the storage URL instead of the Edge Function URL

In the `revokeShare` function:
- Delete the HTML file from storage when revoking

**2. No Edge Function changes needed**

The `og-share` function can remain as a fallback but is no longer the primary share URL.

### Technical Details

The generated HTML file will look like:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Practice Daily</title>
  <meta property="og:title" content="Practice Daily" />
  <meta property="og:description" content="Practice log shared by Calvin 3 -- February 10, 2026" />
  <meta property="og:image" content="https://cbuebvuqpippyiifatkn.supabase.co/storage/v1/object/public/community-images/og/practice-daily-og.jpeg" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <!-- ... twitter tags ... -->
</head>
<body>
  <p>Redirecting...</p>
  <script>window.location.replace("https://id-preview--cd8351fe-3671-4983-92c3-c6d5206bddf5.lovable.app/shared/{token}");</script>
</body>
</html>
```

The storage CDN will serve this with `Content-Type: text/html` automatically because of the `.html` extension.

### Why This Will Work

- Public storage buckets serve files with correct MIME types based on file extension
- No gateway header override issue
- Crawlers get proper HTML with OG tags
- Users still get redirected via JS
- Dynamic content (name, date) is baked in at share-creation time

