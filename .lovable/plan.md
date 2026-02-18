

## Give the Music AI Coach a Voice with ElevenLabs TTS

### How It Works

After each AI response finishes streaming, a small speaker button will appear next to the message. Tapping it sends the text to ElevenLabs and plays the audio back. Users can also toggle an "auto-speak" mode so every response is read aloud automatically.

### Setup

1. **Link ElevenLabs connection** -- Your existing ElevenLabs connection needs to be linked to this project so the API key is available as a secret in backend functions.

### New Backend Function

**New file: `supabase/functions/elevenlabs-tts/index.ts`**
- Accepts `{ text, voiceId }` in the request body
- Calls the ElevenLabs TTS API (`/v1/text-to-speech/{voiceId}`) using the `ELEVENLABS_API_KEY` secret
- Uses the `eleven_turbo_v2_5` model for low-latency speech
- Returns the raw audio (MP3) as a binary response
- Voice: "Brian" (`nPczCjzI2devNBz1zQrb`) -- a clear, warm male voice suitable for a tutor (can be changed later)

### UI Changes

**File: `src/components/practice-log/MusicAI.tsx`**
- Add a small speaker/volume icon button next to each assistant message
- When clicked, fetch audio from the TTS edge function and play it
- Show a loading spinner while audio is being generated
- Add a stop button to cancel playback mid-sentence
- Add a toggle in the header for "Auto-speak" mode -- when enabled, each new response is automatically spoken aloud after streaming completes

### Technical Details

**Edge function (`elevenlabs-tts/index.ts`):**
```
POST { text: string, voiceId?: string }
-> fetches from ElevenLabs API
-> returns audio/mpeg binary
```

**Client-side playback:**
- Uses `fetch()` with `.blob()` (not `supabase.functions.invoke()`) to get binary audio
- Creates an `Audio` object from the blob URL for playback
- Tracks playing state per message so only one message speaks at a time

**Files to create:**
- `supabase/functions/elevenlabs-tts/index.ts`

**Files to modify:**
- `supabase/config.toml` -- add the new function entry
- `src/components/practice-log/MusicAI.tsx` -- add speaker buttons and auto-speak toggle

**No database changes needed.**
