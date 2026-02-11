

## Fix: Always Show Expiration Options First

### Problem

When the Share dialog opens, the database query finds an existing active share and immediately switches to the revoke/link screen. The user never sees the expiration options screen first.

### Solution

Add a `showLinkView` state variable to `ShareButton.tsx` that controls which screen is displayed, decoupling it from whether `shareData` exists.

### Technical Details

**File: `src/components/practice-log/ShareButton.tsx`**

1. Add new state: `const [showLinkView, setShowLinkView] = useState(false);`
2. Reset `showLinkView` to `false` when dialog opens (in the `useEffect`)
3. Set `showLinkView = true` after `createShare` completes in `handleGenerateLink`
4. Change render condition from `shareData ?` to `showLinkView && shareData ?`
5. When `shareData` exists but `showLinkView` is false, show a banner in the expiration options screen: "You already have an active link" with a "View Link" button that sets `showLinkView = true`
6. After revoking, set `showLinkView = false` so it returns to the expiration options

**No other files need changes.**

### Updated Flow

1. User clicks Share - dialog opens, `showLinkView` is false - expiration options show
2. Fetch runs, finds existing share, sets `shareData`
3. A banner appears: "You already have an active link. [View Link]"
4. User can view existing link OR generate a new one
5. After generating or clicking "View Link," revoke/link screen shows
