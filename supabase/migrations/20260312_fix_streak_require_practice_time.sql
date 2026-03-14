-- Fix streak calculation: only count days where actual practice time was logged.
-- Previously, any practice_logs row (even empty/auto-saved) counted toward the streak.
CREATE OR REPLACE FUNCTION public.get_practice_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  has_log BOOLEAN;
BEGIN
  -- If user hasn't practiced today yet, give grace period and start from yesterday
  SELECT EXISTS (
    SELECT 1 FROM public.practice_logs
    WHERE user_id = p_user_id
      AND log_date = check_date
      AND total_time IS NOT NULL
      AND total_time > INTERVAL '0'
  ) INTO has_log;

  IF NOT has_log THEN
    check_date := check_date - INTERVAL '1 day';
  END IF;

  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.practice_logs
      WHERE user_id = p_user_id
        AND log_date = check_date
        AND total_time IS NOT NULL
        AND total_time > INTERVAL '0'
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

-- Also fix get_practiced_dates so the calendar only highlights days with actual practice time.
CREATE OR REPLACE FUNCTION public.get_practiced_dates(p_user_id UUID, p_year INTEGER, p_month INTEGER)
RETURNS DATE[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result DATE[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT log_date ORDER BY log_date)
  INTO result
  FROM public.practice_logs
  WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM log_date) = p_year
    AND EXTRACT(MONTH FROM log_date) = p_month
    AND total_time IS NOT NULL
    AND total_time > INTERVAL '0';

  RETURN COALESCE(result, ARRAY[]::DATE[]);
END;
$$;
