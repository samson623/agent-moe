export interface PlatformConfig {
  width: number;
  height: number;
  fps: number;
  label: string;
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  youtube:        { width: 1920, height: 1080, fps: 30, label: '16:9 YouTube' },
  'youtube-shorts': { width: 1080, height: 1920, fps: 30, label: '9:16 YouTube Shorts' },
  tiktok:         { width: 1080, height: 1920, fps: 30, label: '9:16 TikTok' },
  instagram: { width: 1080, height: 1920, fps: 30, label: '9:16 Reels' },
  x:         { width: 1080, height: 1080, fps: 30, label: '1:1 X/Twitter' },
  linkedin:  { width: 1080, height: 1080, fps: 30, label: '1:1 LinkedIn' },
  email:     { width: 1280, height: 720,  fps: 30, label: '16:9 Email' },
  universal: { width: 1920, height: 1080, fps: 30, label: '16:9 Universal' },
};

export const HOOK_DURATION_SECONDS = 3;
export const CTA_DURATION_SECONDS = 4;
export const THUMBNAIL_DURATION_SECONDS = 2;
export const TRANSITION_DURATION_FRAMES = 15; // 0.5s at 30fps

export function getPlatformConfig(platform: string): PlatformConfig {
  return PLATFORM_CONFIGS[platform] ?? PLATFORM_CONFIGS.universal!;
}

export function calculateTotalDuration(sceneDurations: number[]): number {
  const sceneTotal = sceneDurations.reduce((sum, d) => sum + d, 0);
  return HOOK_DURATION_SECONDS + THUMBNAIL_DURATION_SECONDS + sceneTotal + CTA_DURATION_SECONDS;
}
