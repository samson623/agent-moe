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

  const opacity = interpolate(
    frame,
    [0, durationInFrames * 0.4, durationInFrames * 0.6, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: primaryColor,
        opacity: opacity * 0.3,
      }}
    />
  );
};
