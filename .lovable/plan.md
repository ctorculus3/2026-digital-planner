

# Phase 1: Dashboard with Calendar, Streaks, and Badges

## Overview

Add a new Dashboard page as a separate route (`/dashboard`) alongside the existing practice journal. After login, users land on the Dashboard, which shows a monthly practice calendar with colored dots on practiced days, a practice streak counter, and collectible streak badges. The journal stays at its current route, accessible via navigation tabs.

---

## User Experience

### Navigation
- A small nav bar will appear below the scallop header on both the Dashboard and Journal pages
- Two tabs: **Dashboard** and **Journal**
- After login, users land on the Dashboard (`/dashboard` becomes the new default route)
- The Journal moves to `/journal`

### Dashboard Layout
- **Monthly Calendar**: Displays the current month in a grid. Days that have a practice log entry show a colored circle (using the app's teal accent). Users can click month arrows to browse previous/future months.
- **Streak Counter**: A prominent display showing the current consecutive-day practice streak (e.g., "12 days in a row"). Counts backward from today -- any gap breaks the streak.
- **Badge Shelf**: Displays earned badges for milestone streaks:
  - 10-Day Streak
  - 30-Day Streak
  - 50-Day Streak
  - 100-Day Streak
  
  Unearned badges appear as grayed-out/locked. Once earned, a badge is permanent even if the streak later breaks.

---

## Technical Details

### 1. Database Migration

**New table: `user_badges`**
Stores permanently earned badges so they persist even after a streak resets.

```text
user_badges
  id          uuid (PK, default gen_random_uuid())
  user_id     uuid (NOT NULL)
  badge_type  text (NOT NULL) -- e.g. 'streak_10', 'streak_30', 'streak_50', 'streak_100'
  earned_at   timestamptz (NOT NULL, default now())
  UNIQUE(user_id, badge_type)
```

RLS policies:
- Users can SELECT their own badges
- Users can INSERT their own badges
- No UPDATE or DELETE needed

**New database function: `get_practice_streak(p_user_id uuid)`**
A `SECURITY DEFINER` function that calculates the current consecutive-day streak by querying `practice_logs` for distinct `log_date` values, ordered descending, counting backward from today until a gap is found.

**New database function: `get_practiced_dates(p_user_id uuid, p_year int, p_month int)`**
Returns an array of dates in the given month where the user has a practice log entry. Used to render calendar dots.

### 2. New Files

| File | Purpose |
|---|---|
| `src/pages/Dashboard.tsx` | Dashboard page component |
| `src/hooks/useDashboardData.ts` | Hook to fetch practiced dates, streak, and badges |
| `src/components/dashboard/PracticeCalendar.tsx` | Monthly calendar grid with colored dots |
| `src/components/dashboard/StreakCounter.tsx` | Streak display with flame/star icon |
| `src/components/dashboard/BadgeShelf.tsx` | Badge collection display |
| `src/components/dashboard/DashboardNav.tsx` | Navigation tabs (Dashboard / Journal) |

### 3. Modified Files

| File | Change |
|---|---|
| `src/App.tsx` | Add `/dashboard` route (new default), move journal to `/journal`, redirect `/` to `/dashboard` |
| `src/components/practice-log/PracticeLogCalendar.tsx` | Add `DashboardNav` below the scallop header |

### 4. Frontend Logic

**`useDashboardData` hook:**
- Fetches practiced dates for the viewed month via `get_practiced_dates` RPC
- Fetches current streak via `get_practice_streak` RPC
- Fetches earned badges from `user_badges` table
- When streak crosses a badge threshold (10, 30, 50, 100), automatically inserts the badge into `user_badges` if not already earned

**`PracticeCalendar` component:**
- Renders a standard month grid (Sun-Sat columns)
- Days with practice entries get a colored circle overlay using the `--header-bg` teal color
- Month navigation arrows to browse forward/backward
- Today's date is highlighted

**`StreakCounter` component:**
- Shows a large number with a flame icon and "day streak" label
- Animates on load for visual appeal

**`BadgeShelf` component:**
- Displays four badge cards in a row
- Earned badges show in full color with the earned date
- Unearned badges appear grayed-out with the threshold label (e.g., "10 Days")
- Uses medal/trophy icons from lucide-react

**`DashboardNav` component:**
- A simple two-tab navigation bar using the app's existing `--time-section-bg` light green background
- Active tab is visually distinguished
- Links to `/dashboard` and `/journal`

### 5. Routing Changes

```text
/           --> Redirect to /dashboard
/dashboard  --> ProtectedRoute > SubscriptionGate > Dashboard
/journal    --> ProtectedRoute > SubscriptionGate > Index (existing journal)
/staff-paper --> (unchanged)
/auth        --> (unchanged)
/shared/:token --> (unchanged)
```

### 6. Design

The Dashboard follows the existing notebook aesthetic:
- Same scallop header at the top
- Light green accent background (`--time-section-bg`) for section cards
- Teal (`--header-bg`) colored dots on the calendar
- Badge icons use warm gold/amber tones matching the app's coral/teal palette
- Cards use the existing `bg-card` with `border-border` styling

