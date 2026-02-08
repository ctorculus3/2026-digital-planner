
-- Allow all authenticated users to read profiles (needed for community post display)
CREATE POLICY "Authenticated users can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);
