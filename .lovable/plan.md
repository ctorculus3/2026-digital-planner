
# Fix Time Calculation Not Working

## Problem
The Start Time and Stop Time inputs are not properly calculating Total Time. This is caused by a format mismatch between the database time format and what the HTML time input expects.

## Root Cause
- The database stores times as PostgreSQL `time without time zone` type
- Database returns times like `"14:30:00"` (with seconds)
- HTML `<input type="time">` expects `"HH:MM"` format (without seconds)
- Some browsers don't properly handle the seconds in the value, causing the input to appear blank or not work

## Solution
Normalize time values when loading from the database by stripping any seconds component.

## Changes Required

### File: `src/components/practice-log/PracticeLogForm.tsx`

Add a helper function to normalize time format and use it when loading data:

**Add helper function (near top of component):**
```typescript
// Normalize time to HH:MM format (strip seconds if present)
const normalizeTime = (time: string | null): string => {
  if (!time) return "";
  // If time has seconds (HH:MM:SS), strip them
  const parts = time.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
};
```

**Update the useEffect that loads data (lines 52-53):**
```typescript
// Before:
setStartTime(practiceLog.start_time || "");
setStopTime(practiceLog.stop_time || "");

// After:
setStartTime(normalizeTime(practiceLog.start_time));
setStopTime(normalizeTime(practiceLog.stop_time));
```

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/practice-log/PracticeLogForm.tsx` | Add `normalizeTime` helper and use it when loading times from database |

## Why This Fixes the Issue
- When the form loads data from the database, times like `"14:30:00"` are converted to `"14:30"`
- The HTML time input correctly recognizes this format
- The `totalTime` calculation works correctly since both values are in consistent format
- No database changes needed - this is purely a display/input normalization fix
