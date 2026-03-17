import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { springOpacity, slideUp } from '../lib/text-animations';
import { hexToRgba } from '../lib/color-parser';

const CTA_TYPE_LABELS: Record<string, string> = {
  subscribe: 'Subscribe',
  follow: 'Follow',
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

const PARTICLES = [
  { left: '12%', size: 5, delay: 0, speed: 0.8 },
  { left: '28%', size: 3, delay: 10, speed: 1.0 },
  { left: '48%', size: 4, delay: 5, speed: 0.9 },
  { left: '65%', size: 6, delay: 16, speed: 0.7 },
  { left: '82%', size: 3, delay: 8, speed: 1.1 },
  { left: '38%', size: 5, delay: 22, speed: 0.85 },
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
  const badgeOpacity = springOpacity(frame, fps, 14);
  const badgeY = slideUp(frame, fps, 14);

  // Badge pulse
  const pulseCycle = ((frame % (fps * 1.2)) / (fps * 1.2));
  const badgePulse = 1 + 0.06 * Math.sin(pulseCycle * Math.PI * 2);

  // Ken Burns on background
  const bgScale = backgroundImage
    ? interpolate(frame, [0, durationInFrames], [1.0, 1.12], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  // Cinematic letterbox bars
  const barProgress = spring({
    frame: frame - 2,
    fps,
    config: { damping: 18, mass: 0.8, stiffness: 60, overshootClamping: true },
  });
  const barHeight = interpolate(barProgress, [0, 1], [0, 70]);

  return (
    <AbsoluteFill
      style={{
        background: backgroundImage
          ? '#000'
          : `radial-gradient(ellipse at center, ${hexToRgba(primaryColor, 0.2)} 0%, ${backgroundColor} 70%)`,
      }}
    >
      {/* Background image with Ken Burns */}
      {backgroundImage && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
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
      )}

      {/* Dark overlay */}
      {backgroundImage && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)' }} />
      )}

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Letterbox bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${barHeight}px`, background: '#000', zIndex: 10 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: `${barHeight}px`, background: '#000', zIndex: 10 }} />

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
              boxShadow: `0 0 ${p.size * 3}px ${hexToRgba(accentColor, 0.4)}`,
              opacity: particleOpacity,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* CTA Text */}
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
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

        {/* CTA badge — pulsing */}
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
              padding: '14px 36px',
              borderRadius: '999px',
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              fontSize: '24px',
              fontWeight: 700,
              color: '#ffffff',
              fontFamily: 'system-ui, sans-serif',
              boxShadow: `0 4px 30px ${hexToRgba(accentColor, 0.4)}, 0 0 60px ${hexToRgba(primaryColor, 0.2)}`,
            }}
          >
            {CTA_TYPE_LABELS[ctaType] ?? ctaType}
          </div>

          {destination && (
            <p style={{ fontSize: '18px', color: hexToRgba('#ffffff', 0.5), fontFamily: 'system-ui, sans-serif', margin: 0 }}>
              {destination}
            </p>
          )}
        </div>
      </AbsoluteFill>

      {/* Bouncing arrow */}
      <div
        style={{
          position: 'absolute',
          bottom: `${barHeight + 30}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: badgeOpacity,
          zIndex: 11,
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
            filter: `drop-shadow(0 0 8px ${hexToRgba(accentColor, 0.5)})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
