

## Fix: Inconsistent Streak Counter

### Root Cause

The `get_practice_streak` database function starts counting from **today** (`CURRENT_DATE`) and walks backward. If you haven't logged practice **today yet**, it finds no log for today and immediately returns **0** -- even though you have a 12-day streak going through yesterday.

The "sometimes 12, sometimes 0" behavior happens because:
- **Shows 12**: When you view the dashboard on a day you've already logged (or from a cached result)
- **Shows 0**: When you view it before logging today's practice

### The Fix

Update the database function so that if there's no log for today, it starts counting from **yesterday** instead. This way your streak stays visible all day and only resets if you miss an entire day.

### Technical Details

**Database migration** -- Replace the `get_practice_streak` function:

```sql
CREATE OR REPLACE FUNCTION public.get_practice_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  has_log BOOLEAN;
BEGIN
  -- Check if there's a log for today
  SELECT EXISTS (
    SELECT 1 FROM public.practice_logs
    WHERE user_id = p_user_id AND log_date = check_date
  ) INTO has_log;

  -- If no log today, start from yesterday
  IF NOT has_log THEN
    check_date := check_date - INTERVAL '1 day';
  END IF;

  -- Count consecutive days backward
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.practice_logs
      WHERE user_id = p_user_id AND log_date = check_date
    ) INTO has_log;

    IF NOT has_log THEN
      EXIT;
    END IF;

    streak := streak + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;

  RETURN streak;
END;
$$;
```

No frontend code changes needed -- the same RPC call will now return the correct value consistently.

