import type { NextConfig } from "next";
import path from "path";

const isVercel = process.env.VERCEL === '1';

// Modules that transitively import playwright/ffmpeg/remotion.
// On Vercel these are replaced with no-op stubs so NFT never traces
// the heavy packages into any Lambda bundle.
const STUBS: Record<string, string> = {
  '@/features/browser-agent/scheduler': './src/lib/stubs/browser-scheduler-stub',
  '@/features/browser-agent/browser-runner': './src/lib/stubs/browser-runner-stub',
  '@/features/browser-agent/recorder': './src/lib/stubs/recorder-stub',
  '@/features/video-rendering/services/render-service': './src/lib/stubs/render-service-stub',
};

// Absolute-path versions for webpack (which resolves @/ before alias lookup)
const WEBPACK_STUBS = Object.fromEntries(
  Object.entries(STUBS).map(([k, v]) => {
    const rel = k.replace('@/', 'src/');
    const abs = path.join(__dirname, rel);
    const stubAbs = path.join(__dirname, v.replace('./', ''));
    return [[abs, stubAbs], [abs + '.ts', stubAbs + '.ts']];
  }).flat()
);

const nextConfig: NextConfig = {
  typescript: {
    // Stubs may not perfectly match original types — ignore on Vercel only
    ignoreBuildErrors: isVercel,
  },
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
  // Turbopack alias (Vercel uses Turbopack for production builds when
  // turbopack config is present; `next dev --turbopack` also uses this).
  turbopack: isVercel ? { resolveAlias: STUBS } : {},
  // Webpack alias (local `next build` without --turbopack flag).
  webpack: (config) => {
    if (isVercel) {
      Object.assign(config.resolve.alias, WEBPACK_STUBS);
    }
    return config;
  },
};

export default nextConfig;
