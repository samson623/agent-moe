import React from 'react';
import { Composition } from 'remotion';
import { VideoPackageComposition } from './compositions/VideoPackageComposition';
import type { VideoCompositionProps } from './compositions/VideoPackageComposition';
import { PLATFORM_CONFIGS } from './lib/platform-config';

const DEFAULT_PROPS: VideoCompositionProps = {
  title: 'Sample Video',
  platform: 'youtube',
  hook: { primary: 'Did you know this one trick can change everything?', variants: [] },
  scenes: [
    {
      order: 1,
      title: 'The Problem',
      script: 'Most people struggle with this every single day without even realizing it.',
      visual_direction: 'Show frustrated person at desk',
      duration_seconds: 5,
    },
    {
      order: 2,
      title: 'The Solution',
      script: 'But there is a simple method that top performers use to get results fast.',
      visual_direction: 'Bright transition to success imagery',
      duration_seconds: 5,
    },
    {
      order: 3,
      title: 'How It Works',
      script: 'Step one: identify the pattern. Step two: apply the framework. Step three: watch results compound.',
      visual_direction: 'Numbered list with checkmarks appearing',
      duration_seconds: 6,
    },
  ],
  thumbnailConcept: {
    headline: 'CHANGE EVERYTHING',
    visual_description: 'Bold text on dark gradient',
    color_scheme: 'Dark purple with amber accent',
    text_overlay: 'The #1 Method',
  },
  caption: null,
  cta: {
    text: 'Follow for more tips like this!',
    type: 'subscribe',
  },
  sceneImages: [
    'https://picsum.photos/seed/hook/1920/1080',
    'https://picsum.photos/seed/thumb/1920/1080',
    'https://picsum.photos/seed/scene1/1920/1080',
    'https://picsum.photos/seed/scene2/1920/1080',
    'https://picsum.photos/seed/scene3/1920/1080',
    'https://picsum.photos/seed/cta/1920/1080',
  ],
};

export const Root: React.FC = () => {
  // Calculate default duration: hook(3s) + thumbnail(2s) + scenes + cta(4s)
  const sceneDuration = DEFAULT_PROPS.scenes.reduce((sum, s) => sum + s.duration_seconds, 0);
  const totalSeconds = 3 + 2 + sceneDuration + 4;

  return (
    <>
      {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => (
        <Composition
          key={platform}
          id={`video-package-${platform}`}
          component={VideoPackageComposition}
          durationInFrames={totalSeconds * config.fps}
          fps={config.fps}
          width={config.width}
          height={config.height}
          defaultProps={{
            ...DEFAULT_PROPS,
            platform,
          }}
        />
      ))}
    </>
  );
};
