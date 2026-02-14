

## Add AI Music Assistant to the Practice Journal

### Overview

Add a collapsible AI chat panel inside the journal that serves as a music theory tutor and practice helper. Users can ask questions like "What is the circle of fifths?" or "Suggest warm-ups for trumpet" and get streaming AI responses -- all powered by Lovable AI (already configured, no API key needed).

### How It Works

- A "Music AI" button appears in the journal toolbar area (near the How To and other controls)
- Clicking it opens a slide-out chat panel on the right side of the journal
- Users type questions and get streaming, markdown-rendered responses
- The AI has context about music theory, practice techniques, and can also see the user's current journal entries (goals, repertoire, notes) to give personalized advice
- Conversation resets per session (no database storage needed)

### What Gets Built

1. **Backend function** (`supabase/functions/music-ai/index.ts`)
   - Receives the user's message plus optional journal context (goals, repertoire, notes)
   - Calls Lovable AI gateway with a music-focused system prompt using `google/gemini-3-flash-preview`
   - Streams the response back via SSE
   - Handles rate limit (429) and payment (402) errors

2. **AI Chat component** (`src/components/practice-log/MusicAI.tsx`)
   - Collapsible chat panel with a message list and input field
   - Streams AI responses token-by-token with markdown rendering
   - Sends current journal context (goals, repertoire, notes) alongside questions so the AI can give personalized help
   - Shows a few starter prompts like "What is the circle of fifths?" to guide users

3. **Integration into `PracticeLogForm.tsx`**
   - Add the MusicAI component to the right column of the journal, between the Notes section and the tools
   - Pass current journal state (goals, repertoire, notes) as context props
   - No changes to any existing features -- purely additive

### Technical Details

**Edge Function** (`supabase/functions/music-ai/index.ts`):
- System prompt: "You are a knowledgeable music theory tutor and practice coach. Answer questions about music theory, scales, chords, ear training, technique, and practice strategies. Keep answers clear and practical. If the user shares their practice context, reference it in your advice."
- Model: `google/gemini-3-flash-preview`
- Streaming enabled
- CORS headers included
- Rate limit / payment error handling

**Config** (`supabase/config.toml`):
- Add `[functions.music-ai]` with `verify_jwt = false`

**New dependency**:
- `react-markdown` for rendering AI responses with proper formatting

**MusicAI Component**:
- Toggle button with a sparkle/brain icon in a card styled consistently with other journal sections
- Chat messages displayed in a scroll area
- Input field at the bottom with send button
- Starter suggestion chips for common questions
- Receives `journalContext` prop with current goals, repertoire, and notes to send to the AI

**PracticeLogForm changes**:
- Import and render `<MusicAI />` in the right column
- Pass current form state as context -- minimal, targeted addition with no impact on existing features

