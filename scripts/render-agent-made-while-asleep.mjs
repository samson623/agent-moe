/**
 * Render: "Look At What My Agent Made While I Was Asleep" — YouTube 16:9
 *
 * 1. Edge TTS generates free voiceover for each scene
 * 2. ffmpeg stitches audio clips into one track with correct timing
 * 3. Remotion renders the video
 * 4. ffmpeg merges voiceover onto the final video
 *
 * Usage: node scripts/render-agent-made-while-asleep.mjs
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const entry = path.join(root, 'src/features/video-rendering/remotion/index.ts');
const silentVideoPath = path.join(root, 'agent-made-while-asleep-silent.mp4');
const outputPath = path.join(root, 'agent-made-while-asleep.mp4');
const audioDir = path.join(root, 'public/video-scene-images/agent-made-while-asleep/audio');

// Remotion's bundled ffmpeg
const ffmpeg = path.join(
  root,
  'node_modules/.pnpm/@remotion+compositor-win32-x64-msvc@4.0.435/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe',
);

// Edge TTS voice — Guy is a natural-sounding US male
const VOICE = 'en-US-GuyNeural';

// ---------------------------------------------------------------------------
// Scene timeline — [startSeconds, durationSeconds, script]
// ---------------------------------------------------------------------------

const sceneTimeline = [
  { name: 'hook',      start: 0,  duration: 3,  script: 'I woke up to this.' },
  { name: 'thumbnail', start: 3,  duration: 2,  script: 'My AI agent worked all night.' },
  { name: 'scene1',    start: 5,  duration: 7,  script: 'While I was sleeping, my AI content team wrote 12 posts, scheduled them across 4 platforms, and optimized every caption for engagement.' },
  { name: 'scene2',    start: 12, duration: 7,  script: 'The Growth Operator spotted 3 trending topics before anyone else — and drafted campaigns around each one.' },
  { name: 'scene3',    start: 19, duration: 7,  script: 'Revenue Closer A/B tested my CTAs overnight. The winning version doubled my click-through rate.' },
  { name: 'cta',       start: 26, duration: 4,  script: 'This is Agent MOE. Follow to see what it builds next.' },
];

// ---------------------------------------------------------------------------
// Scene images — user-provided
// ---------------------------------------------------------------------------

const DIR = 'video-scene-images/agent-made-while-asleep';

const userImages = {
  hook:      `/${DIR}/hook.jpeg`,
  thumbnail: `/${DIR}/thumbnail.jpeg`,
  scene1:    `/${DIR}/scene1.jpeg`,
  scene2:    `/${DIR}/scene2.jpeg`,
  scene3:    `/${DIR}/scene3.jpeg`,
  cta:       `/${DIR}/cta.jpeg`,
};

// Verify all images exist
for (const [name, imgPath] of Object.entries(userImages)) {
  const fullPath = path.join(root, 'public', imgPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing image: ${fullPath}`);
    process.exit(1);
  }
  console.log(`  ✓ ${name}: ${(fs.statSync(fullPath).size / 1024).toFixed(0)} KB`);
}

const sceneImages = [
  userImages.hook,
  userImages.thumbnail,
  userImages.scene1,
  userImages.scene2,
  userImages.scene3,
  userImages.cta,
];

// ---------------------------------------------------------------------------
// Edge TTS — generate voiceover per scene
// ---------------------------------------------------------------------------

fs.mkdirSync(audioDir, { recursive: true });

console.log('\n🎙️  Generating voiceover with Edge TTS...\n');

for (const scene of sceneTimeline) {
  const audioPath = path.join(audioDir, `${scene.name}.mp3`);

  // Skip if already cached
  if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 1000) {
    console.log(`  ✓ ${scene.name} (cached)`);
    continue;
  }

  console.log(`  🎙️  ${scene.name}: "${scene.script.slice(0, 50)}..."`);
  execSync(
    `python -m edge_tts --voice ${VOICE} --text "${scene.script.replace(/"/g, '\\"')}" --write-media "${audioPath}"`,
    { stdio: 'pipe' },
  );

  const size = fs.statSync(audioPath).size;
  console.log(`  ✓ ${scene.name}: ${(size / 1024).toFixed(0)} KB`);
}

// ---------------------------------------------------------------------------
// Stitch audio clips into one track with correct timing
// ---------------------------------------------------------------------------

console.log('\n🔊 Stitching voiceover track...');

const totalSeconds = 30;
const fullAudioPath = path.join(audioDir, 'full-voiceover.mp3');

// Build ffmpeg filter: place each clip at its start time, mix together
const inputs = sceneTimeline.map((s) => `-i "${path.join(audioDir, `${s.name}.mp3`)}"`).join(' ');
const delays = sceneTimeline.map((s, i) => `[${i}]adelay=${s.start * 1000}|${s.start * 1000}[a${i}]`).join(';');
const mixInputs = sceneTimeline.map((_, i) => `[a${i}]`).join('');
const filter = `${delays};${mixInputs}amix=inputs=${sceneTimeline.length}:duration=longest:dropout_transition=0,volume=${sceneTimeline.length}`;

execSync(
  `"${ffmpeg}" -y ${inputs} -filter_complex "${filter}" -t ${totalSeconds} "${fullAudioPath}"`,
  { stdio: 'pipe' },
);

console.log(`  ✓ Full voiceover: ${(fs.statSync(fullAudioPath).size / 1024).toFixed(0)} KB`);

// ---------------------------------------------------------------------------
// Copy images into Remotion bundle
// ---------------------------------------------------------------------------

function copyImagesToBundleDir(bundleDir) {
  const seen = new Set();
  for (const imgPath of sceneImages) {
    if (!imgPath || seen.has(imgPath)) continue;
    seen.add(imgPath);
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
// Remotion render (silent video)
// ---------------------------------------------------------------------------

const inputProps = {
  title: 'Look At What My Agent Made While I Was Asleep',
  platform: 'youtube',
  hook: {
    primary: 'I woke up to this.',
    variants: ['My AI agent worked all night.'],
  },
  scenes: [
    {
      order: 1,
      title: 'The Queue Is Full',
      script: 'While I was sleeping, my AI content team wrote 12 posts, scheduled them across 4 platforms, and optimized every caption for engagement.',
      visual_direction: 'Content calendar full with scheduled posts and social media icons',
      duration_seconds: 7,
    },
    {
      order: 2,
      title: 'Growth Found Trends',
      script: 'The Growth Operator spotted 3 trending topics before anyone else — and drafted campaigns around each one.',
      visual_direction: 'Holographic trending topic graphs with upward arrows',
      duration_seconds: 7,
    },
    {
      order: 3,
      title: 'Revenue Optimized',
      script: "Revenue Closer A/B tested my CTAs overnight. The winning version doubled my click-through rate.",
      visual_direction: 'A/B test dashboard showing Version B winning',
      duration_seconds: 7,
    },
  ],
  thumbnailConcept: {
    headline: 'My AI Agent Worked All Night',
    visual_description: 'Split screen: sleeping person and active AI dashboard',
    color_scheme: 'Deep violet with amber accent',
    text_overlay: 'Look What It Made',
  },
  caption: "I woke up and my AI agent had already written content, found trends, and optimized my revenue. This is Agent MOE. #AI #Automation #AgentMOE",
  cta: {
    text: 'This is Agent MOE. Follow to see what it builds next.',
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

console.log('\n📋 Copying images into Remotion bundle...');
copyImagesToBundleDir(bundleLocation);

console.log('\n🎬 Selecting YouTube 16:9 composition...');
const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: 'video-package-youtube',
  inputProps,
});

composition.durationInFrames = totalSeconds * composition.fps;
console.log(`   ${composition.width}x${composition.height} @ ${composition.fps}fps, ${totalSeconds}s`);

console.log('🎞️  Rendering silent video...');
await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: 'h264',
  outputLocation: silentVideoPath,
  inputProps,
  onProgress: ({ progress }) => {
    const pct = Math.round(progress * 100);
    if (pct % 10 === 0) process.stdout.write(`  render ${pct}%\r`);
  },
});
console.log('✅ Silent video ready');

// ---------------------------------------------------------------------------
// Merge voiceover onto video
// ---------------------------------------------------------------------------

console.log('\n🔊 Merging voiceover onto video...');
execSync(
  `"${ffmpeg}" -y -i "${silentVideoPath}" -i "${fullAudioPath}" -c:v copy -c:a aac -b:a 192k -map 0:v:0 -map 1:a:0 -shortest "${outputPath}"`,
  { stdio: 'pipe' },
);

// Clean up silent intermediate file
fs.unlinkSync(silentVideoPath);

const finalSize = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(1);
console.log(`\n✅ Done! Video with voiceover saved to: ${outputPath} (${finalSize} MB)`);
