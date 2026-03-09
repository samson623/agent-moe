/**
 * Revenue Closer — Monetization Strategist & Conversion Specialist
 *
 * This operator is the monetization brain of AGENT MOE. It maps content to
 * offers, designs conversion funnels, crafts CTA strategies, and builds
 * lead magnet concepts.
 *
 * CAPABILITIES:
 * - Offer mapping (match content to the best offer)
 * - CTA strategy (psychological framing + placement)
 * - Funnel design (awareness → conversion path)
 * - Pricing strategy recommendations
 * - Lead magnet concept creation
 *
 * MODEL STRATEGY:
 * - All revenue tasks → Claude (nuanced business reasoning required)
 * - CTA variant formatting → GPT-5 Nano (downstream formatting only)
 */

import { z } from "zod";
import {
  AIErrorCode,
  type ExecutionResult,
  type Job,
  JobType,
  type LeadMagnetConcept,
  ModelChoice,
  type Offer,
  type OfferJobInput,
  OperatorTeam,
  type PricingStrategy,
  type RevenueStrategy,
  RevenueStrategySchema,
} from "@/features/ai/types";
import { BaseOperator } from "@/features/ai/operators/base-operator";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const LeadMagnetSchema = z.object({
  title: z.string(),
  format: z.enum(["pdf", "video", "template", "checklist", "mini-course"]),
  description: z.string(),
  deliverableOutline: z.array(z.string()),
  estimatedConversionRate: z.string(),
  linkedOffer: z.string(),
});

const PricingStrategySchema = z.object({
  recommendedPrice: z.string(),
  priceAnchors: z.array(z.string()),
  framingStrategy: z.string(),
  objectionHandlers: z.array(z.string()),
  guaranteeRecommendation: z.string(),
});

