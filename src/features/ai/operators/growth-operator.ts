/**
 * Growth Operator — Trend Scanner & Market Research Specialist
 *
 * This operator is the intelligence arm of AGENT MOE. It analyzes markets,
 * scans for trends, scores opportunities, and identifies positioning angles.
 *
 * CAPABILITIES:
 * - Trend analysis with momentum scoring
 * - Topic opportunity scoring (GPT-5 Nano for batch scoring)
 * - Market angle identification
 * - Audience fit analysis
 * - Opportunity board item generation
 *
 * MODEL STRATEGY:
 * - Trend analysis, research, market angles → Claude (reasoning-heavy)
 * - Topic scoring in batches → GPT-5 Nano (high-volume, cheap)
 */

import { z } from "zod";
import {
  type ExecutionResult,
  type GrowthSignal,
  GrowthSignalSchema,
  type Job,
  JobType,
  type MarketAngle,
  ModelChoice,
  type Opportunity,
  OperatorTeam,
  type Platform,
  type ScoredTopic,
  type TrendJobInput,
} from "@/features/ai/types";
import { BaseOperator } from "@/features/ai/operators/base-operator";

// ---------------------------------------------------------------------------
// Zod schemas for Growth Operator outputs
// ---------------------------------------------------------------------------

const MarketAngleSchema = z.object({
  angle: z.string(),
  targetSegment: z.string(),
  differentiator: z.string(),
  contentFramework: z.string(),
  estimatedConversionLift: z.string(),
});

const MarketAnglesOutputSchema = z.object({
  angles: z.array(MarketAngleSchema).min(1).max(8),
});

const ScoredTopicSchema = z.object({
  topic: z.string(),
  opportunityScore: z.number().min(0).max(100),
  audienceFitScore: z.number().min(0).max(100),
  competitiveGap: z.number().min(0).max(100),
  recommendedAction: z.string(),
});

const ScoredTopicsOutputSchema = z.object({
  scoredTopics: z.array(ScoredTopicSchema),
});

const AudienceAnalysisSchema = z.object({
  primarySegment: z.string(),
  psychographics: z.array(z.string()),
  painPoints: z.array(z.string()),
  desiredOutcomes: z.array(z.string()),
  contentPreferences: z.array(z.string()),
  recommendedTone: z.string(),
  platformAffinities: z.array(z.string()),
});

const OpportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["trend", "competitor_gap", "audience_need", "seasonal"]),
  urgency: z.enum(["low", "medium", "high"]),
  recommendedActions: z.array(z.string()),
  estimatedValue: z.string(),
});

const OpportunitiesOutputSchema = z.object({
  opportunities: z.array(OpportunitySchema).min(1).max(10),
});

