import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'playwright',
    'playwright-core',
    'ffmpeg-static',
    'remotion',
    '@remotion/renderer',
    '@remotion/bundler',
    '@remotion/cli',
    '@remotion/media-utils',
    'edge-tts',
  ],
  outputFileTracingExcludes: {
    '*': [
      '**/node_modules/playwright/**',
      '**/node_modules/playwright-core/**',
      '**/node_modules/@playwright/**',
      '**/node_modules/ffmpeg-static/**',
      '**/node_modules/remotion/**',
      '**/node_modules/@remotion/**',
      '**/node_modules/edge-tts/**',
    ],
  },
};

export default nextConfig;
