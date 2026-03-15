import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { springOpacity, slideUp, pulseScale } from '../lib/text-animations';
import { hexToRgba } from '../lib/color-parser';

const CTA_TYPE_LABELS: Record<string, string> = {
  subscribe: 'Subscribe',
  link_in_bio: 'Link in Bio',
  dm: 'DM Me',
  comment: 'Drop a Comment',
  visit: 'Visit Now',
  buy: 'Get It Now',
};

interface CTASceneProps {
  ctaText: string;
  ctaType: string;
  destination?: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImage?: string;
}

// Floating particle config — 6 particles with staggered animations
const PARTICLES = [
  { left: '15%', size: 6, delay: 0, speed: 0.8 },
  { left: '30%', size: 4, delay: 12, speed: 1.0 },
  { left: '50%', size: 5, delay: 6, speed: 0.9 },
  { left: '65%', size: 3, delay: 18, speed: 1.1 },
  { left: '80%', size: 7, delay: 3, speed: 0.7 },
  { left: '42%', size: 4, delay: 24, speed: 1.0 },
];

export const CTAScene: React.FC<CTASceneProps> = ({
  ctaText,
  ctaType,
  destination,
  primaryColor,
  accentColor,
  backgroundColor,
  backgroundImage,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const textOpacity = springOpacity(frame, fps, 5);
  const textY = slideUp(frame, fps, 5);
  const badgeOpacity = springOpacity(frame, fps, 12);
  const badgeY = slideUp(frame, fps, 12);

  // More noticeable pulse for the badge
  const pulseCycle = ((frame % (fps * 1.2)) / (fps * 1.2));
  const badgePulse = 1 + 0.06 * Math.sin(pulseCycle * Math.PI * 2);

  const pulse = pulseScale(frame, fps);

  return (
    <AbsoluteFill
      style={{
        background: backgroundImage
          ? '#000'
          : `radial-gradient(ellipse at center, ${hexToRgba(primaryColor, 0.2)} 0%, ${backgroundColor} 70%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
      }}
    >
      {/* Background image — dimmed */}
      {backgroundImage && (
        <Img
          src={backgroundImage}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      )}

      {/* Dark overlay */}
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }}
        />
      )}

      {/* Floating particles */}
      {PARTICLES.map((p, i) => {
        const adjustedFrame = Math.max(0, frame - p.delay);
        const loopDuration = fps * 3 * p.speed;
        const loopProgress = (adjustedFrame % loopDuration) / loopDuration;
        const particleY = interpolate(loopProgress, [0, 1], [100, -20]);
        const particleOpacity = interpolate(
          loopProgress,
          [0, 0.1, 0.7, 1],
          [0, 0.6, 0.6, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.left,
              bottom: `${particleY}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: hexToRgba(accentColor, 0.7),
              boxShadow: `0 0 ${p.size * 2}px ${hexToRgba(accentColor, 0.4)}`,
              opacity: particleOpacity,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* CTA Text */}
      <div
        style={{
          opacity: textOpacity,
          transform: `translateY(${textY}px) scale(${pulse})`,
          textAlign: 'center',
          maxWidth: '80%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontSize: '64px',
            fontWeight: 900,
            color: '#ffffff',
            fontFamily: 'system-ui, sans-serif',
            lineHeight: 1.15,
            margin: 0,
            letterSpacing: '-0.01em',
            textShadow: `0 0 20px ${hexToRgba(accentColor, 0.6)}, 0 0 60px ${hexToRgba(accentColor, 0.3)}, 0 4px 30px rgba(0,0,0,0.5)`,
          }}
        >
          {ctaText}
        </p>
      </div>

      {/* CTA type badge — pulsing */}
      <div
        style={{
          opacity: badgeOpacity,
          transform: `translateY(${badgeY}px) scale(${badgePulse})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            padding: '12px 32px',
            borderRadius: '999px',
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            fontSize: '24px',
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: `0 4px 30px ${hexToRgba(accentColor, 0.4)}`,
          }}
        >
          {CTA_TYPE_LABELS[ctaType] ?? ctaType}
        </div>

        {/* Destination URL */}
        {destination && (
          <p
            style={{
              fontSize: '18px',
              color: hexToRgba('#ffffff', 0.5),
              fontFamily: 'system-ui, sans-serif',
              margin: 0,
            }}
          >
            {destination}
          </p>
        )}
      </div>

      {/* Bottom arrow indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '50px',
          opacity: badgeOpacity,
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '0',
            height: '0',
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: `16px solid ${accentColor}`,
            transform: `translateY(${Math.sin(frame / 8) * 6}px)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
