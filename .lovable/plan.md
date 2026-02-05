

# Persist Total Practice Time to Database

## Overview

This plan adds the ability to save the Total Practice Time to the database, along with fixing the start/stop time format conversion so all time values are properly stored.

## Changes Required

### 1. Database Migration

Add a new `total_time` column to store the calculated practice duration.

**SQL Migration:**
```sql
ALTER TABLE practice_logs 
ADD COLUMN total_time interval;
```

Using `interval` type allows storing durations like "2 hours 30 minutes" natively in the database.

---

### 2. Update Hook Interface

**File:** `src/hooks/usePracticeLog.ts`

Add `total_time` to the `PracticeLogData` interface and include it in the save payload.

---

### 3. Update Form Component

**File:** `src/components/practice-log/PracticeLogForm.tsx`

1. **Add a helper function** to convert AM/PM time strings to database-compatible `HH:MM` format
2. **Update `handleSave`** to:
   - Convert start_time and stop_time to proper format before saving
   - Include total_time in the save data

---

## Technical Details

### New Helper Function

```typescript
// Convert user input (e.g., "12:30 PM") to database format "HH:MM"
const formatTimeForDb = (timeStr: string): string | null => {
  const parsed = parseTimeString(timeStr);
  if (!parsed) return null;
  
  const hours = parsed.hours.toString().padStart(2, '0');
  const minutes = parsed.minutes.toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
```

### Updated handleSave

```typescript
const handleSave = useCallback(() => {
  save({
    goals: mainGoals,
    subgoals,
    start_time: formatTimeForDb(startTime),
    stop_time: formatTimeForDb(stopTime),
    total_time: totalTime || null,  // Add total time
    warmups,
    scales,
    repertoire,
    technique: "",
    musicianship: "",
    notes,
    metronome_used: metronomeUsed,
  });
  setHasUnsavedChanges(false);
}, [mainGoals, subgoals, startTime, stopTime, totalTime, warmups, scales, repertoire, notes, metronomeUsed, save]);
```

### Updated PracticeLogData Interface

```typescript
export interface PracticeLogData {
  goals: string;
  subgoals: string;
  start_time: string | null;
  stop_time: string | null;
  total_time: string | null;  // Add this
  warmups: string[];
  scales: string[];
  repertoire: string[];
  technique: string;
  musicianship: string;
  notes: string;
  metronome_used: boolean;
}
```

### Updated Save Payload in Hook

```typescript
const payload = {
  // ... existing fields
  total_time: logData.total_time || null,
};
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Database | Add `total_time` column (interval type) to `practice_logs` table |
| `src/hooks/usePracticeLog.ts` | Add `total_time` to interface and save payload |
| `src/components/practice-log/PracticeLogForm.tsx` | Add `formatTimeForDb` helper, update `handleSave` to convert times and include total_time |

---

## What This Fixes

1. **Start/Stop times now save correctly** - AM/PM input like "12:30 PM" gets converted to "12:30" before saving
2. **Total Practice Time persists** - The calculated duration is stored in the database
3. **Data loads correctly** - When you return to a saved log, all time values display properly

