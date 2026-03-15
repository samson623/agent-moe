import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export type KenBurnsStyle = 'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight';

interface KenBurnsProps {
  imageUrl: string;
  style?: KenBurnsStyle;
  children?: React.ReactNode;
}

export const KenBurns: React.FC<KenBurnsProps> = ({
  imageUrl,
  style = 'zoomIn',
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  let transform: string;
  switch (style) {
    case 'zoomIn':
      transform = `scale(${interpolate(progress, [0, 1], [1.0, 1.15])})`;
      break;
    case 'zoomOut':
      transform = `scale(${interpolate(progress, [0, 1], [1.15, 1.0])})`;
      break;
    case 'panLeft':
      transform = `scale(1.1) translateX(${interpolate(progress, [0, 1], [0, -5])}%)`;
      break;
    case 'panRight':
      transform = `scale(1.1) translateX(${interpolate(progress, [0, 1], [-5, 0])}%)`;
      break;
    default:
      transform = `scale(${interpolate(progress, [0, 1], [1.0, 1.15])})`;
  }

  return (
    <AbsoluteFill>
      {/* Background image with Ken Burns effect */}
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
          src={imageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            transform,
            willChange: 'transform',
          }}
        />
      </div>

      {/* Overlay content */}
      {children}
    </AbsoluteFill>
  );
};
