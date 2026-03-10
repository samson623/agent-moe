import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { bulkUpdateAssetStatus, duplicateAsset } from '@/lib/supabase/queries/assets'
import { logActivity } from '@/lib/supabase/queries/activity'
import type { AssetStatus } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const bulkActionSchema = z.object({
  asset_ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['approve', 'reject', 'archive', 'duplicate', 'publish']),
  workspace_id: z.string().uuid(),
})

const ACTION_TO_STATUS: Record<string, AssetStatus> = {
  approve: 'approved',
  reject: 'rejected',
  archive: 'archived',
  publish: 'published',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = bulkActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { asset_ids, action, workspace_id } = parsed.data
    const client = createAdminClient()

    if (action === 'duplicate') {
      const results: string[] = []
      const errors: string[] = []

      for (const assetId of asset_ids) {
        const { data: dup, error } = await duplicateAsset(client, assetId)
        if (error || !dup) {
          errors.push(`${assetId}: ${error ?? 'unknown error'}`)
        } else {
          results.push(dup.id)
          await logActivity(client, {
            workspace_id,
            actor_type: 'system',
            action: 'asset.duplicated',
            entity_type: 'asset',
            entity_id: dup.id,
            summary: `Asset duplicated from ${assetId} → ${dup.id} (v${dup.version})`,
          })
        }
      }

      return NextResponse.json({
        data: { duplicated_ids: results, count: results.length },
        ...(errors.length > 0 && { errors }),
      })
    }

    const targetStatus = ACTION_TO_STATUS[action]!
    const { count, error } = await bulkUpdateAssetStatus(client, asset_ids, targetStatus)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    await logActivity(client, {
      workspace_id,
      actor_type: 'system',
      action: `asset.bulk_${action}`,
      entity_type: 'asset',
      entity_id: asset_ids[0] ?? '',
      summary: `Bulk ${action}: ${count} asset(s) → ${targetStatus}`,
      details: { asset_ids, target_status: targetStatus },
    })

    return NextResponse.json({ data: { count, status: targetStatus } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
