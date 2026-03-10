/**
 * Growth Engine — Domain Types (Phase 7)
 *
 * Client-safe types for the Trend & Signal Engine.
 * These mirror the trend_signals DB table and the TrendScanner service output.
 */

export type SignalMomentum = 'explosive' | 'rising' | 'stable' | 'falling';

export interface TrendMarketAngle {
  angle: string;
  rationale: string;
  cta_angle: string;
}

export interface TrendContentIdea {
  title: string;
  format: string;
  hook: string;
  estimated_reach?: 'low' | 'medium' | 'high' | 'viral';
}

export interface TrendSignal {
  id: string;
  workspace_id: string;
  topic: string;
  category: string | null;
  score: number;
  opportunity_score: number;
  audience_fit: number;
  momentum: SignalMomentum;
  platform: string | null;
  source_urls: string[];
  competitor_gaps: string[];
  market_angles: TrendMarketAngle[];
  content_ideas: TrendContentIdea[];
  raw_research: Record<string, unknown>;
  scanned_at: string;
  created_at: string;
  updated_at: string;
}

export interface TrendSignalInsert {
  workspace_id: string;
  topic: string;
  category?: string | null;
  score?: number;
  opportunity_score?: number;
  audience_fit?: number;
  momentum?: SignalMomentum;
  platform?: string | null;
  source_urls?: string[];
  competitor_gaps?: string[];
  market_angles?: TrendMarketAngle[];
  content_ideas?: TrendContentIdea[];
  raw_research?: Record<string, unknown>;
  scanned_at?: string;
}

export type TrendSignalUpdate = Partial<Omit<TrendSignalInsert, 'workspace_id'>>;

export interface TrendScanInput {
  topics: string[];
  platforms?: string[];
  workspaceId: string;
  context?: {
    businessType?: string;
    targetAudience?: string;
    activeOffers?: string[];
  };
}

export interface TrendScanResult {
  signals: Omit<TrendSignal, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>[];
  scanned_at: string;
  topics_processed: number;
  top_opportunity: string | null;
}

export interface TopicScoreInput {
  topic: string;
  platform?: string;
  audienceDescription?: string;
}

export interface TopicScoreResult {
  topic: string;
  score: number;
  momentum: SignalMomentum;
  reasoning: string;
  best_angle: string;
  recommended_format: string;
}

export interface OpportunityBoardItem {
  signal: TrendSignal;
  rank: number;
  recommended_action: string;
  urgency: 'immediate' | 'this_week' | 'this_month';
}

export interface TrendSignalFilters {
  momentum?: SignalMomentum | 'all';
  category?: string;
  platform?: string;
  minScore?: number;
  limit?: number;
  offset?: number;
  sort?: 'opportunity' | 'score' | 'recent';
}
