

# Fix Total Time Calculation - Input Format Issue

## Problem Identified

The issue is that you're typing times in **AM/PM format** (like "12:30 p.m.") into the time input fields. HTML `<input type="time">` fields:

- Only accept 24-hour format internally (e.g., "14:30" for 2:30 PM)
- Display a native time picker on most browsers
- Do **not** accept typed AM/PM text like "12:30 p.m." - the browser ignores this

When the browser can't parse what you type, the input's value stays empty, so `startTime` and `stopTime` remain `""`, and the calculation returns `"0:00"`.

## Solution

Replace the native `<input type="time">` with simple text inputs that accept user-friendly time formats (like "12:30 PM" or "2:30pm"), then parse and calculate the duration using simple clock math.

## Changes Required

### File: `src/components/practice-log/PracticeLogForm.tsx`

1. **Add a time parsing helper** that understands formats like:
   - "12:30 PM", "12:30pm", "12:30 p.m."
   - "2:30 PM", "2:30pm"
   - "14:30" (24-hour format)

2. **Change the inputs from `type="time"` to `type="text"`** with a placeholder showing the expected format

3. **Update the `totalTime` calculation** to use the new parser

## Technical Details

**New helper function to parse time strings:**

```typescript
const parseTimeString = (timeStr: string): { hours: number; minutes: number } | null => {
  if (!timeStr || !timeStr.trim()) return null;
  
  const cleaned = timeStr.trim().toLowerCase().replace(/\s+/g, '');
  
  // Check for AM/PM
  const isPM = cleaned.includes('pm') || cleaned.includes('p.m');
  const isAM = cleaned.includes('am') || cleaned.includes('a.m');
  
  // Remove AM/PM markers
  const timeOnly = cleaned.replace(/[ap]\.?m\.?/g, '').trim();
  
  // Parse hours and minutes
  const parts = timeOnly.split(':');
  if (parts.length < 2) return null;
  
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return null;
  
  // Convert to 24-hour format
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  
  return { hours, minutes };
};
```

**Updated totalTime calculation:**

```typescript
const totalTime = useMemo(() => {
  const start = parseTimeString(startTime);
  const stop = parseTimeString(stopTime);
  
  if (!start || !stop) return "";
  
  let totalMinutes = (stop.hours * 60 + stop.minutes) - (start.hours * 60 + start.minutes);
  
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Handle overnight sessions
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}, [startTime, stopTime]);
```

**Updated inputs (change from type="time" to type="text"):**

```tsx
<Input
  type="text"
  value={startTime}
  onChange={(e) => { setStartTime(e.target.value); markChanged(); }}
  placeholder="e.g. 12:30 PM"
  className="bg-transparent border-b border-border rounded-none px-0"
/>
```

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/practice-log/PracticeLogForm.tsx` | Add `parseTimeString` helper, change time inputs to text type with placeholder, update `totalTime` to use the parser |

## Why This Fixes the Issue

- Text inputs accept any format you type (12:30 PM, 2:30pm, 14:30)
- The parser converts all formats to hours/minutes for calculation
- Simple subtraction gives you the practice duration
- Works on all browsers and devices consistently
- No reliance on browser's native time picker behavior