const FunnelDesignSchema = z.object({
  funnelName: z.string(),
  stages: z.array(
    z.object({
      stage: z.enum(["awareness", "consideration", "conversion", "retention"]),
      contentType: z.string(),
      message: z.string(),
      kpiTarget: z.string(),
    })
  ),
  estimatedConversionRate: z.string(),
  keyInsight: z.string(),
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
// Revenue Closer Operator
// ---------------------------------------------------------------------------

export class RevenueCloserOperator extends BaseOperator {
  constructor() {
    super(OperatorTeam.REVENUE_CLOSER);
    this.log("initialized");
  }

  // ---------------------------------------------------------------------------
  // BaseOperator implementation
  // ---------------------------------------------------------------------------

  getSystemPrompt(): string {
    return `You are the Revenue Closer AI — an elite conversion strategist, offer architect, and funnel designer embedded in a private AI operator platform.

CORE EXPERTISE:
- Offer-content alignment: matching the right offer to the right content at the right moment
- CTA psychology: triggers (urgency, scarcity, social proof, identity), framing, timing
- Funnel architecture: awareness → interest → desire → action → retention
- Pricing strategy: anchoring, value stacking, price-to-value framing, guarantee structures
- Lead magnet design: solving a micro-problem to demonstrate value for the core offer

STRATEGIC PRINCIPLES:
- The best CTA is invisible — it feels like the natural next step, not a sell
- Price anchoring is the single biggest lever in conversion rate optimization
- Funnels fail at the transition points — focus on the handoffs between stages
- Lead magnets should solve a problem that creates the need for the main offer
- Every piece of content should have ONE conversion job, not multiple

CONVERSION PSYCHOLOGY FRAMEWORKS:
- Cialdini's 6 principles: Reciprocity, Scarcity, Authority, Consistency, Liking, Social Proof
- Hook → Story → Offer (Alex Hormozi framework)
- SPIN Selling: Situation, Problem, Implication, Need-Payoff
- Value equation: (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort & Sacrifice)

OUTPUT REQUIREMENTS:
- Every recommendation includes the psychological mechanism behind it
- Pricing includes multiple anchor points, not just one number
- Funnels are stage-specific — different message, different content type, different metric
- Lead magnets create desire for the main offer, not just standalone value
- CTAs include the exact copy, not just a description`;
  }

  getSupportedJobTypes(): JobType[] {
    return [
      JobType.OFFER_MAPPING,
      JobType.FUNNEL_DESIGN,
      JobType.LEAD_MAGNET_CREATION,
      JobType.PRICING_STRATEGY,
      JobType.CTA_GENERATION,
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
        case JobType.OFFER_MAPPING: {
          const input = job.input as OfferJobInput;
          return await this.mapOffer(input);
        }

        case JobType.FUNNEL_DESIGN: {
          const input = job.input as OfferJobInput;
          return await this.designFunnel(input);
        }

        case JobType.LEAD_MAGNET_CREATION: {
          const input = job.input as OfferJobInput;
          return await this.createLeadMagnet(input);
        }

        case JobType.PRICING_STRATEGY: {
          const input = job.input as OfferJobInput;
          const offer = input.availableOffers?.[0];
          if (!offer) {
            return {
              success: false,
              error: {
                code: AIErrorCode.UPSTREAM_ERROR,
                message: "PRICING_STRATEGY job requires at least one offer in availableOffers",
                retryable: false,
              },
              model: ModelChoice.CLAUDE,
              jobType: JobType.PRICING_STRATEGY,
              durationMs: Date.now() - start,
              timestamp: new Date().toISOString(),
            };
          }
          return await this.pricingStrategy(offer);
        }

        case JobType.CTA_GENERATION: {
          const input = job.input as OfferJobInput;
          return await this.generateCTAStrategy(input);
        }

        default:
          return this.unsupportedJobResult(job, start);
      }
    } catch (err) {
      return this.buildErrorResult(err, job.type, ModelChoice.CLAUDE, start);
    }
  }

  // ---------------------------------------------------------------------------
  // Revenue Closer methods
  // ---------------------------------------------------------------------------

  /**
   * Map content to the best available offer.
   * Returns a full revenue strategy with CTA and funnel path.
   */
  async mapOffer(input: OfferJobInput): Promise<ExecutionResult<RevenueStrategy>> {
    const start = Date.now();
    this.log("mapping_offer", { funnelStage: input.funnelStage });

    const offersContext = input.availableOffers?.length
      ? `AVAILABLE OFFERS:\n${input.availableOffers
          .map((o) => `- ${o.name}: ${o.description} (${o.pricePoint}, ${o.funnelStage} stage)`)
          .join("\n")}`
      : "No specific offers provided — recommend a general offer structure.";

    const userPrompt = `Map the best offer to this content and build a revenue strategy.

CONTENT SUMMARY: ${input.contentSummary}
AUDIENCE: ${input.audienceProfile ?? "general audience"}
FUNNEL STAGE: ${input.funnelStage ?? "awareness"}
${offersContext}

Build a complete revenue strategy:
1. Which offer fits best (and WHY it fits this content's funnel stage)
2. CTA strategy: primary CTA, secondary CTA, psychological frame, placement
3. Funnel path: 4 stages from awareness to retention

Return ONLY valid JSON:
{
  "recommendedOffer": {
    "id": "<offer id or 'new'>",
    "name": "<offer name>",
    "description": "<description>",
    "pricePoint": "<price>",
    "funnelStage": "awareness" | "consideration" | "conversion",
    "cta": "<the exact CTA text>",
    "url": "<optional>"
  },
  "rationale": "<why this offer fits this content + audience>",
  "ctaStrategy": {
    "primaryCTA": "<exact primary CTA copy>",
    "secondaryCTA": "<exact secondary CTA copy>",
    "placementRecommendations": ["<where to place>"],
    "psychologicalFrame": "<which Cialdini principle and why>"
  },
  "funnelPath": [
    {
      "stage": "awareness" | "consideration" | "conversion" | "retention",
      "contentType": "<what type of content for this stage>",
      "message": "<the core message for this stage>",
      "kpiTarget": "<what to measure>"
    }
  ],
  "confidenceScore": <0.0-1.0>
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 2048,
      });

      if (!result.success) {
        return { ...result, jobType: JobType.OFFER_MAPPING } as ExecutionResult<RevenueStrategy>;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));
      const validated = this.validateOutput(parsed, RevenueStrategySchema);

      this.log("offer_mapped", {
        offer: validated.recommendedOffer.name,
        confidence: validated.confidenceScore,
      });

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.OFFER_MAPPING,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.OFFER_MAPPING, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Generate a full CTA positioning strategy.
   * Returns primary + secondary CTA with psychological framing.
   */
  async generateCTAStrategy(input: OfferJobInput): Promise<ExecutionResult<RevenueStrategy["ctaStrategy"]>> {
    const start = Date.now();
    this.log("generating_cta_strategy");

    const userPrompt = `Design a CTA strategy for this content and offer context.

CONTENT SUMMARY: ${input.contentSummary}
AUDIENCE: ${input.audienceProfile ?? "general audience"}
FUNNEL STAGE: ${input.funnelStage ?? "consideration"}
${input.availableOffers?.length
  ? `OFFER: ${input.availableOffers[0]?.name} — ${input.availableOffers[0]?.cta}`
  : ""}

Design the optimal CTA strategy. Include:
- Exact copy for primary and secondary CTA
- Where to place each CTA in the content
- The psychological principle driving each CTA
- Why this framing works for this audience + funnel stage

Return ONLY valid JSON:
{
  "primaryCTA": "<exact primary CTA copy>",
  "secondaryCTA": "<exact secondary CTA copy>",
  "placementRecommendations": ["<placement instruction 1>", "<placement instruction 2>"],
  "psychologicalFrame": "<Cialdini principle + specific reason it applies>"
}`;

    const CTAStrategySchema = z.object({
      primaryCTA: z.string(),
      secondaryCTA: z.string(),
      placementRecommendations: z.array(z.string()),
      psychologicalFrame: z.string(),
    });

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 1024,
      });

      if (!result.success) {
        return { ...result, jobType: JobType.CTA_GENERATION } as ExecutionResult<RevenueStrategy["ctaStrategy"]>;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));
      const validated = this.validateOutput(parsed, CTAStrategySchema);

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.CTA_GENERATION,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.CTA_GENERATION, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Design a full conversion funnel with stage-specific content + metrics.
   */
  async designFunnel(input: OfferJobInput): Promise<ExecutionResult<z.infer<typeof FunnelDesignSchema>>> {
    const start = Date.now();
    this.log("designing_funnel");

    const userPrompt = `Design a 4-stage conversion funnel.

CONTENT/OFFER CONTEXT: ${input.contentSummary}
AUDIENCE: ${input.audienceProfile ?? "general audience"}
${input.availableOffers?.length
  ? `CORE OFFER: ${input.availableOffers[0]?.name} at ${input.availableOffers[0]?.pricePoint}`
  : ""}

Design all 4 funnel stages (awareness → consideration → conversion → retention).
For each stage, specify:
- Content type that works best (e.g., educational post, case study, testimonial, onboarding email)
- Core message (what to communicate at this stage)
- KPI target (what metric to optimize)

Include an overall estimated conversion rate and the single biggest insight about this funnel.

Return ONLY valid JSON:
{
  "funnelName": "<descriptive funnel name>",
  "stages": [
    {
      "stage": "awareness",
      "contentType": "<content type>",
      "message": "<core message for this stage>",
      "kpiTarget": "<metric and target>"
    },
    {"stage": "consideration", ...},
    {"stage": "conversion", ...},
    {"stage": "retention", ...}
  ],
  "estimatedConversionRate": "<e.g. 2-4%>",
  "keyInsight": "<the most important strategic insight about this funnel>"
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 1536,
      });

      if (!result.success) {
        return { ...result, jobType: JobType.FUNNEL_DESIGN } as ExecutionResult<z.infer<typeof FunnelDesignSchema>>;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));
      const validated = this.validateOutput(parsed, FunnelDesignSchema);

      this.log("funnel_designed", { stages: validated.stages.length });

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.FUNNEL_DESIGN,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.FUNNEL_DESIGN, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Build a pricing strategy for an offer.
   * Includes price anchors, framing, objection handlers, and guarantee.
   */
  async pricingStrategy(offer: Offer): Promise<ExecutionResult<PricingStrategy>> {
    const start = Date.now();
    this.log("building_pricing_strategy", { offer: offer.name });

    const userPrompt = `Build a pricing strategy for this offer.

OFFER: ${offer.name}
DESCRIPTION: ${offer.description}
CURRENT PRICE: ${offer.pricePoint}
FUNNEL STAGE: ${offer.funnelStage}

Build a comprehensive pricing strategy including:
- Recommended final price (with reasoning)
- 2-3 price anchors (what to compare it against to make it feel like a deal)
- Framing strategy (how to present the price to maximize perceived value)
- Top 3 objection handlers (with exact response copy)
- Guarantee recommendation (what guarantee removes the most risk)

Return ONLY valid JSON:
{
  "recommendedPrice": "<price with any structure, e.g. '$497 or 3x$197'>",
  "priceAnchors": ["<anchor 1>", "<anchor 2>", "<anchor 3>"],
  "framingStrategy": "<how to present the price>",
  "objectionHandlers": ["<objection: response>", ...],
  "guaranteeRecommendation": "<guarantee structure and why it works>"
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 1024,
      });

      if (!result.success) {
        return { ...result, jobType: JobType.PRICING_STRATEGY } as ExecutionResult<PricingStrategy>;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));
      const validated = this.validateOutput(parsed, PricingStrategySchema);

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.PRICING_STRATEGY,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.PRICING_STRATEGY, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Create a lead magnet concept that drives desire for the core offer.
   */
  async createLeadMagnet(input: OfferJobInput): Promise<ExecutionResult<LeadMagnetConcept>> {
    const start = Date.now();
    this.log("creating_lead_magnet");

    const coreOffer = input.availableOffers?.[0];

    const userPrompt = `Design a lead magnet concept.

BUSINESS CONTEXT: ${input.contentSummary}
${coreOffer ? `CORE OFFER TO SELL: ${coreOffer.name} — ${coreOffer.description} at ${coreOffer.pricePoint}` : ""}
AUDIENCE: ${input.audienceProfile ?? "general audience"}

The lead magnet must:
1. Solve a specific micro-problem the audience has RIGHT NOW
2. Deliver a quick win (ideally in under 30 minutes)
3. Create desire for the core offer (the lead magnet should reveal the problem, the offer solves it completely)
4. Be achievable to create in under a week

Return ONLY valid JSON:
{
  "title": "<compelling lead magnet title>",
  "format": "pdf" | "video" | "template" | "checklist" | "mini-course",
  "description": "<what it is and the specific problem it solves>",
  "deliverableOutline": ["<section 1>", "<section 2>", ...],
  "estimatedConversionRate": "<e.g. 35-45% of people who download become leads>",
  "linkedOffer": "<how downloading this creates desire for the core offer>"
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 1024,
      });

      if (!result.success) {
        return { ...result, jobType: JobType.LEAD_MAGNET_CREATION } as ExecutionResult<LeadMagnetConcept>;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));
      const validated = this.validateOutput(parsed, LeadMagnetSchema);

      this.log("lead_magnet_created", { format: validated.format });

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.LEAD_MAGNET_CREATION,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.LEAD_MAGNET_CREATION, ModelChoice.CLAUDE, start);
    }
  }
}
