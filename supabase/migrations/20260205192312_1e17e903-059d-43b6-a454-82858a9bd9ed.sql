-- Create shared_practice_logs table
CREATE TABLE public.shared_practice_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_log_id UUID NOT NULL REFERENCES public.practice_logs(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.shared_practice_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create share tokens for their own practice logs
CREATE POLICY "Users can create share tokens for own logs"
ON public.shared_practice_logs
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  practice_log_id IN (SELECT id FROM public.practice_logs WHERE user_id = auth.uid())
);

-- Policy: Users can view their own share tokens
CREATE POLICY "Users can view their own share tokens"
ON public.shared_practice_logs
FOR SELECT
USING (created_by = auth.uid());

-- Policy: Users can delete their own share tokens
CREATE POLICY "Users can delete their own share tokens"
ON public.shared_practice_logs
FOR DELETE
USING (created_by = auth.uid());

-- Policy: Anyone can look up share tokens (for public access)
CREATE POLICY "Anyone can lookup share tokens"
ON public.shared_practice_logs
FOR SELECT
USING (
  (expires_at IS NULL OR expires_at > now())
);

-- Add policy on practice_logs to allow public read via valid share token
CREATE POLICY "Anyone can view shared practice logs"
ON public.practice_logs
FOR SELECT
USING (
  id IN (
    SELECT practice_log_id FROM public.shared_practice_logs
    WHERE (expires_at IS NULL OR expires_at > now())
  )
);