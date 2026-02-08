
-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Users can view their own badges
CREATE POLICY "Users can view their own badges"
  ON public.user_badges
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own badges
CREATE POLICY "Users can insert their own badges"
  ON public.user_badges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function: get_practice_streak
-- Calculates consecutive practice days ending today
CREATE OR REPLACE FUNCTION public.get_practice_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  has_log BOOLEAN;
BEGIN
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

-- Function: get_practiced_dates
-- Returns array of dates in a given month where user has practice logs
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
    AND EXTRACT(MONTH FROM log_date) = p_month;

  RETURN COALESCE(result, ARRAY[]::DATE[]);
END;
$$;
