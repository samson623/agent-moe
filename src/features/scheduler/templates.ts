import type { ScheduleType, ExecutionMode, PermissionLevel } from './types'

export interface MissionTemplate {
  id: string
  name: string
  description: string
  instruction: string
  schedule_type: ScheduleType
  cron_expression?: string
  execution_mode: ExecutionMode
  permission_level: PermissionLevel
  tags: string[]
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: 'morning-briefing',
    name: 'Morning AI Briefing',
    description: 'Scan top AI news sources, score relevance, and generate a daily summary.',
    instruction:
      'Scan the top AI news from the past 24 hours. Sources: TechCrunch AI, The Verge AI, Ars Technica, VentureBeat AI, and major AI lab blogs (OpenAI, Anthropic, Google DeepMind, Meta AI). For each story: extract title, source, 1-sentence summary, and a relevance score (0-100) for a solopreneur AI creator audience. Return the top 10 stories sorted by relevance score, plus a 3-sentence executive summary of the day\'s most important developments.',
    schedule_type: 'custom_cron',
    cron_expression: '0 7 * * *',
    execution_mode: 'heavy',
    permission_level: 'autonomous',
    tags: ['news', 'ai', 'briefing'],
  },
  {
    id: 'competitor-monitor',
    name: 'Competitor Channel Monitor',
    description: 'Check competitor YouTube channels for new uploads and summarize findings.',
    instruction:
      'Check these YouTube channels for any new videos uploaded in the past 24 hours: @AllAboutAI, @MattVidPro, @AIJason, @DavidOndrej, @TheAIGRID. For each new video found: extract the title, upload date, view count, and a 2-sentence summary of the topic. Flag any videos that cover topics we should respond to or that represent content gaps we can fill. Return results as a structured list grouped by channel.',
    schedule_type: 'custom_cron',
    cron_expression: '0 8 * * *',
    execution_mode: 'heavy',
    permission_level: 'autonomous',
    tags: ['competitors', 'youtube', 'monitoring'],
  },
  {
    id: 'weekly-analytics',
    name: 'Weekly Analytics Report',
    description: 'Pull platform stats and generate a weekly performance insights report.',
    instruction:
      'Generate a weekly analytics report for Agent MOE. Pull the following metrics for the past 7 days: total missions executed, success rate, average execution time, total tokens consumed, top 5 most-run missions, content assets created, and any missions that failed more than once. Compare key metrics to the previous week and highlight trends (improving, declining, stable). End with 3 actionable recommendations based on the data.',
    schedule_type: 'custom_cron',
    cron_expression: '0 9 * * 1',
    execution_mode: 'heavy',
    permission_level: 'autonomous',
    tags: ['analytics', 'weekly', 'report'],
  },
  {
    id: 'daily-content-ideas',
    name: 'Daily Content Ideas',
    description: 'Generate content hooks from trending signals and current events.',
    instruction:
      'Based on today\'s trending AI topics and recent trend signals in our Growth Engine, generate 5 content ideas for social media. For each idea provide: a working title, the target platform (X, LinkedIn, YouTube, or TikTok), a hook sentence (the first line that grabs attention), the content format (thread, short-video, carousel, or newsletter), and an estimated reach tier (medium, high, or viral). Prioritize ideas that align with our audience of solopreneur AI creators and that fill gaps competitors haven\'t covered.',
    schedule_type: 'custom_cron',
    cron_expression: '0 6 * * *',
    execution_mode: 'light',
    permission_level: 'autonomous',
    tags: ['content', 'ideas', 'daily'],
  },
  {
    id: 'social-engagement',
    name: 'Social Engagement Check',
    description: 'Flag over-performing and under-performing posts across platforms.',
    instruction:
      'Review our recent social media posts from the past 24 hours across all connected platforms. For each post, classify performance as: over-performing (>2x average engagement), on-track (within normal range), or under-performing (<0.5x average engagement). For over-performing posts: identify what made them work (hook, timing, topic, format) and suggest how to double down. For under-performing posts: identify likely causes and suggest whether to boost, repurpose, or archive. Return a concise dashboard-style summary with counts and top recommendations.',
    schedule_type: 'custom_cron',
    cron_expression: '0 */6 * * *',
    execution_mode: 'light',
    permission_level: 'autonomous',
    tags: ['social', 'engagement', 'monitoring'],
  },
]
