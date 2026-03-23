import type { NextConfig } from "next";
import path from "path";

const stub = path.join(__dirname, 'src/lib/stubs/browser-scheduler-stub.ts');
const real = path.join(__dirname, 'src/features/browser-agent/scheduler');

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
  // Turbopack alias (used by `next dev --turbopack` and Vercel production builds
  // when Turbopack is detected). Stubs the browser scheduler so playwright is
  // never traced into the Lambda bundle.
  turbopack: {
    resolveAlias: {
      // Turbopack paths are relative to the project root
      '@/features/browser-agent/scheduler': './src/lib/stubs/browser-scheduler-stub',
    },
  },
  // Webpack alias (used by `next build` locally / CI without Turbopack).
  // `turbopack: {}` must be present or this function crashes the build worker.
  webpack: (config) => {
    // Replace the browser-agent scheduler with a no-op stub so playwright is
    // never included in any server bundle (breaks the instrumentation→playwright chain).
    config.resolve.alias[real] = stub;
    config.resolve.alias[real + '.ts'] = stub;
    return config;
  },
};

export default nextConfig;
