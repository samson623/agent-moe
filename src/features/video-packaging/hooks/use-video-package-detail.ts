'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { VideoPackage } from './use-video-packages'

export interface UseVideoPackageDetailReturn {
  pkg: VideoPackage | null
  loading: boolean
  error: string | null
  refresh: () => void
  updateStatus: (status: string) => Promise<boolean>
  updateTitle: (title: string) => Promise<boolean>
  remove: () => Promise<boolean>
}


function normalizeScene(scene: VideoPackage['scenes'][number]): VideoPackage['scenes'][number] {
  const raw = scene as VideoPackage['scenes'][number] & { imageUrl?: string }
  return {
    ...scene,
    image_url: scene.image_url ?? raw.imageUrl,
  }
}

function normalizeVideoPackage(pkg: VideoPackage): VideoPackage {
  return {
    ...pkg,
    scenes: Array.isArray(pkg.scenes) ? pkg.scenes.map(normalizeScene) : [],
  }
}

export function useVideoPackageDetail(
  id: string,
  workspaceId: string,
): UseVideoPackageDetailReturn {
  const [pkg, setPkg] = useState<VideoPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchPackage = useCallback(async () => {
    if (!id || !workspaceId) {
      setPkg(null)
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ workspace_id: workspaceId })

      const res = await fetch(`/api/video-packages/${id}?${params.toString()}`, {
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }

      const json = await res.json() as { data: VideoPackage }

      setPkg(json.data ? normalizeVideoPackage(json.data) : null)
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to load video package')
    } finally {
      setLoading(false)
    }
  }, [id, workspaceId])

  useEffect(() => {
    void fetchPackage()
    return () => { abortRef.current?.abort() }
  }, [fetchPackage])

  const updateStatus = useCallback(
    async (status: string): Promise<boolean> => {
      setError(null)

      try {
        const res = await fetch(`/api/video-packages/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, workspace_id: workspaceId }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(body.error ?? `Update failed (${res.status})`)
        }

        const json = await res.json() as { data: VideoPackage }
        setPkg(json.data ? normalizeVideoPackage(json.data) : null)
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update status')
        return false
      }
    },
    [id, workspaceId],
  )

  const updateTitle = useCallback(
    async (title: string): Promise<boolean> => {
      setError(null)

      try {
        const res = await fetch(`/api/video-packages/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, workspace_id: workspaceId }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(body.error ?? `Update failed (${res.status})`)
        }

        const json = await res.json() as { data: VideoPackage }
        setPkg(json.data ? normalizeVideoPackage(json.data) : null)
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update title')
        return false
      }
    },
    [id, workspaceId],
  )

  const remove = useCallback(async (): Promise<boolean> => {
    setError(null)

    try {
      const params = new URLSearchParams({ workspace_id: workspaceId })

      const res = await fetch(`/api/video-packages/${id}?${params.toString()}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `Delete failed (${res.status})`)
      }

      setPkg(null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video package')
      return false
    }
  }, [id, workspaceId])

  return { pkg, loading, error, refresh: fetchPackage, updateStatus, updateTitle, remove }
}
