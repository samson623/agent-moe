-- Add recording URL column to browser_tasks
-- Stores the public URL path to the MP4 recording of a browser task execution

ALTER TABLE browser_tasks
ADD COLUMN IF NOT EXISTS recording_url TEXT;

COMMENT ON COLUMN browser_tasks.recording_url IS 'Public URL path to the MP4 recording of this task execution';
