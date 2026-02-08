
# Add Multi-Image Attachments to Community Posts (Up to 5)

## Overview
Allow users to optionally attach up to **5 images** to their community posts. Images will be uploaded to a public storage bucket, referenced in the database as an array, and displayed in the feed as a responsive gallery.

## What Changes

### 1. Database: Add `image_paths` array column
Add a nullable `text[]` (text array) column called `image_paths` to the `community_posts` table. Using an array column (rather than a separate join table) keeps things simple and aligns with the existing pattern used elsewhere in the app (e.g., `warmups`, `repertoire` on `practice_logs`).

### 2. Storage: Create a public `community-images` bucket
Create a new **public** storage bucket called `community-images`. Public access is appropriate since all community posts are visible to all authenticated users.

RLS policies on the bucket:
- **INSERT**: authenticated users can upload to their own folder (`user_id/...`)
- **DELETE**: users can delete files in their own folder

### 3. UI: Multi-image picker in PostComposer
- Add an image icon button in the action bar (next to the character count and Post button)
- Clicking it opens a file picker that accepts multiple files (JPEG, PNG, WEBP, GIF)
- Show thumbnail previews of selected images in a horizontal row with individual remove (X) buttons
- Display a count indicator (e.g., "3/5 images")
- Enforce per-image 5MB size limit and max 5 images total
- Images are optional -- text-only posts still work exactly as before
- A post requires at least one of: text content or images
- Submit flow:
  1. Upload all images in parallel to `community-images/{user_id}/{timestamp}-{index}.{ext}`
  2. Collect the resulting paths into an array
  3. Call the `moderate-and-post` edge function with text content AND image paths array
  4. If the function call fails, clean up any uploaded images
  5. Clear the form on success

### 4. Edge function: Accept `image_paths` parameter
Update `moderate-and-post` to:
- Accept an optional `image_paths` string array in the request body
- Validate the array: max 5 items, each path must start with the user's ID
- Require at least one of `content` or `image_paths` (text becomes optional when images are attached)
- Include the `image_paths` array when inserting the post into the database
- AI moderation continues to apply to text content only (no image screening in this phase)

### 5. Data hook: Include `image_paths` in fetched posts
Update `useCommunityPosts` to:
- Add `image_paths: string[] | null` to the `CommunityPost` interface
- Include `image_paths` in the select query from `community_posts`

### 6. UI: Display image gallery in PostCard
- When a post has `image_paths`, render the images below the text content
- **1 image**: full-width with rounded corners, max height constrained
- **2 images**: side-by-side in a 2-column grid
- **3-5 images**: 2-column grid layout with images filling naturally
- Images use the public bucket URL constructed from the Supabase project URL
- All images have `object-cover` styling for consistent presentation

### 7. Cleanup: Delete images on post deletion
Update `PostFeed`'s delete handler to also remove all associated image files from storage when deleting a post that has `image_paths`.

---

## Technical Details

### Migration SQL
```text
-- Add image_paths array column
ALTER TABLE public.community_posts
  ADD COLUMN image_paths text[];

-- Create community-images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true);

-- Storage RLS: authenticated users can upload to own folder
CREATE POLICY "Users can upload community images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: users can delete own images
CREATE POLICY "Users can delete own community images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/...` | New migration for `image_paths` column + bucket + storage policies |
| `src/components/community/PostComposer.tsx` | Add multi-image picker, thumbnail previews, parallel upload logic |
| `src/components/community/PostCard.tsx` | Render image gallery below post text with responsive grid |
| `src/components/community/PostFeed.tsx` | Delete all images from storage on post deletion |
| `src/hooks/useCommunityPosts.ts` | Add `image_paths` to interface and select query |
| `supabase/functions/moderate-and-post/index.ts` | Accept optional `image_paths` array, validate, allow image-only posts |

### Constraints
- Max image size: 5MB per image
- Max images per post: 5
- Accepted formats: JPEG, PNG, WEBP, GIF
- Image moderation is text-only in this phase (no AI image screening)
- Text content becomes optional when at least one image is attached
