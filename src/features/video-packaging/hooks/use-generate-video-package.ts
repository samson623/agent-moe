'use client'

import { useCallback, useState } from 'react'
import type { VideoPackage } from './use-video-packages'

export interface GenerateVideoPackageInput {
  topic: string
  platform: string
  tone?: string
  scene_count?: number
  hook_count?: number
  mission_id?: string
}

export interface UseGenerateVideoPackageReturn {
  generate: (input: GenerateVideoPackageInput) => Promise<boolean>
  generating: boolean
  lastGenerated: VideoPackage | null
  error: string | null
  clearLastGenerated: () => void
}

export function useGenerateVideoPackage(workspaceId: string): UseGenerateVideoPackageReturn {
  const [generating, setGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<VideoPackage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(
    async (input: GenerateVideoPackageInput): Promise<boolean> => {
      setGenerating(true)
      setError(null)

      try {
        const res = await fetch('/api/video-packages/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_id: workspaceId, ...input }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string; details?: string }
          const message = [body.error, body.details].filter(Boolean).join(': ')
          throw new Error(message || `Generation failed (${res.status})`)
        }

        const json = await res.json() as { data: VideoPackage }
        setLastGenerated(json.data ?? null)
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate video package')
        return false
      } finally {
        setGenerating(false)
      }
    },
    [workspaceId],
  )

  const clearLastGenerated = useCallback(() => {
    setLastGenerated(null)
  }, [])

  return { generate, generating, lastGenerated, error, clearLastGenerated }
}
