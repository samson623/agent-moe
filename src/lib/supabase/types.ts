export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor: string
          entity_id: string
          entity_type: string
          id: number
          message: string
          meta: Json
          occurred_at: string
          workspace_id: string
        }
        Insert: {
          action: string
          actor: string
          entity_id: string
          entity_type: string
          id?: number
          message: string
          meta?: Json
          occurred_at?: string
          workspace_id: string
        }
        Update: {
          action?: string
          actor?: string
          entity_id?: string
          entity_type?: string
          id?: number
          message?: string
          meta?: Json
          occurred_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: number
          occurred_at: string
          properties: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: number
          occurred_at?: string
          properties?: Json
          workspace_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: number
          occurred_at?: string
          properties?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          asset_id: string | null
          auto_approved: boolean
          created_at: string
          id: string
          job_id: string | null
          notes: string | null
          requested_at: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_flags: string[]
          risk_level: Database["public"]["Enums"]["risk_level"]
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          asset_id?: string | null
          auto_approved?: boolean
          created_at?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          requested_at?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_flags?: string[]
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          asset_id?: string | null
          auto_approved?: boolean
          created_at?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          requested_at?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_flags?: string[]
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          confidence_score: number
          content: string
          created_at: string
          id: string
          job_id: string | null
          linked_offer_id: string | null
          metadata: Json
          mission_id: string | null
          operator_team: Database["public"]["Enums"]["operator_team"]
          parent_asset_id: string | null
          platform: Database["public"]["Enums"]["asset_platform"]
          status: Database["public"]["Enums"]["asset_status"]
          title: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          confidence_score?: number
          content?: string
          created_at?: string
          id?: string
          job_id?: string | null
          linked_offer_id?: string | null
          metadata?: Json
          mission_id?: string | null
          operator_team: Database["public"]["Enums"]["operator_team"]
          parent_asset_id?: string | null
          platform?: Database["public"]["Enums"]["asset_platform"]
          status?: Database["public"]["Enums"]["asset_status"]
          title: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          confidence_score?: number
          content?: string
          created_at?: string
          id?: string
          job_id?: string | null
          linked_offer_id?: string | null
          metadata?: Json
          mission_id?: string | null
          operator_team?: Database["public"]["Enums"]["operator_team"]
          parent_asset_id?: string | null
          platform?: Database["public"]["Enums"]["asset_platform"]
          status?: Database["public"]["Enums"]["asset_status"]
          title?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_linked_offer_id_fk"
            columns: ["linked_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_parent_asset_id_fkey"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_rules: {
        Row: {
          auto_approve_threshold: number
          blocked_phrases: string[]
          brand_guidelines: string
          created_at: string
          id: string
          safety_level: Database["public"]["Enums"]["safety_level"]
          tone_voice: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          auto_approve_threshold?: number
          blocked_phrases?: string[]
          brand_guidelines?: string
          created_at?: string
          id?: string
          safety_level?: Database["public"]["Enums"]["safety_level"]
          tone_voice?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          auto_approve_threshold?: number
          blocked_phrases?: string[]
          brand_guidelines?: string
          created_at?: string
          id?: string
          safety_level?: Database["public"]["Enums"]["safety_level"]
          tone_voice?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      connectors: {
        Row: {
          config: Json
          created_at: string
          credentials: Json
          id: string
          last_sync_at: string | null
          name: string
          platform: Database["public"]["Enums"]["connector_platform"]
          status: Database["public"]["Enums"]["connector_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          credentials?: Json
          id?: string
          last_sync_at?: string | null
          name: string
          platform: Database["public"]["Enums"]["connector_platform"]
          status?: Database["public"]["Enums"]["connector_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          credentials?: Json
          id?: string
          last_sync_at?: string | null
          name?: string
          platform?: Database["public"]["Enums"]["connector_platform"]
          status?: Database["public"]["Enums"]["connector_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connectors_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          depends_on: string[]
          description: string
          error_message: string | null
          id: string
          input_data: Json
          job_type: string
          mission_id: string
          model_used: Database["public"]["Enums"]["model_used"] | null
          operator_team: Database["public"]["Enums"]["operator_team"]
          output_data: Json
          priority: number
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          depends_on?: string[]
          description?: string
          error_message?: string | null
          id?: string
          input_data?: Json
          job_type: string
          mission_id: string
          model_used?: Database["public"]["Enums"]["model_used"] | null
          operator_team: Database["public"]["Enums"]["operator_team"]
          output_data?: Json
          priority?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          depends_on?: string[]
          description?: string
          error_message?: string | null
          id?: string
          input_data?: Json
          job_type?: string
          mission_id?: string
          model_used?: Database["public"]["Enums"]["model_used"] | null
          operator_team?: Database["public"]["Enums"]["operator_team"]
          output_data?: Json
          priority?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_campaigns: {
        Row: {
          asset_ids: string[]
          created_at: string
          description: string
          end_date: string | null
          id: string
          launch_date: string | null
          meta: Json
          mission_ids: string[]
          name: string
          offer_id: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          timeline: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          asset_ids?: string[]
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          launch_date?: string | null
          meta?: Json
          mission_ids?: string[]
          name: string
          offer_id?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          timeline?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          asset_ids?: string[]
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          launch_date?: string | null
          meta?: Json
          mission_ids?: string[]
          name?: string
          offer_id?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          timeline?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_campaigns_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string
          id: string
          instruction: string
          meta: Json
          plan_json: Json
          priority: Database["public"]["Enums"]["mission_priority"]
          source_channel: string | null
          status: Database["public"]["Enums"]["mission_status"]
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instruction: string
          meta?: Json
          plan_json?: Json
          priority?: Database["public"]["Enums"]["mission_priority"]
          source_channel?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          title: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instruction?: string
          meta?: Json
          plan_json?: Json
          priority?: Database["public"]["Enums"]["mission_priority"]
          source_channel?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          cta_text: string
          cta_url: string
          currency: string
          description: string
          id: string
          meta: Json
          name: string
          offer_type: Database["public"]["Enums"]["offer_type"]
          price_cents: number | null
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          cta_text?: string
          cta_url?: string
          currency?: string
          description?: string
          id?: string
          meta?: Json
          name: string
          offer_type: Database["public"]["Enums"]["offer_type"]
          price_cents?: number | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          cta_text?: string
          cta_url?: string
          currency?: string
          description?: string
          id?: string
          meta?: Json
          name?: string
          offer_type?: Database["public"]["Enums"]["offer_type"]
          price_cents?: number | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      trend_signals: {
        Row: {
          audience_fit: number
          category: string | null
          competitor_gaps: string[] | null
          content_ideas: Json | null
          created_at: string | null
          id: string
          market_angles: Json | null
          momentum: Database["public"]["Enums"]["signal_momentum"]
          opportunity_score: number
          platform: string | null
          raw_research: Json | null
          scanned_at: string | null
          score: number
          source_urls: string[] | null
          topic: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          audience_fit?: number
          category?: string | null
          competitor_gaps?: string[] | null
          content_ideas?: Json | null
          created_at?: string | null
          id?: string
          market_angles?: Json | null
          momentum?: Database["public"]["Enums"]["signal_momentum"]
          opportunity_score?: number
          platform?: string | null
          raw_research?: Json | null
          scanned_at?: string | null
          score?: number
          source_urls?: string[] | null
          topic: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          audience_fit?: number
          category?: string | null
          competitor_gaps?: string[] | null
          content_ideas?: Json | null
          created_at?: string | null
          id?: string
          market_angles?: Json | null
          momentum?: Database["public"]["Enums"]["signal_momentum"]
          opportunity_score?: number
          platform?: string | null
          raw_research?: Json | null
          scanned_at?: string | null
          score?: number
          source_urls?: string[] | null
          topic?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trend_signals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      video_packages: {
        Row: {
          asset_id: string | null
          caption: string | null
          confidence_score: number | null
          created_at: string | null
          cta: Json | null
          hook: Json
          id: string
          metadata: Json | null
          mission_id: string | null
          platform: Database["public"]["Enums"]["asset_platform"]
          scenes: Json
          status: Database["public"]["Enums"]["asset_status"]
          thumbnail_concept: Json
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          asset_id?: string | null
          caption?: string | null
          confidence_score?: number | null
          created_at?: string | null
          cta?: Json | null
          hook?: Json
          id?: string
          metadata?: Json | null
          mission_id?: string | null
          platform: Database["public"]["Enums"]["asset_platform"]
          scenes?: Json
          status?: Database["public"]["Enums"]["asset_status"]
          thumbnail_concept?: Json
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          asset_id?: string | null
          caption?: string | null
          confidence_score?: number | null
          created_at?: string | null
          cta?: Json | null
          hook?: Json
          id?: string
          metadata?: Json | null
          mission_id?: string | null
          platform?: Database["public"]["Enums"]["asset_platform"]
          scenes?: Json
          status?: Database["public"]["Enums"]["asset_status"]
          thumbnail_concept?: Json
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_packages_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_packages_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_packages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      publishing_logs: {
        Row: {
          asset_id: string | null
          connector_id: string
          created_at: string
          error_message: string | null
          external_post_id: string | null
          external_post_url: string | null
          id: string
          payload: Json
          platform: Database["public"]["Enums"]["connector_platform"]
          published_at: string | null
          response: Json
          status: "cancelled" | "failed" | "pending" | "success"
          workspace_id: string
        }
        Insert: {
          asset_id?: string | null
          connector_id: string
          created_at?: string
          error_message?: string | null
          external_post_id?: string | null
          external_post_url?: string | null
          id?: string
          payload?: Json
          platform: Database["public"]["Enums"]["connector_platform"]
          published_at?: string | null
          response?: Json
          status?: "cancelled" | "failed" | "pending" | "success"
          workspace_id: string
        }
        Update: {
          asset_id?: string | null
          connector_id?: string
          created_at?: string
          error_message?: string | null
          external_post_id?: string | null
          external_post_url?: string | null
          id?: string
          payload?: Json
          platform?: Database["public"]["Enums"]["connector_platform"]
          published_at?: string | null
          response?: Json
          status?: "cancelled" | "failed" | "pending" | "success"
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publishing_logs_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publishing_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          active_offer_id: string | null
          created_at: string
          id: string
          name: string
          settings: Json
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_offer_id?: string | null
          created_at?: string
          id?: string
          name: string
          settings?: Json
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_offer_id?: string | null
          created_at?: string
          id?: string
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_active_offer_id_fk"
            columns: ["active_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_links: {
        Row: {
          id: string
          user_id: string
          workspace_id: string
          chat_id: number
          username: string | null
          is_active: boolean
          linked_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id: string
          chat_id: number
          username?: string | null
          is_active?: boolean
          linked_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string
          chat_id?: number
          username?: string | null
          is_active?: boolean
          linked_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_sessions: {
        Row: {
          chat_id: number
          user_id: string
          workspace_id: string
          state: Json
          updated_at: string
        }
        Insert: {
          chat_id: number
          user_id: string
          workspace_id: string
          state?: Json
          updated_at?: string
        }
        Update: {
          chat_id?: number
          user_id?: string
          workspace_id?: string
          state?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_workspace_owner: { Args: { p_workspace_id: string }; Returns: boolean }
    }
    Enums: {
      approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "revision_requested"
      asset_platform:
        | "x"
        | "linkedin"
        | "instagram"
        | "tiktok"
        | "youtube"
        | "email"
        | "universal"
      asset_status:
        | "draft"
        | "review"
        | "approved"
        | "published"
        | "archived"
        | "rejected"
      asset_type:
        | "post"
        | "thread"
        | "script"
        | "caption"
        | "cta"
        | "thumbnail_concept"
        | "carousel"
        | "video_concept"
        | "email"
        | "report"
      campaign_status: "draft" | "active" | "paused" | "completed" | "archived"
      connector_platform:
        | "x"
        | "linkedin"
        | "instagram"
        | "tiktok"
        | "youtube"
        | "email"
        | "notion"
        | "airtable"
        | "webhook"
        | "telegram"
      connector_status: "connected" | "disconnected" | "error" | "pending"
      job_status: "pending" | "running" | "completed" | "failed" | "cancelled"
      mission_priority: "low" | "normal" | "high" | "urgent"
      mission_status:
        | "pending"
        | "planning"
        | "running"
        | "paused"
        | "completed"
        | "failed"
      model_used: "claude" | "gpt5_nano"
      offer_status: "active" | "inactive" | "archived"
      offer_type:
        | "product"
        | "service"
        | "lead_magnet"
        | "course"
        | "consultation"
        | "subscription"
        | "affiliate"
      operator_team:
        | "content_strike"
        | "growth_operator"
        | "revenue_closer"
        | "brand_guardian"
        | "browser_agent"
      risk_level: "low" | "medium" | "high" | "critical"
      safety_level: "strict" | "moderate" | "relaxed"
      signal_momentum: "explosive" | "rising" | "stable" | "falling"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      approval_status: [
        "pending",
        "approved",
        "rejected",
        "revision_requested",
      ],
      asset_platform: [
        "x",
        "linkedin",
        "instagram",
        "tiktok",
        "youtube",
        "email",
        "universal",
      ],
      asset_status: [
        "draft",
        "review",
        "approved",
        "published",
        "archived",
        "rejected",
      ],
      asset_type: [
        "post",
        "thread",
        "script",
        "caption",
        "cta",
        "thumbnail_concept",
        "carousel",
        "video_concept",
        "email",
        "report",
      ],
      campaign_status: ["draft", "active", "paused", "completed", "archived"],
      connector_platform: [
        "x",
        "linkedin",
        "instagram",
        "tiktok",
        "youtube",
        "email",
        "notion",
        "airtable",
        "webhook",
        "telegram",
      ],
      connector_status: ["connected", "disconnected", "error", "pending"],
      job_status: ["pending", "running", "completed", "failed", "cancelled"],
      mission_priority: ["low", "normal", "high", "urgent"],
      mission_status: [
        "pending",
        "planning",
        "running",
        "paused",
        "completed",
        "failed",
      ],
      model_used: ["claude", "gpt5_nano"],
      offer_status: ["active", "inactive", "archived"],
      offer_type: [
        "product",
        "service",
        "lead_magnet",
        "course",
        "consultation",
        "subscription",
        "affiliate",
      ],
      operator_team: [
        "content_strike",
        "growth_operator",
        "revenue_closer",
        "brand_guardian",
        "browser_agent",
      ],
      risk_level: ["low", "medium", "high", "critical"],
      safety_level: ["strict", "moderate", "relaxed"],
      signal_momentum: ["explosive", "rising", "stable", "falling"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const


// ---------------------------------------------------------------------------
// Convenience type aliases — appended after codegen, do not edit manually
// ---------------------------------------------------------------------------

// Row types
export type UserRow            = Database['public']['Tables']['users']['Row']
export type WorkspaceRow       = Database['public']['Tables']['workspaces']['Row']
export type BrandRuleRow       = Database['public']['Tables']['brand_rules']['Row']
export type MissionRow         = Database['public']['Tables']['missions']['Row']
export type JobRow             = Database['public']['Tables']['jobs']['Row']
export type AssetRow           = Database['public']['Tables']['assets']['Row']
export type OfferRow           = Database['public']['Tables']['offers']['Row']
export type ApprovalRow        = Database['public']['Tables']['approvals']['Row']
export type ConnectorRow       = Database['public']['Tables']['connectors']['Row']
export type AnalyticsEventRow  = Database['public']['Tables']['analytics_events']['Row']
export type ActivityLogRow     = Database['public']['Tables']['activity_logs']['Row']
export type LaunchCampaignRow  = Database['public']['Tables']['launch_campaigns']['Row']
export type TrendSignalRow     = Database['public']['Tables']['trend_signals']['Row']

// Insert types
export type UserInsert            = Database['public']['Tables']['users']['Insert']
export type WorkspaceInsert       = Database['public']['Tables']['workspaces']['Insert']
export type BrandRuleInsert       = Database['public']['Tables']['brand_rules']['Insert']
export type MissionInsert         = Database['public']['Tables']['missions']['Insert']
export type JobInsert             = Database['public']['Tables']['jobs']['Insert']
export type AssetInsert           = Omit<Database['public']['Tables']['assets']['Insert'], 'asset_type' | 'content' | 'linked_offer_id'> & {
  type: Database['public']['Enums']['asset_type']
  body?: string
  offer_id?: string | null
}
export type OfferInsert           = Database['public']['Tables']['offers']['Insert']
export type ApprovalInsert        = Database['public']['Tables']['approvals']['Insert']
export type ConnectorInsert       = Database['public']['Tables']['connectors']['Insert']
export type AnalyticsEventInsert  = Database['public']['Tables']['analytics_events']['Insert']
export type ActivityLogInsert     = Database['public']['Tables']['activity_logs']['Insert']
export type LaunchCampaignInsert  = Database['public']['Tables']['launch_campaigns']['Insert']
export type TrendSignalInsertRow  = Database['public']['Tables']['trend_signals']['Insert']

// Update types
export type UserUpdate            = Database['public']['Tables']['users']['Update']
export type WorkspaceUpdate       = Database['public']['Tables']['workspaces']['Update']
export type BrandRuleUpdate       = Database['public']['Tables']['brand_rules']['Update']
export type MissionUpdate         = Database['public']['Tables']['missions']['Update']
export type JobUpdate             = Database['public']['Tables']['jobs']['Update']
export type AssetUpdate           = Database['public']['Tables']['assets']['Update']
export type OfferUpdate           = Database['public']['Tables']['offers']['Update']
export type ApprovalUpdate        = Database['public']['Tables']['approvals']['Update']
export type ConnectorUpdate         = Database['public']['Tables']['connectors']['Update']
export type PublishingLogInsert     = Database['public']['Tables']['publishing_logs']['Insert']
export type PublishingLogUpdate     = Database['public']['Tables']['publishing_logs']['Update']
export type AnalyticsEventUpdate  = Database['public']['Tables']['analytics_events']['Update']
export type ActivityLogUpdate     = Database['public']['Tables']['activity_logs']['Update']
export type LaunchCampaignUpdate  = Database['public']['Tables']['launch_campaigns']['Update']

// Enum types
export type MissionStatus     = Database['public']['Enums']['mission_status']
export type MissionPriority   = Database['public']['Enums']['mission_priority']
export type JobStatus         = Database['public']['Enums']['job_status']
export type ModelUsed         = Database['public']['Enums']['model_used']
export type OperatorTeam      = Database['public']['Enums']['operator_team']
export type AssetType         = Database['public']['Enums']['asset_type']
export type AssetPlatform     = Database['public']['Enums']['asset_platform']
export type AssetStatus       = Database['public']['Enums']['asset_status']
export type Platform          = AssetPlatform
export type ApprovalStatus    = Database['public']['Enums']['approval_status']
export type RiskLevel         = Database['public']['Enums']['risk_level']
export type SafetyLevel       = Database['public']['Enums']['safety_level']
export type OfferType         = Database['public']['Enums']['offer_type']
export type OfferStatus       = Database['public']['Enums']['offer_status']
export type ConnectorPlatform = Database['public']['Enums']['connector_platform']
export type ConnectorStatus   = Database['public']['Enums']['connector_status']
export type CampaignStatus    = Database['public']['Enums']['campaign_status']
export type SignalMomentum    = Database['public']['Enums']['signal_momentum']

// App-layer convenience aliases
export type User = UserRow & { name?: string | null }
export type Workspace = WorkspaceRow & { settings?: Record<string, unknown> | null }
export type BrandRule = BrandRuleRow
export type Approval = ApprovalRow
export type Connector = ConnectorRow
export type AnalyticsEvent = AnalyticsEventRow
export type ActivityLog = ActivityLogRow
export type LaunchCampaign = LaunchCampaignRow

export type Mission = MissionRow & {
  started_at?: string | null
  completed_at?: string | null
}

export type Job = JobRow & {
  duration_ms?: number | null
}

export type Asset = Omit<AssetRow, 'asset_type' | 'content' | 'linked_offer_id'> & {
  type: AssetRow['asset_type']
  body: AssetRow['content']
  offer_id: AssetRow['linked_offer_id']
}

export type Offer = OfferRow & {
  price?: string | null
  features?: string[] | null
}
