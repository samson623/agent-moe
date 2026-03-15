'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface VideoHook {
  primary: string
  variants: string[]
}

export interface VideoScene {
  order: number
  title: string
  script: string
  visual_direction: string
  duration_seconds: number
  image_url?: string
}

export interface ThumbnailConcept {
  headline: string
  visual_description: string
  color_scheme: string
  text_overlay: string
}

export interface VideoCTA {
  text: string
  type: 'subscribe' | 'link_in_bio' | 'dm' | 'comment' | 'visit' | 'buy'
  destination?: string
}

export interface VideoPackage {
  id: string
  workspace_id: string
  mission_id: string | null
  asset_id: string | null
  title: string
  platform: string
  hook: VideoHook
  scenes: VideoScene[]
  thumbnail_concept: ThumbnailConcept
  caption: string | null
  cta: VideoCTA | null
  status: string
  confidence_score: number | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface VideoPackageFilters {
  platform?: string
  status?: string
  search?: string
}

export interface UseVideoPackagesReturn {
  packages: VideoPackage[]
  total: number
  page: number
  loading: boolean
  error: string | null
  refetch: () => void
  setPage: (page: number) => void
}


function normalizeScene(scene: VideoScene): VideoScene {
  const raw = scene as VideoScene & { imageUrl?: string }
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

export function useVideoPackages(
  workspaceId: string,
  filters?: VideoPackageFilters,
  initialPage = 1,
): UseVideoPackagesReturn {
  const [packages, setPackages] = useState<VideoPackage[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPageState] = useState(initialPage)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchPackages = useCallback(async () => {
    if (!workspaceId) {
      setPackages([])
      setTotal(0)
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ workspace_id: workspaceId, page: String(page) })

      if (filters?.platform) params.set('platform', filters.platform)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.search) params.set('search', filters.search)

      const res = await fetch(`/api/video-packages?${params.toString()}`, {
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }

      const json = await res.json() as { data: VideoPackage[]; total: number; page: number }

      setPackages((json.data ?? []).map(normalizeVideoPackage))
      setTotal(json.total ?? 0)
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to load video packages')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, filters?.platform, filters?.status, filters?.search, page])

  useEffect(() => {
    void fetchPackages()
    return () => { abortRef.current?.abort() }
  }, [fetchPackages])

  const setPage = useCallback((next: number) => {
    setPageState(next)
  }, [])

  return { packages, total, page, loading, error, refetch: fetchPackages, setPage }
}
