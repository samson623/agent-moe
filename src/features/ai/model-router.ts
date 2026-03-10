/**
 * Model Router — Dual-Model Routing Service
 *
 * This service is the decision engine for the dual-model AI architecture.
 * It decides whether each job goes to Claude (free via Max subscription) or
 * GPT-5 Nano (cheap OpenAI API for high-volume simple tasks).
 *
 * ROUTING PHILOSOPHY:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Claude:     Multi-step reasoning, tool use, web access,    │
 * │              content generation, research, planning          │
 * │                                                             │
 * │  GPT-5 Nano: Scoring, classification, formatting, tagging,  │
 * │              summaries, CTA variants — simple + repetitive   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * This split means we get Claude quality where it matters (free)
 * and sub-cent costs everywhere else.
 */

import {
  JobType,
  ModelChoice,
  type ModelRouterConfig,
} from "@/features/ai/types";

// ---------------------------------------------------------------------------
// Static routing tables — the source of truth for model assignment
// ---------------------------------------------------------------------------

/**
 * Jobs that ALWAYS go to Claude.
 * These require multi-step reasoning, tool use, or generate primary content.
 */
const CLAUDE_JOB_TYPES = new Set<JobType>([
  JobType.MISSION_PLANNING,
  JobType.CONTENT_GENERATION,
  JobType.THREAD_GENERATION,
  JobType.SCRIPT_GENERATION,
  JobType.CAPTION_GENERATION,
  JobType.CONTENT_REPURPOSING,
  JobType.RESEARCH,
  JobType.TREND_ANALYSIS,
  JobType.TREND_SCAN,
  JobType.MARKET_ANGLE_FINDING,
  JobType.AUDIENCE_ANALYSIS,
  JobType.OFFER_MAPPING,
  JobType.FUNNEL_DESIGN,
  JobType.LEAD_MAGNET_CREATION,
  JobType.SAFETY_REVIEW,
  JobType.OPPORTUNITY_GENERATION,
  JobType.PRICING_STRATEGY,
  JobType.VIDEO_PACKAGE,
  JobType.BROWSER_SCRAPE,
  JobType.BROWSER_SCREENSHOT,
  JobType.BROWSER_CLICK,
  JobType.BROWSER_FILL_FORM,
  JobType.BROWSER_NAVIGATE,
  JobType.BROWSER_MONITOR,
  JobType.BROWSER_EXTRACT_DATA,
  JobType.BROWSER_SUBMIT_FORM,
]);

/**
 * Jobs that go to GPT-5 Nano.
 * These are lightweight, high-volume, or classification tasks.
 */
const GPT_NANO_JOB_TYPES = new Set<JobType>([
  JobType.TOPIC_SCORING,
  JobType.SAFETY_TONE_CHECK,
  JobType.CTA_GENERATION,
  JobType.CONTENT_FORMATTING,
  JobType.STATUS_SUMMARY,
  JobType.TAG_ASSIGNMENT,
  JobType.CONFIDENCE_SCORING,
  JobType.CONTENT_CLASSIFICATION,
  JobType.CLAIM_FLAGGING,
  JobType.TONAL_ALIGNMENT_CHECK,
]);

// ---------------------------------------------------------------------------
// ModelRouter class
// ---------------------------------------------------------------------------

export class ModelRouter {
  private readonly config: ModelRouterConfig;

  constructor() {
    const costThresholdRaw = process.env["OPENAI_COST_THRESHOLD_USD"];
    const costThreshold = costThresholdRaw ? parseFloat(costThresholdRaw) : 0.001;

    this.config = {
      costThresholdUsd: isNaN(costThreshold) ? 0.001 : costThreshold,
      forceClaudeForToolUse: true,
      forceClaudeForWebAccess: true,
      nanoJobTypes: GPT_NANO_JOB_TYPES,
      claudeJobTypes: CLAUDE_JOB_TYPES,
    };

    this.logConfig();
  }

  /**
   * Primary routing entry point.
   * Given a job descriptor, return the model that should handle it.
   */
  getModelForJob(job: {
    type: JobType;
    requiresTools?: boolean;
    requiresWebAccess?: boolean;
  }): ModelChoice {
    // Tool use and web access ALWAYS go to Claude — it's the only one with those capabilities.
    if (job.requiresTools && this.config.forceClaudeForToolUse) {
      return ModelChoice.CLAUDE;
    }

    if (job.requiresWebAccess && this.config.forceClaudeForWebAccess) {
      return ModelChoice.CLAUDE;
    }

    return this.route(job.type);
  }

  /**
   * Route a job type to a model using the static routing tables.
   * Deterministic — same input always yields same output.
   */
  route(jobType: JobType): ModelChoice {
    if (this.config.claudeJobTypes.has(jobType)) {
      return ModelChoice.CLAUDE;
    }

    if (this.config.nanoJobTypes.has(jobType)) {
      return ModelChoice.GPT5_NANO;
    }

    // Unknown job types fall back to Claude — safety default.
    // Unknown types may require reasoning we haven't categorized yet.
    console.warn(
      `[ModelRouter] Unknown job type "${jobType}" — defaulting to Claude`
    );
    return ModelChoice.CLAUDE;
  }

  /** Convenience predicate — does this job type go to Claude? */
  shouldUseClaude(jobType: JobType): boolean {
    return this.route(jobType) === ModelChoice.CLAUDE;
  }

  /** Convenience predicate — does this job type go to GPT-5 Nano? */
  shouldUseGPTNano(jobType: JobType): boolean {
    return this.route(jobType) === ModelChoice.GPT5_NANO;
  }

  /**
   * Get the routing decision and metadata for all job types.
   * Used by the /api/ai/route-test endpoint for verification.
   */
  getRoutingTable(): Array<{ jobType: JobType; model: ModelChoice }> {
    return Object.values(JobType).map((jobType) => ({
      jobType,
      model: this.route(jobType),
    }));
  }

  /** Return a summary of current routing config (safe to log / return from API). */
  getConfigSummary(): {
    costThresholdUsd: number;
    forceClaudeForToolUse: boolean;
    forceClaudeForWebAccess: boolean;
    claudeJobCount: number;
    nanoJobCount: number;
  } {
    return {
      costThresholdUsd: this.config.costThresholdUsd,
      forceClaudeForToolUse: this.config.forceClaudeForToolUse,
      forceClaudeForWebAccess: this.config.forceClaudeForWebAccess,
      claudeJobCount: this.config.claudeJobTypes.size,
      nanoJobCount: this.config.nanoJobTypes.size,
    };
  }

  private logConfig(): void {
    console.log("[ModelRouter] Initialized", {
      claudeJobs: this.config.claudeJobTypes.size,
      nanoJobs: this.config.nanoJobTypes.size,
      costThreshold: this.config.costThresholdUsd,
    });
  }
}

// Singleton export — one router instance per server process.
// Constructed lazily so env vars are available at call time.
let _routerInstance: ModelRouter | null = null;

export function getModelRouter(): ModelRouter {
  if (!_routerInstance) {
    _routerInstance = new ModelRouter();
  }
  return _routerInstance;
}
