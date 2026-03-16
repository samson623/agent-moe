import { interpolate, spring } from 'remotion';
import type { SpringConfig } from 'remotion';

const SPRING_CONFIG: SpringConfig = {
  damping: 12,
  mass: 0.5,
  stiffness: 100,
  overshootClamping: false,
};

/**
 * Spring-based scale entrance (0 → 1)
 */
export function springScale(frame: number, fps: number, delay = 0): number {
  return spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIG,
  });
}

/**
 * Spring-based opacity entrance (0 → 1)
 */
export function springOpacity(frame: number, fps: number, delay = 0): number {
  return spring({
    frame: frame - delay,
    fps,
    config: { ...SPRING_CONFIG, damping: 20 },
  });
}

/**
 * Slide up entrance: returns translateY value (starts from offset, ends at 0)
 */
export function slideUp(frame: number, fps: number, delay = 0, distance = 40): number {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIG,
  });
  return interpolate(progress, [0, 1], [distance, 0]);
}

/**
 * Word-by-word reveal: returns the number of words to show
 */
export function wordRevealCount(
  frame: number,
  fps: number,
  totalWords: number,
  durationSeconds: number,
  delay = 0,
): number {
  const adjustedFrame = Math.max(0, frame - delay);
  const totalFrames = durationSeconds * fps;
  const progress = Math.min(1, adjustedFrame / totalFrames);
  return Math.floor(progress * totalWords);
}

/**
 * Pulsing scale animation for CTAs
 */
export function pulseScale(frame: number, fps: number): number {
  const cycle = (frame % (fps * 2)) / (fps * 2);
  return 1 + 0.03 * Math.sin(cycle * Math.PI * 2);
}

/**
 * Fade out at the end of a sequence
 */
export function fadeOut(
  frame: number,
  durationInFrames: number,
  fadeFrames = 10,
): number {
  return interpolate(
    frame,
    [durationInFrames - fadeFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
}

/**
 * Gradient rotation angle that shifts over time
 */
export function gradientAngle(frame: number, fps: number, baseAngle = 135): number {
  return baseAngle + (frame / fps) * 5;
}
