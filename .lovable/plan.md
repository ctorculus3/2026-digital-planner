

# Add Instagram and TikTok to Badge Sharing

## Updated Plan

Building on the previously approved sharing plan, add **Instagram** and **TikTok** as sharing options alongside Twitter/X, Facebook, Copy Text, and native Share.

## How Instagram and TikTok Sharing Works

Neither Instagram nor TikTok have simple web-based "share intent" URLs like Twitter or Facebook. Here's the practical approach:

- **Instagram**: Open the user's Instagram profile creation flow via `https://www.instagram.com/`. Since Instagram doesn't support pre-filled text links, the share button will first copy the share message to the clipboard, then open Instagram — with a toast telling the user to paste their message.
- **TikTok**: Same approach — copy to clipboard, then open `https://www.tiktok.com/`. A toast notifies the user the text is copied and ready to paste.

This is the standard pattern used by most apps for Instagram/TikTok sharing since those platforms don't offer URL-based share intents.

## Changes to the Plan

### `src/components/dashboard/ShareBadgeDialog.tsx` (new file)

Add two additional share buttons to the dialog:

- **Instagram button**: Copies share text to clipboard, shows a toast ("Text copied! Paste it on Instagram"), then opens `https://www.instagram.com/` in a new tab
- **TikTok button**: Copies share text to clipboard, shows a toast ("Text copied! Paste it on TikTok"), then opens `https://www.tiktok.com/` in a new tab

The button order in the dialog will be:
1. Twitter/X
2. Facebook
3. Instagram
4. TikTok
5. Copy Text (for SMS/texting)
6. Share (native, mobile only)

### All Other Files

No additional changes beyond the original plan — `BadgeShelf.tsx` and `Dashboard.tsx` updates remain the same.

## Files to Create/Modify
- `src/components/dashboard/ShareBadgeDialog.tsx` — new file with all 6 share options
- `src/components/dashboard/BadgeShelf.tsx` — export components, add share icon on earned badges
- `src/pages/Dashboard.tsx` — pass streak to BadgeShelf

