import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { springOpacity, slideUp, wordRevealCount, fadeOut } from '../lib/text-animations';
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

export const NarrationScene: React.FC<NarrationSceneProps> = ({
  sceneNumber,
  title,
  script,
  primaryColor,
  accentColor,
  backgroundColor,
  backgroundImages,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleOpacity = springOpacity(frame, fps, 3);
  const titleY = slideUp(frame, fps, 3);
  const badgeOpacity = springOpacity(frame, fps, 0);

  const words = script.split(' ');
  const visibleWords = wordRevealCount(
    frame,
    fps,
    words.length,
    (durationInFrames / fps) * 0.7,
    15,
  );
  const globalFade = fadeOut(frame, durationInFrames);

  // Ken Burns: alternate zoom-in vs pan based on odd/even scene number
  const kbProgress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  let bgTransform: string;
  if (sceneNumber % 2 === 1) {
    // Odd scenes: zoom in
    bgTransform = `scale(${interpolate(kbProgress, [0, 1], [1.0, 1.12])})`;
  } else {
    // Even scenes: slow pan left
    bgTransform = `scale(1.1) translateX(${interpolate(kbProgress, [0, 1], [0, -4])}%)`;
  }

  const usableBackgroundImages = (backgroundImages ?? []).filter(Boolean);
  const backgroundImageCount = usableBackgroundImages.length;
  const activeBackgroundImage =
    backgroundImageCount > 0
      ? usableBackgroundImages[Math.min(
          backgroundImageCount - 1,
          Math.floor((frame / Math.max(1, durationInFrames)) * backgroundImageCount),
        )]
      : undefined;

  const content = (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0',
        opacity: globalFade,
      }}
    >
      {/* Dark gradient overlay — transparent at top, dark at bottom */}
      {activeBackgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 75%, rgba(0,0,0,0.95) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Scene number badge + title — top-left */}
      <div
        style={{
          position: 'absolute',
          top: '48px',
          left: '48px',
          opacity: badgeOpacity,
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700,
            color: '#000',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {String(sceneNumber).padStart(2, '0')}
        </div>
        <span
          style={{
            fontSize: '22px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.8)',
            fontFamily: 'system-ui, sans-serif',
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            display: 'inline-block',
          }}
        >
          {title}
        </span>
      </div>

      {/* Script text — bottom 30% subtitle style */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: '60px 60px 80px 60px',
          display: 'flex',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            padding: '28px 40px',
            maxWidth: '90%',
          }}
        >
          <p
            style={{
              fontSize: '36px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.95)',
              fontFamily: 'system-ui, sans-serif',
              lineHeight: 1.5,
              margin: 0,
              textAlign: 'center',
              textShadow: '0 2px 6px rgba(0,0,0,0.5)',
            }}
          >
            {words.map((word, i) => (
              <span
                key={i}
                style={{
                  opacity: i < visibleWords ? 1 : 0.12,
                  transition: 'opacity 0.1s',
                }}
              >
                {word}{' '}
              </span>
            ))}
          </p>
        </div>
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

  // Fallback: gradient background (original style)
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
