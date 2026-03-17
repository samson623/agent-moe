import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { springOpacity, fadeOut } from '../lib/text-animations';
import { hexToRgba } from '../lib/color-parser';

interface NarrationSceneProps {
  sceneNumber: number;
  title: string;
  script: string;
  visualDirection: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImages?: string[];
}

// Floating particles for atmosphere
const PARTICLES = [
  { x: '10%', size: 3, delay: 0, speed: 0.7 },
  { x: '25%', size: 5, delay: 8, speed: 0.9 },
  { x: '45%', size: 4, delay: 4, speed: 1.0 },
  { x: '60%', size: 3, delay: 15, speed: 0.8 },
  { x: '75%', size: 6, delay: 10, speed: 0.6 },
  { x: '88%', size: 4, delay: 20, speed: 1.1 },
];

// Vary Ken Burns per scene for visual variety
const KB_STYLES: Array<(p: number) => string> = [
  (p) => `scale(${interpolate(p, [0, 1], [1.0, 1.15])})`, // zoom in
  (p) => `scale(1.12) translateX(${interpolate(p, [0, 1], [0, -5])}%)`, // pan left
  (p) => `scale(${interpolate(p, [0, 1], [1.15, 1.0])})`, // zoom out
  (p) => `scale(1.12) translateX(${interpolate(p, [0, 1], [-4, 2])}%)`, // pan right
];

export const NarrationScene: React.FC<NarrationSceneProps> = ({
  sceneNumber,
  title,
  primaryColor,
  accentColor,
  backgroundColor,
  backgroundImages,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Title animation — slides up with spring
  const titleSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 90, overshootClamping: false },
  });
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  const titleOpacity = springOpacity(frame, fps, 3);

  // Badge animation
  const badgeOpacity = springOpacity(frame, fps, 0);
  const badgeScale = spring({
    frame,
    fps,
    config: { damping: 10, mass: 0.4, stiffness: 120, overshootClamping: false },
  });

  const globalFade = fadeOut(frame, durationInFrames);

  // Ken Burns — cycle through styles based on scene number
  const kbProgress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const kbStyle = KB_STYLES[(sceneNumber - 1) % KB_STYLES.length]!;
  const bgTransform = kbStyle(kbProgress);

  const usableBackgroundImages = (backgroundImages ?? []).filter(Boolean);
  const backgroundImageCount = usableBackgroundImages.length;
  const activeBackgroundImage =
    backgroundImageCount > 0
      ? usableBackgroundImages[Math.min(
          backgroundImageCount - 1,
          Math.floor((frame / Math.max(1, durationInFrames)) * backgroundImageCount),
        )]
      : undefined;

  // Accent glow bar — pulses subtly
  const glowPulse = 0.4 + 0.2 * Math.sin((frame / fps) * Math.PI * 1.5);

  const content = (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0',
        opacity: globalFade,
      }}
    >
      {/* Dark gradient overlay */}
      {activeBackgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => {
        const adjustedFrame = Math.max(0, frame - p.delay);
        const loopDuration = fps * 4 * p.speed;
        const loopProgress = (adjustedFrame % loopDuration) / loopDuration;
        const particleY = interpolate(loopProgress, [0, 1], [105, -5]);
        const particleOpacity = interpolate(
          loopProgress,
          [0, 0.1, 0.7, 1],
          [0, 0.5, 0.5, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              bottom: `${particleY}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: hexToRgba(accentColor, 0.6),
              boxShadow: `0 0 ${p.size * 3}px ${hexToRgba(accentColor, 0.3)}`,
              opacity: particleOpacity,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* Scene number badge — top-left */}
      <div
        style={{
          position: 'absolute',
          top: '60px',
          left: '48px',
          opacity: badgeOpacity,
          transform: `scale(${badgeScale})`,
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: `0 4px 20px ${hexToRgba(accentColor, 0.4)}`,
          }}
        >
          {String(sceneNumber).padStart(2, '0')}
        </div>
      </div>

      {/* Centered title — large and bold */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: '85%',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <h2
          style={{
            fontSize: '72px',
            fontWeight: 900,
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: '-0.02em',
            textShadow: `0 2px 8px rgba(0,0,0,0.8), 0 6px 40px ${hexToRgba(primaryColor, 0.5)}`,
          }}
        >
          {title}
        </h2>

        {/* Accent glow bar under title */}
        <div
          style={{
            margin: '24px auto 0',
            width: '100px',
            height: '4px',
            borderRadius: '2px',
            background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
            boxShadow: `0 0 20px ${hexToRgba(accentColor, glowPulse)}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );

  if (activeBackgroundImage) {
    return (
      <AbsoluteFill>
        {/* Ken Burns background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <Img
            src={activeBackgroundImage}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              transform: bgTransform,
              willChange: 'transform',
            }}
          />
        </div>
        {content}
      </AbsoluteFill>
    );
  }

  // Fallback: gradient background
  const angle = 135 + sceneNumber * 30 + (frame / fps) * 5;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${backgroundColor} 0%, ${hexToRgba(primaryColor, 0.25)} 100%)`,
      }}
    >
      {content}
    </AbsoluteFill>
  );
};
