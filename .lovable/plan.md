

# Redesign Share Badge Dialog

## What Changes

### 1. Much Larger Badge in the Dialog
The badge will be displayed at roughly 2x its current size (around 160x180px instead of 88x100px) so it's the hero of the dialog. This will be done by wrapping the `EnamelBadge` in a CSS `scale(1.8)` transform, keeping the component reusable without modifying the shelf version.

### 2. Updated Share Message Text
The share message will read exactly:
> "I earned the [10 Days] streak badge on Practice Daily! Currently on a [21]-day practice streak. Track your music practice journey at Practicedaily.app"

No `https://` prefix in the visible text. The underlying link will still work.

### 3. Remove "Preview" Style Link
The current "Practice Daily" link shows as a clickable hyperlink with `https://practicedaily.app`. Instead, the branding section will show "Practice Daily" as a large heading (not a link) and "Your Personal Practice Journal" as a tagline, with "Practicedaily.app" shown as plain text below. No clickable preview link.

### 4. Bigger Fonts Throughout
- Dialog title: bump from `text-lg` to `text-2xl`
- Streak count: bump from `text-lg` to `text-2xl`
- "Practice Daily" branding: bump from `text-xl` to `text-3xl`
- Tagline: bump from `text-sm` to `text-base`
- "Practicedaily.app" shown as `text-lg` plain text

### 5. Clarify the "Share" Button
The native Share button (using `navigator.share`) only appears on mobile devices that support it — on desktop browsers it's hidden entirely, which is expected behavior. No code change needed here, but the other buttons (Twitter/X, Facebook, Instagram, TikTok, Copy Text) all work on every device. The dialog will remain functional on desktop through those options.

## Technical Details

### File: `src/components/dashboard/ShareBadgeDialog.tsx`

**Changes:**
- Wrap `EnamelBadge` in a container with `transform: scale(1.8)` and appropriate margin to prevent overlap
- Update `shareMessage` to: `` `I earned the ${badgeConfig.label} streak badge on Practice Daily! 🔥 Currently on a ${streak}-day practice streak. Track your music practice journey at Practicedaily.app` ``
- Replace the `<a>` branding link with a plain `<p>` showing "Practice Daily" in large bold text
- Add "Practicedaily.app" as plain text below the tagline
- Increase all font sizes as described above

### File: `src/components/dashboard/BadgeShelf.tsx`
No changes needed.

