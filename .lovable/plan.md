

# Fix: Time Display Reverting to 24-Hour Format

## The Problem

When you enter times like "12:30 PM" or "2:30 PM", they save correctly to the database. But when you navigate away and come back, they display as "12:30" or "14:30" instead of the friendly AM/PM format you originally entered.

This happens because the function that loads times from the database only strips the seconds -- it doesn't convert back to 12-hour AM/PM format.

## The Fix

Update the `normalizeTime` function in `PracticeLogForm.tsx` to convert 24-hour database times back to 12-hour AM/PM format for display.

## Technical Details

### File: `src/components/practice-log/PracticeLogForm.tsx`

**Current `normalizeTime` function (lines 51-58):**
```typescript
const normalizeTime = (time: string | null): string => {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;  // Just strips seconds, stays in 24-hour
  }
  return time;
};
```

**Updated `normalizeTime` function:**
```typescript
const normalizeTime = (time: string | null): string => {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return time;
    const period = hours >= 12 ? "PM" : "AM";
    if (hours === 0) hours = 12;
    else if (hours > 12) hours -= 12;
    return `${hours}:${minutes} ${period}`;
  }
  return time;
};
```

This converts database values like "14:30" to "2:30 PM" and "00:30" to "12:30 AM" when loading data back into the form. The save path remains unchanged -- `formatTimeForDb` already correctly converts AM/PM input to 24-hour format for storage.

### No other files need to change

- The `parseTimeString` function already handles both "2:30 PM" and "14:30" formats, so the total time calculation will continue to work correctly.
- The `formatTimeForDb` function already converts AM/PM to 24-hour for saving.

