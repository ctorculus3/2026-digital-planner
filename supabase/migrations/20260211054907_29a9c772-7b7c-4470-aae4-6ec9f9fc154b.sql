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
  SELECT EXISTS (
    SELECT 1 FROM public.practice_logs
    WHERE user_id = p_user_id AND log_date = check_date
  ) INTO has_log;

  IF NOT has_log THEN
    check_date := check_date - INTERVAL '1 day';
  END IF;

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