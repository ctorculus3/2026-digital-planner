

## Fix: Share Dialog Showing Revoke Screen First

### Problem

When you open the Share dialog, it immediately shows the "Revoke access" screen because stale `shareData` from a previous interaction is still in React state. The `fetchExistingShare` call runs after the dialog is already visible, so you briefly (or permanently, if a share exists) see the wrong screen.

### Solution

Reset `shareData` to `null` when the dialog opens, so the expiration options screen always appears first. Then the fetch determines whether to switch to the revoke view.

### Technical Details

**File: `src/hooks/useSharePracticeLog.ts`**

- In `fetchExistingShare`, add `setShareData(null)` at the very beginning (before `setIsLoading(true)`) so any stale data is cleared before the database query runs.

This is a one-line change. The flow becomes:
1. User clicks Share -- dialog opens, `shareData` is null -- expiration options screen shows
2. `fetchExistingShare` runs, clears any stale data, queries DB
3. If an active share exists in DB, `shareData` gets set -- view switches to the revoke/link screen
4. If no active share exists, `shareData` stays null -- expiration options remain visible

