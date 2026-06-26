ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS room_type text,
ADD COLUMN IF NOT EXISTS floor text,
ADD COLUMN IF NOT EXISTS bed_type text;

-- Reload the PostgREST schema cache so the API recognizes the new columns immediately
NOTIFY pgrst, 'reload schema';

