/**
 * Render: Agent MOE YouTube Short — using user-provided scene images
 *
 * Uses EXACTLY the images the user provides. No AI generation, no stock photos.
 *
 * Usage: node scripts/render-youtube-short.mjs
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const entry = path.join(root, 'src/features/video-rendering/remotion/index.ts');
const outputPath = path.join(root, 'agent-moe-youtube-short.mp4');

// ---------------------------------------------------------------------------
// Scene images — user-provided, no generation
// ---------------------------------------------------------------------------

const IMAGE_DIR = 'video-scene-images/youtube-short';

const userImages = {
  hook: `/${IMAGE_DIR}/scene1-hook.jpeg`,         // Tired at desk, 2:00 AM
  thumbnail: `/${IMAGE_DIR}/scene2-dashboard.jpeg`, // AI Dashboard lighting up
  scene1: `/${IMAGE_DIR}/scene3-tasks.jpeg`,       // Endless tasks, overwhelmed
  scene2: `/${IMAGE_DIR}/scene4-system.jpeg`,      // Full Agent MOE system online
  cta: `/${IMAGE_DIR}/scene4-system.jpeg`,         // Reuse system online for CTA
};

// Verify all images exist
for (const [name, imgPath] of Object.entries(userImages)) {
  const fullPath = path.join(root, 'public', imgPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing image: ${fullPath}`);
    process.exit(1);
  }
  const size = fs.statSync(fullPath).size;
  console.log(`  ✓ ${name}: ${(size / 1024).toFixed(0)} KB — ${path.basename(imgPath)}`);
}

// sceneImages array order: [hook, thumbnail, scene1, scene2, ..., cta]
const sceneImages = [
  userImages.hook,
  userImages.thumbnail,
  userImages.scene1,
  userImages.scene2,
  userImages.cta,
];

// ---------------------------------------------------------------------------
// Copy images into Remotion bundle
// ---------------------------------------------------------------------------

function copyImagesToBundleDir(bundleDir) {
  for (const imgPath of sceneImages) {
    if (!imgPath) continue;
    const srcPath = path.join(root, 'public', imgPath);
    const destPath = path.join(bundleDir, imgPath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  📋 ${path.basename(imgPath)} → bundle`);
    }
  }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const inputProps = {
  title: 'Agent MOE — Your AI Team That Never Sleeps',
  platform: 'youtube',
  hook: {
    primary: 'Still doing everything yourself at 2 AM?',
    variants: ['Your AI team is ready to clock in.'],
  },
  scenes: [
    {
      order: 1,
      title: 'Drowning in Tasks',
      script: "Schedule, analyze, optimize, review, deliver, prioritize — the list never ends. You can't keep up. Nobody can.",
      visual_direction: 'Overwhelmed person at desk with endless task list',
      duration_seconds: 7,
    },
    {
      order: 2,
      title: 'Full System Online',
      script: 'Agent MOE runs your entire operation — Growth Engine finds opportunities, Launchpad deploys campaigns, and the feedback loop optimizes everything automatically.',
      visual_direction: 'Full Agent MOE dashboard with all systems operational',
      duration_seconds: 8,
    },
  ],
  thumbnailConcept: {
    headline: 'Your AI Team Never Sleeps',
    visual_description: 'AI dashboard with glowing purple and amber data streams',
    color_scheme: 'Deep violet with amber accent',
    text_overlay: 'Agent MOE — Full System Online',
  },
  caption: "Stop grinding at 2 AM. Agent MOE runs content, growth, revenue, and brand protection — all on autopilot. #AI #Automation #AgentMOE",
  cta: {
    text: 'Let Agent MOE run your operation',
    type: 'subscribe',
    destination: '',
  },
  sceneImages,
};

console.log('\n📦 Bundling Remotion project...');
const bundleLocation = await bundle({
  entryPoint: entry,
  onProgress: (p) => {
    if (p % 25 === 0) process.stdout.write(`  bundle ${p}%\r`);
  },
});
console.log('✅ Bundle ready');

console.log('\n📋 Copying YOUR images into Remotion bundle...');
copyImagesToBundleDir(bundleLocation);

console.log('\n🎬 Selecting YouTube 16:9 composition...');
const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: 'video-package-youtube',
  inputProps,
});

// Hook (3s) + Thumbnail (2s) + Scene1 (7s) + Scene2 (8s) + CTA (4s) = 24s + transitions
const totalSeconds = 24;
composition.durationInFrames = totalSeconds * composition.fps;
console.log(`   ${composition.width}x${composition.height} @ ${composition.fps}fps, ${totalSeconds}s`);

console.log('🎞️  Rendering...');
await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: 'h264',
  outputLocation: outputPath,
  inputProps,
  onProgress: ({ progress }) => {
    const pct = Math.round(progress * 100);
    if (pct % 10 === 0) process.stdout.write(`  render ${pct}%\r`);
  },
});

console.log(`\n✅ Done! Video saved to: ${outputPath}`);
