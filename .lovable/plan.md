

# Change Week Navigation to Land on Weekend Boundaries

## What Changes

Instead of jumping exactly 7 days, the backward and forward week tabs will navigate to the edge of the adjacent week:

- **Backward tab**: Always lands on **Saturday** of the previous week (the last day of that week)
- **Forward tab**: Always lands on **Sunday** of the next week (the first day of that week)

This makes navigating between weeks feel like "flipping pages" -- backward takes you to the end of the previous week, forward takes you to the start of the next week.

## Examples

| Current Date | Press Backward | Press Forward |
|---|---|---|
| Sun Feb 8 | Sat Feb 7 | Sun Feb 15 |
| Wed Feb 11 | Sat Feb 7 | Sun Feb 15 |
| Sat Feb 14 | Sat Feb 7 | Sun Feb 15 |

## Change

### `src/components/practice-log/PracticeLogCalendar.tsx`

Update the two handler functions with new date math:

- **`handlePrevWeek`**: Calculate the previous Saturday by subtracting `(dayOfWeek + 1)` days from the current date. For example, from Sunday (day 0) that's 1 day back; from Wednesday (day 3) that's 4 days back.

- **`handleNextWeek`**: Calculate the next Sunday by adding `(7 - dayOfWeek)` days from the current date. For example, from Saturday (day 6) that's 1 day forward; from Wednesday (day 3) that's 4 days forward.

No other files need changes -- the `DayTabs` component and styling remain the same.

