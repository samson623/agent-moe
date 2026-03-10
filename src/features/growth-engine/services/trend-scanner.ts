/**
 * TrendScanner — Phase 7 Core Service
 *
 * Orchestrates the Growth Operator to scan topics, score signals,
 * find market angles, and produce TrendSignal data ready for DB storage.
 *
 * MODEL SPLIT:
 * - analyzeTrends / findMarketAngles / generateOpportunities → Claude
 * - scoreTopics → GPT-5 Nano (parallel batch)
 */

import 'server-only'

import { GrowthOperator } from '@/features/ai/operators/growth-operator'
import type {
  TrendSignal,
  TrendScanInput,
  TrendScanResult,
  TopicScoreInput,
  TopicScoreResult,
  OpportunityBoardItem,
  SignalMomentum,
  TrendMarketAngle,
  TrendContentIdea,
} from '@/features/growth-engine/types'
import { Platform } from '@/features/ai/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreToMomentum(score: number): SignalMomentum {
  if (score >= 80) return 'explosive'
  if (score >= 60) return 'rising'
  if (score >= 40) return 'stable'
  return 'falling'
}

function platformStringToEnum(p: string): Platform {
  const map: Record<string, Platform> = {
    x: Platform.X,
    twitter: Platform.X,
    linkedin: Platform.LINKEDIN,
    instagram: Platform.INSTAGRAM,
    tiktok: Platform.TIKTOK,
    youtube: Platform.YOUTUBE,
    email: Platform.EMAIL,
  }
  return map[p.toLowerCase()] ?? Platform.GENERIC
}

function buildContentIdeasFromAngles(
  angles: Array<{ angle: string; contentFramework: string }>,
  topic: string,
): TrendContentIdea[] {
  const formats = ['post', 'thread', 'video', 'carousel']
  return angles.slice(0, 3).map((a, i) => ({
    title: `${topic}: ${a.angle.slice(0, 60)}`,
    format: formats[i % formats.length] ?? 'post',
    hook: a.contentFramework.slice(0, 120),
    estimated_reach: i === 0 ? 'high' : 'medium',
  }))
}

// ---------------------------------------------------------------------------
// TrendScanner
// ---------------------------------------------------------------------------

export class TrendScanner {
  private readonly growth: GrowthOperator

  constructor() {
    this.growth = new GrowthOperator()
  }

  /**
   * Scans a set of topics and returns scored TrendSignal data.
   * Runs trend analysis, topic scoring, and market angle finding in parallel.
   */
  async scanTopics(input: TrendScanInput): Promise<TrendScanResult> {
    const { topics, platforms, context } = input
    const scanned_at = new Date().toISOString()

    const niche = topics.join(', ')
    const platformEnums = (platforms ?? [])
      .map(platformStringToEnum)
      .filter((p) => p !== Platform.GENERIC)

    try {
      // Run all three Growth Operator calls in parallel for speed
      const [trendResult, scoredResult, anglesResult] = await Promise.all([
        this.growth.analyzeTrends({
          kind: 'trend',
          niche,
          platforms: platformEnums.length > 0 ? platformEnums : undefined,
          timeframe: '7d',
        }),
        this.growth.scoreTopics(topics, context?.targetAudience
          ? `opportunity for ${context.targetAudience}`
          : undefined),
        this.growth.findMarketAngles(niche, platformEnums.length > 0 ? platformEnums : undefined),
      ])

      const trendSignals = trendResult.success ? trendResult.data.signals : []
      const scoredTopics = scoredResult.success ? scoredResult.data.scoredTopics : []
      const angles = anglesResult.success ? anglesResult.data.angles : []

      // Map each input topic to a TrendSignal
      const signals = topics.map((topic, i): Omit<TrendSignal, 'id' | 'workspace_id' | 'created_at' | 'updated_at'> => {
        // Match against trend analysis results by topic similarity
        const trendMatch = trendSignals.find(
          (s) => s.topic.toLowerCase().includes(topic.toLowerCase().split(' ')[0] ?? '')
        ) ?? trendSignals[i % Math.max(trendSignals.length, 1)]

        // Match scored topic
        const scored = scoredTopics.find(
          (s) => s.topic.toLowerCase() === topic.toLowerCase()
        ) ?? scoredTopics[i % Math.max(scoredTopics.length, 1)]

        const rawScore = trendMatch?.momentumScore ?? scored?.opportunityScore ?? 50
        const opportunityScore = trendMatch?.opportunityScore ?? scored?.opportunityScore ?? 50
        const audienceFit = scored
          ? Math.min(1, scored.audienceFitScore / 100)
          : 0.7

        const trendAngles: TrendMarketAngle[] = angles.slice(0, 3).map((a) => ({
          angle: a.angle,
          rationale: a.differentiator,
          cta_angle: a.estimatedConversionLift,
        }))

        const contentIdeas = buildContentIdeasFromAngles(angles, topic)

        const competitorGaps: string[] = []
        if (trendMatch?.competitorActivity === 'low') {
          competitorGaps.push('Low competitor coverage — first-mover opportunity')
        }
        if (scored && scored.competitiveGap > 60) {
          competitorGaps.push('High competitive gap score — underserved demand')
        }

        return {
          topic,
          category: null,
          score: rawScore,
          opportunity_score: opportunityScore,
          audience_fit: audienceFit,
          momentum: scoreToMomentum(rawScore),
          platform: platformEnums[0]?.toString() ?? null,
          source_urls: [],
          competitor_gaps: competitorGaps,
          market_angles: trendAngles,
          content_ideas: contentIdeas,
          raw_research: {
            trend_match: trendMatch ?? null,
            scored_topic: scored ?? null,
            market_angles: angles,
          },
          scanned_at,
        }
      })

      // Find top opportunity
      const top = signals.reduce<typeof signals[0] | null>((best, s) => {
        if (!best) return s
        return s.opportunity_score > best.opportunity_score ? s : best
      }, null)

      return {
        signals,
        scanned_at,
        topics_processed: topics.length,
        top_opportunity: top?.topic ?? null,
      }
    } catch (err) {
      console.error('[TrendScanner.scanTopics] Error:', err)
      // Return empty result rather than throwing — callers handle empty gracefully
      return {
        signals: [],
        scanned_at,
        topics_processed: 0,
        top_opportunity: null,
      }
    }
  }