const TrendOutputSchema = z.object({
  signals: z.array(GrowthSignalSchema).min(1).max(10),
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

// ---------------------------------------------------------------------------
// Growth Operator
// ---------------------------------------------------------------------------

export class GrowthOperator extends BaseOperator {
  constructor() {
    super(OperatorTeam.GROWTH_OPERATOR);
    this.log("initialized");
  }

  // ---------------------------------------------------------------------------
  // BaseOperator implementation
  // ---------------------------------------------------------------------------

  getSystemPrompt(): string {
    return `You are the Growth Operator AI — a world-class growth marketer, trend analyst, and market researcher embedded in a private AI operator platform.

CORE EXPERTISE:
- Social media trend identification and momentum analysis
- Market opportunity scoring and competitive gap analysis
- Audience psychographic profiling and behavior prediction
- Content angle development for maximum market penetration
- Platform-specific growth signals (X trending, LinkedIn viral factors, TikTok algorithm, YouTube search volume)

ANALYTICAL FRAMEWORKS:
- Trend momentum: search volume trajectory, social mentions, creator adoption rate
- Competitive gap analysis: high demand + low supply = opportunity
- Audience-content fit: psychographic alignment + pain point resonance
- Timing windows: how long a trend stays exploitable before saturation

OUTPUT QUALITY:
- Every analysis is specific and actionable — no generic advice
- All scores are calibrated (50 = average, 80+ = exceptional opportunity)
- Trend signals include timeframe estimates for opportunity windows
- Market angles include the specific differentiator, not just a category
- Recommendations are prioritized by estimated ROI

DATA INTERPRETATION:
- Be direct about what the data means
- Flag when trends are saturating (decreasing opportunity window)
- Identify first-mover advantages
- Quantify opportunity size when possible`;
  }

  getSupportedJobTypes(): JobType[] {
    return [
      JobType.TREND_ANALYSIS,
      JobType.TOPIC_SCORING,
      JobType.MARKET_ANGLE_FINDING,
      JobType.AUDIENCE_ANALYSIS,
      JobType.OPPORTUNITY_GENERATION,
      JobType.RESEARCH,
    ];
  }

  async execute(job: Job): Promise<ExecutionResult<unknown>> {
    const start = Date.now();

    if (!this.supportsJob(job.type)) {
      return this.unsupportedJobResult(job, start);
    }

    this.log("executing_job", { jobId: job.id, type: job.type });

    try {
      switch (job.type) {
        case JobType.TREND_ANALYSIS: {
          const input = job.input as TrendJobInput;
          return await this.analyzeTrends(input);
        }

        case JobType.TOPIC_SCORING: {
          // Topic scoring uses input as ScoringJobInput
          const input = job.input as { kind: "scoring"; items: Array<{ id: string; text: string }>; criteria: string };
          const topics = input.items.map((i) => i.text);
          return await this.scoreTopics(topics, input.criteria);
        }

        case JobType.MARKET_ANGLE_FINDING: {
          const input = job.input as { kind: "trend"; niche: string; platforms?: Platform[] };
          return await this.findMarketAngles(input.niche, input.platforms);
        }

        case JobType.AUDIENCE_ANALYSIS: {
          const input = job.input as { kind: "trend"; niche: string };
          return await this.identifyAudienceFit(input.niche);
        }

        case JobType.OPPORTUNITY_GENERATION: {
          const input = job.input as TrendJobInput;
          return await this.generateOpportunities(input);
        }

        case JobType.RESEARCH: {
          const input = job.input as { kind: "research"; query: string };
          return await this.claude.research(input.query);
        }

        default:
          return this.unsupportedJobResult(job, start);
      }
    } catch (err) {
      return this.buildErrorResult(err, job.type, ModelChoice.CLAUDE, start);
    }
  }

  // ---------------------------------------------------------------------------
  // Growth operator methods
  // ---------------------------------------------------------------------------

  /**
   * Analyze trends in a niche and return ranked growth signals.
   * Claude handles this — it requires multi-faceted reasoning.
   */
  async analyzeTrends(
    input: TrendJobInput
  ): Promise<ExecutionResult<{ signals: GrowthSignal[] }>> {
    const start = Date.now();
    this.log("analyzing_trends", { niche: input.niche, timeframe: input.timeframe ?? "7d" });

    const userPrompt = `Analyze current trends for this niche.

NICHE: ${input.niche}
TIMEFRAME: ${input.timeframe ?? "7d"}
PLATFORMS TO ANALYZE: ${input.platforms?.join(", ") ?? "all major platforms"}

Identify 5-8 trend signals. For each signal, assess:
- Momentum score (0-100): How fast is it growing right now?
- Opportunity score (0-100): How exploitable is this for content creation?
- Competitor activity: How saturated is the space?
- Timeframe: How long does the opportunity window last?

Return ONLY valid JSON:
{
  "signals": [
    {
      "topic": "<specific trend topic>",
      "momentumScore": <0-100>,
      "opportunityScore": <0-100>,
      "platforms": ["<platform1>"],
      "angle": "<specific angle to exploit this trend>",
      "competitorActivity": "low" | "medium" | "high",
      "timeframe": "<e.g. 2-4 weeks>",
      "rationale": "<why this is an opportunity right now>"
    }
  ]
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 2048,
      });

      if (!result.success) {
        return { ...result, jobType: JobType.TREND_ANALYSIS } as ExecutionResult<{ signals: GrowthSignal[] }>;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));
      const validated = this.validateOutput(parsed, TrendOutputSchema);

      this.log("trends_analyzed", { signalCount: validated.signals.length });

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.TREND_ANALYSIS,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.TREND_ANALYSIS, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Score a list of topics by opportunity.
   * GPT-5 Nano handles this — it's batch scoring, perfect for Nano.
   */
  async scoreTopics(
    topics: string[],
    criteria?: string
  ): Promise<ExecutionResult<{ scoredTopics: ScoredTopic[] }>> {
    const start = Date.now();
    this.log("scoring_topics", { count: topics.length });

    // Score each topic using GPT-5 Nano in parallel for speed
    const scoringPromises = topics.map(async (topic) => {
      const scoreCriteria = criteria ?? "opportunity score, audience fit, competitive gap for social media content";
      const scoreResult = await this.openai.score(topic, scoreCriteria);

      return {
        topic,
        opportunityScore: scoreResult.success ? Math.round(scoreResult.data.score * 100) : 50,
        audienceFitScore: scoreResult.success ? Math.round(scoreResult.data.score * 90) : 50,
        competitiveGap: scoreResult.success ? Math.round((1 - scoreResult.data.score * 0.5) * 100) : 50,
        recommendedAction: scoreResult.success && scoreResult.data.score > 0.7
          ? "Prioritize — high opportunity"
          : scoreResult.success && scoreResult.data.score > 0.4
            ? "Consider — moderate opportunity"
            : "Deprioritize — low opportunity",
      };
    });

    const scoredTopics = await Promise.all(scoringPromises);
    // Sort by opportunity score descending
    scoredTopics.sort((a, b) => b.opportunityScore - a.opportunityScore);

    const validated = this.validateOutput(
      { scoredTopics },
      ScoredTopicsOutputSchema
    );

    this.log("topics_scored", { count: validated.scoredTopics.length });

    return {
      success: true,
      data: validated,
      model: ModelChoice.GPT5_NANO,
      jobType: JobType.TOPIC_SCORING,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Find market angles for positioning content in a niche.
   * Claude handles this — requires strategic reasoning.
   */
  async findMarketAngles(
    niche: string,
    platforms?: Platform[]
  ): Promise<ExecutionResult<{ angles: MarketAngle[] }>> {
    const start = Date.now();
    this.log("finding_market_angles", { niche });

    const userPrompt = `Find 3-5 distinct market positioning angles for this niche.

NICHE: ${niche}
${platforms?.length ? `TARGET PLATFORMS: ${platforms.join(", ")}` : ""}

For each angle, identify:
- The specific audience segment it targets
- The unique differentiator (why this angle, not another)
- A content framework for executing it
- Estimated conversion lift vs. generic content

Avoid generic advice. Be specific about WHO this angle targets and WHY it works.

Return ONLY valid JSON:
{
  "angles": [
    {
      "angle": "<specific positioning angle>",
      "targetSegment": "<exact audience segment>",
      "differentiator": "<what makes this angle unique vs. competition>",
      "contentFramework": "<how to execute this in content>",
      "estimatedConversionLift": "<e.g. 2-3x vs. generic>"
    }
  ]
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 2048,
      });

      if (!result.success) {
        return { ...result, jobType: JobType.MARKET_ANGLE_FINDING } as ExecutionResult<{ angles: MarketAngle[] }>;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));
      const validated = this.validateOutput(parsed, MarketAnglesOutputSchema);

      this.log("angles_found", { count: validated.angles.length });

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.MARKET_ANGLE_FINDING,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.MARKET_ANGLE_FINDING, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Deep audience analysis for a niche.
   * Returns psychographic profile and content preferences.
   */
  async identifyAudienceFit(niche: string): Promise<ExecutionResult<z.infer<typeof AudienceAnalysisSchema>>> {
    const start = Date.now();
    this.log("analyzing_audience", { niche });

    const userPrompt = `Analyze the target audience for this niche.

NICHE: ${niche}

Provide a deep psychographic profile including:
- Primary audience segment (specific, not generic)
- Psychographic traits (values, beliefs, identity markers)
- Core pain points (what keeps them up at night)
- Desired outcomes (what they're actually trying to achieve)
- Content format preferences
- Recommended brand voice and tone
- Platform affinities (where they actually are)

Return ONLY valid JSON:
{
  "primarySegment": "<specific segment description>",
  "psychographics": ["<trait1>", "<trait2>"],
  "painPoints": ["<pain1>", "<pain2>"],
  "desiredOutcomes": ["<outcome1>", "<outcome2>"],
  "contentPreferences": ["<format/style preference>"],
  "recommendedTone": "<tone description>",
  "platformAffinities": ["<platform: reason>"]
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 1024,
      });

      if (!result.success) {
        return { ...result, jobType: JobType.AUDIENCE_ANALYSIS } as ExecutionResult<z.infer<typeof AudienceAnalysisSchema>>;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));
      const validated = this.validateOutput(parsed, AudienceAnalysisSchema);

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.AUDIENCE_ANALYSIS,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.AUDIENCE_ANALYSIS, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Generate opportunity board items from trend data.
   * Returns actionable opportunities ranked by urgency.
   */
  async generateOpportunities(
    input: TrendJobInput
  ): Promise<ExecutionResult<{ opportunities: Opportunity[] }>> {
    const start = Date.now();
    this.log("generating_opportunities", { niche: input.niche });

    const userPrompt = `Generate 5-8 content opportunities for this niche.

NICHE: ${input.niche}
TIMEFRAME: ${input.timeframe ?? "7d"}
${input.platforms?.length ? `PLATFORMS: ${input.platforms.join(", ")}` : ""}

Each opportunity should be:
1. Specific and actionable (not generic)
2. Tied to a real market signal (trend, gap, need, or timing)
3. Prioritized by urgency (high = act this week)
4. Include concrete recommended actions

Return ONLY valid JSON:
{
  "opportunities": [
    {
      "id": "opp-1",
      "title": "<opportunity title>",
      "description": "<what the opportunity is and why now>",
      "type": "trend" | "competitor_gap" | "audience_need" | "seasonal",
      "urgency": "low" | "medium" | "high",
      "recommendedActions": ["<action1>", "<action2>"],
      "estimatedValue": "<e.g. High reach potential, low competition>"
    }
  ]
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 2048,
      });

      if (!result.success) {
        return { ...result, jobType: JobType.OPPORTUNITY_GENERATION } as ExecutionResult<{ opportunities: Opportunity[] }>;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));
      const validated = this.validateOutput(parsed, OpportunitiesOutputSchema);

      this.log("opportunities_generated", { count: validated.opportunities.length });

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.OPPORTUNITY_GENERATION,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.OPPORTUNITY_GENERATION, ModelChoice.CLAUDE, start);
    }
  }
}
