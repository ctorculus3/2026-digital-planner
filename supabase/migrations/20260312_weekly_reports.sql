-- Weekly Practice Reports: table, aggregation RPC, RLS, storage bucket
-- Supports AI-generated weekly practice report cards with shareable images

-- 1. Create weekly_reports table
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Aggregated stats
  total_minutes INTEGER NOT NULL DEFAULT 0,
  session_count INTEGER NOT NULL DEFAULT 0,
  streak_at_generation INTEGER NOT NULL DEFAULT 0,

  -- Practice breakdown by category
  category_breakdown JSONB NOT NULL DEFAULT '{}',

  -- Pieces/repertoire practiced
  pieces_practiced TEXT[] NOT NULL DEFAULT '{}',

  -- AI-generated content
  ai_insight TEXT,
  ai_next_week_focus TEXT,

  -- Badges earned during this week
  badges_earned TEXT[] NOT NULL DEFAULT '{}',

  -- Sharing
  share_image_path TEXT,
  community_post_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, week_start)
);

-- 2. Enable RLS
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reports"
  ON public.weekly_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON public.weekly_reports FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role handles inserts via Edge Function (bypasses RLS)

-- 3. Index for fast lookups
CREATE INDEX idx_weekly_reports_user_week
  ON public.weekly_reports (user_id, week_start DESC);

-- 4. Aggregation RPC function
CREATE OR REPLACE FUNCTION public.aggregate_weekly_practice(
  p_user_id UUID,
  p_week_start DATE,
  p_week_end DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
  logs RECORD;
  total_mins INTEGER := 0;
  session_cnt INTEGER := 0;
  warmup_count INTEGER := 0;
  scale_count INTEGER := 0;
  repertoire_count INTEGER := 0;
  ear_training_count INTEGER := 0;
  music_listening_count INTEGER := 0;
  additional_count INTEGER := 0;
  all_repertoire TEXT[] := '{}';
  all_goals TEXT[] := '{}';
BEGIN
  FOR logs IN
    SELECT * FROM public.practice_logs
    WHERE user_id = p_user_id
      AND log_date >= p_week_start
      AND log_date <= p_week_end
      AND total_time IS NOT NULL
      AND total_time > INTERVAL '0'
    ORDER BY log_date
  LOOP
    session_cnt := session_cnt + 1;
    total_mins := total_mins + EXTRACT(EPOCH FROM logs.total_time)::integer / 60;

    warmup_count := warmup_count + COALESCE(array_length(logs.warmups, 1), 0);
    scale_count := scale_count + COALESCE(array_length(logs.scales, 1), 0);
    repertoire_count := repertoire_count + COALESCE(array_length(logs.repertoire, 1), 0);
    ear_training_count := ear_training_count + COALESCE(array_length(logs.ear_training, 1), 0);
    music_listening_count := music_listening_count + COALESCE(array_length(logs.music_listening, 1), 0);
    additional_count := additional_count + COALESCE(array_length(logs.additional_tasks, 1), 0);

    IF logs.repertoire IS NOT NULL THEN
      all_repertoire := all_repertoire || logs.repertoire;
    END IF;

    IF logs.goals IS NOT NULL AND logs.goals != '' THEN
      all_goals := array_append(all_goals, logs.goals);
    END IF;
  END LOOP;

  result := jsonb_build_object(
    'total_minutes', total_mins,
    'session_count', session_cnt,
    'category_breakdown', jsonb_build_object(
      'warmups', warmup_count,
      'scales', scale_count,
      'repertoire', repertoire_count,
      'ear_training', ear_training_count,
      'music_listening', music_listening_count,
      'additional_tasks', additional_count
    ),
    'pieces_practiced', (SELECT ARRAY(SELECT DISTINCT unnest(all_repertoire))),
    'goals_this_week', all_goals
  );

  RETURN result;
END;
$$;

-- 5. Create storage bucket for report images
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: users can upload their own report images
CREATE POLICY "Users can upload own report images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'report-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: anyone can view report images (public bucket for sharing)
CREATE POLICY "Public read access for report images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-images');

-- Storage policy: users can delete own report images
CREATE POLICY "Users can delete own report images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'report-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
