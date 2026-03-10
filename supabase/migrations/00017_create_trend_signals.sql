-- Phase 7: Trend & Signal Engine
-- Creates the trend_signals table for storing AI-scored trend intelligence.

-- Momentum enum
CREATE TYPE signal_momentum AS ENUM ('explosive', 'rising', 'stable', 'falling');

-- Main table
CREATE TABLE IF NOT EXISTS trend_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Core signal identity
  topic TEXT NOT NULL,
  category TEXT, -- 'ai', 'productivity', 'marketing', 'finance', 'health', 'creator_economy', etc.

  -- AI-scored metrics
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  opportunity_score INTEGER NOT NULL DEFAULT 0 CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  audience_fit DECIMAL(4,3) NOT NULL DEFAULT 0.0 CHECK (audience_fit >= 0 AND audience_fit <= 1),

  -- Momentum tracking
  momentum signal_momentum NOT NULL DEFAULT 'stable',

  -- Platform this signal is strongest on
  platform TEXT,

  -- Research data
  source_urls TEXT[] DEFAULT '{}',
  competitor_gaps TEXT[] DEFAULT '{}',

  -- JSONB payloads
  market_angles JSONB DEFAULT '[]',  -- [{angle, rationale, cta_angle}]
  content_ideas JSONB DEFAULT '[]',  -- [{title, format, hook, estimated_reach}]
  raw_research JSONB DEFAULT '{}',   -- raw Growth Operator output

  -- Timestamps
  scanned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_trend_signals_workspace ON trend_signals(workspace_id);
CREATE INDEX idx_trend_signals_score ON trend_signals(workspace_id, score DESC);
CREATE INDEX idx_trend_signals_opportunity ON trend_signals(workspace_id, opportunity_score DESC);
CREATE INDEX idx_trend_signals_momentum ON trend_signals(workspace_id, momentum);
CREATE INDEX idx_trend_signals_category ON trend_signals(workspace_id, category);
CREATE INDEX idx_trend_signals_scanned_at ON trend_signals(workspace_id, scanned_at DESC);

-- Auto-update updated_at (reuses existing set_updated_at function)
CREATE TRIGGER set_trend_signals_updated_at
  BEFORE UPDATE ON trend_signals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE trend_signals;
ALTER TABLE trend_signals REPLICA IDENTITY FULL;

-- RLS
ALTER TABLE trend_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their workspace trend signals"
  ON trend_signals FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));
