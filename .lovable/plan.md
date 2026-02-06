
# Add Additional Task and Music Listening Sections

## Overview

Add two new sections below "Notes & Focus" with checkboxes like the Repertoire section:
1. **Additional Task** - starts with 4 items, expandable to 10
2. **Music Listening** - starts with 4 items, expandable to 10

Both sections will have the same bullet circle checkboxes as the Repertoire & Exercises section.

---

## Changes Required

### 1. Database Migration

Add four new columns to store the data:

```sql
ALTER TABLE practice_logs 
ADD COLUMN additional_tasks text[] DEFAULT '{}',
ADD COLUMN additional_tasks_completed boolean[] DEFAULT '{}',
ADD COLUMN music_listening text[] DEFAULT '{}',
ADD COLUMN music_listening_completed boolean[] DEFAULT '{}';
```

---

### 2. Update Practice Log Hook

**File:** `src/hooks/usePracticeLog.ts`

Add the new fields to the `PracticeLogData` interface:

```typescript
export interface PracticeLogData {
  // ... existing fields ...
  additional_tasks: string[];
  additional_tasks_completed: boolean[];
  music_listening: string[];
  music_listening_completed: boolean[];
}
```

Update the save payload to include the new fields.

---

### 3. Update Practice Log Form

**File:** `src/components/practice-log/PracticeLogForm.tsx`

**Add new state variables:**
```typescript
const [additionalTasks, setAdditionalTasks] = useState<string[]>(Array(10).fill(""));
const [additionalTasksCompleted, setAdditionalTasksCompleted] = useState<boolean[]>(Array(10).fill(false));
const [additionalTaskCount, setAdditionalTaskCount] = useState(4);

const [musicListening, setMusicListening] = useState<string[]>(Array(10).fill(""));
const [musicListeningCompleted, setMusicListeningCompleted] = useState<boolean[]>(Array(10).fill(false));
const [musicListeningCount, setMusicListeningCount] = useState(4);
```

**Add helper functions** (following existing patterns):
```typescript
const updateAdditionalTask = (index: number, value: string) => { ... };
const updateAdditionalTaskCompleted = (index: number, checked: boolean) => { ... };
const addAdditionalTask = () => { if (additionalTaskCount < 10) setAdditionalTaskCount(prev => prev + 1); };

const updateMusicListening = (index: number, value: string) => { ... };
const updateMusicListeningCompleted = (index: number, checked: boolean) => { ... };
const addMusicListening = () => { if (musicListeningCount < 10) setMusicListeningCount(prev => prev + 1); };
```

**Add UI sections** below the Notes & Focus card, inside the right column:

```text
Current Layout:
┌─────────────────────────────────────────────────┐
│  Repertoire & Exercises  │  Notes & Focus       │
│  (left column)           │  Metronome checkbox  │
│                          │                      │
└─────────────────────────────────────────────────┘

New Layout:
┌─────────────────────────────────────────────────┐
│  Repertoire & Exercises  │  Notes & Focus       │
│  (left column)           │  Metronome checkbox  │
│                          │  Additional Task     │
│                          │  Music Listening     │
└─────────────────────────────────────────────────┘
```

Each new section will have:
- A card container with the section label
- Rows with round checkboxes + text input
- A "+" button to add more items (up to 10)

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Database | Add 4 new columns for tasks and listening data |
| `src/hooks/usePracticeLog.ts` | Add new fields to interface and save payload |
| `src/components/practice-log/PracticeLogForm.tsx` | Add state, handlers, and UI for both sections |

---

## Visual Design

Each row in the new sections will look like the Repertoire rows:

```
○ [Text input field                    ]
○ [Text input field                    ]
○ [Text input field                    ]
○ [Text input field                    ]
[+ Add]
```

Where ○ is a round checkbox that can be checked to mark completion.
