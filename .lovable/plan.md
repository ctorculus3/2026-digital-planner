

# Fix: Practice Session Timer Showing Incorrect Duration

## Root Cause

There is a race condition between the timer's internal state and the sync effect that watches parent props.

When the user clicks "Complete":
1. `completeSession` correctly calculates the duration (e.g., "0:01 mins" for 1:12) and sets `completedTotalTime`
2. It calls `onSessionComplete(startDb, stopDb, duration)` which updates the parent's `startTime` and `stopTime`
3. The parent re-renders with new `existingStartTime` / `existingStopTime` props
4. The sync `useEffect` detects the prop change, sees `hasExistingSession` is now true, and **overwrites** `completedTotalTime` with `existingTotalTime` -- which is still the old/empty value from the database

Additionally, the parent never stores the `duration` value back into `totalTime` state, so `existingTotalTime` remains stale.

## Fix (two changes)

### 1. Parent: Store the duration in `totalTime` state

In `PracticeLogForm.tsx`, the `onSessionComplete` callback should also update `totalTime`:

```tsx
onSessionComplete={(start, stop, duration) => {
  setStartTime(start);
  setStopTime(stop);
  setTotalTime(duration);   // <-- ADD THIS LINE
  markChanged();
}}
```

This ensures `existingTotalTime` has the correct value when the sync effect runs.

### 2. Timer: Guard the sync effect against self-triggered updates

In `PracticeSessionTimer.tsx`, skip the sync effect when the session was just completed internally (to avoid overwriting the freshly-set completed state). Use a ref to track internal completions:

- Add a `justCompletedRef` that gets set to `true` in `completeSession` and checked/cleared in the sync effect
- When the effect fires and `justCompletedRef.current` is true, skip the state reset and just clear the ref

### Files to Modify
- `src/components/practice-log/PracticeLogForm.tsx` -- add `setTotalTime(duration)` in the callback
- `src/components/practice-log/PracticeSessionTimer.tsx` -- add `justCompletedRef` guard in sync effect and `completeSession`

