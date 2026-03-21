import { z } from 'zod'

// ---------------------------------------------------------------------------
// Literal union types
// ---------------------------------------------------------------------------

export type ExecutionMode = 'light' | 'heavy' | 'auto'
export type PermissionLevel = 'autonomous' | 'draft'
export type ScheduleType = 'once' | 'daily' | 'hourly' | 'weekly' | 'custom_cron'
export type ScheduledMissionRunStatus = 'running' | 'completed' | 'failed' | 'skipped'

// ---------------------------------------------------------------------------
// Interfaces — map 1-to-1 with DB columns
// ---------------------------------------------------------------------------

/** Typed representation of a scheduled_missions row. */
export interface ScheduledMission {
  id: string
  workspace_id: string

  // Identity
  name: string
  instruction: string

  // Schedule definition
  schedule_type: ScheduleType
  cron_expression: string | null
  scheduled_at: string | null
  timezone: string

  // Execution settings
  execution_mode: ExecutionMode
  permission_level: PermissionLevel
  operator_team: string | null
  tags: string[]
  config: Record<string, unknown>

  // State
  is_active: boolean
  last_run_at: string | null
  next_run_at: string | null
  run_count: number
  max_consecutive_failures: number
  consecutive_failures: number

  // Metadata
  created_at: string
  updated_at: string
}

/** Typed representation of a scheduled_mission_runs row. */
export interface ScheduledMissionRun {
  id: string
  scheduled_mission_id: string
  mission_id: string | null

  // Execution result
  status: ScheduledMissionRunStatus
  execution_mode: ExecutionMode
  result_summary: string | null
  result_data: Record<string, unknown>
  error_message: string | null
  tokens_used: number | null
  duration_ms: number | null

  // Timing
  started_at: string
  completed_at: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Input / update shapes
// ---------------------------------------------------------------------------

/** Shape accepted when creating a new scheduled mission. */
export interface ScheduledMissionInput {
  name: string
  instruction: string
  schedule_type: ScheduleType
  cron_expression?: string
  scheduled_at?: string
  timezone?: string
  execution_mode?: ExecutionMode
  permission_level?: PermissionLevel
  operator_team?: string
  tags?: string[]
  config?: Record<string, unknown>
}

/** Shape accepted when updating an existing scheduled mission (all editable fields optional). */
export type ScheduledMissionUpdate = Partial<
  Pick<
    ScheduledMission,
    | 'name'
    | 'instruction'
    | 'schedule_type'
    | 'cron_expression'
    | 'scheduled_at'
    | 'timezone'
    | 'execution_mode'
    | 'permission_level'
    | 'operator_team'
    | 'tags'
    | 'config'
    | 'is_active'
    | 'next_run_at'
    | 'last_run_at'
    | 'run_count'
    | 'consecutive_failures'
    | 'max_consecutive_failures'
  >
>

/** Input shape for inserting a new run record. */
export interface ScheduledMissionRunInput {
  scheduled_mission_id: string
  mission_id?: string
  status?: ScheduledMissionRunStatus
  execution_mode: ExecutionMode
  result_summary?: string
  result_data?: Record<string, unknown>
  error_message?: string
  tokens_used?: number
  duration_ms?: number
  started_at?: string
  completed_at?: string
}

/** Partial shape for updating a run record. */
export type ScheduledMissionRunUpdate = Partial<
  Pick<
    ScheduledMissionRun,
    | 'status'
    | 'result_summary'
    | 'result_data'
    | 'error_message'
    | 'tokens_used'
    | 'duration_ms'
    | 'completed_at'
    | 'mission_id'
  >
>

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface ScheduledMissionStats {
  total: number
  active: number
  runs_today: number
  failures_today: number
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const ScheduledMissionInputSchema = z.object({
  name: z.string().min(1).max(200),
  instruction: z.string().min(1).max(10000),
  schedule_type: z.enum(['once', 'daily', 'hourly', 'weekly', 'custom_cron']),
  cron_expression: z.string().max(100).optional(),
  scheduled_at: z.string().datetime({ offset: true }).optional(),
  timezone: z.string().max(100).optional(),
  execution_mode: z.enum(['light', 'heavy', 'auto']).optional(),
  permission_level: z.enum(['autonomous', 'draft']).optional(),
  operator_team: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  config: z.record(z.unknown()).optional(),
})

export const ScheduledMissionUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  instruction: z.string().min(1).max(10000).optional(),
  schedule_type: z.enum(['once', 'daily', 'hourly', 'weekly', 'custom_cron']).optional(),
  cron_expression: z.string().max(100).nullable().optional(),
  scheduled_at: z.string().datetime({ offset: true }).nullable().optional(),
  timezone: z.string().max(100).optional(),
  execution_mode: z.enum(['light', 'heavy', 'auto']).optional(),
  permission_level: z.enum(['autonomous', 'draft']).optional(),
  operator_team: z.string().max(100).nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  config: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
  next_run_at: z.string().datetime({ offset: true }).nullable().optional(),
  last_run_at: z.string().datetime({ offset: true }).nullable().optional(),
  run_count: z.number().int().min(0).optional(),
  consecutive_failures: z.number().int().min(0).optional(),
  max_consecutive_failures: z.number().int().min(1).optional(),
})
