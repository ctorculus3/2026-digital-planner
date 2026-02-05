

# Fix Time Calculation - Race Condition Issue

## Problem Identified
After investigation, the issue is NOT with the time format normalization (that fix was correct). The real problem is a **race condition** in the form state management.

## Root Cause
The `useEffect` that loads data from the database (lines 57-106) has `[practiceLog, isLoading]` as dependencies. This causes it to run multiple times:

1. When you enter a start time like "12:30", the `startTime` state updates correctly
2. The `totalTime` calculation should work at this point
3. However, the `practiceLog` object from the database query may trigger re-renders (even with the same data)
4. Each time `practiceLog` reference changes, the `useEffect` runs again
5. Since `practiceLog.start_time` is still `null` in the database (hasn't been saved yet), the form resets `startTime` back to `""`
6. With `startTime` as `""`, the `totalTime` calculation returns early with `""`

Essentially, your typed values are being immediately overwritten by the stale database values.

## Solution
Add a flag to track whether the form has been initialized from database data. Only load from the database on initial mount or when navigating to a different date, NOT on every `practiceLog` change.

## Changes Required

### File: `src/components/practice-log/PracticeLogForm.tsx`

1. Add a ref to track if form has been initialized for current date
2. Update the useEffect to only populate form data when the date changes or on first load
3. Reset the initialization flag when the date prop changes

```text
Changes:
- Add: const isInitializedRef = useRef(false);
- Add: const currentDateRef = useRef(date.toISOString());
- Modify useEffect to check if already initialized for current date
- Reset initialization when date changes
```

## Technical Details

**Add initialization tracking ref:**
```typescript
const isInitializedRef = useRef(false);
const currentDateRef = useRef(date.toISOString());
```

**Modify the useEffect:**
```typescript
useEffect(() => {
  // Reset initialization when date changes
  if (currentDateRef.current !== date.toISOString()) {
    isInitializedRef.current = false;
    currentDateRef.current = date.toISOString();
  }
  
  // Only initialize once per date
  if (isInitializedRef.current) return;
  
  if (practiceLog) {
    // ... existing population code ...
    isInitializedRef.current = true;
  } else if (!isLoading) {
    // ... existing reset code ...
    isInitializedRef.current = true;
  }
}, [practiceLog, isLoading, date]);
```

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/practice-log/PracticeLogForm.tsx` | Add initialization tracking to prevent form state from being overwritten by stale database data |

## Why This Fixes the Issue
- The form will only be populated from the database once when first loading a date
- User edits to time fields will persist in state and not be overwritten
- The `totalTime` calculation will work correctly because `startTime` and `stopTime` won't be reset
- When navigating to a different date, the form properly resets and loads that date's data
- The auto-save functionality will still work and save changes to the database

