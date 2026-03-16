export const CUSTOM_SCENE_IMAGES_KEY = 'custom_scene_images'

export function readCustomSceneImages(
  metadata: Record<string, unknown> | null | undefined,
  sceneCount: number,
): string[][] {
  const raw = metadata?.[CUSTOM_SCENE_IMAGES_KEY]

  if (!Array.isArray(raw)) {
    return Array.from({ length: sceneCount }, () => [])
  }

  return Array.from({ length: sceneCount }, (_, index) => {
    const value = raw[index]

    if (typeof value === 'string') {
      return value ? [value] : []
    }

    if (!Array.isArray(value)) {
      return []
    }

    return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
  })
}

export function writeCustomSceneImages(
  metadata: Record<string, unknown> | null | undefined,
  sceneImages: string[][],
): Record<string, unknown> {
  const next = { ...(metadata ?? {}) }

  if (sceneImages.some((group) => group.some((value) => value.trim().length > 0))) {
    next[CUSTOM_SCENE_IMAGES_KEY] = sceneImages
  } else {
    delete next[CUSTOM_SCENE_IMAGES_KEY]
  }

  return next
}
