/**
 * Asset Pipeline — creates assets and approvals from completed job outputs
 *
 * After the execution engine finishes a job, this pipeline:
 * 1. Maps operator output → asset row (for content-producing job types)
 * 2. Creates approval rows when Brand Guardian flags safety issues
 *
 * Fault-tolerant: errors are logged but never thrown. A failing pipeline
 * must never break job execution.
 */

import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import { JobType, Platform } from '@/features/ai/types'
import type { ModelChoice } from '@/features/ai/types'
import type { Database, Json } from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// DB type aliases
// ---------------------------------------------------------------------------

type DbAssetType = Database['public']['Enums']['asset_type']
type DbPlatform = Database['public']['Enums']['asset_platform']
type DbOperatorTeam = Database['public']['Enums']['operator_team']
type DbRiskLevel = Database['public']['Enums']['risk_level']
type AssetInsert = Database['public']['Tables']['assets']['Insert']
type AssetRow = Database['public']['Tables']['assets']['Row']
type ApprovalInsert = Database['public']['Tables']['approvals']['Insert']
type ApprovalRow = Database['public']['Tables']['approvals']['Row']

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface AssetPipelineInput {
  jobId: string
  missionId: string
  workspaceId: string
  operatorTeam: DbOperatorTeam
  jobType: JobType
  output: unknown
  model: ModelChoice
  confidenceScore?: number
}

export interface ApprovalCheckInput {
  jobId: string
  missionId: string
  workspaceId: string
  operatorTeam: DbOperatorTeam
  output: unknown
}

interface PipelineResult<T> {
  data: T | null
  error: string | null
}

// ---------------------------------------------------------------------------
// Mapping tables
// ---------------------------------------------------------------------------

/** Only content-producing job types create asset rows. */
const JOB_TYPE_TO_ASSET_TYPE: Partial<Record<JobType, DbAssetType>> = {
  [JobType.CONTENT_GENERATION]: 'post',
  [JobType.THREAD_GENERATION]: 'thread',
  [JobType.SCRIPT_GENERATION]: 'script',
  [JobType.CAPTION_GENERATION]: 'caption',
  [JobType.CTA_GENERATION]: 'cta',
  [JobType.CONTENT_REPURPOSING]: 'post',
  [JobType.LEAD_MAGNET_CREATION]: 'report',
}

/** AI Platform enum → DB platform enum. */
const AI_PLATFORM_TO_DB: Record<string, DbPlatform> = {
  [Platform.X]: 'x',
  [Platform.LINKEDIN]: 'linkedin',
  [Platform.INSTAGRAM]: 'instagram',
  [Platform.TIKTOK]: 'tiktok',
  [Platform.YOUTUBE]: 'youtube',
  [Platform.EMAIL]: 'email',
  [Platform.GENERIC]: 'universal',
}

const VALID_RISK_LEVELS: readonly DbRiskLevel[] = ['low', 'medium', 'high', 'critical']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely coerces an unknown value to a record for field access. */
function safeRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

/** Maps an AI Platform string to the DB platform enum, defaulting to 'universal'. */
function resolveDbPlatform(raw: unknown): DbPlatform {
  if (typeof raw === 'string' && raw in AI_PLATFORM_TO_DB) {
    return AI_PLATFORM_TO_DB[raw]!
  }
  return 'universal'
}

/**
 * Extracts the asset body from operator output based on job type.
 *
 * - Posts/captions: plain text body
 * - Threads: JSON array of tweets
 * - Scripts: JSON with hook, body sections, CTA
 * - CTAs: JSON array of variants
 */
function extractBody(jobType: JobType, output: Record<string, unknown>): string {
  switch (jobType) {
    case JobType.CONTENT_GENERATION:
    case JobType.CAPTION_GENERATION:
    case JobType.CONTENT_REPURPOSING: {
      if (typeof output.body === 'string' && output.body.length > 0) {
        return output.body
      }
      return JSON.stringify(output)
    }

    case JobType.THREAD_GENERATION: {
      if (Array.isArray(output.tweets)) {
        return JSON.stringify(output.tweets)
      }
      return JSON.stringify(output)
    }

    case JobType.SCRIPT_GENERATION: {
      return JSON.stringify({
        hook: output.hook,
        body: output.body,
        cta: output.cta,
        durationSeconds: output.durationSeconds,
      })
    }

    case JobType.CTA_GENERATION: {
      if (Array.isArray(output.variants)) {
        return JSON.stringify(output.variants)
      }
      return JSON.stringify(output)
    }

    case JobType.LEAD_MAGNET_CREATION: {
      return JSON.stringify(output)
    }

    default:
      return JSON.stringify(output)
  }
}

