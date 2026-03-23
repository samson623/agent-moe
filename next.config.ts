import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Required so the webpack function below doesn't crash the build worker
  // when Next.js dev uses Turbopack and prod uses webpack.
  turbopack: {},
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
  webpack: (config) => {
    // On Vercel, replace the browser-agent scheduler (which transitively imports
    // Playwright via instrumentation.ts) with a no-op stub. This breaks the
    // import chain so NFT never traces Playwright into any Lambda bundle.
    if (process.env.VERCEL) {
      // Use the resolved absolute path as the alias key — the @/ prefix is
      // already expanded by Next.js before custom aliases are checked.
      const real = path.join(__dirname, 'src/features/browser-agent/scheduler');
      const stub = path.join(__dirname, 'src/lib/stubs/browser-scheduler-stub.ts');
      config.resolve.alias[real] = stub;
      config.resolve.alias[real + '.ts'] = stub;
    }
    return config;
  },
};

export default nextConfig;
