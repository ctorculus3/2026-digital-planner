

# Fix Day Tab Navigation to Stay Within the Same Week

## The Problem

The day tabs currently always move forward in time. When you:
1. Start on Friday Feb 06
2. Click Saturday - moves to Feb 07 (correct)
3. Click Friday again - moves to Feb 13 (wrong! should be Feb 06)

The tabs should represent the days surrounding today's date, allowing navigation both backward and forward within the week.

## The Fix

Change the navigation logic to move to the nearest occurrence of the selected day, preferring backward movement for past days and forward movement for future days within the same week context.

## Technical Details

**File:** `src/components/practice-log/PracticeLogCalendar.tsx`

**Current Logic (broken):**
```typescript
const handleSelectDayOfWeek = useCallback((targetDayOfWeek: number) => {
  const currentDayOfWeek = getDay(currentDate);
  let daysToAdd = targetDayOfWeek - currentDayOfWeek;
  if (daysToAdd <= 0) {
    daysToAdd += 7;  // Always moves forward
  }
  const newDate = addDays(currentDate, daysToAdd);
  setCurrentDate(newDate);
}, [currentDate]);
```

**New Logic (fixed):**
```typescript
const handleSelectDayOfWeek = useCallback((targetDayOfWeek: number) => {
  const currentDayOfWeek = getDay(currentDate);
  const daysToAdd = targetDayOfWeek - currentDayOfWeek;
  // Simply add the difference - can be negative (go back) or positive (go forward)
  const newDate = addDays(currentDate, daysToAdd);
  setCurrentDate(newDate);
}, [currentDate]);
```

## How It Works After the Fix

| Current Day | Tab Clicked | Calculation | Result |
|-------------|-------------|-------------|--------|
| Saturday (6) | Friday (5) | 5 - 6 = -1 | Goes back 1 day |
| Friday (5) | Saturday (6) | 6 - 5 = +1 | Goes forward 1 day |
| Wednesday (3) | Sunday (0) | 0 - 3 = -3 | Goes back 3 days |
| Sunday (0) | Saturday (6) | 6 - 0 = +6 | Goes forward 6 days |

## Summary

| Location | Change |
|----------|--------|
| `src/components/practice-log/PracticeLogCalendar.tsx` | Remove the `if (daysToAdd <= 0)` block that adds 7 days |

This one-line fix allows the tabs to navigate naturally within the week, going backward for earlier days and forward for later days.

