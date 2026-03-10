/**
 * Approval query helpers.
 *
 * Approvals are the safety gate — flagged assets require explicit
 * approve / reject / revision before they can be published.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Approval, ApprovalStatus, RiskLevel } from '../types'

type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApprovalFilters {
  status?: ApprovalStatus
  risk_level?: RiskLevel
  mission_id?: string
}

export interface ApprovalStats {
  pending: number
  approved_today: number
  rejected_today: number
  total_reviewed: number
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns a paginated list of approvals for a workspace.
 */
export async function getApprovals(
  client: TypedClient,
  workspaceId: string,
  filters: ApprovalFilters = {},
  options: { limit?: number; offset?: number } = {},
): Promise<{ data: Approval[]; count: number; error: string | null }> {
  const limit = Math.min(100, Math.max(1, options.limit ?? 20))
  const offset = Math.max(0, options.offset ?? 0)

  let query = client
    .from('approvals')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.risk_level) {
    query = query.eq('risk_level', filters.risk_level)
  }
  if (filters.mission_id) {
    query = query.eq('mission_id', filters.mission_id)
  }

  const { data, error, count } = await query

  if (error) {
    return { data: [], count: 0, error: error.message }
  }

  return {
    data: (data ?? []) as unknown as Approval[],
    count: count ?? 0,
    error: null,
  }
}

/**
 * Returns a single approval by ID.
 */
export async function getApproval(
  client: TypedClient,
  approvalId: string,
): Promise<{ data: Approval | null; error: string | null }> {
  const { data, error } = await client
    .from('approvals')
    .select('*')
    .eq('id', approvalId)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as unknown as Approval | null, error: null }
}

/**
 * Returns all approvals linked to a specific mission.
 */
export async function getApprovalsByMission(
  client: TypedClient,
  missionId: string,
  workspaceId: string,
): Promise<{ data: Approval[]; error: string | null }> {
  const { data, error } = await client
    .from('approvals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('mission_id', missionId)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []) as unknown as Approval[], error: null }
}

/**
 * Records a decision on an approval and triggers the post-approval
 * asset status update.
 */
export async function decideApproval(
  client: TypedClient,
  approvalId: string,
  decision: 'approved' | 'rejected' | 'revision_requested',
  notes?: string,
): Promise<{ data: Approval | null; error: string | null }> {
  const { data, error } = await client
    .from('approvals')
    .update({
      status: decision,
      notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', approvalId)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  const approval = data as unknown as Approval

  // Post-approval trigger: sync asset status
  const assetStatus =
    decision === 'approved'
      ? 'approved'
      : decision === 'rejected'
        ? 'rejected'
        : 'draft' // revision_requested → back to draft

  if (approval.asset_id) {
    await client
      .from('assets')
      .update({ status: assetStatus })
      .eq('id', approval.asset_id)
  }

  return { data: approval, error: null }
}

/**
 * Batch-decides multiple approvals in sequence.
 * Returns count of updated rows.
 */
export async function batchDecideApprovals(
  client: TypedClient,
  approvalIds: string[],
  decision: 'approved' | 'rejected',
  notes?: string,
): Promise<{ updated: number; error: string | null }> {
  if (approvalIds.length === 0) {
    return { updated: 0, error: null }
  }

  const decidedAt = new Date().toISOString()
  const assetStatus = decision === 'approved' ? 'approved' : 'rejected'

  const { data, error } = await client
    .from('approvals')
    .update({
      status: decision,
      notes: notes ?? null,
      reviewed_at: decidedAt,
    })
    .in('id', approvalIds)
    .eq('status', 'pending') // only update pending ones
    .select('id, asset_id')

  if (error) {
    return { updated: 0, error: error.message }
  }

  const updated = (data ?? []) as unknown as Pick<Approval, 'id' | 'asset_id'>[]

  // Sync all affected asset statuses
  const assetIds = updated.map((a) => a.asset_id).filter((id): id is string => id !== null)
  if (assetIds.length > 0) {
    await client
      .from('assets')
      .update({ status: assetStatus })
      .in('id', assetIds)
  }

  return { updated: updated.length, error: null }
}

/**
 * Returns approval stats for dashboard / header badge.
 */
export async function getApprovalStats(
  client: TypedClient,
  workspaceId: string,
): Promise<ApprovalStats> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = today.toISOString()

  const [pendingResult, approvedTodayResult, rejectedTodayResult, totalResult] =
    await Promise.all([
      client
        .from('approvals')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending'),
      client
        .from('approvals')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'approved')
        .gte('reviewed_at', todayIso),
      client
        .from('approvals')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'rejected')
        .gte('reviewed_at', todayIso),
      client
        .from('approvals')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .neq('status', 'pending'),
    ])

  return {
    pending: pendingResult.count ?? 0,
    approved_today: approvedTodayResult.count ?? 0,
    rejected_today: rejectedTodayResult.count ?? 0,
    total_reviewed: totalResult.count ?? 0,
  }
}

/**
 * Returns decided approvals for the audit history view.
 */
export async function getApprovalHistory(
  client: TypedClient,
  workspaceId: string,
  limit = 50,
): Promise<{ data: Approval[]; error: string | null }> {
  const { data, error } = await client
    .from('approvals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .neq('status', 'pending')
    .order('reviewed_at', { ascending: false })
    .limit(Math.min(200, limit))

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: (data ?? []) as unknown as Approval[], error: null }
}
