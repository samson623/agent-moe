-- Browser Task Scheduling
-- Adds scheduled/recurring browser tasks powered by node-cron.

-- Schedule definitions table
CREATE TABLE IF NOT EXISTS browser_task_schedules (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Schedule definition
  name          TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('once', 'daily', 'weekly', 'custom_cron')),
  cron_expression TEXT,
  scheduled_at  TIMESTAMPTZ,
  timezone      TEXT NOT NULL DEFAULT 'UTC',

  -- Task template (used to create browser_tasks on each trigger)
  task_type     TEXT NOT NULL CHECK (task_type IN (
    'scrape', 'screenshot', 'click', 'fill_form',
    'navigate', 'monitor', 'extract_data', 'submit_form'
  )),
  url           TEXT NOT NULL,
  instructions  TEXT NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}',
  priority      INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  max_retries   INTEGER NOT NULL DEFAULT 3,
  timeout_ms    INTEGER NOT NULL DEFAULT 30000,

  -- State
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at   TIMESTAMPTZ,
  next_run_at   TIMESTAMPTZ,
  run_count     INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link spawned tasks back to their schedule
ALTER TABLE browser_tasks
  ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES browser_task_schedules(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_schedules_workspace ON browser_task_schedules(workspace_id);
CREATE INDEX idx_schedules_active_next ON browser_task_schedules(is_active, next_run_at);
CREATE INDEX idx_browser_tasks_schedule ON browser_tasks(schedule_id) WHERE schedule_id IS NOT NULL;

-- Auto-update updated_at
CREATE TRIGGER set_browser_task_schedules_updated_at
  BEFORE UPDATE ON browser_task_schedules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE browser_task_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their workspace browser task schedules"
  ON browser_task_schedules FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));
