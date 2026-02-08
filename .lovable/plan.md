

# Seed Community with ~20 Fake Posts

## What this does
Populates your Community feed with realistic-looking posts from various fictional users to simulate an active music practice community. This will make the page feel alive and give you a sense of how it looks with real activity.

## Steps

### 1. Create fake user profiles
Insert approximately 8-10 fake profile records into the `profiles` table, each with a unique display name (e.g., "Sarah M.", "JazzDrummer42", "Violin_Vivian"). These won't have real auth accounts, but since there are no foreign key constraints, they'll display correctly in the feed.

### 2. Insert ~20 community posts
Create around 20 posts spread across the fake users with music-practice-themed content such as:
- Sharing practice milestones ("Finally nailed that Chopin etude after 3 weeks!")
- Gear talk ("Just got new strings for my acoustic -- what a difference")
- Encouragement ("Keep at it everyone, consistency is key")
- Questions ("Anyone have tips for sight-reading jazz charts?")
- Practice habits ("Morning practice sessions hit different")

Posts will have staggered `created_at` timestamps over the past few days so the feed looks natural with varied "time ago" labels.

### 3. No code changes needed
The existing `PostFeed` and `PostCard` components already handle multiple users, avatars (with initials fallback), and timestamps -- so the new posts will display automatically.

## Technical details

A single database migration will run two batches of `INSERT` statements:
- ~10 rows into `profiles` (id, display_name, avatar_url as NULL)
- ~20 rows into `community_posts` (id, user_id referencing the fake profiles, content, created_at)

All fake user IDs will use pre-generated UUIDs. The avatar fallback (initials) will display for each since no avatar images are uploaded for these users.

