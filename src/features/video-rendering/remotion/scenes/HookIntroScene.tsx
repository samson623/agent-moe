import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { springScale, springOpacity, gradientAngle } from '../lib/text-animations';
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

  // Spring entrance from bottom — starts at 80px below, springs to 0
  const slideProgress = spring({
    frame: frame - 5,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 80, overshootClamping: false },
  });
  const yOffset = interpolate(slideProgress, [0, 1], [80, 0]);

  const angle = gradientAngle(frame, fps);

  // Ken Burns zoom for the background image
  const bgScale = backgroundImage
    ? interpolate(frame, [0, durationInFrames], [1.0, 1.1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  const content = (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
      }}
    >
      {/* Dark overlay for image readability */}
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Accent glow (visible regardless of background) */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: hexToRgba(accentColor, backgroundImage ? 0.08 : 0.15),
          filter: 'blur(120px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
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

      {/* Bottom accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: `translateX(-50%) scaleX(${scale})`,
          width: '120px',
          height: '4px',
          borderRadius: '2px',
          background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
          zIndex: 1,
        }}
      />
    </AbsoluteFill>
  );

  if (backgroundImage) {
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

  // Fallback: original gradient background
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
