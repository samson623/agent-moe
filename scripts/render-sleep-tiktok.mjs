/**
 * Render: "How Agent MOE works while you sleep" — 30s TikTok
 *
 * 1. GPT Image 1.5 generates cinematic scene images matching Agent MOE brand
 * 2. Images are downloaded and copied into the Remotion bundle
 * 3. Remotion renders the final 1080x1920 TikTok video
 *
 * Usage: node scripts/render-sleep-tiktok.mjs
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (no dotenv dependency)
const envPath = path.join(path.resolve(__dirname, '..'), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}
const root = path.resolve(__dirname, '..');
const entry = path.join(root, 'src/features/video-rendering/remotion/index.ts');
const outputPath = path.join(root, 'moe-works-while-you-sleep.mp4');
const imgDir = path.join(root, 'public/video-scene-images/sleep-tiktok');

// ---------------------------------------------------------------------------
// GPT Image 1.5 — generate cinematic scene images
// ---------------------------------------------------------------------------

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BRAND_STYLE = `Cinematic, dark background with subtle purple and cyan lighting, modern tech aesthetic, high contrast, professional quality, digital art style. No text, no watermarks, no logos. Clean background for video text overlays.`;

/** Generate a scene image with GPT Image 1.5 and save to disk */
async function generateSceneImage(scene, name) {
  const destPath = path.join(imgDir, `${name}.png`);

  // Skip if already have a good cached image
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 20000) {
    console.log(`  ✓ ${name} (cached)`);
    return `/video-scene-images/sleep-tiktok/${name}.png`;
  }

  console.log(`  🎨 ${name}: generating with GPT Image 1.5...`);

  const prompt = `${scene.visual_direction}\n\nStyle: ${BRAND_STYLE}\nVertical composition (9:16), optimized for mobile video. The image should work as a background with text overlaid on top.`;

  try {
    const response = await openai.images.generate({
      model: 'gpt-image-1.5',
      prompt,
      n: 1,
      size: '1024x1536',
      quality: 'high',
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      console.warn(`  ⚠️  ${name}: no image data in response`);
      return '';
    }

    const buffer = Buffer.from(b64, 'base64');
    fs.writeFileSync(destPath, buffer);

    console.log(`  ✓ ${name}: ${(buffer.length / 1024).toFixed(0)} KB from GPT Image 1.5`);
    return `/video-scene-images/sleep-tiktok/${name}.png`;
  } catch (err) {
    console.error(`  ❌ ${name}: image generation failed — ${err.message}`);
    return '';
  }
}

// ---------------------------------------------------------------------------
// Scene definitions
// ---------------------------------------------------------------------------

const scenes = [
  {
    title: 'Hook — Sleeping',
    script: 'Your AI team never sleeps.',
    visual_direction: 'Person sleeping peacefully in dark bedroom with soft blue moonlight',
  },
  {
    title: 'Thumbnail — AI Operators',
    script: 'AI Works While You Sleep. 4 AI Operators. Zero Downtime.',
    visual_direction: 'Futuristic AI robot or digital brain with glowing violet and purple neon lights',
  },
  {
    title: 'The Night Shift Begins',
    script: 'The moment you close your laptop, four AI operators clock in. They scan trends, draft content, and optimize your brand — all night long.',
    visual_direction: 'Dark futuristic command center with multiple glowing screens and holographic displays, purple and blue lighting',
  },
  {
    title: 'Content & Growth',
    script: 'Content Strike Team writes posts and scripts. Growth Operator finds trending topics before anyone else. Your queue fills up while you rest.',
    visual_direction: 'Social media content creation workspace with neon holographic interfaces, trending charts and content feeds floating in air',
  },
  {
    title: 'Revenue & Protection',
    script: 'Revenue Closer tests CTAs and optimizes offers. Brand Guardian reviews every piece for tone, safety, and compliance. Nothing ships without approval.',
    visual_direction: 'Digital shield protecting data streams, cybersecurity concept with glowing barriers and flowing data, violet tones',
  },
  {
    title: 'You Wake Up Ahead',
    script: "By morning, your content queue is full, trends are mapped, and everything is waiting for one click. You didn't just sleep — you scaled.",
    visual_direction: 'Beautiful sunrise over futuristic city skyline with golden light breaking through, hopeful and empowering mood',
  },
  {
    title: 'CTA — Follow',
    script: 'Let AI run your night shift',
    visual_direction: 'Glowing smartphone with AI notifications, purple ambient light, tech aesthetic',
  },
];

// ---------------------------------------------------------------------------
// Copy images into Remotion bundle
// ---------------------------------------------------------------------------

function copyImagesToBundleDir(bundleDir, localImages) {
  for (const imgPath of localImages) {
    if (!imgPath || imgPath.startsWith('http')) continue;
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
// Main
// ---------------------------------------------------------------------------

fs.mkdirSync(imgDir, { recursive: true });

// Keep cached images — only regenerate missing ones

console.log('🎨 Generating scene images with GPT Image 1.5...\n');

const slotNames = ['hook', 'thumbnail', 'scene1', 'scene2', 'scene3', 'scene4', 'cta'];
const localImages = [];

for (let i = 0; i < scenes.length; i++) {
  const img = await generateSceneImage(scenes[i], slotNames[i]);
  localImages.push(img);
}

console.log(`\n📸 Got ${localImages.filter(Boolean).length}/${scenes.length} relevant images\n`);

// ---------------------------------------------------------------------------
// Remotion render
// ---------------------------------------------------------------------------

const inputProps = {
  title: 'How Agent MOE Works While You Sleep',
  platform: 'tiktok',
  hook: {
    primary: 'Your AI team never sleeps.',
    variants: ['They work while you dream.'],
  },
  scenes: [
    {
      order: 1,
      title: 'The Night Shift Begins',
      script: scenes[2].script,
      visual_direction: scenes[2].visual_direction,
      duration_seconds: 5.25,
    },
    {
      order: 2,
      title: 'Content & Growth',
      script: scenes[3].script,
      visual_direction: scenes[3].visual_direction,
      duration_seconds: 5.25,
    },
    {
      order: 3,
      title: 'Revenue & Protection',
      script: scenes[4].script,
      visual_direction: scenes[4].visual_direction,
      duration_seconds: 5.25,
    },
    {
      order: 4,
      title: 'You Wake Up Ahead',
      script: scenes[5].script,
      visual_direction: scenes[5].visual_direction,
      duration_seconds: 5.25,
    },
  ],
  thumbnailConcept: {
    headline: 'AI Works While You Sleep',
    visual_description: 'Dark tech aesthetic with glowing violet UI elements',
    color_scheme: 'Deep violet with amber accent',
    text_overlay: '4 AI Operators. Zero Downtime.',
  },
  caption:
    'Your AI team runs 24/7. Content, growth, revenue, brand — all handled while you sleep. #AI #ContentCreator #Automation',
  cta: {
    text: 'Let AI run your night shift',
    type: 'follow',
    destination: '',
  },
  sceneImages: localImages,
};

console.log('📦 Bundling Remotion project...');
const bundleLocation = await bundle({
  entryPoint: entry,
  onProgress: (p) => {
    if (p % 25 === 0) process.stdout.write(`  bundle ${p}%\r`);
  },
});
console.log('✅ Bundle ready');

console.log('\n📋 Copying images into Remotion bundle...');
copyImagesToBundleDir(bundleLocation, localImages);

console.log('\n🎬 Selecting TikTok composition...');
const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: 'video-package-tiktok',
  inputProps,
});

composition.durationInFrames = 900;
console.log(`   ${composition.width}x${composition.height} @ ${composition.fps}fps, 30s`);

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
