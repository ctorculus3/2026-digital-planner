
## Add Moderator Role to Community

This plan adds a moderator system so designated users (like you, Christopher) can delete any community post -- not just their own.

### What changes

**1. Database: Create a roles system**
- Create an `app_role` enum with values: `admin`, `moderator`, `user`
- Create a `user_roles` table linking user IDs to roles, secured with RLS
- Create a `has_role()` security-definer function to safely check roles without RLS recursion
- Update the `community_posts` DELETE policy so moderators can also delete posts
- Insert your user (`2c0aef3a-...`) as a `moderator`

**2. Frontend: Hook to check moderator status**
- Create a `useUserRole` hook that queries `user_roles` to check if the current user has the `moderator` role
- Uses the existing Supabase client; result is cached for the session

**3. Frontend: Show delete button on all posts for moderators**
- Update `PostFeed` to accept an `isModerator` flag and pass it to `PostCard`
- Update `PostCard` to show the trash icon on all posts when `isModerator` is true (not just own posts)
- Update `Community.tsx` to use the new `useUserRole` hook and pass `isModerator` down

**4. Confirmation dialog before deletion**
- Add an `AlertDialog` confirmation step before any post deletion (for both regular users and moderators)
- This prevents accidental deletions

### Technical details

**Database migration SQL:**
```sql
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Security-definer function (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update community_posts DELETE policy to allow moderators
DROP POLICY "Users can delete own posts" ON public.community_posts;
CREATE POLICY "Users and moderators can delete posts"
  ON public.community_posts FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'admin')
  );
```

**Data insert (separate step):**
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('2c0aef3a-2103-4e9e-b031-dcc6dfa8b9d4', 'moderator');
```

**New file -- `src/hooks/useUserRole.ts`:**
- Queries `user_roles` for the current user
- Returns `{ isModerator: boolean, isAdmin: boolean, loading: boolean }`

**Modified files (incremental changes only):**
- `src/pages/Community.tsx` -- import and use `useUserRole`, pass `isModerator` to `PostFeed`
- `src/components/community/PostFeed.tsx` -- accept `isModerator` prop, pass to `PostCard`
- `src/components/community/PostCard.tsx` -- show delete button when `isOwn || isModerator`, wrap in `AlertDialog` for confirmation

### Security notes
- Roles are stored in a **separate table** (not on profiles), preventing privilege escalation
- The `has_role()` function uses `SECURITY DEFINER` to bypass RLS safely
- Only authenticated users can read their own role assignments
- No client-side role storage; role is always verified server-side via RLS
