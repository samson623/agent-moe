'use client'

import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, Link2, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VideoPackage } from '../hooks/use-video-packages'
import { readCustomSceneImages } from '@/features/video-rendering/scene-image-metadata'

interface SceneVisualsPanelProps {
  pkg: VideoPackage
  workspaceId: string
  onRefresh: () => void
}

export function SceneVisualsPanel({ pkg, workspaceId, onRefresh }: SceneVisualsPanelProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draftUrls, setDraftUrls] = useState<Record<number, string>>({})

  const sceneImageGroups = useMemo(
    () => readCustomSceneImages(pkg.metadata, pkg.scenes.length),
    [pkg.metadata, pkg.scenes.length],
  )

  const sortedScenes = useMemo(
    () => [...pkg.scenes].sort((a, b) => a.order - b.order),
    [pkg.scenes],
  )

  useEffect(() => {
    const nextDrafts: Record<number, string> = {}
    sortedScenes.forEach((scene, index) => {
      nextDrafts[scene.order] = (sceneImageGroups[index] ?? []).join('\n')
    })
    setDraftUrls(nextDrafts)
  }, [sortedScenes, sceneImageGroups])

  async function handleRequest(
    action: () => Promise<Response>,
    busyState: string,
    successMessage: string,
  ) {
    setBusyKey(busyState)
    setError(null)
    setMessage(null)

    try {
      const res = await action()

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string; details?: string }
        throw new Error(
          [body.error, body.details].filter(Boolean).join(': ') || `Request failed (${res.status})`,
        )
      }

      setMessage(successMessage)
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scene image action failed')
    } finally {
      setBusyKey(null)
    }
  }

  const handleUpload = async (sceneOrder: number, files: FileList | null) => {
    if (!files || files.length === 0) return

    const formData = new FormData()
    formData.set('workspace_id', workspaceId)
    formData.set('scene_order', String(sceneOrder))

    Array.from(files).forEach((file) => {
      formData.append('files', file)
    })

    await handleRequest(
      () => fetch(`/api/video-packages/${pkg.id}/scene-images`, {
        method: 'POST',
        body: formData,
      }),
      `upload-${sceneOrder}`,
      `Added ${files.length} image${files.length === 1 ? '' : 's'} to scene ${sceneOrder}.`,
    )
  }

  const handleSaveUrls = async (sceneOrder: number) => {
    const urls = (draftUrls[sceneOrder] ?? '')
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean)

    await handleRequest(
      () => fetch(`/api/video-packages/${pkg.id}/scene-images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          action: 'set_scene_urls',
          scene_order: sceneOrder,
          urls,
        }),
      }),
      `save-urls-${sceneOrder}`,
      urls.length > 0
        ? `Saved ${urls.length} pasted image URL${urls.length === 1 ? '' : 's'} for scene ${sceneOrder}.`
        : `Cleared pasted URLs for scene ${sceneOrder}.`,
    )
  }

  const handleAutoFillAll = async () => {
    await handleRequest(
      () => fetch(`/api/video-packages/${pkg.id}/scene-images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          action: 'auto_fill_all',
        }),
      }),
      'auto-fill-all',
      'Auto-filled visuals for all scenes.',
    )
  }

  const handleAutoFillScene = async (sceneOrder: number) => {
    await handleRequest(
      () => fetch(`/api/video-packages/${pkg.id}/scene-images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          action: 'auto_fill_scene',
          scene_order: sceneOrder,
        }),
      }),
      `auto-fill-${sceneOrder}`,
      `Auto-filled scene ${sceneOrder}.`,
    )
  }

  const handleClearScene = async (sceneOrder: number) => {
    await handleRequest(
      () => fetch(`/api/video-packages/${pkg.id}/scene-images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          scene_order: sceneOrder,
        }),
      }),
      `clear-${sceneOrder}`,
      `Cleared all custom images for scene ${sceneOrder}.`,
    )
  }

  const handleRemoveSingleImage = async (sceneOrder: number, nextUrls: string[]) => {
    setDraftUrls((current) => ({
      ...current,
      [sceneOrder]: nextUrls.join('\n'),
    }))

    await handleRequest(
      () => fetch(`/api/video-packages/${pkg.id}/scene-images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          action: 'set_scene_urls',
          scene_order: sceneOrder,
          urls: nextUrls,
        }),
      }),
      `remove-one-${sceneOrder}`,
      `Removed one image from scene ${sceneOrder}.`,
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Scene visuals</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Each scene can now hold multiple images. Upload several files, paste multiple image
              URLs on separate lines, or let the app auto-fill visuals. During render, longer
              scenes cycle through the image stack instead of holding on one frame.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoFillAll}
            disabled={busyKey !== null}
            className="gap-2"
          >
            {busyKey === 'auto-fill-all' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            AI Fill All
          </Button>
        </div>

        {message && (
          <div className="rounded-[var(--radius)] border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-[var(--radius)] border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedScenes.map((scene, index) => {
          const imageUrls = sceneImageGroups[index] ?? []
          const leadImageUrl = imageUrls[0]
          const uploadBusy = busyKey === `upload-${scene.order}`
          const autoBusy = busyKey === `auto-fill-${scene.order}`
          const clearBusy = busyKey === `clear-${scene.order}`
          const saveBusy = busyKey === `save-urls-${scene.order}`
          const removeOneBusy = busyKey === `remove-one-${scene.order}`
          const disabled = busyKey !== null

          return (
            <div
              key={scene.order}
              className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden"
            >
              <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)]">
                <div className="border-b xl:border-b-0 xl:border-r border-[var(--border)] bg-[var(--surface)]">
                  <div className="aspect-video overflow-hidden">
                    {leadImageUrl ? (
                      <img
                        src={leadImageUrl}
                        alt={`Scene ${scene.order}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center gap-2 text-[var(--text-muted)]">
                        <ImagePlus size={18} />
                        <span className="text-sm">No custom scene images</span>
                      </div>
                    )}
                  </div>

                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 p-3 border-t border-[var(--border)]">
                      {imageUrls.map((url, thumbIndex) => (
                        <div
                          key={url + thumbIndex}
                          className="relative aspect-video overflow-hidden rounded-[var(--radius-sm)]"
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => void handleRemoveSingleImage(
                              scene.order,
                              imageUrls.filter((_, indexToKeep) => indexToKeep !== thumbIndex),
                            )}
                            disabled={disabled}
                            className={cn(
                              'absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full',
                              'bg-black/70 text-white transition-colors hover:bg-red-500',
                              'disabled:opacity-40 disabled:pointer-events-none',
                            )}
                            aria-label={`Remove image ${thumbIndex + 1} from scene ${scene.order}`}
                          >
                            {removeOneBusy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-[var(--text)]">
                        Scene {scene.order}: {scene.title}
                      </h4>
                      <span className="text-xs text-[var(--text-muted)]">
                        {scene.duration_seconds}s · {imageUrls.length} image{imageUrls.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {scene.visual_direction}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <label
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        disabled && 'opacity-40 pointer-events-none',
                      )}
                    >
                      {uploadBusy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                      Upload Images
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="hidden"
                        disabled={disabled}
                        onChange={(event) => {
                          void handleUpload(scene.order, event.target.files)
                          event.currentTarget.value = ''
                        }}
                      />
                    </label>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleAutoFillScene(scene.order)}
                      disabled={disabled}
                      className="gap-2"
                    >
                      {autoBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      AI Fill
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleClearScene(scene.order)}
                      disabled={disabled || imageUrls.length === 0}
                      className="gap-2"
                    >
                      {clearBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Clear Scene
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                      <Link2 size={13} />
                      Paste image URLs for this scene
                    </div>
                    <textarea
                      value={draftUrls[scene.order] ?? ''}
                      onChange={(event) => {
                        setDraftUrls((current) => ({
                          ...current,
                          [scene.order]: event.target.value,
                        }))
                      }}
                      placeholder={'Paste one image URL per line'}
                      rows={5}
                      className={cn(
                        'w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs',
                        'text-[var(--text)] placeholder-[var(--text-muted)] resize-y',
                        'focus:outline-none focus:border-[var(--primary)]',
                      )}
                    />
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Use one URL per line. Render will cycle through them over the scene.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleSaveUrls(scene.order)}
                        disabled={disabled}
                        className="gap-2"
                      >
                        {saveBusy ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                        Save URLs
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
