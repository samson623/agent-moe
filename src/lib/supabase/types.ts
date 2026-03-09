/**
 * Full TypeScript types for the Agent Moe database schema.
 * Follows the Supabase generated-types pattern so `@supabase/supabase-js` v2
 * can provide end-to-end type safety on every query.
 *
 * IMPORTANT: Enum types are defined as standalone aliases BEFORE the Database
 * type to avoid TypeScript's forward-reference resolution producing `never`.
 *
 * 12 tables · 16 enums · convenience aliases for all Row types and enums
 */

// ---------------------------------------------------------------------------
// Standalone DB enum types — defined BEFORE Database to avoid forward-reference `never`
// ---------------------------------------------------------------------------

type DbMissionStatus = 'pending' | 'planning' | 'running' | 'paused' | 'completed' | 'failed'
type DbMissionPriority = 'low' | 'normal' | 'high' | 'urgent'
type DbJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
type DbOperatorTeam = 'content_strike' | 'growth_operator' | 'revenue_closer' | 'brand_guardian'
type DbModelUsed = 'claude' | 'gpt5_nano'
type DbAssetType =
  | 'post'
  | 'thread'
  | 'script'
  | 'caption'
  | 'cta'
  | 'thumbnail_concept'
  | 'carousel'
  | 'video_concept'
  | 'email'
  | 'report'
type DbPlatform = 'x' | 'linkedin' | 'instagram' | 'tiktok' | 'youtube' | 'email' | 'universal'
type DbAssetStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived' | 'rejected'
type DbOfferType =
  | 'product'
  | 'service'
  | 'lead_magnet'
  | 'course'
  | 'consultation'
  | 'subscription'
  | 'affiliate'
type DbOfferStatus = 'active' | 'inactive' | 'archived'
type DbApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested'
type DbRiskLevel = 'low' | 'medium' | 'high' | 'critical'
type DbConnectorPlatform =
  | 'x'
  | 'linkedin'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'email'
  | 'notion'
  | 'airtable'
  | 'webhook'
type DbConnectorStatus = 'connected' | 'disconnected' | 'error' | 'pending'
type DbSafetyLevel = 'strict' | 'moderate' | 'relaxed'
type DbCampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