/** Derives a human-readable title from operator output fields or job type. */
function extractTitle(jobType: JobType, output: Record<string, unknown>): string {
  if (typeof output.title === 'string' && output.title.length > 0) return output.title
  if (typeof output.hook === 'string' && output.hook.length > 0) return output.hook
  if (typeof output.threadHook === 'string' && output.threadHook.length > 0) return output.threadHook

  const labels: Partial<Record<JobType, string>> = {
    [JobType.CONTENT_GENERATION]: 'Generated Post',
    [JobType.THREAD_GENERATION]: 'Generated Thread',
    [JobType.SCRIPT_GENERATION]: 'Generated Script',
    [JobType.CAPTION_GENERATION]: 'Generated Caption',
    [JobType.CTA_GENERATION]: 'CTA Variants',
    [JobType.CONTENT_REPURPOSING]: 'Repurposed Content',
    [JobType.LEAD_MAGNET_CREATION]: 'Lead Magnet',
  }
  return labels[jobType] ?? 'Generated Asset'
}

/** Builds rich metadata for the asset based on the specific output shape. */
function extractMetadata(
  jobType: JobType,
  output: Record<string, unknown>,
  model: ModelChoice,
): Record<string, unknown> {
  const base: Record<string, unknown> = { model, jobType }

  switch (jobType) {
    case JobType.CONTENT_GENERATION:
    case JobType.CONTENT_REPURPOSING: {
      if (typeof output.hook === 'string') base.hook = output.hook
      if (Array.isArray(output.hashtags)) base.hashtags = output.hashtags
      if (typeof output.characterCount === 'number') base.characterCount = output.characterCount
      if (typeof output.contentType === 'string') base.contentType = output.contentType
      if (output.metadata !== null && typeof output.metadata === 'object') {
        base.contentMetadata = output.metadata
      }
      break
    }

    case JobType.THREAD_GENERATION: {
      if (typeof output.threadHook === 'string') base.threadHook = output.threadHook
      if (typeof output.threadCTA === 'string') base.threadCTA = output.threadCTA
      if (typeof output.totalCharacters === 'number') base.totalCharacters = output.totalCharacters
      if (Array.isArray(output.tweets)) base.tweetCount = output.tweets.length
      break
    }

    case JobType.SCRIPT_GENERATION: {
      if (typeof output.durationSeconds === 'number') base.durationSeconds = output.durationSeconds
      if (typeof output.thumbnailSuggestion === 'string') {
        base.thumbnailSuggestion = output.thumbnailSuggestion
      }
      if (typeof output.captionSuggestion === 'string') {
        base.captionSuggestion = output.captionSuggestion
      }
      break
    }

    case JobType.CTA_GENERATION: {
      if (typeof output.recommendedVariant === 'number') {
        base.recommendedVariant = output.recommendedVariant
      }
      if (typeof output.rationale === 'string') base.rationale = output.rationale
      if (Array.isArray(output.variants)) base.variantCount = output.variants.length
      break
    }

    case JobType.CAPTION_GENERATION: {
      if (typeof output.hook === 'string') base.hook = output.hook
      if (Array.isArray(output.hashtags)) base.hashtags = output.hashtags
      if (typeof output.characterCount === 'number') base.characterCount = output.characterCount
      break
    }
  }

  return base
}

/** Looks for an offer ID in the output's metadata or top-level fields. */
function resolveLinkedOffer(output: Record<string, unknown>): string | null {
  if (output.metadata !== null && typeof output.metadata === 'object') {
    const meta = output.metadata as Record<string, unknown>
    if (typeof meta.linkedOfferId === 'string') return meta.linkedOfferId
  }
  if (typeof output.linkedOfferId === 'string') return output.linkedOfferId
  if (typeof output.offer_id === 'string') return output.offer_id
  return null
}

