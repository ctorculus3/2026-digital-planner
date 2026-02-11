

## Fix Link Preview Branding for Shared Links

### Root Cause

The og-share function generates correct HTML, but two things prevent chat apps from showing the "Practice Daily" preview:

1. **OG image is unreachable**: The `og:image` URL points to the Lovable preview domain, which chat crawlers (iMessage, Slack, Discord) cannot access. Without a valid image, most chat apps fall back to domain-level metadata or show nothing useful.
2. **Missing `og:url` tag**: Crawlers use `og:url` to determine the canonical page. Without it, some crawlers display the raw function URL path ("og-share") as the title.

### Fix (single file change)

**`supabase/functions/og-share/index.ts`**

1. **Host OG image via backend storage**: Change the `og:image` URL to use the backend's public storage URL for the practice-daily-og.jpeg image, which is always accessible to crawlers. The image needs to be uploaded to a public storage bucket.

   Alternatively (simpler): use a hardcoded absolute URL to the OG image hosted on the preview domain but without the referer logic -- just always use the preview domain since that's the only domain we have. Actually, the real fix is to upload the image to backend storage where crawlers can always reach it.

   **Simplest approach**: Store the OG image in the `community-images` public bucket (already exists and is public) and reference it with the backend storage URL.

2. **Add `og:url` meta tag** pointing to the redirect destination URL so crawlers display the correct canonical URL.

3. **Remove referer-based origin detection** -- it never works for crawlers. Hardcode the preview domain for redirects (it already does this as fallback, so just simplify).

### Steps

1. Copy `public/images/practice-daily-og.jpeg` to the `community-images` storage bucket as `og/practice-daily-og.jpeg` (one-time upload via code in the edge function or manually)
2. Update `og-share/index.ts`:
   - Set `og:image` to `{SUPABASE_URL}/storage/v1/object/public/community-images/og/practice-daily-og.jpeg` (always accessible)
   - Add `<meta property="og:url" content="${redirectUrl}" />`
   - Simplify origin logic to always use the hardcoded preview domain
3. Redeploy the og-share function

### Technical Detail

The key insight is that chat app crawlers need to be able to HTTP GET the `og:image` URL. The Lovable preview domain may block or require authentication for crawler user agents. Backend storage public buckets are always accessible.

