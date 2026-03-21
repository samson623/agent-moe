/**
 * One-time script: Push AI news (March 16-17, 2026) into Growth Engine as trend signals.
 * Run: npx tsx scripts/push-ai-news-signals.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1]!.trim()] = match[2]!.trim()
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  // Get workspace
  const { data: workspaces, error: wsErr } = await supabase
    .from('workspaces')
    .select('id, name')
    .limit(1)

  if (wsErr || !workspaces?.length) {
    console.error('No workspace found:', wsErr?.message)
    process.exit(1)
  }

  const workspaceId = workspaces[0]!.id
  console.log(`Using workspace: ${workspaces[0]!.name} (${workspaceId})`)

  const now = new Date().toISOString()

  const signals = [
    {
      workspace_id: workspaceId,
      topic: 'NVIDIA GTC 2026 — DGX Spark, NemoClaw, IGX Thor',
      category: 'ai',
      score: 95,
      opportunity_score: 92,
      audience_fit: 0.9,
      momentum: 'explosive' as const,
      platform: 'LinkedIn',
      source_urls: [
        'https://blogs.nvidia.com/blog/gtc-2026-news/',
        'https://www.nvidia.com/gtc/',
      ],
      competitor_gaps: [
        'Most AI creators are covering GTC superficially — deep breakdowns of DGX Spark for solopreneurs are missing',
        'No one connecting NemoClaw open-source stack to practical autonomous agent deployment',
      ],
      market_angles: [
        { angle: 'AI Factory on Your Desk', rationale: 'DGX Spark brings AI-factory-class performance to individual creators — this is the GPU moment for solopreneurs', cta_angle: 'Show your audience what they can build with local AI power' },
        { angle: 'Open-Source Agent Stack', rationale: 'NemoClaw is open-source and pairs with DGX — positions you as the creator who builds real agents, not just talks about them', cta_angle: 'Tutorial content on deploying agents with NemoClaw' },
        { angle: 'Edge AI Is Here', rationale: 'IGX Thor for industrial-grade edge AI — connects to the broader trend of AI leaving the cloud', cta_angle: 'Explain why edge AI changes the game for businesses' },
      ],
      content_ideas: [
        { title: 'NVIDIA Just Made AI Factories Personal — Here\'s What DGX Spark Means for You', format: 'thread', hook: 'Jensen Huang just killed cloud-only AI. Here\'s why.', estimated_reach: 'viral' as const },
        { title: 'NemoClaw: The Open-Source Agent Stack Nobody Is Talking About', format: 'video', hook: 'NVIDIA quietly dropped a full agent deployment framework — for free.', estimated_reach: 'high' as const },
        { title: 'GTC 2026 Breakdown: The 5 Announcements That Actually Matter', format: 'carousel', hook: '90% of GTC coverage misses the real story.', estimated_reach: 'high' as const },
      ],
      raw_research: { source: 'agent-moe-news-scan', scan_date: now, event: 'NVIDIA GTC 2026 March 16-19' },
      scanned_at: now,
    },
    {
      workspace_id: workspaceId,
      topic: 'IBM Granite 4.0 1B Speech — Edge AI for Voice',
      category: 'ai',
      score: 78,
      opportunity_score: 74,
      audience_fit: 0.7,
      momentum: 'rising' as const,
      platform: 'X',
      source_urls: [
        'https://www.labla.org/latest-ai-model-releases-past-24-hours/ai-model-releases-march-16-2026-the-quiet-day-with-a-few-loud-signals/',
      ],
      competitor_gaps: [
        'Small speech models are underreported — most creators focus on LLMs, not voice',
        'Running speech recognition on edge devices under 1.5GB VRAM is a new capability few are highlighting',
      ],
      market_angles: [
        { angle: 'Voice AI Goes Local', rationale: 'A 1B param speech model that runs on edge devices opens up offline voice assistants, privacy-first transcription', cta_angle: 'Build a local voice assistant tutorial' },
        { angle: 'IBM Is Still in the Game', rationale: 'IBM Granite series is underrated — this positions you as covering the full AI landscape, not just OpenAI/Google', cta_angle: 'Contrarian take: IBM\'s quiet AI comeback' },
      ],
      content_ideas: [
        { title: 'This 1B Model Runs Speech Recognition on a $200 Device', format: 'short-video', hook: 'IBM just made voice AI run anywhere — even without internet.', estimated_reach: 'medium' as const },
        { title: 'Edge AI Is Eating the Cloud — Speech Recognition Edition', format: 'thread', hook: 'You don\'t need a GPU cluster for voice AI anymore.', estimated_reach: 'medium' as const },
      ],
      raw_research: { source: 'agent-moe-news-scan', scan_date: now },
      scanned_at: now,
    },
    {
      workspace_id: workspaceId,
      topic: 'Microsoft GigaTIME — AI Transforms Cancer Pathology',
      category: 'ai',
      score: 82,
      opportunity_score: 70,
      audience_fit: 0.6,
      momentum: 'rising' as const,
      platform: 'LinkedIn',
      source_urls: [
        'https://www.labla.org/latest-ai-model-releases-past-24-hours/ai-model-releases-march-16-2026-the-quiet-day-with-a-few-loud-signals/',
      ],
      competitor_gaps: [
        'Medical AI breakthroughs get coverage in health press but rarely in the AI creator/solopreneur space',
        'The "AI saving lives" angle is emotionally powerful but underused in business content',
      ],
      market_angles: [
        { angle: 'AI That Actually Saves Lives', rationale: 'GigaTIME maps cancer cells from cheap slides — this is AI at its most impactful, not chatbots', cta_angle: 'Use this to remind your audience why AI matters beyond productivity' },
        { angle: 'Microsoft\'s Quiet Healthcare Play', rationale: 'While everyone watches OpenAI, Microsoft is transforming oncology research', cta_angle: 'Position as someone who sees the bigger picture' },
      ],
      content_ideas: [
        { title: 'Microsoft Built an AI That Maps Cancer — From a $1 Slide', format: 'thread', hook: 'Forget chatbots. This AI analyzes 40 million cancer cells.', estimated_reach: 'high' as const },
        { title: 'The AI Story Nobody Covered This Week', format: 'short-video', hook: 'While you were arguing about GPT-5, Microsoft was curing cancer.', estimated_reach: 'high' as const },
      ],
      raw_research: { source: 'agent-moe-news-scan', scan_date: now, model: 'GigaTIME', trained_on: '40M cells, 14256 patients' },
      scanned_at: now,
    },
    {
      workspace_id: workspaceId,
      topic: 'Anthropic vs Pentagon — Supply Chain Risk Lawsuit',
      category: 'ai',
      score: 90,
      opportunity_score: 88,
      audience_fit: 0.85,
      momentum: 'explosive' as const,
      platform: 'X',
      source_urls: [
        'https://techcrunch.com/2026/03/09/openai-and-google-employees-rush-to-anthropics-defense-in-dod-lawsuit/',
        'https://fortune.com/2026/03/10/google-openai-employees-back-anthropic-legal-fight-military-use-of-ai/',
        'https://fortune.com/2026/03/05/anthropic-openai-feud-pentagon-dispute-ai-safety-dilemma-personalities/',
      ],
      competitor_gaps: [
        'Most coverage is surface-level legal drama — few creators are connecting this to what it means for AI builders and API users',
        'The OpenAI/Google employees supporting Anthropic is a massive story about industry unity that\'s being buried under CEO drama',
      ],
      market_angles: [
        { angle: 'The AI Safety War Goes to Court', rationale: 'Anthropic refusing military surveillance use is a defining moment for the industry — your audience needs to understand the stakes', cta_angle: 'Break down what this means for every AI builder' },
        { angle: 'Rivals Unite Against the Pentagon', rationale: '30+ OpenAI and Google employees backing Anthropic is unprecedented — this is bigger than competition', cta_angle: 'Frame as "the AI industry found something they all agree on"' },
        { angle: 'Your AI Provider Might Get Banned', rationale: 'If Anthropic gets blacklisted, it affects Claude API users, Agent SDK users, and every business built on their stack', cta_angle: 'Practical guide: what this means if you use Claude' },
      ],
      content_ideas: [
        { title: 'The Pentagon Just Blacklisted the Best AI Lab — Here\'s Why It Matters to You', format: 'thread', hook: 'Anthropic said no to mass surveillance. The Pentagon said fine, you\'re banned.', estimated_reach: 'viral' as const },
        { title: 'OpenAI and Google Employees Just Did Something Unprecedented', format: 'video', hook: '30 engineers from rival companies stood up for their competitor. Here\'s why.', estimated_reach: 'viral' as const },
        { title: 'Is Your AI Stack at Risk? The Anthropic-Pentagon Fallout Explained', format: 'newsletter', hook: 'If you build on Claude, you need to read this.', estimated_reach: 'high' as const },
      ],
      raw_research: { source: 'agent-moe-news-scan', scan_date: now, key_players: ['Anthropic', 'Pentagon', 'OpenAI employees', 'Google DeepMind employees', 'Microsoft'] },
      scanned_at: now,
    },
    {
      workspace_id: workspaceId,
      topic: 'BMW Deploys First Humanoid Robot in Automotive Manufacturing',
      category: 'ai',
      score: 80,
      opportunity_score: 76,
      audience_fit: 0.65,
      momentum: 'rising' as const,
      platform: 'LinkedIn',
      source_urls: [
        'https://aiforum.org.uk/ai-news-roundup-march-16-2026/',
      ],
      competitor_gaps: [
        'Physical AI / robotics content is booming but few solopreneur creators cover it well',
        'The "robots in factories" angle is old — the "humanoid" angle is new and underexplored',
      ],
      market_angles: [
        { angle: 'Physical AI Is the Next Frontier', rationale: 'BMW deploying AEON humanoid robot is the first real automotive deployment — this is the beginning of humanoid labor', cta_angle: 'Position as forward-looking: "this is where AI goes next"' },
        { angle: 'From Software to Hardware', rationale: 'The AI conversation is shifting from chatbots to physical agents — your audience should be paying attention', cta_angle: 'Explain the physical AI trend in simple terms' },
      ],
      content_ideas: [
        { title: 'BMW Just Hired a Robot — And It\'s Not What You Think', format: 'short-video', hook: 'The world\'s first humanoid robot just started working at a BMW factory.', estimated_reach: 'high' as const },
        { title: 'Humanoid Robots Are Here. Now What?', format: 'thread', hook: 'AI isn\'t just software anymore. It has legs now.', estimated_reach: 'medium' as const },
      ],
      raw_research: { source: 'agent-moe-news-scan', scan_date: now, robot: 'AEON by Hexagon Robotics', location: 'BMW Leipzig plant' },
      scanned_at: now,
    },
    {
      workspace_id: workspaceId,
      topic: 'AWS + Cerebras CS-3 — Fastest AI Inference via Bedrock',
      category: 'ai',
      score: 77,
      opportunity_score: 80,
      audience_fit: 0.75,
      momentum: 'rising' as const,
      platform: 'X',
      source_urls: [
        'https://www.crescendo.ai/news/latest-ai-news-and-updates',
      ],
      competitor_gaps: [
        'Inference speed is a bottleneck for AI app builders — this partnership directly impacts anyone building on AWS',
        'Cerebras wafer-scale chips are technical but the speed gains are easy to explain visually',
      ],
      market_angles: [
        { angle: 'AI Just Got 10x Faster on AWS', rationale: 'Cerebras CS-3 on Bedrock means dramatically faster inference for anyone building AI apps on AWS', cta_angle: 'If you build on AWS, this changes your cost/speed math' },
        { angle: 'The Inference Wars Heat Up', rationale: 'AWS partnering with Cerebras signals that GPU isn\'t the only game — wafer-scale is competing', cta_angle: 'Explain the hardware competition in simple terms' },
      ],
      content_ideas: [
        { title: 'AWS Just Made AI Inference Insanely Fast — Here\'s How', format: 'thread', hook: 'Cerebras CS-3 chips on AWS Bedrock. If you build AI apps, pay attention.', estimated_reach: 'medium' as const },
        { title: 'The AI Speed Wars: Why Inference Matters More Than Training Now', format: 'newsletter', hook: 'Training gets the headlines. Inference gets the revenue.', estimated_reach: 'medium' as const },
      ],
      raw_research: { source: 'agent-moe-news-scan', scan_date: now, partnership: 'AWS + Cerebras', product: 'CS-3 on AWS Bedrock' },
      scanned_at: now,
    },
    {
      workspace_id: workspaceId,
      topic: 'Claude Opus 4.6 & Sonnet 4.6 — 1M Context at Standard Pricing',
      category: 'ai',
      score: 85,
      opportunity_score: 90,
      audience_fit: 0.95,
      momentum: 'rising' as const,
      platform: 'X',
      source_urls: [
        'https://www.labla.org/latest-ai-model-releases-past-24-hours/ai-model-releases-march-16-2026-the-quiet-day-with-a-few-loud-signals/',
        'https://llm-stats.com/ai-news',
      ],
      competitor_gaps: [
        'Most creators mention the 1M context update in passing — nobody is showing practical use cases for 1M tokens',
        'The pricing change makes Claude the best value for long-context work but few are doing the math publicly',
      ],
      market_angles: [
        { angle: 'Claude Just Became the Long-Context King', rationale: '1M tokens at standard pricing is a game-changer for anyone processing large codebases, legal docs, or research papers', cta_angle: 'Show real examples of what 1M tokens unlocks' },
        { angle: 'Agent MOE Runs on This', rationale: 'We literally use Claude Opus 4.6 — this upgrade directly benefits our operator stack', cta_angle: 'Behind-the-scenes content showing how Agent MOE leverages 1M context' },
      ],
      content_ideas: [
        { title: 'Claude Just Gave Everyone 1M Tokens — Here\'s What You Can Actually Do With It', format: 'thread', hook: 'Anthropic quietly made the biggest context window free. Most people missed it.', estimated_reach: 'viral' as const },
        { title: 'I Fed an Entire Codebase to Claude — Here\'s What Happened', format: 'video', hook: '1 million tokens. 1 prompt. Zero hallucinations.', estimated_reach: 'high' as const },
      ],
      raw_research: { source: 'agent-moe-news-scan', scan_date: now, models: ['Claude Opus 4.6', 'Claude Sonnet 4.6'], context: '1M tokens', pricing: 'standard' },
      scanned_at: now,
    },
    {
      workspace_id: workspaceId,
      topic: 'Meta Delays Avocado Model + Acquires Moltbook',
      category: 'ai',
      score: 72,
      opportunity_score: 65,
      audience_fit: 0.6,
      momentum: 'stable' as const,
      platform: 'X',
      source_urls: [
        'https://www.crescendo.ai/news/latest-ai-news-and-updates',
      ],
      competitor_gaps: [
        'Meta\'s AI strategy is confusing to most people — a clear explainer would stand out',
        'Moltbook acquisition ("chatroom for chatbots") is a weird concept nobody is explaining well',
      ],
      market_angles: [
        { angle: 'Meta\'s AI Confusion', rationale: 'Delaying Avocado while acquiring Moltbook signals Meta is pivoting strategy — creates content opportunity around "what is Meta doing?"', cta_angle: 'Hot take / analysis piece on Meta\'s AI direction' },
        { angle: 'Chatrooms for Chatbots', rationale: 'Moltbook is a bizarre concept that captures attention — great hook material', cta_angle: 'Explain what agent-to-agent communication means for the future' },
      ],
      content_ideas: [
        { title: 'Meta Just Bought a "Chatroom for Chatbots" — And It Actually Makes Sense', format: 'thread', hook: 'What if AI agents had their own group chat? Meta just bet on it.', estimated_reach: 'medium' as const },
        { title: 'Meta Delayed Its Biggest AI Model. Here\'s Why That Matters.', format: 'short-video', hook: 'While everyone shipped, Meta hit pause. Something\'s up.', estimated_reach: 'medium' as const },
      ],
      raw_research: { source: 'agent-moe-news-scan', scan_date: now, events: ['Avocado model delayed', 'Moltbook acquisition'] },
      scanned_at: now,
    },
    {
      workspace_id: workspaceId,
      topic: 'Google Unified Multimodal Embeddings Released',
      category: 'ai',
      score: 75,
      opportunity_score: 72,
      audience_fit: 0.7,
      momentum: 'rising' as const,
      platform: 'LinkedIn',
      source_urls: [
        'https://www.labla.org/latest-ai-model-releases-past-24-hours/ai-model-releases-march-16-2026-the-quiet-day-with-a-few-loud-signals/',
      ],
      competitor_gaps: [
        'Embeddings are critical infrastructure but rarely explained to non-technical audiences',
        'Unified multimodal embeddings (text + image + video in one space) enable new RAG applications nobody is building yet',
      ],
      market_angles: [
        { angle: 'Search Everything With One Model', rationale: 'Unified embeddings mean you can search across text, images, and video with a single model — this is the next RAG upgrade', cta_angle: 'Tutorial: build a multimodal search app with Google\'s new embeddings' },
        { angle: 'The Quiet Google Drop', rationale: 'While GTC dominated headlines, Google shipped something that matters more for builders', cta_angle: 'Position as the creator who catches what others miss' },
      ],
      content_ideas: [
        { title: 'Google Quietly Shipped the Most Useful AI Update This Week', format: 'thread', hook: 'Everyone was at GTC. Nobody noticed Google unify text, image, and video search.', estimated_reach: 'medium' as const },
        { title: 'Multimodal Embeddings Explained in 60 Seconds', format: 'short-video', hook: 'One model to search text, images, and video. Here\'s how.', estimated_reach: 'medium' as const },
      ],
      raw_research: { source: 'agent-moe-news-scan', scan_date: now },
      scanned_at: now,
    },
  ]

  console.log(`\nInserting ${signals.length} trend signals...\n`)

  let success = 0
  let failed = 0

  for (const signal of signals) {
    const { data, error } = await supabase
      .from('trend_signals')
      .insert(signal)
      .select('id, topic')
      .single()

    if (error) {
      console.error(`FAIL: ${signal.topic} — ${error.message}`)
      failed++
    } else {
      console.log(`OK: ${data.topic} (${data.id})`)
      success++

      // Log activity
      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        actor_type: 'system',
        action: 'trend_signal_created',
        entity_type: 'trend_signal',
        entity_id: data.id,
        summary: `Trend signal created: ${signal.topic}`,
      })
    }
  }

  console.log(`\nDone! ${success} signals inserted, ${failed} failed.`)
  console.log('Open Growth Engine in the dashboard to see them.')
}

main().catch(console.error)
