import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface TransitionWipeProps {
  primaryColor: string;
}

export const TransitionWipe: React.FC<TransitionWipeProps> = ({
  primaryColor,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Smooth bell curve — fade in, hold briefly, fade out
  const blackOpacity = interpolate(
    frame,
    [0, durationInFrames * 0.35, durationInFrames * 0.5, durationInFrames * 0.65, durationInFrames],
    [0, 0.9, 1, 0.9, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Accent light sweep — a soft glowing bar moves across
  const sweepX = interpolate(
    frame,
    [0, durationInFrames],
    [-15, 115],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const sweepOpacity = interpolate(
    frame,
    [0, durationInFrames * 0.15, durationInFrames * 0.85, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Subtle radial flash at midpoint
  const flashOpacity = interpolate(
    frame,
    [durationInFrames * 0.3, durationInFrames * 0.5, durationInFrames * 0.7],
    [0, 0.15, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill>
      {/* Smooth black crossfade */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          opacity: blackOpacity,
        }}
      />

      {/* Soft accent glow sweep */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: `${sweepX}%`,
          width: '60px',
          height: '100%',
          background: `linear-gradient(to right, transparent, ${primaryColor}40, ${primaryColor}80, ${primaryColor}40, transparent)`,
          filter: 'blur(20px)',
          opacity: sweepOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Center radial flash */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '600px',
          height: '600px',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${primaryColor}, transparent 70%)`,
          opacity: flashOpacity,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
