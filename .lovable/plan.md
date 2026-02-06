

# Add Ear Training Section

## What's Changing

A new "Ear Training" section will be added to the practice log form, placed directly below the "Used Metronome Today" checkbox (and above "Additional Task"). It works exactly like the existing Additional Task section -- 4 rows by default, expandable up to 10, each with a clickable circular checkbox and a text input.

## Steps

### 1. Add Database Columns

Add two new columns to the `practice_logs` table:
- `ear_training` (text array, nullable) -- stores the ear training exercise descriptions
- `ear_training_completed` (boolean array, nullable) -- tracks which exercises are checked off

### 2. Update the Practice Log Data Interface

Add `ear_training` and `ear_training_completed` fields to the `PracticeLogData` interface in `usePracticeLog.ts`, and include them in the save payload (filtering empty strings, same as additional tasks).

### 3. Add State and Handlers to the Form

In `PracticeLogForm.tsx`, add the following (mirroring the Additional Tasks pattern):
- State: `earTraining` (string array of 10), `earTrainingCompleted` (boolean array of 10), `earTrainingCount` (starts at 4)
- Load logic in the `useEffect` that initializes from `practiceLog`
- Reset logic for new days
- Update handlers: `updateEarTraining`, `updateEarTrainingCompleted`, `addEarTraining`
- Include in the `handleSave` payload

### 4. Add the UI Section

Insert the Ear Training card between the "Used Metronome Today" checkbox and the "Additional Task" section. It will have:
- A label: "Ear Training"
- 4 visible rows (expandable to 10) with circular checkboxes and text inputs
- An "Add" button when fewer than 10 rows are shown

### 5. Update the Shared Practice Log Page

Add an Ear Training display section to `SharedPracticeLog.tsx` so shared logs also show this data.

---

## Technical Details

### Database Migration

```sql
ALTER TABLE public.practice_logs
  ADD COLUMN ear_training text[] DEFAULT '{}',
  ADD COLUMN ear_training_completed boolean[] DEFAULT '{}';
```

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/usePracticeLog.ts` | Add `ear_training` and `ear_training_completed` to `PracticeLogData` interface and save payload |
| `src/components/practice-log/PracticeLogForm.tsx` | Add state, handlers, load/reset logic, save inclusion, and UI section |
| `src/pages/SharedPracticeLog.tsx` | Add ear training display section |

### UI Placement (right column, top to bottom)

1. Notes and Focus
2. Used Metronome Today
3. **Ear Training (new)**
4. Additional Task
5. Music Listening

