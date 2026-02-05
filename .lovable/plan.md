
# Expandable Input Rows for Practice Log

## Summary
Add "+" buttons to Warm-ups, Scales, and Repertoire sections that allow users to dynamically add more input rows.

## Section Configurations

| Section | Starting Rows | Maximum Rows |
|---------|---------------|--------------|
| Warm-ups | 4 | 10 |
| Scales | 4 | 10 |
| Repertoire & Exercises | 10 | 15 |

## Implementation

### 1. Add Count State Variables
Track how many rows are visible for each section:
- `warmupCount` - starts at 4, max 10
- `scaleCount` - starts at 4, max 10  
- `repertoireCount` - starts at 10, max 15

### 2. Expand Internal Arrays
Change arrays to support maximum sizes:
- Warmups: 10 slots (up from 4)
- Scales: 10 slots (up from 4)
- Repertoire: 15 slots (up from 10)

### 3. Add Row Functions
```typescript
const addWarmup = () => {
  if (warmupCount < 10) {
    setWarmupCount(prev => prev + 1);
    markChanged();
  }
};
// Similar for scales and repertoire
```

### 4. Update Data Loading
When loading saved data, set visible count to match:
- `warmupCount = max(4, savedWarmups.length)`
- `scaleCount = max(4, savedScales.length)`
- `repertoireCount = max(10, savedRepertoire.length)`

### 5. Update UI Rendering
For each section:
- Render only `count` number of input rows
- Show "+" button if below maximum
- Button styled with Plus icon and muted text

### Visual Design
```text
Warm-ups
  1  [________________]
  2  [________________]
  3  [________________]
  4  [________________]
       [+ Add]          <- disappears at 10

Repertoire & Exercises
  ○  [________________]
  ○  [________________]
  ... (10 total)
       [+ Add]          <- disappears at 15
```

## Technical Details

### File to Modify
- `src/components/practice-log/PracticeLogForm.tsx`

### Changes Required
1. Import `Plus` icon from lucide-react
2. Add 3 new state variables for counts
3. Add 3 new functions to add rows
4. Update `useEffect` to set counts when loading data
5. Update initial state arrays to support max sizes
6. Modify render loops to use counts instead of full arrays
7. Add "+" buttons below each section

### Data Persistence
No database changes needed - the save function already filters out empty entries, so only filled rows are stored regardless of how many input boxes are shown.

## Testing
1. Tap "+" under Warm-ups - adds 5th input (up to 10)
2. Tap "+" under Scales - adds 5th input (up to 10)
3. Tap "+" under Repertoire - adds 11th input (up to 15)
4. "+" button disappears when max is reached
5. Save, refresh - correct number of rows restored
6. New day - resets to default counts (4, 4, 10)
