

## Add "Change Display Name" to User Menu

### What This Does

Adds a new "Change name" option to your avatar dropdown menu on the Dashboard. Clicking it opens a small inline editor right in the menu where you can type a new name and save it -- no separate page needed.

### How It Works

1. Click your avatar/name in the top-right corner
2. Select "Change name" from the dropdown
3. A text input appears in the menu with your current name pre-filled
4. Type your new name and click Save (or press Enter)
5. Your name updates immediately everywhere it appears

### Technical Details

**File modified:** `src/components/practice-log/UserMenu.tsx`

- Add an `editing` state toggle
- When "Change name" is clicked, swap the menu item for a small inline form (input + Save/Cancel buttons)
- On save, update the `profiles` table `display_name` column via the existing Supabase client
- Update local `displayName` state so the change reflects immediately in the trigger button
- Use `e.preventDefault()` on the menu item's `onSelect` to keep the dropdown open during editing
- Validate that the name is not empty/whitespace before saving
- Show a toast on success or failure

No database changes needed -- the `profiles` table already has a `display_name` column and an RLS policy allowing users to update their own profile.

