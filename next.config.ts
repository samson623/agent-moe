// Build: 2026-03-23T03:00Z — force Vercel cache invalidation
import type { NextConfig } from "next";
import path from "path";

const isVercel = process.env.VERCEL === '1';

// Modules that transitively import playwright/ffmpeg/remotion.
// On Vercel these are replaced with no-op stubs so NFT never traces
// the heavy packages into any Lambda bundle.
// Turbopack resolveAlias values must be @/-prefixed module specifiers
const TURBOPACK_STUBS: Record<string, string> = {
  '@/features/browser-agent/scheduler': '@/lib/stubs/browser-scheduler-stub',
  '@/features/browser-agent/browser-runner': '@/lib/stubs/browser-runner-stub',
  '@/features/browser-agent/recorder': '@/lib/stubs/recorder-stub',
  '@/features/browser-agent/task-executor': '@/lib/stubs/task-executor-stub',
  '@/features/browser-agent/executor-registry': '@/lib/stubs/executor-registry-stub',
  '@/features/browser-agent/step-emitter': '@/lib/stubs/step-emitter-stub',
  '@/features/video-rendering/services/render-service': '@/lib/stubs/render-service-stub',
};

// Absolute-path versions for webpack (which resolves @/ before alias lookup)
const WEBPACK_STUBS = Object.fromEntries(
  Object.entries(TURBOPACK_STUBS).map(([k, v]) => {
    const rel = k.replace('@/', 'src/');
    const abs = path.join(__dirname, rel);
    const stubRel = v.replace('@/', 'src/');
    const stubAbs = path.join(__dirname, stubRel);
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
  turbopack: isVercel ? { resolveAlias: TURBOPACK_STUBS } : {},
  // Webpack alias (local `next build` without --turbopack flag).
  webpack: (config) => {
    if (isVercel) {
      Object.assign(config.resolve.alias, WEBPACK_STUBS);
    }
    return config;
  },
};

export default nextConfig;
