

## Update Voice ID and Test TTS

### What Changed
You upgraded your ElevenLabs plan, so the 401 "unusual activity" error should be resolved. You also provided a specific voice ID (`lxYfHSkYm1EzQzGhdbfc`) to use instead of the default Brian voice.

### Changes Needed

**File: `supabase/functions/elevenlabs-tts/index.ts`**
- Change the default voice ID from `nPczCjzI2devNBz1zQrb` (Brian) to `lxYfHSkYm1EzQzGhdbfc` (your custom voice)
- This is a one-line change on line 30

### If the Error Persists

If after deploying you still get a 502/401, the ElevenLabs API key from the connector may need to be refreshed. In that case we would reconnect the ElevenLabs connector so it picks up your updated paid account credentials.

### No other changes needed
- The edge function code is correct
- The UI integration is already complete
- No database changes required

