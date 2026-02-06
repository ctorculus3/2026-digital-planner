ALTER TABLE public.practice_logs
  ADD COLUMN ear_training text[] DEFAULT '{}',
  ADD COLUMN ear_training_completed boolean[] DEFAULT '{}';