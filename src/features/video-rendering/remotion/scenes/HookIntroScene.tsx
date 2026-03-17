import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { springScale, springOpacity } from '../lib/text-animations';
import { hexToRgba } from '../lib/color-parser';

interface HookIntroSceneProps {
  hookText: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  platform: string;
  backgroundImage?: string;
}

export const HookIntroScene: React.FC<HookIntroSceneProps> = ({
  hookText,
  primaryColor,
  accentColor,
  backgroundColor,
  backgroundImage,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scale = springScale(frame, fps, 5);
  const opacity = springOpacity(frame, fps, 0);

  // Spring entrance from bottom
  const slideProgress = spring({
    frame: frame - 5,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 80, overshootClamping: false },
  });
  const yOffset = interpolate(slideProgress, [0, 1], [80, 0]);

  // Ken Burns zoom
  const bgScale = backgroundImage
    ? interpolate(frame, [0, durationInFrames], [1.0, 1.12], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  // Cinematic letterbox bars — slide in
  const barProgress = spring({
    frame: frame - 2,
    fps,
    config: { damping: 18, mass: 0.8, stiffness: 60, overshootClamping: true },
  });
  const barHeight = interpolate(barProgress, [0, 1], [0, 80]);

  // Accent line under text — grows from center
  const lineWidth = interpolate(
    spring({ frame: frame - 15, fps, config: { damping: 12, mass: 0.5, stiffness: 80 } }),
    [0, 1],
    [0, 120],
  );

  const content = (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
      }}
    >
      {/* Dark overlay */}
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Accent glow */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: hexToRgba(accentColor, backgroundImage ? 0.06 : 0.15),
          filter: 'blur(120px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Cinematic letterbox bars */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${barHeight}px`,
          background: '#000',
          zIndex: 10,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: `${barHeight}px`,
          background: '#000',
          zIndex: 10,
        }}
      />

      {/* Hook text */}
      <div
        style={{
          opacity,
          transform: `scale(${scale}) translateY(${yOffset}px)`,
          textAlign: 'center',
          maxWidth: '85%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontSize: '84px',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.1,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textShadow: `0 2px 8px rgba(0,0,0,0.8), 0 6px 40px ${hexToRgba(primaryColor, 0.6)}`,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {hookText}
        </p>
      </div>

      {/* Accent line — grows from center */}
      <div
        style={{
          position: 'absolute',
          bottom: `${barHeight + 40}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${lineWidth}px`,
          height: '4px',
          borderRadius: '2px',
          background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
          boxShadow: `0 0 20px ${hexToRgba(accentColor, 0.5)}`,
          zIndex: 11,
        }}
      />
    </AbsoluteFill>
  );

  if (backgroundImage) {
    return (
      <AbsoluteFill>
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
            src={backgroundImage}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              transform: `scale(${bgScale})`,
              willChange: 'transform',
            }}
          />
        </div>
        {content}
      </AbsoluteFill>
    );
  }

  const angle = 135 + (frame / fps) * 5;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${backgroundColor} 0%, ${hexToRgba(primaryColor, 0.4)} 50%, ${backgroundColor} 100%)`,
      }}
    >
      {content}
    </AbsoluteFill>
  );
};
