

## Add Practice Hours Graph with Weekly/Monthly/Yearly Tabs

### Overview
Add a bar chart below the "Hours of Practice" summary showing practice time over time, with tabs to switch between Weekly (default), Monthly, and Yearly views. Also reorder the dashboard sections.

### New Section Order
1. Day Streak
2. Practice Calendar
3. Hours of Practice (summary)
4. Hours of Practice Graph (new)
5. Streak Badges

### New Files

**`src/components/dashboard/PracticeTimeGraph.tsx`**
- A new component that receives the raw practice log data (array of `{ log_date, total_time }`) and renders a bar chart using `recharts` (already installed) with the existing `ChartContainer` / `ChartTooltip` from `src/components/ui/chart.tsx`.
- Uses Radix `Tabs` (already installed) to switch between Weekly, Monthly, and Yearly views.
- **Weekly view (default)**: Shows 7 bars for Mon--Sun of the current week, each bar = total hours practiced that day.
- **Monthly view**: Shows ~4--5 bars, one per week of the current month, each bar = total hours for that week.
- **Yearly view**: Shows 12 bars for Jan--Dec of the current year, each bar = total hours for that month.
- X-axis labels: day names (Mon, Tue...) for weekly; "Wk 1, Wk 2..." for monthly; month abbreviations (Jan, Feb...) for yearly.
- Y-axis: hours (decimal, e.g. 1.5).
- Bar color: uses the existing `header-bg` theme color (teal) to match the calendar indicators.
- Loading state: skeleton placeholder matching the card style.

### Modified Files

**`src/hooks/useDashboardData.ts`**
- Export the raw practice logs array (`{ log_date: string, total_time: string }[]`) alongside existing return values so the graph component can compute its own aggregations.
- Add a new state variable `practiceLogs` populated from the existing `timeRes.data` fetch (no additional network request needed).

**`src/pages/Dashboard.tsx`**
- Import the new `PracticeTimeGraph` component.
- Reorder the sections in the JSX to: StreakCounter, PracticeCalendar, PracticeTimeSummary, PracticeTimeGraph, BadgeShelf.
- Pass `practiceLogs` and `loading` to `PracticeTimeGraph`.

### Technical Details

- Graph data aggregation happens client-side in `PracticeTimeGraph` using `useMemo`, recomputing when logs or the selected tab changes.
- The `parseIntervalToMinutes` utility will be extracted and shared (or duplicated in the graph component) to convert Postgres interval strings to minutes.
- `date-fns` (already installed) handles all date math: `startOfWeek`, `endOfWeek`, `startOfMonth`, `eachDayOfInterval`, `format`, `getISOWeek`.
- The `recharts` `BarChart` with `Bar`, `XAxis`, `YAxis`, `CartesianGrid` components will be used directly (the project already uses recharts v2.15).
- Tabs use the existing `Tabs`, `TabsList`, `TabsTrigger` from `src/components/ui/tabs.tsx`.

