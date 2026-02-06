ALTER TABLE practice_logs 
ADD COLUMN additional_tasks text[] DEFAULT '{}',
ADD COLUMN additional_tasks_completed boolean[] DEFAULT '{}',
ADD COLUMN music_listening text[] DEFAULT '{}',
ADD COLUMN music_listening_completed boolean[] DEFAULT '{}';