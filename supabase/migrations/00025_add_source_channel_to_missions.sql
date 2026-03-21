-- Add source_channel to missions so we can track where a mission originated
-- (telegram, dashboard, api, scheduler, etc.) for notification routing and analytics.

ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS source_channel TEXT DEFAULT 'dashboard';

-- Index for filtering missions by source
CREATE INDEX IF NOT EXISTS idx_missions_source_channel ON missions (source_channel);

-- Backfill existing Telegram-sourced missions from meta JSONB
UPDATE missions
  SET source_channel = 'telegram'
  WHERE meta ->> 'source' = 'telegram'
    AND source_channel = 'dashboard';
