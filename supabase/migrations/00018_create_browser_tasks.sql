-- Phase 8: Browser Agent Layer
-- Creates browser_tasks and browser_sessions tables for Playwright automation.

-- Add browser_agent to operator_team enum (for job routing)
ALTER TYPE operator_team ADD VALUE IF NOT EXISTS 'browser_agent';

-- Main browser tasks table
CREATE TABLE IF NOT EXISTS browser_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

  -- Task identity
  task_type TEXT NOT NULL CHECK (task_type IN (
    'scrape', 'screenshot', 'click', 'fill_form',
    'navigate', 'monitor', 'extract_data', 'submit_form'
  )),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'cancelled', 'timeout'
  )),

  -- Execution config
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  url TEXT NOT NULL,
  instructions TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',

  -- Result storage
  result JSONB,
  screenshot_url TEXT,
  error_message TEXT,

  -- Retry management
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,

  -- Timing
  timeout_ms INTEGER NOT NULL DEFAULT 30000,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Browser sessions table (tracks Playwright browser instances)
CREATE TABLE IF NOT EXISTS browser_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  browser_task_id UUID REFERENCES browser_tasks(id) ON DELETE SET NULL,

  session_type TEXT NOT NULL DEFAULT 'headless' CHECK (session_type IN ('headless', 'headed', 'mobile')),
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'closed', 'crashed')),
  browser_type TEXT NOT NULL DEFAULT 'chromium' CHECK (browser_type IN ('chromium', 'firefox', 'webkit')),

  user_agent TEXT,
  viewport_width INTEGER NOT NULL DEFAULT 1280,
  viewport_height INTEGER NOT NULL DEFAULT 720,

  logs JSONB[] NOT NULL DEFAULT '{}',

  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for browser_tasks
CREATE INDEX idx_browser_tasks_workspace ON browser_tasks(workspace_id);
CREATE INDEX idx_browser_tasks_status ON browser_tasks(workspace_id, status);
CREATE INDEX idx_browser_tasks_task_type ON browser_tasks(workspace_id, task_type);
CREATE INDEX idx_browser_tasks_mission ON browser_tasks(mission_id) WHERE mission_id IS NOT NULL;
CREATE INDEX idx_browser_tasks_created_at ON browser_tasks(workspace_id, created_at DESC);
CREATE INDEX idx_browser_tasks_priority ON browser_tasks(workspace_id, priority DESC, created_at ASC) WHERE status = 'pending';

-- Indexes for browser_sessions
CREATE INDEX idx_browser_sessions_workspace ON browser_sessions(workspace_id);
CREATE INDEX idx_browser_sessions_status ON browser_sessions(workspace_id, status);

-- Auto-update updated_at triggers
CREATE TRIGGER set_browser_tasks_updated_at
  BEFORE UPDATE ON browser_tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_browser_sessions_updated_at
  BEFORE UPDATE ON browser_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable Realtime for browser_tasks
ALTER PUBLICATION supabase_realtime ADD TABLE browser_tasks;
ALTER TABLE browser_tasks REPLICA IDENTITY FULL;

-- RLS
ALTER TABLE browser_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their workspace browser tasks"
  ON browser_tasks FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their workspace browser sessions"
  ON browser_sessions FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));
