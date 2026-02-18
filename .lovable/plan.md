

## Fix Auto-Speak Browser Autoplay Restriction

### The Problem
When "Auto-speak" is enabled, `audio.play()` is called after the AI response finishes streaming. By that point, the browser no longer considers it a direct user gesture, so it blocks playback with a `NotAllowedError`.

Manual clicks on the speaker icon work fine because they are direct user interactions.

### The Fix

**File: `src/components/practice-log/MusicAI.tsx`**

Use a "warm-up" technique: when auto-speak is enabled, create and play a silent Audio element during the user's form submit (which IS a user gesture). This unlocks audio playback for that session. Then the real TTS audio can play later without restriction.

1. Add a helper function `warmUpAudio()` that plays a brief silent audio clip to unlock the browser's audio gate
2. Call `warmUpAudio()` inside the `send()` function (triggered by form submit = user gesture) when `autoSpeak` is enabled, before the streaming begins
3. In `speakMessage`, catch `NotAllowedError` specifically and show a helpful toast suggesting the user tap the speaker icon manually

### Technical Details

```text
User clicks Send (user gesture)
  -> if autoSpeak: play silent audio to unlock browser audio gate
  -> stream AI response
  -> when done: speakMessage() calls audio.play() (now allowed)
```

The silent audio warm-up uses a minimal valid WAV data URI -- no network request needed.

**Only one file changes:** `src/components/practice-log/MusicAI.tsx`
No backend or database changes needed.
