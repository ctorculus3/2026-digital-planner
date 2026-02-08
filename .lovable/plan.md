

# Fix: Second Image Post "Nothing Happened"

## Root Cause Analysis

After thorough code review, there are two likely causes:

1. **Silent early return in `handleSubmit`**: When `!session || !user` evaluates to true (e.g., during a brief auth token refresh), the function returns immediately with zero feedback -- no error toast, no loading indicator, just "nothing happened." The Post button appears enabled (it only checks `canSubmit`), but clicking it silently does nothing.

2. **File input stale state**: After a successful post clears the form, the hidden file input element may not properly trigger `onChange` if the same file is re-selected in certain browsers, despite the value reset in `handleImageSelect`.

## Changes

### 1. PostComposer -- Fix silent failures and improve reliability

**File**: `src/components/community/PostComposer.tsx`

- Replace the silent `return` in `handleSubmit` with an informative toast when `session` or `user` is missing:
  ```text
  Before:  if (!canSubmit || !session || !user) return;
  After:   if (!canSubmit) return;
           if (!session || !user) {
             toast({ title: "Session expired", description: "Please refresh the page and try again.", variant: "destructive" });
             return;
           }
  ```

- Reset the file input value in the success cleanup path (belt and suspenders alongside the existing reset in `handleImageSelect`):
  ```text
  // In the success block, after clearing images:
  if (fileInputRef.current) fileInputRef.current.value = "";
  ```

- Add a key attribute to the hidden file input that changes after each successful post, forcing React to create a fresh DOM element. This eliminates any browser-level caching of the file input state:
  ```text
  const [inputKey, setInputKey] = useState(0);
  // In success cleanup:
  setInputKey(prev => prev + 1);
  // On the input element:
  <input key={inputKey} ref={fileInputRef} ... />
  ```

These are small, targeted changes that preserve all existing functionality while fixing the silent failure and stale file input issues.

## Technical Details

Only one file is modified: `src/components/community/PostComposer.tsx`. The changes are:

| Change | Lines affected | Purpose |
|--------|---------------|---------|
| Add `inputKey` state | +1 line near state declarations | Track file input resets |
| Split the early-return guard | ~5 lines replacing 1 line | Show toast on auth failure instead of silent return |
| Reset file input + bump key in success path | +2 lines in success block | Ensure fresh file input after each post |
| Add `key={inputKey}` to file input element | 1 attribute added | Force new DOM element after each post |

No database, storage, or edge function changes needed -- the backend is working correctly as confirmed by testing.

