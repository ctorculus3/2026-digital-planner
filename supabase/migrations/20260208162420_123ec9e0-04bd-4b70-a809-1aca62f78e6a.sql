-- Drop the restrictive INSERT policy and recreate as permissive
DROP POLICY "Users can insert their own badges" ON public.user_badges;

CREATE POLICY "Users can insert their own badges"
ON public.user_badges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also fix the SELECT policy (also restrictive)
DROP POLICY "Users can view their own badges" ON public.user_badges;

CREATE POLICY "Users can view their own badges"
ON public.user_badges
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);