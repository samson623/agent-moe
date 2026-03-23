import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Heavy packages (playwright, remotion, ffmpeg) are stripped from the
    // Vercel install to keep the bundle under 300MB. Their types are absent
    // on the build server, so we skip TS errors there only.
    ignoreBuildErrors: !!process.env.VERCEL,
  },
  serverExternalPackages: [
    '@remotion/renderer',
    '@remotion/bundler',
    '@remotion/cli',
    '@remotion/media-utils',
    'remotion',
    'playwright',
    'playwright-core',
    'ffmpeg-static',
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
