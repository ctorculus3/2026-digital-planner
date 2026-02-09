

## Add Practice Time Summary to the Dashboard

Display practice time totals (Today, This Week, This Month, Total) alongside the existing streak counter in a single unified section.

### Data Approach

The `practice_logs` table already stores `total_time` as a Postgres `interval`. Rather than creating a database function, we'll query practice logs directly on the client side with date filters, then sum the intervals in JavaScript. This keeps it simple and avoids a migration.

### What Changes

**1. `src/hooks/useDashboardData.ts`** -- Add practice time fetching

- Add a new `practiceTime` state object with four fields: `today`, `thisWeek`, `thisMonth`, `total` (all in minutes as numbers)
- In `fetchData`, add a query to fetch `total_time` and `log_date` from `practice_logs` for the current user (no date filter -- we need all-time totals)
- Parse the interval strings (e.g., "01:45:00") into minutes
- Calculate the four buckets using date comparisons (today, start of week, start of month)
- Return `practiceTime` alongside existing data

**2. `src/components/dashboard/StreakCounter.tsx`** -- Expand to include time stats

- Rename to accept `practiceTime` prop alongside `streak`
- Keep the existing flame icon + streak counter on the left
- Add a vertical divider
- Add the four time stats (Today, This Week, This Month, Total) on the right, formatted as `H:MM`
- Use a responsive layout: side-by-side on desktop, stacked on mobile

**3. `src/pages/Dashboard.tsx`** -- Pass new data

- Destructure `practiceTime` from `useDashboardData` and pass it to `StreakCounter`

### Time Formatting

Times will display as hours and minutes in `H:MM` format:
- Under 1 hour: `0:45`
- Over 1 hour: `1:45`
- Large totals: `12:50`

The label will say "hrs" to clarify (e.g., "Today: 1:45 hrs").

### Technical Notes

- The query fetches all practice logs for the user (needed for "Total"). Since each user typically has tens to low hundreds of logs, this is efficient.
- Logs with `null` total_time are skipped in the sum.
- "This Week" uses Monday as the start of the week (ISO standard), matching typical practice schedules.
- The interval parsing handles the `HH:MM:SS` format returned by Postgres.

