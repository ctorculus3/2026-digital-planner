

## Fix: Content-Type Override and OG Image Issues

### Problem 1: Content-Type being overridden to `text/plain`

The backend gateway is overriding the `Content-Type: text/html` header set by the function. When crawlers receive `text/plain`, they don't parse the HTML for OG meta tags, so the link preview falls back to whatever the platform default is ("Lovable").

**Fix**: Add explicit `X-Content-Type-Options: nosniff` and ensure the Content-Type header is correctly prioritized. If the gateway still overrides it, we can work around it by returning a redirect response (HTTP 302) instead -- but first, we'll try a more direct fix by explicitly setting headers in a way the gateway respects.

### Problem 2: OG Image may not be accessible

The uploaded image at `community-images/og/practice-daily-og.jpeg` appears to return a blank response when fetched. The image may not have uploaded correctly, or the path may be wrong.

**Fix**: Re-upload the image to storage, and verify it's accessible at the expected URL before updating the function.

### Changes

**Step 1: Re-upload OG image to `community-images` bucket**
- Upload `public/images/practice-daily-og.jpeg` to `community-images/og/practice-daily-og.jpeg`
- Verify it's publicly accessible

**Step 2: Update `supabase/functions/og-share/index.ts`**
- Add `X-Content-Type-Options: nosniff` header to prevent content-type sniffing
- Add `Cache-Control` header so crawlers get fresh responses
- Keep the existing dynamic metadata (sharer name, date) and JS-only redirect

```typescript
return new Response(html, {
  status: 200,
  headers: {
    "Content-Type": "text/html; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  },
});
```

**Step 3: Deploy and verify**
- Deploy the og-share function
- Verify the response comes back as `text/html`
- Verify the OG image URL returns a valid image
- Generate a new share link for testing

### Why This Should Work

The combination of fixes ensures:
- Crawlers receive properly typed HTML (`text/html`) so they parse OG tags
- The OG image is accessible and displays correctly in previews
- No meta-refresh redirect means crawlers stay on this page
- Dynamic metadata (sharer name + date) is already working correctly in the function logic
