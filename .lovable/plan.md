

## Admin Role Management UI

This plan adds an admin panel so you can promote and demote community members to/from the moderator role, all from within the Community page.

### What you'll see

- A small **shield icon button** next to the Community heading, visible only to admins
- Clicking it opens a **Role Management dialog** with two sections:
  1. **Current Moderators** -- a list showing each moderator's name with a "Remove" button
  2. **Add Moderator** -- a search field where you type a user's display name, see matching results, and click "Promote" to grant moderator access
- All changes take effect immediately, with confirmation toasts

### What changes

**1. Database: Upgrade your role and add admin policies**

- Your current `moderator` role will be upgraded to `admin` (admins automatically have all moderator powers)
- New RLS policies on `user_roles` so admins can:
  - View all user roles (needed to list current moderators)
  - Insert new roles (to promote users)
  - Delete roles (to demote users)

**2. New component: RoleManagementDialog**

- A dialog component (`src/components/community/RoleManagementDialog.tsx`) containing:
  - A list of current moderators fetched from `user_roles` joined with `profiles`
  - A search input that queries `profiles` by display name
  - Promote/demote buttons with confirmation
  - Loading and empty states

**3. Updated Community page**

- Import `useUserRole` for `isAdmin` (already available but unused)
- Show the admin shield button next to the "Community" heading when `isAdmin` is true
- Opens the `RoleManagementDialog`

### Technical details

**Database migration:**

```sql
-- Allow admins to view all user roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to assign roles
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to remove roles
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

**Data update:**

```sql
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = '2c0aef3a-2103-4e9e-b031-dcc6dfa8b9d4';
```

**New file -- `src/components/community/RoleManagementDialog.tsx`:**

- Uses `Dialog` from the existing UI library
- Fetches current moderators: queries `user_roles` where `role = 'moderator'`, then joins with `profiles` for display names
- Search input with debounce (uses existing `useDebounce` hook) to query `profiles` by `display_name` using `ilike`
- Promote action: inserts into `user_roles` with `role = 'moderator'`
- Demote action: deletes from `user_roles` matching `user_id` and `role = 'moderator'`
- Both actions use confirmation dialogs and show toast feedback
- Prevents assigning moderator to someone who already has it

**Modified file -- `src/pages/Community.tsx`:**

- Extract `isAdmin` from the existing `useUserRole()` hook (only `isModerator` is currently destructured)
- Add a shield icon button next to the "Community" heading, conditionally rendered when `isAdmin` is true
- Manages open/close state for the `RoleManagementDialog`

### Security notes

- All role changes are enforced server-side through RLS policies -- only users with the `admin` role can modify `user_roles`
- The admin check uses the `has_role()` security-definer function, avoiding RLS recursion
- Client-side visibility of the admin button is cosmetic only; unauthorized users cannot perform role changes even if they bypass the UI
- Admins cannot accidentally remove their own admin role (the UI will only manage `moderator` assignments)

