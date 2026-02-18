

## Add Notification When TTS Limit Is Reached

Currently, the app silently disables voice features on mount if the monthly quota is already exhausted. This change will show a visible toast notification so the user knows why voice is unavailable.

### What Changes

**File: `src/components/practice-log/MusicAI.tsx`**

- In the existing `useEffect` that checks quota on mount (`checkQuota`), add a toast notification when the usage is at or above the 6,000-second (100-minute) limit.
- The toast will say something like: "Monthly voice limit reached. Voice playback will reset next month."

### Technical Detail

In the `checkQuota` effect (~line 155), after detecting `data >= 6000`, add:

```typescript
toast({
  title: "Voice Limit Reached",
  description: "Monthly voice playback limit reached. It will reset next month.",
});
```

This complements the existing mid-playback notification -- users will now also be informed as soon as they open the Music AI panel.

