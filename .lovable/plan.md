

## TTS Monthly Usage Cap (100 minutes across all users)

### Overview
Track total TTS usage across all users. Once 100 minutes of voice playback is consumed in a calendar month, disable the feature until the next month.

### Changes Required

#### 1. New Database Table: `tts_usage`
Create a table to log each TTS request with its estimated duration (based on text length).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | Who made the request |
| text_length | integer | Character count of the text sent |
| estimated_seconds | integer | Estimated audio duration (~15 chars/sec for speech) |
| created_at | timestamptz | When the request was made |

RLS: insert allowed for authenticated users, select not needed from client.

#### 2. New Database Function: `get_tts_usage_this_month`
An RPC function that returns the total estimated seconds used this calendar month across ALL users. No user filter -- this is a global cap.

```sql
SELECT COALESCE(SUM(estimated_seconds), 0)
FROM tts_usage
WHERE created_at >= date_trunc('month', now())
```

#### 3. Edge Function Update: `elevenlabs-tts/index.ts`
Before calling ElevenLabs:
- Query `tts_usage` for total seconds used this month
- If >= 6000 (100 min), return a `429` response with `{ error: "Monthly voice limit reached", quota_exceeded: true }`
- After a successful TTS call, insert a row into `tts_usage` with the estimated duration

Estimation formula: `estimated_seconds = Math.ceil(text.length / 15)` (average speech rate is roughly 15 characters per second).

#### 4. Frontend Update: `MusicAI.tsx`
- When `speakMessage` receives a response with `quota_exceeded: true`, show a toast: "Voice playback limit reached for this month"
- Hide the speaker icons and auto-speak toggle when quota is exceeded (use a `ttsDisabled` state)
- On component mount, call a lightweight check endpoint (or the RPC) to know if TTS is already exhausted for the month

### Technical Details

**Why estimate duration from text length?**
Tracking actual audio duration would require decoding the MP3 on the server, which adds complexity. Character-based estimation is simple and accurate enough for a budget cap.

**Why enforce in the edge function?**
Server-side enforcement prevents bypassing the cap. The frontend hides UI elements for a better experience, but the edge function is the real gatekeeper.

**Flow:**
```text
User triggers TTS
  -> Edge function checks tts_usage sum for current month
  -> If < 6000 seconds: call ElevenLabs, log usage, return audio
  -> If >= 6000 seconds: return 429 + quota_exceeded flag
  -> Frontend shows "limit reached" message
  -> Next month: usage resets automatically (date filter)
```