// ---------------------------------------------------------------------------
// Database type
// ---------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      // -----------------------------------------------------------------------
      // users
      // -----------------------------------------------------------------------
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // workspaces
      // -----------------------------------------------------------------------
      workspaces: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          industry: string | null
          target_audience: string | null
          brand_voice: string | null
          default_platform: DbPlatform
          settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          industry?: string | null
          target_audience?: string | null
          brand_voice?: string | null
          default_platform?: DbPlatform
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          industry?: string | null
          target_audience?: string | null
          brand_voice?: string | null
          default_platform?: DbPlatform
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // brand_rules
      // -----------------------------------------------------------------------
      brand_rules: {
        Row: {
          id: string
          workspace_id: string
          safety_level: DbSafetyLevel
          tone_descriptors: string[]
          blocked_phrases: string[]
          blocked_claims: string[]
          required_disclaimers: string[]
          auto_approve_threshold: number
          auto_reject_threshold: number
          custom_rules: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          safety_level?: DbSafetyLevel
          tone_descriptors?: string[]
          blocked_phrases?: string[]
          blocked_claims?: string[]
          required_disclaimers?: string[]
          auto_approve_threshold?: number
          auto_reject_threshold?: number
          custom_rules?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          safety_level?: DbSafetyLevel
          tone_descriptors?: string[]
          blocked_phrases?: string[]
          blocked_claims?: string[]
          required_disclaimers?: string[]
          auto_approve_threshold?: number
          auto_reject_threshold?: number
          custom_rules?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // missions
      // -----------------------------------------------------------------------
      missions: {
        Row: {
          id: string
          workspace_id: string
          created_by: string
          title: string
          instruction: string
          status: DbMissionStatus
          priority: DbMissionPriority
          operator_team: DbOperatorTeam | null
          context: Record<string, unknown>
          result_summary: string | null
          job_count: number
          completed_job_count: number
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          created_by: string
          title: string
          instruction: string
          status?: DbMissionStatus
          priority?: DbMissionPriority
          operator_team?: DbOperatorTeam | null
          context?: Record<string, unknown>
          result_summary?: string | null
          job_count?: number
          completed_job_count?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          created_by?: string
          title?: string
          instruction?: string
          status?: DbMissionStatus
          priority?: DbMissionPriority
          operator_team?: DbOperatorTeam | null
          context?: Record<string, unknown>
          result_summary?: string | null
          job_count?: number
          completed_job_count?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // jobs
      // -----------------------------------------------------------------------
      jobs: {
        Row: {
          id: string
          mission_id: string
          workspace_id: string
          title: string
          description: string | null
          status: DbJobStatus
          operator_team: DbOperatorTeam
          model_used: DbModelUsed | null
          input_data: Record<string, unknown>
          output_data: Record<string, unknown>
          error_message: string | null
          retry_count: number
          depends_on: string[]
          started_at: string | null
          completed_at: string | null
          duration_ms: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mission_id: string
          workspace_id: string
          title: string
          description?: string | null
          status?: DbJobStatus
          operator_team: DbOperatorTeam
          model_used?: DbModelUsed | null
          input_data?: Record<string, unknown>
          output_data?: Record<string, unknown>
          error_message?: string | null
          retry_count?: number
          depends_on?: string[]
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mission_id?: string
          workspace_id?: string
          title?: string
          description?: string | null
          status?: DbJobStatus
          operator_team?: DbOperatorTeam
          model_used?: DbModelUsed | null
          input_data?: Record<string, unknown>
          output_data?: Record<string, unknown>
          error_message?: string | null
          retry_count?: number
          depends_on?: string[]
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // assets
      // -----------------------------------------------------------------------
      assets: {
        Row: {
          id: string
          workspace_id: string
          mission_id: string | null
          job_id: string | null
          operator_team: DbOperatorTeam | null
          type: DbAssetType
          platform: DbPlatform
          status: DbAssetStatus
          title: string | null
          body: string
          metadata: Record<string, unknown>
          confidence_score: number | null
          offer_id: string | null
          version: number
          parent_asset_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          mission_id?: string | null
          job_id?: string | null
          operator_team?: DbOperatorTeam | null
          type: DbAssetType
          platform?: DbPlatform
          status?: DbAssetStatus
          title?: string | null
          body: string
          metadata?: Record<string, unknown>
          confidence_score?: number | null
          offer_id?: string | null
          version?: number
          parent_asset_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          mission_id?: string | null
          job_id?: string | null
          operator_team?: DbOperatorTeam | null
          type?: DbAssetType
          platform?: DbPlatform
          status?: DbAssetStatus
          title?: string | null
          body?: string
          metadata?: Record<string, unknown>
          confidence_score?: number | null
          offer_id?: string | null
          version?: number
          parent_asset_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // offers
      // -----------------------------------------------------------------------
      offers: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          type: DbOfferType
          status: DbOfferStatus
          price: number | null
          currency: string
          url: string | null
          cta_text: string | null
          tags: string[]
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          type: DbOfferType
          status?: DbOfferStatus
          price?: number | null
          currency?: string
          url?: string | null
          cta_text?: string | null
          tags?: string[]
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          type?: DbOfferType
          status?: DbOfferStatus
          price?: number | null
          currency?: string
          url?: string | null
          cta_text?: string | null
          tags?: string[]
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // approvals
      // -----------------------------------------------------------------------
      approvals: {
        Row: {
          id: string
          workspace_id: string
          asset_id: string
          mission_id: string | null
          status: DbApprovalStatus
          risk_level: DbRiskLevel
          risk_flags: string[]
          reviewer_id: string | null
          reviewer_notes: string | null
          decided_at: string | null
          auto_decided: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          asset_id: string
          mission_id?: string | null
          status?: DbApprovalStatus
          risk_level?: DbRiskLevel
          risk_flags?: string[]
          reviewer_id?: string | null
          reviewer_notes?: string | null
          decided_at?: string | null
          auto_decided?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          asset_id?: string
          mission_id?: string | null
          status?: DbApprovalStatus
          risk_level?: DbRiskLevel
          risk_flags?: string[]
          reviewer_id?: string | null
          reviewer_notes?: string | null
          decided_at?: string | null
          auto_decided?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // connectors
      // -----------------------------------------------------------------------
      connectors: {
        Row: {
          id: string
          workspace_id: string
          platform: DbConnectorPlatform
          status: DbConnectorStatus
          display_name: string | null
          account_handle: string | null
          access_token_enc: string | null
          refresh_token_enc: string | null
          token_expires_at: string | null
          scopes: string[]
          metadata: Record<string, unknown>
          last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          platform: DbConnectorPlatform
          status?: DbConnectorStatus
          display_name?: string | null
          account_handle?: string | null
          access_token_enc?: string | null
          refresh_token_enc?: string | null
          token_expires_at?: string | null
          scopes?: string[]
          metadata?: Record<string, unknown>
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          platform?: DbConnectorPlatform
          status?: DbConnectorStatus
          display_name?: string | null
          account_handle?: string | null
          access_token_enc?: string | null
          refresh_token_enc?: string | null
          token_expires_at?: string | null
          scopes?: string[]
          metadata?: Record<string, unknown>
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // analytics_events
      // -----------------------------------------------------------------------
      analytics_events: {
        Row: {
          id: string
          workspace_id: string
          event_type: string
          entity_type: string | null
          entity_id: string | null
          operator_team: DbOperatorTeam | null
          model_used: DbModelUsed | null
          platform: DbPlatform | null
          value: number | null
          metadata: Record<string, unknown>
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          event_type: string
          entity_type?: string | null
          entity_id?: string | null
          operator_team?: DbOperatorTeam | null
          model_used?: DbModelUsed | null
          platform?: DbPlatform | null
          value?: number | null
          metadata?: Record<string, unknown>
          occurred_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          event_type?: string
          entity_type?: string | null
          entity_id?: string | null
          operator_team?: DbOperatorTeam | null
          model_used?: DbModelUsed | null
          platform?: DbPlatform | null
          value?: number | null
          metadata?: Record<string, unknown>
          occurred_at?: string
          created_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // activity_logs
      // -----------------------------------------------------------------------
      activity_logs: {
        Row: {
          id: string
          workspace_id: string
          actor_type: string
          actor_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          summary: string
          details: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          actor_type: string
          actor_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          summary: string
          details?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          actor_type?: string
          actor_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          summary?: string
          details?: Record<string, unknown>
          created_at?: string
        }
        Relationships: []
      }

      // -----------------------------------------------------------------------
      // launch_campaigns
      // -----------------------------------------------------------------------
      launch_campaigns: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          status: DbCampaignStatus
          offer_id: string | null
          mission_ids: string[]
          asset_ids: string[]
          platforms: DbPlatform[]
          scheduled_start: string | null
          scheduled_end: string | null
          launched_at: string | null
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          status?: DbCampaignStatus
          offer_id?: string | null
          mission_ids?: string[]
          asset_ids?: string[]
          platforms?: DbPlatform[]
          scheduled_start?: string | null
          scheduled_end?: string | null
          launched_at?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          status?: DbCampaignStatus
          offer_id?: string | null
          mission_ids?: string[]
          asset_ids?: string[]
          platforms?: DbPlatform[]
          scheduled_start?: string | null
          scheduled_end?: string | null
          launched_at?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }

    // -------------------------------------------------------------------------
    // Enums — reference the standalone Db* types for consistency
    // -------------------------------------------------------------------------
    Enums: {
      mission_status: DbMissionStatus
      mission_priority: DbMissionPriority
      job_status: DbJobStatus
      operator_team: DbOperatorTeam
      model_used: DbModelUsed
      asset_type: DbAssetType
      platform: DbPlatform
      asset_status: DbAssetStatus
      offer_type: DbOfferType
      offer_status: DbOfferStatus
      approval_status: DbApprovalStatus
      risk_level: DbRiskLevel
      connector_platform: DbConnectorPlatform
      connector_status: DbConnectorStatus
      safety_level: DbSafetyLevel
      campaign_status: DbCampaignStatus
    }

    Views: Record<string, never>
    Functions: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ---------------------------------------------------------------------------
// Convenience Row aliases (use these throughout the codebase)
// ---------------------------------------------------------------------------

/** A registered user (maps to Supabase auth.users via trigger) */
export type User = Database['public']['Tables']['users']['Row']

/** A private business workspace — single workspace per user in this app */
export type Workspace = Database['public']['Tables']['workspaces']['Row']

/** Tone, safety, and approval rules for the workspace */
export type BrandRule = Database['public']['Tables']['brand_rules']['Row']

/** A top-level user instruction that drives the AI workflow */
export type Mission = Database['public']['Tables']['missions']['Row']

/** A single subtask decomposed from a mission, routed to an operator team */
export type Job = Database['public']['Tables']['jobs']['Row']

/** A piece of generated content produced by an operator */
export type Asset = Database['public']['Tables']['assets']['Row']

/** A monetization path linked to assets and campaigns */
export type Offer = Database['public']['Tables']['offers']['Row']

/** An approval decision record — safety gate before assets are published */
export type Approval = Database['public']['Tables']['approvals']['Row']

/** An external platform connection (OAuth / API key) */
export type Connector = Database['public']['Tables']['connectors']['Row']

/** A platform or system event recorded for analytics */
export type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row']

/** A system action recorded for audit and display purposes */
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

/** A grouped campaign sequencing missions, assets, and a single offer */
export type LaunchCampaign = Database['public']['Tables']['launch_campaigns']['Row']

// ---------------------------------------------------------------------------
// Convenience Insert / Update aliases
// ---------------------------------------------------------------------------

export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert']
export type WorkspaceUpdate = Database['public']['Tables']['workspaces']['Update']

export type BrandRuleInsert = Database['public']['Tables']['brand_rules']['Insert']
export type BrandRuleUpdate = Database['public']['Tables']['brand_rules']['Update']

export type MissionInsert = Database['public']['Tables']['missions']['Insert']
export type MissionUpdate = Database['public']['Tables']['missions']['Update']

export type JobInsert = Database['public']['Tables']['jobs']['Insert']
export type JobUpdate = Database['public']['Tables']['jobs']['Update']

export type AssetInsert = Database['public']['Tables']['assets']['Insert']
export type AssetUpdate = Database['public']['Tables']['assets']['Update']

export type OfferInsert = Database['public']['Tables']['offers']['Insert']
export type OfferUpdate = Database['public']['Tables']['offers']['Update']

export type ApprovalInsert = Database['public']['Tables']['approvals']['Insert']
export type ApprovalUpdate = Database['public']['Tables']['approvals']['Update']

export type ConnectorInsert = Database['public']['Tables']['connectors']['Insert']
export type ConnectorUpdate = Database['public']['Tables']['connectors']['Update']

export type AnalyticsEventInsert = Database['public']['Tables']['analytics_events']['Insert']
export type AnalyticsEventUpdate = Database['public']['Tables']['analytics_events']['Update']

export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert']
export type ActivityLogUpdate = Database['public']['Tables']['activity_logs']['Update']

export type LaunchCampaignInsert = Database['public']['Tables']['launch_campaigns']['Insert']
export type LaunchCampaignUpdate = Database['public']['Tables']['launch_campaigns']['Update']

// ---------------------------------------------------------------------------
// Enum type aliases (exported for use throughout the codebase)
// ---------------------------------------------------------------------------

export type MissionStatus = DbMissionStatus
export type MissionPriority = DbMissionPriority
export type JobStatus = DbJobStatus
export type OperatorTeam = DbOperatorTeam
export type ModelUsed = DbModelUsed
export type AssetType = DbAssetType
export type Platform = DbPlatform
export type AssetStatus = DbAssetStatus
export type OfferType = DbOfferType
export type OfferStatus = DbOfferStatus
export type ApprovalStatus = DbApprovalStatus
export type RiskLevel = DbRiskLevel
export type ConnectorPlatform = DbConnectorPlatform
export type ConnectorStatus = DbConnectorStatus
export type SafetyLevel = DbSafetyLevel
export type CampaignStatus = DbCampaignStatus
