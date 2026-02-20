

# Fix Badge Share Button Issues

## Problems Identified

1. **Share icon only visible on hover** -- The share button uses `opacity-0 group-hover:opacity-100`, making it invisible on mobile and hard to discover on desktop. Fix: make it always visible on earned badges.

2. **Share button click does nothing** -- The share icon button sits inside a `relative group` wrapper, but the dialog isn't opening reliably. The issue is likely that on mobile/touch devices, `group-hover` never fires, so the button is invisible and untappable. Making it always visible fixes this.

3. **"Copy Text" only shares text with a link** -- The user wants the shared content to include the actual badge details (streak number, badge milestone), not just a landing page URL. The current `shareMessage` already includes badge info (`"I just hit a X-day practice streak and earned the Y badge"`), but the user may want more emphasis. The real issue the user is describing is that the message feels like "just a link." We'll make the copy text more descriptive and badge-focused.

## Changes

### 1. `src/components/dashboard/BadgeShelf.tsx`

- Remove `opacity-0 group-hover:opacity-100` from the share button so it's **always visible** on earned badges
- Style it as a subtle but permanently visible icon (slightly smaller, positioned at bottom-center or bottom-right of the badge)

### 2. `src/components/dashboard/ShareBadgeDialog.tsx`

- Update `shareMessage` to be more badge-focused, emphasizing the achievement:
  ```
  "I earned the [30 Days] streak badge on Practice Daily! Currently on a [X]-day practice streak. Track your music practice journey at https://practicedaily.app"
  ```
- This makes the copied text clearly about the badge achievement rather than feeling like just a link share

## Technical Details

- The share icon button's `opacity-0 group-hover:opacity-100` classes will be replaced with `opacity-70 hover:opacity-100` so it's always visible but not distracting
- The share message text will be restructured to lead with the badge achievement
- No backend changes needed

## Files Modified
- `src/components/dashboard/BadgeShelf.tsx` -- make share icon always visible
- `src/components/dashboard/ShareBadgeDialog.tsx` -- improve share message text

