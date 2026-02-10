ALTER TABLE practice_media DROP CONSTRAINT practice_media_media_type_check;
ALTER TABLE practice_media ADD CONSTRAINT practice_media_media_type_check 
  CHECK (media_type = ANY (ARRAY['audio'::text, 'video'::text, 'youtube'::text, 'photo'::text]));