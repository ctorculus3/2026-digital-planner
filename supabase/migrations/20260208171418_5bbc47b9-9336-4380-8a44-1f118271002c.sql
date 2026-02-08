
-- Re-add the FK constraint, but skip validation for existing rows (seed data)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) NOT VALID;