/** Extracts risk flag descriptions from a SafetyReview's flags array. */
function formatRiskFlags(flags: unknown[]): string[] {
  return flags.map((flag) => {
    const f = safeRecord(flag)
    const type = typeof f.type === 'string' ? f.type : 'unknown'
    const severity = typeof f.severity === 'string' ? f.severity : 'unknown'
    const excerpt = typeof f.excerpt === 'string' ? f.excerpt : ''
    return `[${severity}] ${type}: ${excerpt}`
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates an asset row from a completed job's output.
 *
 * Returns `{ data: null, error: null }` for non-content job types (not an error).
 * Returns `{ data: asset, error: null }` on success.
 * Returns `{ data: null, error: message }` on failure — logged, never thrown.
 */
export async function createAssetFromJobOutput(
  input: AssetPipelineInput,
): Promise<PipelineResult<AssetRow>> {
  const {
    jobId,
    missionId,
    workspaceId,
    operatorTeam,
    jobType,
    output,
    model,
    confidenceScore,
  } = input

  const assetType = JOB_TYPE_TO_ASSET_TYPE[jobType]
  if (!assetType) {
    return { data: null, error: null }
  }

  try {
    const record = safeRecord(output)
    const body = extractBody(jobType, record)
    const title = extractTitle(jobType, record)
    const platform = resolveDbPlatform(record.platform)
    const metadata = extractMetadata(jobType, record, model)

    let score = confidenceScore ?? null
    if (score === null && typeof record.confidenceScore === 'number') {
      score = record.confidenceScore
    }

    const row: AssetInsert = {
      workspace_id: workspaceId,
      mission_id: missionId,
      job_id: jobId,
      operator_team: operatorTeam,
      asset_type: assetType,
      platform,
      status: 'draft',
      title,
      content: body,
      metadata: metadata as Json,
      confidence_score: score ?? undefined,
      linked_offer_id: resolveLinkedOffer(record),
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('assets')
      .insert(row)
      .select()
      .single()

    if (error) {
      console.error(
        `[AssetPipeline] Failed to insert asset for job ${jobId}: ${error.message}`,
      )
      return { data: null, error: error.message }
    }

    return { data: data as AssetRow, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(
      `[AssetPipeline] Unexpected error creating asset for job ${jobId}: ${message}`,
    )
    return { data: null, error: message }
  }
}

/**
 * Creates an approval row if the job output is a Brand Guardian safety review
 * that flagged issues.
 *
 * Finds the most recent asset in the same mission (excluding the current job)
 * and attaches the approval to it. Also transitions that asset to 'review' status.
 *
 * No-op for non-Brand Guardian jobs or clean safety reviews.
 */
export async function createApprovalIfNeeded(
  input: ApprovalCheckInput,
): Promise<PipelineResult<ApprovalRow>> {
  const { jobId, missionId, workspaceId, operatorTeam, output } = input

  if (operatorTeam !== 'brand_guardian') {
    return { data: null, error: null }
  }

  try {
    const record = safeRecord(output)

    const approved = record.approved
    const flags = Array.isArray(record.flags) ? record.flags : []
    const riskLevel = typeof record.riskLevel === 'string' ? record.riskLevel : null

    if (approved === true && flags.length === 0) {
      return { data: null, error: null }
    }

    if (typeof approved !== 'boolean' && flags.length === 0) {
      return { data: null, error: null }
    }

    const supabase = createAdminClient()

    const { data: relatedAsset, error: assetError } = await supabase
      .from('assets')
      .select('id')
      .eq('mission_id', missionId)
      .eq('workspace_id', workspaceId)
      .neq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (assetError || !relatedAsset) {
      console.error(
        `[AssetPipeline] No related asset found for approval (mission ${missionId}): ` +
          (assetError?.message ?? 'no rows'),
      )
      return { data: null, error: assetError?.message ?? 'No related asset found' }
    }

    await supabase
      .from('assets')
      .update({ status: 'review' as const })
      .eq('id', relatedAsset.id)

    const dbRiskLevel: DbRiskLevel = VALID_RISK_LEVELS.includes(riskLevel as DbRiskLevel)
      ? (riskLevel as DbRiskLevel)
      : 'medium'

    const approval: ApprovalInsert = {
      workspace_id: workspaceId,
      asset_id: relatedAsset.id,
      status: 'pending',
      risk_level: dbRiskLevel,
      risk_flags: formatRiskFlags(flags),
      notes: typeof record.revisionNotes === 'string' ? record.revisionNotes : null,
    }

    const { data, error } = await supabase
      .from('approvals')
      .insert(approval)
      .select()
      .single()

    if (error) {
      console.error(
        `[AssetPipeline] Failed to insert approval for asset ${relatedAsset.id}: ${error.message}`,
      )
      return { data: null, error: error.message }
    }

    return { data: data as ApprovalRow, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(
      `[AssetPipeline] Unexpected error checking approval for job ${jobId}: ${message}`,
    )
    return { data: null, error: message }
  }
}
