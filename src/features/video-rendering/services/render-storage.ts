import 'server-only'

import fs from 'fs'
import { createAdminClient } from '@/lib/supabase/server'

const BUCKET = 'video-renders'

/**
 * Upload a rendered MP4 to Supabase Storage.
 * Returns a public URL for the uploaded file.
 *
 * NOTE: The `video-renders` bucket must be created in Supabase dashboard first.
 * If the bucket doesn't exist, falls back to serving from /public/renders/.
 */
export async function uploadRenderToStorage(
  filePath: string,
  videoPackageId: string,
  workspaceId: string,
): Promise<string> {
  try {
    const client = await createAdminClient()
    const fileBuffer = fs.readFileSync(filePath)
    const storagePath = `${workspaceId}/${videoPackageId}.mp4`

    const { error } = await client.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      })

    if (error) {
      console.warn('[render-storage] Supabase upload failed, using local path:', error.message)
      return `/renders/${videoPackageId}.mp4`
    }

    // Get public URL
    const { data } = client.storage.from(BUCKET).getPublicUrl(storagePath)

    // Clean up local file after successful upload
    try {
      fs.unlinkSync(filePath)
    } catch {
      // Non-critical — local cleanup failure is ok
    }

    return data.publicUrl
  } catch {
    // Fallback to local file serving
    console.warn('[render-storage] Storage unavailable, using local path')
    return `/renders/${videoPackageId}.mp4`
  }
}
