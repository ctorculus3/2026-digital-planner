

# Add Time Unit Labels to Completed Session Duration

## What Changes

In the completed state of the Practice Session Timer, the message currently reads:
> "You practiced for 0:01. See you tomorrow."

It will be updated to append a human-readable unit after the time value:

| Duration | Display |
|----------|---------|
| Less than 1 minute (e.g. `0:01`) | "0:01 secs" |
| 1-59 minutes (e.g. `0:15`) | "0:15 mins" |
| 1+ hours (e.g. `1:30`) | "1:30 hrs" |

## Technical Details

### File: `src/components/practice-log/PracticeSessionTimer.tsx`

**Modify `formatDuration` function** (lines 28-34) to return the time string with the unit label appended:

- If `h > 0`: return `"X:MM hrs"`
- If `m > 0`: return `"0:MM mins"`
- Otherwise (m === 0): return `"0:SS secs"`

No other files need to change. The display message on the completed screen will automatically pick up the new format since it uses the return value of this function.

