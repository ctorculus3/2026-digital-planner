

# Community Page -- Implementation Plan

## Overview

Add a new **Community** tab to the app where musicians can share thoughts, discuss gear, habits, and encourage each other. The feature is designed around a niche, "human-sized" community ethos -- focused on quality over noise.

**Access rules:**
- All authenticated (subscribed) users can **read** posts
- Only users with a **10+ day practice streak** can **create** posts
- AI moderation automatically screens every post before publishing

---

## What You'll See

### Navigation
A new **Community** tab (with a Users icon) appears in the existing Dashboard/Journal nav bar, accessible from any page.

### Community Page Layout
- **Header area** with streak status banner:
  - If streak >= 10: shows a post composer (text area + submit button)
  - If streak < 10: shows an encouraging message like *"Reach a 10-day practice streak to unlock posting!"* with a progress indicator
- **Post feed** below: a scrollable list of posts, newest first
- Each post card shows:
  - Author's profile picture (avatar) or initials fallback
  - Display name
  - Timestamp (relative, e.g. "2 hours ago")
  - Post content (text)
- **Real-time updates**: new posts appear automatically without refreshing

### Profile Pictures
- An avatar upload option added to the **User Menu** dropdown
- Users can upload a profile picture that appears next to their posts
- Fallback shows their initials in a colored circle (like the current User icon)

---

## Implementation Steps

### Step 1: Database Changes

**Add `avatar_url` column to `profiles` table:**
- New nullable `text` column for storing the path to the avatar image

**Create `community_posts` table:**
- `id` (uuid, primary key)
- `user_id` (uuid, not null) -- references the poster
- `content` (text, not null) -- the post text
- `created_at` (timestamptz, default now())

**Create a public storage bucket `avatars`** for profile pictures.

**RLS policies for `community_posts`:**
- SELECT: all authenticated users can read all posts
- INSERT: authenticated users where `get_practice_streak(auth.uid()) >= 10`
- DELETE: users can delete their own posts
- No UPDATE (posts are immutable once published)

**Enable realtime** on `community_posts` so new posts appear live.

### Step 2: AI Moderation Edge Function

Create a `moderate-and-post` backend function that:
1. Authenticates the user via their session token
2. Validates the post content (non-empty, max 500 characters)
3. Checks the user's streak (must be >= 10)
4. Sends the content to an AI model (using the built-in Lovable AI key) with a prompt like: *"Evaluate if this text contains obscenity, hate speech, spam, or unauthorized brand promotion. Reply with JSON: {approved: boolean, reason: string}"*
5. If approved, inserts the post into `community_posts` using a service-role client
6. Returns success or rejection reason to the client

This ensures all moderation + authorization happens server-side where it cannot be bypassed.

### Step 3: Frontend -- Community Page and Components

**New files:**
- `src/pages/Community.tsx` -- main page with scallop header, nav, and content area
- `src/components/community/PostFeed.tsx` -- fetches and displays posts with realtime subscription
- `src/components/community/PostCard.tsx` -- individual post display with avatar, name, time, content
- `src/components/community/PostComposer.tsx` -- text area + submit button, calls the moderation edge function
- `src/components/community/StreakGateBanner.tsx` -- shown when user has < 10-day streak, displays progress
- `src/hooks/useCommunityPosts.ts` -- data fetching hook with realtime subscription
- `src/hooks/useUserStreak.ts` -- reusable hook to fetch current streak (extracted from dashboard logic)

**Routing:**
- Add `/community` route to `App.tsx` (protected + subscription-gated, like Dashboard and Journal)

**Navigation:**
- Add `{ label: "Community", path: "/community", icon: Users }` to the `DashboardNav` component

### Step 4: Avatar Upload

- Add avatar upload UI in the `UserMenu` dropdown (or a small modal)
- Upload to the `avatars` storage bucket as `{user_id}.jpg`
- Update the `profiles.avatar_url` column with the public URL
- Update `PostCard` to display the avatar (with `AvatarFallback` showing initials)

---

## Technical Details

### Database Migration SQL

```text
-- Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN avatar_url text;

-- Create community_posts table
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read posts
CREATE POLICY "Authenticated users can read posts"
ON public.community_posts FOR SELECT TO authenticated
USING (true);

-- Only users with 10+ streak can insert (server-side backup; 
-- primary enforcement is the edge function)
CREATE POLICY "Users with streak can insert posts"
ON public.community_posts FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.get_practice_streak(auth.uid()) >= 10
);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON public.community_posts FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
```

### Edge Function: `moderate-and-post`

- Uses `LOVABLE_API_KEY` (already configured) to call the AI moderation model
- Uses `google/gemini-2.5-flash-lite` for fast, cost-effective moderation checks
- Posts that fail moderation return a clear rejection reason to the user
- Posts that pass are inserted using the service-role key for reliability

### Avatars Storage Bucket

- Public bucket so avatar URLs can be displayed to all authenticated users
- Files stored as `{user_id}.jpg` with upsert to replace old avatars
- Max file size enforced client-side (e.g., 2MB)

### Component Architecture

```text
Community.tsx
  +-- ScallopHeader
  +-- DashboardNav (with new Community tab)
  +-- UserMenu + ManageSubscription
  +-- StreakGateBanner (if streak < 10)
  +-- PostComposer (if streak >= 10)
  +-- PostFeed
       +-- PostCard (repeated)
            +-- Avatar + AvatarFallback
            +-- Display name
            +-- Relative timestamp
            +-- Post content
```

### Security Considerations

- Streak requirement enforced at **both** the edge function level and database RLS level
- AI moderation runs server-side -- users cannot bypass it
- Post content validated: non-empty, trimmed, max 500 characters
- No HTML rendering of user content -- plain text only to prevent XSS
- Avatar uploads restricted to image types (JPEG, PNG, WebP) and capped at 2MB

