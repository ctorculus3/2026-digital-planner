

# Clickable Calendar Dates + Today Highlighting

## What Changes

### 1. Tappable Calendar Days
Each date cell on the Dashboard calendar becomes a clickable button. When you tap a date that falls within the displayed month, you'll be navigated directly to that day's journal entry at `/journal?date=2026-02-05`. The Journal already reads the `?date=` parameter and opens the correct day, so no changes are needed on the Journal side.

### 2. Distinct "Today" Color
Today's date gets a unique visual treatment so it stands out from both practiced days and regular days:
- **Today (not practiced)**: A coral/orange ring and bold text using the app's primary accent color (`--primary`)
- **Today (practiced)**: Teal fill with a coral/orange ring around it, combining both indicators
- **Practiced days**: Teal filled circle (unchanged)
- **Regular days**: Plain text (unchanged)

This makes it easy to spot "today" at a glance regardless of whether you've practiced yet.

---

## Technical Details

### Files Modified

| File | Change |
|---|---|
| `src/components/dashboard/PracticeCalendar.tsx` | Add `onDateClick` prop, make day cells clickable buttons, update today styling |
| `src/pages/Dashboard.tsx` | Pass `onDateClick` handler that navigates to `/journal?date=YYYY-MM-DD` |

### PracticeCalendar Changes
- Add an `onDateClick?: (dateStr: string) => void` prop to the component interface
- Wrap each in-month day cell in a `<button>` element with `cursor-pointer` and hover effect
- Update today's styling: replace the current `ring-1 ring-header-bg` with `ring-2 ring-primary` (coral/orange ring) so it's visually distinct from the teal practiced-day circles
- When today is also a practiced day, show both the teal fill and the coral ring

### Dashboard Changes
- Import `useNavigate` from `react-router-dom`
- Pass an `onDateClick` callback to `PracticeCalendar` that calls `navigate(\`/journal?date=\${dateStr}\`)`

