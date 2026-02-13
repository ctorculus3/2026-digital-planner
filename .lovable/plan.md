

## Add Media Tools Section to the How To Manual

### What

Add a new subsection under "Filling Out Your Practice Log" (Section 4) in the How To manual that explains the Media Tools feature -- how to upload files, drop media, and paste YouTube URLs.

### Content to Add

A new **Media Tools** heading after the existing "Ear Training, Additional Tasks & Music Listening" subsection, covering:

- The Media Tools section lives in the left column below Repertoire & Exercises
- Users can upload or drag-and-drop audio files (MP3, WAV, M4A), video files (MP4, MOV), and photos (JPG, PNG, WebP, GIF)
- Users can paste YouTube URLs to embed videos for listening sessions or reference
- Up to 5 media items can be attached per practice log entry
- Each item can be played back, viewed, or deleted directly in the journal

### Technical Details

**File:** `src/components/HowToManual.tsx`

- Add a new `<h4>` + `<p>` block for "Media Tools" inside Section 4, after the "Ear Training, Additional Tasks & Music Listening" subsection (around line 89)
- Uses the same styling as the other subsections (`font-medium text-foreground mt-3 mb-1` for the heading)
- No new files, components, or dependencies needed

