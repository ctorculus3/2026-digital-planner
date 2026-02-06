

# Make Repertoire Bullets Selectable

## Overview

Convert the decorative bullet circles in the Repertoire & Exercises section into functional checkboxes so users can mark each exercise as completed. The completion status will persist to the database.

## What Changes

Currently, the repertoire data is stored as a simple array of strings (`string[]`). To track completion status, we have two options:

**Option A: Add a separate array for completion status**
- Add a new `repertoire_completed` column (`boolean[]`) that tracks which items are completed
- Simpler migration, keeps existing data intact

**Option B: Store as JSON objects**
- Change repertoire to store objects like `[{name: "Exercise", completed: true}]`
- Requires data migration for existing records

I'll implement **Option A** as it's cleaner and preserves existing data.

---

## Changes Required

### 1. Database Migration

Add a new column to track completion status for each repertoire item:

```sql
ALTER TABLE practice_logs 
ADD COLUMN repertoire_completed boolean[] DEFAULT '{}';
```

---

### 2. Update Hook Interface

**File:** `src/hooks/usePracticeLog.ts`

Add `repertoire_completed` to the `PracticeLogData` interface and include it in the save payload.

---

### 3. Update Form Component

**File:** `src/components/practice-log/PracticeLogForm.tsx`

1. Add state for tracking completed items: `repertoireCompleted: boolean[]`
2. Replace the decorative `<div>` bullet with the `<Checkbox>` component
3. Add handler to toggle completion status
4. Include completion data in save payload

**Current code (decorative bullet):**
```tsx
<div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
```

**New code (functional checkbox):**
```tsx
<Checkbox
  checked={repertoireCompleted[index] || false}
  onCheckedChange={(checked) => updateRepertoireCompleted(index, !!checked)}
  className="rounded-full"
/>
```

---

## Technical Details

### New State Variable

```typescript
const [repertoireCompleted, setRepertoireCompleted] = useState<boolean[]>(Array(15).fill(false));
```

### Toggle Handler

```typescript
const updateRepertoireCompleted = (index: number, checked: boolean) => {
  const newCompleted = [...repertoireCompleted];
  newCompleted[index] = checked;
  setRepertoireCompleted(newCompleted);
  markChanged();
};
```

### Updated Save Payload

```typescript
save({
  // ... existing fields
  repertoire_completed: repertoireCompleted,
});
```

### Load from Database

When loading a practice log, initialize the completion state:

```typescript
const loadedCompleted = [...(practiceLog.repertoire_completed || [])];
while (loadedCompleted.length < 15) loadedCompleted.push(false);
setRepertoireCompleted(loadedCompleted);
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Database | Add `repertoire_completed` column (`boolean[]`) |
| `src/hooks/usePracticeLog.ts` | Add `repertoire_completed` to interface and save payload |
| `src/components/practice-log/PracticeLogForm.tsx` | Add completion state, replace bullet div with Checkbox, add toggle handler |

---

## User Experience

- Clicking a bullet circle toggles it between empty (uncompleted) and checked (completed)
- Completed exercises show a checkmark inside the circle
- Completion status saves automatically with the practice log
- Visual feedback helps users track their progress through the day's exercises

