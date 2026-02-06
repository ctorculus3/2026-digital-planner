
# Display Times in 12-Hour Clock Format

## The Problem

When you enter a time like "2:30 PM", it gets saved to the database in 24-hour format ("14:30"). When you navigate away and return, the time displays as "14:30" instead of "2:30 PM".

## The Fix

Update the `normalizeTime` function to convert database times (24-hour format) back to 12-hour AM/PM format for display.

## Technical Details

**File:** `src/components/practice-log/PracticeLogForm.tsx`

**Current function (shows 24-hour time):**
```typescript
const normalizeTime = (time: string | null): string => {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
};
```

**New function (shows 12-hour time with AM/PM):**
```typescript
const normalizeTime = (time: string | null): string => {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    
    if (isNaN(hours)) return time;
    
    const period = hours >= 12 ? "PM" : "AM";
    
    // Convert to 12-hour format
    if (hours === 0) {
      hours = 12; // Midnight
    } else if (hours > 12) {
      hours = hours - 12;
    }
    
    return `${hours}:${minutes} ${period}`;
  }
  return time;
};
```

## How It Works

| Database Value | Display Value |
|----------------|---------------|
| 14:30 | 2:30 PM |
| 09:00 | 9:00 AM |
| 00:30 | 12:30 AM |
| 12:00 | 12:00 PM |

## Summary

| Location | Change |
|----------|--------|
| `src/components/practice-log/PracticeLogForm.tsx` | Update `normalizeTime` to convert 24-hour database times to 12-hour AM/PM display format |

The input parsing (`parseTimeString`) already handles both 12-hour and 24-hour input, so users can enter times in either format. This change ensures the display is always in the friendly 12-hour format.
