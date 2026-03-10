/**
 * Analytics — domain types.
 *
 * These types describe the data structures used by the Analytics feature:
 * system-wide stats, mission/content/operator performance, publishing stats,
 * event tracking, and AI-generated feedback insights. They map to the shapes
 * returned by the /api/analytics/* routes.
 */

// ---------------------------------------------------------------------------
// Time Range
// ---------------------------------------------------------------------------

export type TimeRange = '7d' | '30d' | '90d' | 'all'

// ---------------------------------------------------------------------------
// System Stats
// ---------------------------------------------------------------------------

/**
 * Top-level system-wide aggregate stats for a workspace over a time range.
 * Returned by GET /api/analytics/stats as part of AnalyticsDashboard.
 */
export interface SystemStats {
  missions_total: number
  missions_completed: number
  missions_failed: number
  missions_active: number
  jobs_total: number
  jobs_completed: number
  assets_total: number
  assets_published: number
  approvals_total: number
  approval_rate: number
  publish_success_rate: number
  time_range: TimeRange
}

// ---------------------------------------------------------------------------
// Mission Performance
// ---------------------------------------------------------------------------

/**
 * Per-operator breakdown within MissionPerformance.
 */
export interface MissionPerformanceItem {
  operator_team: string
  missions: number
  completed: number
  failed: number
  success_rate: number
}

/**
 * Mission-level performance breakdown for a workspace.
 * Returned by GET /api/analytics/missions as `{ data: MissionPerformance }`.
 */
export interface MissionPerformance {
  total: number
  completed: number
  failed: number
  active: number
  pending: number
  completion_rate: number
  by_operator: MissionPerformanceItem[]
  avg_jobs_per_mission: number
}

// ---------------------------------------------------------------------------
// Content Performance
// ---------------------------------------------------------------------------

/**
 * Per asset-type breakdown within ContentPerformance.
 */
export interface ContentTypeBreakdown {
  type: string
  count: number
  published: number
}

/**
 * Per platform breakdown within ContentPerformance.
 */
export interface PlatformBreakdown {
  platform: string
  count: number
}

/**
 * Content/asset performance breakdown for a workspace.
 * Returned by GET /api/analytics/content as `{ data: ContentPerformance }`.
 */
export interface ContentPerformance {
  total_assets: number
  published_assets: number
  draft_assets: number
  approved_assets: number
  rejected_assets: number
  by_type: ContentTypeBreakdown[]
  by_platform: PlatformBreakdown[]
  avg_confidence_score: number
}

// ---------------------------------------------------------------------------
// Operator Stats
// ---------------------------------------------------------------------------

/**
 * Stats for a single operator team within OperatorStats.
 */
export interface OperatorTeamStat {
  team: string
  missions: number
  jobs: number
  assets: number
  success_rate: number
}

/**
 * Operator team performance breakdown for a workspace.
 * Returned by GET /api/analytics/operators as `{ data: OperatorStats }`.
 */
export interface OperatorStats {
  by_team: OperatorTeamStat[]
  top_team: string | null
}

// ---------------------------------------------------------------------------
// Publishing Stats
// ---------------------------------------------------------------------------

/**
 * Per-platform publishing breakdown within PublishingStats.
 */
export interface PlatformPublishStat {
  platform: string
  total: number
  successful: number
  failed: number
  success_rate: number
}

/**
 * Publishing/distribution stats for a workspace.
 * Returned by GET /api/analytics/stats as part of AnalyticsDashboard.
 */
export interface PublishingStats {
  total_attempts: number
  successful: number
  failed: number
  success_rate: number
  by_platform: PlatformPublishStat[]
}

// ---------------------------------------------------------------------------
// Analytics Events
// ---------------------------------------------------------------------------

/**
 * A single analytics event row from the analytics_events table.
 * Returned by GET /api/analytics/events as `{ data: AnalyticsEvent[], total }`.
 */
export interface AnalyticsEvent {
  id: number
  workspace_id: string
  event_type: string
  entity_type: string
  entity_id: string
  properties: Record<string, unknown>
  occurred_at: string
  created_at: string
}

/**
 * Payload for the useTrackEvent hook's track() function.
 * Sent to POST /api/analytics/events.
 */
export interface TrackEventPayload {
  workspace_id: string
  event_type: string
  entity_type: string
  entity_id: string
  properties?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Feedback Insights
// ---------------------------------------------------------------------------

export type FeedbackInsightType = 'opportunity' | 'warning' | 'recommendation' | 'success'

/**
 * A single AI-generated insight returned by POST /api/analytics/feedback.
 */
export interface FeedbackInsight {
  id: string
  type: FeedbackInsightType
  title: string
  body: string
  metric?: string
}

// ---------------------------------------------------------------------------
// Analytics Dashboard (composite)
// ---------------------------------------------------------------------------

/**
 * Full analytics dashboard snapshot returned by GET /api/analytics/stats.
 * All sub-shapes are assembled server-side from parallel queries.
 */
export interface AnalyticsDashboard {
  system: SystemStats
  missions: MissionPerformance
  content: ContentPerformance
  operators: OperatorStats
  publishing: PublishingStats
  time_range: TimeRange
  generated_at: string
}
