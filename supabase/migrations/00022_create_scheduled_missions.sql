-- =============================================================================
-- Migration 00022: Scheduled Missions
-- =============================================================================
-- Purpose: General-purpose autonomous scheduled mission runner.
--   1. scheduled_missions — define any task, schedule it, set execution mode
--   2. scheduled_mission_runs — per-execution history log
-- =============================================================================

-- =============================================================================
-- TABLE 1: scheduled_missions
-- =============================================================================

CREATE TABLE IF NOT EXISTS scheduled_missions (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id              UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Identity
  name                      TEXT NOT NULL,
  instruction               TEXT NOT NULL,

  -- Schedule definition
  schedule_type             TEXT NOT NULL CHECK (schedule_type IN ('once', 'daily', 'hourly', 'weekly', 'custom_cron')),
  cron_expression           TEXT,
  scheduled_at              TIMESTAMPTZ,
  timezone                  TEXT NOT NULL DEFAULT 'America/New_York',

  -- Execution settings
  execution_mode            TEXT NOT NULL DEFAULT 'auto' CHECK (execution_mode IN ('light', 'heavy', 'auto')),
  permission_level          TEXT NOT NULL DEFAULT 'autonomous' CHECK (permission_level IN ('autonomous', 'draft')),
  operator_team             TEXT,
  tags                      TEXT[] NOT NULL DEFAULT '{}',
  config                    JSONB NOT NULL DEFAULT '{}',

  -- State
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at               TIMESTAMPTZ,
  next_run_at               TIMESTAMPTZ,
  run_count                 INTEGER NOT NULL DEFAULT 0,
  max_consecutive_failures  INTEGER NOT NULL DEFAULT 3,
  consecutive_failures      INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 2: scheduled_mission_runs
-- =============================================================================

CREATE TABLE IF NOT EXISTS scheduled_mission_runs (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_mission_id  UUID NOT NULL REFERENCES scheduled_missions(id) ON DELETE CASCADE,
  mission_id            UUID REFERENCES missions(id) ON DELETE SET NULL,

  -- Execution result
  status                TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'skipped')),
  execution_mode        TEXT NOT NULL,
  result_summary        TEXT,
  result_data           JSONB NOT NULL DEFAULT '{}',
  error_message         TEXT,
  tokens_used           INTEGER,
  duration_ms           INTEGER,

  -- Timing
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Runner query: find all active missions that are due
CREATE INDEX idx_scheduled_missions_active_next
  ON scheduled_missions(is_active, next_run_at);

-- Workspace-scoped listing
CREATE INDEX idx_scheduled_missions_workspace
  ON scheduled_missions(workspace_id);

-- Run history: most recent runs per schedule first
CREATE INDEX idx_scheduled_mission_runs_schedule_created
  ON scheduled_mission_runs(scheduled_mission_id, created_at DESC);

-- =============================================================================
-- TRIGGER: auto-update updated_at on scheduled_missions
-- =============================================================================

CREATE TRIGGER set_scheduled_missions_updated_at
  BEFORE UPDATE ON scheduled_missions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE scheduled_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_mission_runs ENABLE ROW LEVEL SECURITY;

-- scheduled_missions: users can manage missions belonging to their workspaces
CREATE POLICY "Users can manage their workspace scheduled missions"
  ON scheduled_missions FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));

-- scheduled_mission_runs: users can manage runs whose parent mission belongs to their workspaces
CREATE POLICY "Users can manage their workspace scheduled mission runs"
  ON scheduled_mission_runs FOR ALL
  USING (
    scheduled_mission_id IN (
      SELECT id FROM scheduled_missions
      WHERE workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    scheduled_mission_id IN (
      SELECT id FROM scheduled_missions
      WHERE workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
    )
  );
