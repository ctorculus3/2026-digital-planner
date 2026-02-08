
-- Drop the FK constraint on profiles to allow seed data
ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
