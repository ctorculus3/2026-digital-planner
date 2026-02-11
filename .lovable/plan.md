

## Add Picture Posting to Community

### Overview

Users will be able to attach up to 5 images when composing a community post. Images are uploaded to the existing `community-images` storage bucket and their paths stored in the existing `image_paths` array column on `community_posts`. Posts will be valid if they have text OR at least one image.

### What Already Exists

- `community_posts.image_paths` text[] column (already in DB)
- `community-images` public storage bucket (already created)
- Storage RLS: INSERT and DELETE scoped to `{user_id}/` folders (already configured)
- No SELECT policy needed (bucket is public)

### Changes

**1. PostComposer.tsx -- Add image picker and preview**

- Add state for selected image `File[]` (max 5)
- Add an image attach button (camera/image icon) using a hidden `<input type="file">` triggered by a `<label>` (robust pattern per memory)
- Show thumbnail previews of selected images with remove buttons
- Update `canSubmit` logic: valid if text OR images present
- On submit:
  1. Upload images to `community-images/{user_id}/{uuid}.ext` using Supabase Storage
  2. Collect the file paths
  3. Pass `image_paths` array alongside `content` to the `moderate-and-post` edge function
- Reset images and use dynamic `key` on file input after submit
- Use `sr-only` class on the hidden input for accessibility

**2. moderate-and-post edge function -- Accept and store image_paths**

- Parse optional `image_paths` string array from request body
- Validate: max 5 paths, each must start with the user's ID folder
- Include `image_paths` in the INSERT to `community_posts`
- Allow content to be empty string when images are present
- Text moderation only applies to text content (images bypass -- streak gate provides trust)

**3. PostCard.tsx -- Display images in posts**

- If `post.image_paths` has entries, render an image gallery below the text
- Use responsive grid: 1 image = full width, 2 = 2-col, 3+ = 2-col grid
- Each image gets a public URL from the `community-images` bucket
- Add a click-to-enlarge lightbox using Radix Dialog

**4. useCommunityPosts.ts -- Fetch image_paths**

- Add `image_paths` to the select query
- Include in the `CommunityPost` interface

**5. PostFeed.tsx -- Handle image cleanup on delete**

- When deleting a post that has images, also delete the image files from storage

### Technical Details

**File: `src/components/community/PostComposer.tsx`**
- New state: `images: File[]`, `inputKey: number`
- `<label>` with image icon triggers hidden `<input type="file" accept="image/*" multiple>`
- Before calling edge function, upload each file: `supabase.storage.from('community-images').upload('{userId}/{crypto.randomUUID()}.{ext}', file)`
- Pass resulting paths in body to `moderate-and-post`
- On error, clean up any uploaded images

**File: `supabase/functions/moderate-and-post/index.ts`**
- Destructure `{ content, image_paths }` from body
- Validate: content required if no images; image_paths max 5; paths must match user folder
- Insert with `image_paths` column

**File: `src/components/community/PostCard.tsx`**
- New `ImageGallery` component renders grid of images
- Lightbox dialog for full-size viewing with accessible hidden title/description
- Public URLs via `supabase.storage.from('community-images').getPublicUrl(path)`

**File: `src/hooks/useCommunityPosts.ts`**
- Update select to include `image_paths`
- Add `image_paths: string[] | null` to `CommunityPost` interface

**File: `src/components/community/PostFeed.tsx`**
- In `handleDelete`, if post has `image_paths`, call `supabase.storage.from('community-images').remove(paths)` before deleting the row

