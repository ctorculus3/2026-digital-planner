

## Add Photo Support to Media Tools

Add the ability to drop or browse for photos (JPG, PNG, WEBP, etc.) in the Media Tools section, alongside existing audio, video, and YouTube support.

### What Changes

1. **Database**: Update the `practice_media_media_type_check` constraint to allow `'photo'` in addition to `'audio'`, `'video'`, and `'youtube'`.

2. **Hook (`useMediaTools.ts`)**:
   - Add accepted image MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) and extensions (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`).
   - Update `MediaItem` type to include `"photo"` as a media_type.
   - Detect image files and set `media_type: "photo"` during upload.
   - Update the success toast to say "File uploaded" instead of "Audio uploaded".
   - Clean up photo storage files on delete (same as audio/video).

3. **Component (`MediaTools.tsx`)**:
   - Update the drop zone text to "Drop audio/video/photo or click to browse".
   - Update the file input `accept` attribute to include image types.
   - Add an `ImageIcon` from lucide-react for photo items.
   - Add a photo preview in the `MediaItemCard` that displays the image via signed URL (similar to how audio/video uses `MediaPlayer`).

4. **UI for photo items**: Photos will display as a thumbnail image in the media card, loaded via signed URL from the private bucket.

### Technical Details

**Database migration:**
```text
ALTER TABLE practice_media DROP CONSTRAINT practice_media_media_type_check;
ALTER TABLE practice_media ADD CONSTRAINT practice_media_media_type_check 
  CHECK (media_type = ANY (ARRAY['audio'::text, 'video'::text, 'youtube'::text, 'photo'::text]));
```

**New accepted types in hook:**
- Extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
- MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**File size limit**: Same 500MB limit applies (though photos are typically much smaller).

**Storage**: Photos go into the same `practice-media` bucket, same path pattern (`userId/logId/media-N.ext`).

