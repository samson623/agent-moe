import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { HookIntroScene } from '../scenes/HookIntroScene';
import { NarrationScene } from '../scenes/NarrationScene';
import { ThumbnailScene } from '../scenes/ThumbnailScene';
import { CTAScene } from '../scenes/CTAScene';
import { TransitionWipe } from '../scenes/TransitionWipe';
import { parseColorScheme } from '../lib/color-parser';
import {
  HOOK_DURATION_SECONDS,
  CTA_DURATION_SECONDS,
  THUMBNAIL_DURATION_SECONDS,
  TRANSITION_DURATION_FRAMES,
} from '../lib/platform-config';

export type VideoCompositionProps = Record<string, unknown> & {
  title: string;
  platform: string;
  hook: { primary: string; variants: string[] };
  scenes: Array<{
    order: number;
    title: string;
    script: string;
    visual_direction: string;
    duration_seconds: number;
  }>;
  thumbnailConcept: {
    headline: string;
    visual_description: string;
    color_scheme: string;
    text_overlay: string;
  };
  caption: string | null;
  cta: { text: string; type: string; destination?: string } | null;
  /** Optional background images: [hookImage, thumbnailImage, scene1Image, scene2Image, ..., ctaImage] */
  sceneImages?: string[];
  /** Optional per-scene image groups for narration scenes. */
  sceneImageGroups?: string[][];
};

export const VideoPackageComposition: React.FC<VideoCompositionProps> = ({
  hook,
  scenes,
  thumbnailConcept,
  cta,
  sceneImages,
  sceneImageGroups,
}) => {
  const { fps } = useVideoConfig();
  const colors = parseColorScheme(thumbnailConcept.color_scheme || 'dark blue with violet accent');

  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  // Unpack optional background images
  // Array order: [hookImage, thumbnailImage, scene1Image, scene2Image, ..., ctaImage]
  const hookImage = sceneImages?.[0];
  const thumbnailImage = sceneImages?.[1];
  const ctaImage = sceneImages && sceneImages.length > 0
    ? sceneImages[sceneImages.length - 1]
    : undefined;
  // Narration scene images start at index 2, ending one before the last (CTA)
  const narrationImages = sceneImages?.slice(2, -1) ?? [];
  const narrationImageGroups = sceneImageGroups ?? narrationImages.map((image) => (image ? [image] : []));

  // Debug: log what images each scene will use (visible in Remotion render logs)
  if (typeof window !== 'undefined') {
    console.log('[VideoPackageComposition] hookImage:', hookImage);
    console.log('[VideoPackageComposition] thumbnailImage:', thumbnailImage);
    console.log('[VideoPackageComposition] ctaImage:', ctaImage);
    console.log('[VideoPackageComposition] narrationImageGroups:', JSON.stringify(narrationImageGroups));
  }

  // Build timeline
  let currentFrame = 0;

  // Hook intro
  const hookStart = currentFrame;
  const hookFrames = HOOK_DURATION_SECONDS * fps;
  currentFrame += hookFrames;

  // Thumbnail reveal
  const thumbStart = currentFrame;
  const thumbFrames = THUMBNAIL_DURATION_SECONDS * fps;
  currentFrame += thumbFrames;

  // Narration scenes
  const sceneTimeline = sortedScenes.map((scene) => {
    const start = currentFrame;
    const frames = scene.duration_seconds * fps;
    currentFrame += frames;
    return { scene, start, frames };
  });

  // CTA
  const ctaStart = currentFrame;
  const ctaFrames = CTA_DURATION_SECONDS * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {/* Hook Intro */}
      <Sequence from={hookStart} durationInFrames={hookFrames}>
        <HookIntroScene
          hookText={hook.primary}
          primaryColor={colors.primary}
          accentColor={colors.accent}
          backgroundColor={colors.background}
          platform=""
          backgroundImage={hookImage}
        />
      </Sequence>

      {/* Transition: hook → thumbnail */}
      <Sequence
        from={hookStart + hookFrames - TRANSITION_DURATION_FRAMES}
        durationInFrames={TRANSITION_DURATION_FRAMES}
      >
        <TransitionWipe primaryColor={colors.primary} />
      </Sequence>

      {/* Thumbnail Reveal */}
      <Sequence from={thumbStart} durationInFrames={thumbFrames}>
        <ThumbnailScene
          headline={thumbnailConcept.headline}
          textOverlay={thumbnailConcept.text_overlay}
          primaryColor={colors.primary}
          accentColor={colors.accent}
          backgroundColor={colors.background}
          backgroundImage={thumbnailImage}
        />
      </Sequence>

      {/* Narration Scenes */}
      {sceneTimeline.map(({ scene, start, frames }, index) => (
        <React.Fragment key={scene.order}>
          {/* Transition before each narration scene */}
          {index === 0 && (
            <Sequence
              from={start - TRANSITION_DURATION_FRAMES}
              durationInFrames={TRANSITION_DURATION_FRAMES}
            >
              <TransitionWipe primaryColor={colors.primary} />
            </Sequence>
          )}

          <Sequence from={start} durationInFrames={frames}>
            <NarrationScene
              sceneNumber={scene.order}
              title={scene.title}
              script={scene.script}
              visualDirection={scene.visual_direction}
              primaryColor={colors.primary}
              accentColor={colors.accent}
              backgroundColor={colors.background}
              backgroundImages={narrationImageGroups[index]}
            />
          </Sequence>

          {/* Transition between narration scenes */}
          {index < sceneTimeline.length - 1 && (
            <Sequence
              from={start + frames - TRANSITION_DURATION_FRAMES}
              durationInFrames={TRANSITION_DURATION_FRAMES}
            >
              <TransitionWipe primaryColor={colors.primary} />
            </Sequence>
          )}
        </React.Fragment>
      ))}

      {/* Transition: last scene → CTA */}
      <Sequence
        from={ctaStart - TRANSITION_DURATION_FRAMES}
        durationInFrames={TRANSITION_DURATION_FRAMES}
      >
        <TransitionWipe primaryColor={colors.primary} />
      </Sequence>

      {/* CTA */}
      {cta && (
        <Sequence from={ctaStart} durationInFrames={ctaFrames}>
          <CTAScene
            ctaText={cta.text}
            ctaType={cta.type}
            destination={cta.destination}
            primaryColor={colors.primary}
            accentColor={colors.accent}
            backgroundColor={colors.background}
            backgroundImage={ctaImage}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
