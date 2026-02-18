

## SEO Improvements: Dynamic Titles, Structured Data, and Sitemap

### 1. Dynamic Per-Page Titles

Add a small `useEffect` in each page component to set `document.title` (no extra library needed). This gives each route its own browser tab title and improves SEO signals.

| Route | Title |
|-------|-------|
| `/auth` (Landing) | Practice Daily -- See Your Practice Come to Life |
| `/dashboard` | Dashboard -- Practice Daily |
| `/journal` | Practice Journal -- Practice Daily |
| `/community` | Community -- Practice Daily |
| `/staff-paper` | Staff Paper -- Practice Daily |
| `/privacy` | Privacy Policy -- Practice Daily |
| `/terms` | Terms of Service -- Practice Daily |
| `/shared/:token` | Shared Practice Log -- Practice Daily |

Files to edit: `Landing.tsx`, `Dashboard.tsx`, `Index.tsx`, `Community.tsx`, `StaffPaper.tsx`, `Privacy.tsx`, `Terms.tsx`, `SharedPracticeLog.tsx`

Each gets a one-line `useEffect`:
```typescript
useEffect(() => { document.title = "Dashboard — Practice Daily"; }, []);
```

### 2. JSON-LD Structured Data on Landing Page

Add a `SoftwareApplication` JSON-LD script tag to `Landing.tsx` via a `useEffect`. This helps search engines display rich snippets.

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Practice Daily",
  "applicationCategory": "MusicApplication",
  "operatingSystem": "Web",
  "description": "A daily practice journal for musicians...",
  "offers": {
    "@type": "Offer",
    "price": "3.99",
    "priceCurrency": "USD",
    "billingIncrement": "P1M"
  }
}
```

### 3. Sitemap

Create `public/sitemap.xml` listing all public routes, and update `public/robots.txt` to reference it.

Public routes to include:
- `/` (redirects to `/dashboard`, but crawlers see `/auth`)
- `/auth`
- `/privacy`
- `/terms`

Update `robots.txt` to add:
```
Sitemap: https://daydream-calendar-2026.lovable.app/sitemap.xml
```

### Technical Notes

- No new dependencies needed -- `document.title` and injected `<script>` tags are pure DOM.
- JSON-LD is injected/removed via `useEffect` cleanup to avoid duplicates during SPA navigation.
- The sitemap uses the published URL as the base.
- All changes are additive and won't affect existing functionality.
