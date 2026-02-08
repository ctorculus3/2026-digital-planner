
-- Fix 1: Tighten profiles public exposure
-- Drop the overly broad "anyone can view" policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Allow authenticated users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow viewing profiles only for users who have active shared practice logs
-- This is needed so the shared practice log page can display the sharer's name
CREATE POLICY "Anyone can view profiles of shared log creators"
  ON public.profiles FOR SELECT
  USING (id IN (
    SELECT created_by FROM public.shared_practice_logs 
    WHERE expires_at IS NULL OR expires_at > now()
  ));

-- Fix 2: Create an RPC to look up shared practice logs by token
-- This avoids exposing the created_by UUID directly to clients
CREATE OR REPLACE FUNCTION public.lookup_shared_practice_log(p_share_token text)
RETURNS TABLE (practice_log_id uuid, sharer_display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT spl.practice_log_id, p.display_name
  FROM public.shared_practice_logs spl
  LEFT JOIN public.profiles p ON p.id = spl.created_by
  WHERE spl.share_token = p_share_token
    AND (spl.expires_at IS NULL OR spl.expires_at > now());
$$;