  /**
   * Scores a single topic and returns a TopicScoreResult.
   * Uses GPT-5 Nano via scoreTopics (fast + cheap).
   */
  async scoreOneTopic(input: TopicScoreInput): Promise<TopicScoreResult> {
    try {
      const criteria = input.audienceDescription
        ? `opportunity for ${input.audienceDescription}`
        : 'social media content opportunity score'

      const result = await this.growth.scoreTopics([input.topic], criteria)

      if (!result.success) {
        return this.defaultTopicScore(input.topic)
      }

      const scored = result.data.scoredTopics[0]
      if (!scored) {
        return this.defaultTopicScore(input.topic)
      }

      const score = scored.opportunityScore
      const momentum = scoreToMomentum(score)

      const formats = ['post', 'thread', 'video', 'carousel', 'email']
      const formatIndex = Math.floor(score / 25)

      return {
        topic: input.topic,
        score,
        momentum,
        reasoning: scored.recommendedAction,
        best_angle: `High competitive gap (${scored.competitiveGap}/100) with strong audience fit`,
        recommended_format: formats[Math.min(formatIndex, formats.length - 1)] ?? 'post',
      }
    } catch (err) {
      console.error('[TrendScanner.scoreOneTopic] Error:', err)
      return this.defaultTopicScore(input.topic)
    }
  }

  /**
   * Builds a ranked opportunity board from existing signals.
   */
  buildOpportunityBoard(signals: TrendSignal[]): OpportunityBoardItem[] {
    return [...signals]
      .sort((a, b) => b.opportunity_score - a.opportunity_score)
      .slice(0, 10)
      .map((signal, i) => {
        const urgency: OpportunityBoardItem['urgency'] =
          signal.opportunity_score >= 80 ? 'immediate' :
          signal.opportunity_score >= 60 ? 'this_week' :
          'this_month'

        const firstAngle = signal.market_angles[0]
        const recommended_action = firstAngle
          ? `Create content around: ${firstAngle.angle}`
          : `Explore ${signal.topic} for content opportunities`

        return {
          signal,
          rank: i + 1,
          recommended_action,
          urgency,
        }
      })
  }

  private defaultTopicScore(topic: string): TopicScoreResult {
    return {
      topic,
      score: 50,
      momentum: 'stable',
      reasoning: 'Could not score topic — defaulting to neutral score',
      best_angle: 'General interest topic',
      recommended_format: 'post',
    }
  }
}

// Singleton
let _instance: TrendScanner | null = null

export function getTrendScanner(): TrendScanner {
  if (!_instance) {
    _instance = new TrendScanner()
  }
  return _instance
}
