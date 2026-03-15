import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { springOpacity, slideUp } from '../lib/text-animations';
import { hexToRgba } from '../lib/color-parser';

interface ThumbnailSceneProps {
  headline: string;
  textOverlay: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImage?: string;
}

export const ThumbnailScene: React.FC<ThumbnailSceneProps> = ({
  headline,
  textOverlay,
  primaryColor,
  accentColor,
  backgroundColor,
  backgroundImage,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dramatic scale-in: 0.8 → overshoot 1.02 → settle 1.0
  const rawSpring = spring({
    frame: frame - 3,
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 80, overshootClamping: false },
  });
  const cardScale = interpolate(rawSpring, [0, 1], [0.8, 1.0]);
  const cardOpacity = springOpacity(frame, fps, 0);
  const textY = slideUp(frame, fps, 8);
  const textOpacity = springOpacity(frame, fps, 8);

  return (
    <AbsoluteFill
      style={{
        background: backgroundImage ? '#000' : backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background image — blurred */}
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            width: 'calc(100% + 40px)',
            height: 'calc(100% + 40px)',
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
              filter: 'blur(20px)',
            }}
          />
        </div>
      )}

      {/* Dim overlay on blurred bg */}
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        />
      )}

      {/* Background glow (gradient fallback only) */}
      {!backgroundImage && (
        <div
          style={{
            position: 'absolute',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: hexToRgba(primaryColor, 0.2),
            filter: 'blur(120px)',
          }}
        />
      )}

      {/* Frosted glass card */}
      <div
        style={{
          opacity: cardOpacity,
          transform: `scale(${cardScale}) rotate(${(1 - rawSpring) * -3}deg)`,
          background: backgroundImage
            ? 'rgba(255, 255, 255, 0.08)'
            : `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.3)}, ${hexToRgba(accentColor, 0.15)})`,
          border: `2px solid ${backgroundImage ? 'rgba(255,255,255,0.15)' : hexToRgba(primaryColor, 0.4)}`,
          borderRadius: '24px',
          padding: '60px 80px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          backdropFilter: 'blur(24px)',
          maxWidth: '75%',
          boxShadow: backgroundImage
            ? '0 8px 60px rgba(0,0,0,0.5)'
            : 'none',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontSize: '78px',
            fontWeight: 900,
            color: '#ffffff',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            lineHeight: 1.05,
            margin: 0,
            letterSpacing: '-0.02em',
            textShadow: `0 0 30px ${hexToRgba(accentColor, 0.5)}, 0 4px 20px ${hexToRgba(primaryColor, 0.5)}`,
          }}
        >
          {headline}
        </h1>

        {/* Text overlay */}
        {textOverlay && (
          <p
            style={{
              fontSize: '28px',
              fontWeight: 500,
              color: hexToRgba('#ffffff', 0.85),
              fontFamily: 'system-ui, sans-serif',
              textAlign: 'center',
              margin: 0,
              opacity: textOpacity,
              transform: `translateY(${textY}px)`,
            }}
          >
            {textOverlay}
          </p>
        )}

        {/* Accent underline */}
        <div
          style={{
            width: '80px',
            height: '4px',
            borderRadius: '2px',
            background: accentColor,
            opacity: textOpacity,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
