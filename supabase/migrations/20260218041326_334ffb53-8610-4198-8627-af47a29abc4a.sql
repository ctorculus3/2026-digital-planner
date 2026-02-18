
-- Create tts_usage table
CREATE TABLE public.tts_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  text_length INTEGER NOT NULL,
  estimated_seconds INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tts_usage ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can insert their own usage
CREATE POLICY "Users can insert their own tts usage"
  ON public.tts_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RPC to get total seconds used this month (global)
CREATE OR REPLACE FUNCTION public.get_tts_usage_this_month()
  RETURNS INTEGER
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
  SELECT COALESCE(SUM(estimated_seconds), 0)::INTEGER
  FROM public.tts_usage
  WHERE created_at >= date_trunc('month', now());
$$;
