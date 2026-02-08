

# Test: 10-Day Streak Badge Awarding

## What We'll Do

Insert practice log entries for three missing dates to create a continuous 10-day streak, then verify the badge is automatically awarded when the Dashboard loads.

## Current State

- Streak: 5 days (Feb 4-8)
- Gap at: Feb 3 (breaks connection to Feb 1-2)
- Missing before Feb 1: Jan 30, Jan 31
- Badges earned: none

## Test Steps

### Step 1: Insert Missing Practice Logs

Add minimal practice log entries for three dates to create an unbroken 10-day chain:
- **Jan 30** (new)
- **Jan 31** (new)
- **Feb 3** (fills the gap)

This creates: Jan 30, 31, Feb 1, 2, 3, 4, 5, 6, 7, 8 = **10 consecutive days**

No code changes needed -- just three INSERT statements into `practice_logs` using the existing user ID.

### Step 2: Refresh the Dashboard

When the Dashboard loads, the `useDashboardData` hook will:
1. Call `get_practice_streak` -- which should now return **10**
2. Check badge thresholds -- streak >= 10 and `streak_10` not yet earned
3. Automatically INSERT a row into `user_badges` with `badge_type = 'streak_10'`

### Step 3: Verify

- The **StreakCounter** should display **10**
- The **BadgeShelf** should show the **10 Days** badge as earned (colored, with today's date)
- The other three badges (30, 50, 100) should remain grayed out

### Technical Details

**SQL to insert test data** (will be run as a database operation):

```text
INSERT INTO practice_logs (user_id, log_date)
VALUES
  ('2c0aef3a-...', '2026-01-30'),
  ('2c0aef3a-...', '2026-01-31'),
  ('2c0aef3a-...', '2026-02-03');
```

**No code files are modified** -- this is purely a data test to verify the existing badge-awarding logic works correctly.

### What Success Looks Like

After refreshing the Dashboard:
- Streak counter shows "10"
- The first badge (10 Days / Medal icon) lights up in color with today's date shown beneath it
- The remaining three badges stay grayed out
- The January calendar view (navigate back one month) shows Jan 30-31 with teal dots

