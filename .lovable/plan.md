

# Add Previous/Next Week Tabs to Day Tabs

## Overview

Add two navigation tabs to the weekday tab strip on the right side: a **backward arrow tab** before Sunday to jump to the previous week, and a **forward arrow tab** after Saturday to jump to the next week. These will visually match the existing day tabs but use arrow symbols instead of day names.

## Changes

### 1. `src/components/practice-log/DayTabs.tsx`

- Add two new props: `onPrevWeek` and `onNextWeek` (callback functions)
- Before the Sunday tab, render a "previous week" button with a left/up-pointing arrow (e.g., chevron icon or simple arrow character like "<<")
- After the Saturday tab, render a "next week" button with a right/down-pointing arrow
- Both tabs use the same vertical text styling and rounded-right shape as the day tabs
- Use a neutral/distinct color (like a muted gray or a contrasting accent) so they stand out as navigation controls rather than day selectors

### 2. `src/components/practice-log/PracticeLogCalendar.tsx`

- Add two new handler functions:
  - `handlePrevWeek`: subtracts 7 days from the current date using `subDays(currentDate, 7)`
  - `handleNextWeek`: adds 7 days to the current date using `addDays(currentDate, 7)`
- Pass these handlers to `DayTabs` as `onPrevWeek` and `onNextWeek` props

### 3. `src/index.css` (minor)

- Add a CSS variable for the navigation tab color (e.g., `--tab-nav`) so it has a distinct but harmonious appearance with the existing day tab rainbow

### 4. `tailwind.config.ts` (minor)

- Register the new `tab-nav` color utility class

## Visual Layout (top to bottom on right side)

```text
[ STAFF PAPER ]
[   <<  ]  <-- Previous week tab (new)
[  SUN  ]
[  MON  ]
[ TUES  ]
[  WED  ]
[ THUR  ]
[  FRI  ]
[  SAT  ]
[   >>  ]  <-- Next week tab (new)
```

## Technical Details

The new tabs will use `ChevronUp` and `ChevronDown` icons from lucide-react (since the tabs are vertical, up = backward in time, down = forward in time). They'll share the same rounded-right styling, shadow, and hover effects as the existing day tabs but won't have the "selected" ring indicator since they're action buttons, not selectors.

No database changes needed -- this is purely a UI/navigation enhancement using the existing `setCurrentDate` state in `PracticeLogCalendar`.
