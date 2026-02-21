

# Replace Time Tracking with Practice Session Timer

## Overview
Replace the current manual Start Time / Stop Time / Total Time input section with an interactive practice session timer. The timer will have three states: **Idle** (ready to start), **Running** (counting up with pause/complete buttons), and **Completed** (showing summary with streak). This removes friction -- users just press "Start" and focus on practicing.

## Three States

### State 1: Idle (Before Starting)
- Large "Start Practice Session" button (primary color)
- Play icon on button
- Clean, inviting appearance using the project's `--time-section-bg` color

### State 2: Session In Progress
- Header text: "Session in progress"
- Large elapsed time counter (MM:SS format, counting UP)
- Progress bar showing elapsed time vs a soft goal (optional visual only)
- Two buttons side-by-side: "Pause" (outline) and "Complete" (accent/green)
- Pause toggles to "Resume" when paused

### State 3: Session Complete
- Checkmark icon (lucide `CheckCircle2`)
- "Today's session complete!" in accent green
- "You practiced for [H:MM]. See you tomorrow." in muted text
- "STREAK: X DAYS" badge with flame emoji
- A "Reset" option in case they want to start another session

## How It Works Technically

### New Component: `PracticeSessionTimer.tsx`
- Replaces the current time tracking grid (lines 466-489 of `PracticeLogForm.tsx`)
- Uses `useState` for session state: `idle | running | paused | completed`
- Uses `useRef` for interval (counts UP, not down)
- Tracks `startTimestamp` (Date) and accumulated `elapsedSeconds`
- On pause: stores accumulated seconds, clears interval
- On resume: starts new interval, adds to accumulated
- On complete: calculates total duration, auto-populates `startTime` and `stopTime` in the parent form so database persistence works exactly as before

### Integration with PracticeLogForm
- The new component receives callbacks: `onStart`, `onComplete(startTime, stopTime, totalTime)`
- `onComplete` sets `startTime`, `stopTime`, and triggers `markChanged()` + auto-save
- The `start_time`, `stop_time`, `total_time` database columns remain unchanged
- If the form loads with existing `start_time`/`stop_time` data, show the "completed" state with that data

### Streak Display
- Import `useUserStreak` hook to show the current streak in the completed state
- Shows "STREAK: X DAYS" with flame emoji, styled as a pill/badge

### Files to Create
- `src/components/practice-log/PracticeSessionTimer.tsx` -- new component with all three states

### Files to Modify
- `src/components/practice-log/PracticeLogForm.tsx` -- replace the time tracking grid (lines 465-489) with `<PracticeSessionTimer>`, pass appropriate props, keep all other sections untouched

## Design Details
- Background: `bg-[hsl(var(--time-section-bg))]` (matches existing time section)
- "Start" button: `bg-primary text-primary-foreground`, large rounded, with Play icon
- "Pause" button: `variant="outline"`, large
- "Complete" button: green accent (`bg-emerald-500 hover:bg-emerald-600 text-white`), large
- Completed checkmark: `text-emerald-500`
- "Today's session complete!": `text-emerald-500 font-bold`
- Streak badge: muted background pill with `text-foreground`
- Timer font: `font-display text-5xl font-bold tabular-nums`
- All centered layout within the card

## What Stays the Same
- Database schema: no changes needed
- All other form sections (Goals, Warmups, Scales, Repertoire, Notes, Metronome, Tuner, Drone, Timer widget, Ear Training, Additional Tasks, Music Listening) are completely untouched
- The existing Timer widget (countdown timer with presets) remains separate and unchanged
- Auto-save and manual save continue working as before
