/**
 * Model Router Tests
 *
 * Verifies the dual-model routing strategy is deterministic and correct.
 * These tests are pure logic — no API calls, no mocking of external services.
 */

import { ModelRouter, getModelRouter } from "@/features/ai/model-router";
import { JobType, ModelChoice } from "@/features/ai/types";

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let router: ModelRouter;

beforeEach(() => {
  // Fresh router for each test — avoids singleton bleed between tests
  router = new ModelRouter();
});

// ---------------------------------------------------------------------------
// Claude routing
// ---------------------------------------------------------------------------

describe("ModelRouter — Claude routing", () => {
  it("routes content_generation to Claude", () => {
    expect(router.route(JobType.CONTENT_GENERATION)).toBe(ModelChoice.CLAUDE);
  });

  it("routes thread_generation to Claude", () => {
    expect(router.route(JobType.THREAD_GENERATION)).toBe(ModelChoice.CLAUDE);
  });

  it("routes script_generation to Claude", () => {
    expect(router.route(JobType.SCRIPT_GENERATION)).toBe(ModelChoice.CLAUDE);
  });

  it("routes mission_planning to Claude", () => {
    expect(router.route(JobType.MISSION_PLANNING)).toBe(ModelChoice.CLAUDE);
  });

  it("routes research to Claude", () => {
    expect(router.route(JobType.RESEARCH)).toBe(ModelChoice.CLAUDE);
  });

  it("routes trend_analysis to Claude", () => {
    expect(router.route(JobType.TREND_ANALYSIS)).toBe(ModelChoice.CLAUDE);
  });

  it("routes safety_review to Claude", () => {
    expect(router.route(JobType.SAFETY_REVIEW)).toBe(ModelChoice.CLAUDE);
  });

  it("routes offer_mapping to Claude", () => {
    expect(router.route(JobType.OFFER_MAPPING)).toBe(ModelChoice.CLAUDE);
  });

  it("routes market_angle_finding to Claude", () => {
    expect(router.route(JobType.MARKET_ANGLE_FINDING)).toBe(ModelChoice.CLAUDE);
  });

  it("routes funnel_design to Claude", () => {
    expect(router.route(JobType.FUNNEL_DESIGN)).toBe(ModelChoice.CLAUDE);
  });

  it("routes lead_magnet_creation to Claude", () => {
    expect(router.route(JobType.LEAD_MAGNET_CREATION)).toBe(ModelChoice.CLAUDE);
  });

  it("routes pricing_strategy to Claude", () => {
    expect(router.route(JobType.PRICING_STRATEGY)).toBe(ModelChoice.CLAUDE);
  });

  it("routes audience_analysis to Claude", () => {
    expect(router.route(JobType.AUDIENCE_ANALYSIS)).toBe(ModelChoice.CLAUDE);
  });

  it("routes opportunity_generation to Claude", () => {
    expect(router.route(JobType.OPPORTUNITY_GENERATION)).toBe(ModelChoice.CLAUDE);
  });

  it("routes caption_generation to Claude", () => {
    expect(router.route(JobType.CAPTION_GENERATION)).toBe(ModelChoice.CLAUDE);
  });

  it("routes content_repurposing to Claude", () => {
    expect(router.route(JobType.CONTENT_REPURPOSING)).toBe(ModelChoice.CLAUDE);
  });
});

// ---------------------------------------------------------------------------
// GPT-5 Nano routing
// ---------------------------------------------------------------------------

describe("ModelRouter — GPT-5 Nano routing", () => {
  it("routes topic_scoring to GPT-5 Nano", () => {
    expect(router.route(JobType.TOPIC_SCORING)).toBe(ModelChoice.GPT5_NANO);
  });

  it("routes safety_tone_check to GPT-5 Nano", () => {
    expect(router.route(JobType.SAFETY_TONE_CHECK)).toBe(ModelChoice.GPT5_NANO);
  });

  it("routes cta_generation to GPT-5 Nano", () => {
    expect(router.route(JobType.CTA_GENERATION)).toBe(ModelChoice.GPT5_NANO);
  });

  it("routes content_formatting to GPT-5 Nano", () => {
    expect(router.route(JobType.CONTENT_FORMATTING)).toBe(ModelChoice.GPT5_NANO);
  });

  it("routes status_summary to GPT-5 Nano", () => {
    expect(router.route(JobType.STATUS_SUMMARY)).toBe(ModelChoice.GPT5_NANO);
  });

  it("routes tag_assignment to GPT-5 Nano", () => {
    expect(router.route(JobType.TAG_ASSIGNMENT)).toBe(ModelChoice.GPT5_NANO);
  });

  it("routes confidence_scoring to GPT-5 Nano", () => {
    expect(router.route(JobType.CONFIDENCE_SCORING)).toBe(ModelChoice.GPT5_NANO);
  });

  it("routes content_classification to GPT-5 Nano", () => {
    expect(router.route(JobType.CONTENT_CLASSIFICATION)).toBe(ModelChoice.GPT5_NANO);
  });

  it("routes claim_flagging to GPT-5 Nano", () => {
    expect(router.route(JobType.CLAIM_FLAGGING)).toBe(ModelChoice.GPT5_NANO);
  });

  it("routes tonal_alignment_check to GPT-5 Nano", () => {
    expect(router.route(JobType.TONAL_ALIGNMENT_CHECK)).toBe(ModelChoice.GPT5_NANO);
  });
});

// ---------------------------------------------------------------------------
// Tool use and web access overrides
// ---------------------------------------------------------------------------

describe("ModelRouter — Tool use and web access overrides", () => {
  it("routes to Claude when requiresTools is true, even for Nano job type", () => {
    // topic_scoring normally goes to Nano — tool use should override
    expect(
      router.getModelForJob({ type: JobType.TOPIC_SCORING, requiresTools: true })
    ).toBe(ModelChoice.CLAUDE);
  });

  it("routes to Claude when requiresWebAccess is true, even for Nano job type", () => {
    expect(
      router.getModelForJob({ type: JobType.TAG_ASSIGNMENT, requiresWebAccess: true })
    ).toBe(ModelChoice.CLAUDE);
  });

  it("routes to Claude when both requiresTools and requiresWebAccess are true", () => {
    expect(
      router.getModelForJob({
        type: JobType.CONTENT_FORMATTING,
        requiresTools: true,
        requiresWebAccess: true,
      })
    ).toBe(ModelChoice.CLAUDE);
  });

  it("does NOT override routing when requiresTools is false", () => {
    // topic_scoring without tool override should still go to Nano
    expect(
      router.getModelForJob({ type: JobType.TOPIC_SCORING, requiresTools: false })
    ).toBe(ModelChoice.GPT5_NANO);
  });

  it("does NOT override routing when requiresWebAccess is false", () => {
    expect(
      router.getModelForJob({ type: JobType.STATUS_SUMMARY, requiresWebAccess: false })
    ).toBe(ModelChoice.GPT5_NANO);
  });

  it("routes Claude job types to Claude even without override flags", () => {
    expect(
      router.getModelForJob({ type: JobType.RESEARCH })
    ).toBe(ModelChoice.CLAUDE);
  });
});

// ---------------------------------------------------------------------------
// Batch / high-volume routing
// ---------------------------------------------------------------------------

describe("ModelRouter — Batch task routing", () => {
  it("routes all simple classification tasks to GPT-5 Nano", () => {
    const simpleTasks = [
      JobType.TOPIC_SCORING,
      JobType.TAG_ASSIGNMENT,
      JobType.CONTENT_CLASSIFICATION,
      JobType.CONFIDENCE_SCORING,
      JobType.STATUS_SUMMARY,
    ];

    simpleTasks.forEach((jobType) => {
      expect(router.route(jobType)).toBe(ModelChoice.GPT5_NANO);
    });
  });

  it("shouldUseGPTNano returns true for all Nano job types", () => {
    const nanoTypes = [
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
    ];

    nanoTypes.forEach((jobType) => {
      expect(router.shouldUseGPTNano(jobType)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("ModelRouter — Determinism", () => {
  it("returns the same model for the same job type on repeated calls", () => {
    const jobType = JobType.CONTENT_GENERATION;
    const calls = Array.from({ length: 10 }, () => router.route(jobType));
    const allSame = calls.every((result) => result === calls[0]);
    expect(allSame).toBe(true);
  });

  it("is deterministic across multiple router instances", () => {
    const router2 = new ModelRouter();
    const jobTypes = Object.values(JobType);

    jobTypes.forEach((jobType) => {
      expect(router.route(jobType)).toBe(router2.route(jobType));
    });
  });

  it("shouldUseClaude and shouldUseGPTNano are mutually exclusive", () => {
    const jobTypes = Object.values(JobType);

    jobTypes.forEach((jobType) => {
      const useClaude = router.shouldUseClaude(jobType);
      const useNano = router.shouldUseGPTNano(jobType);
      // Exactly one of them should be true
      expect(useClaude !== useNano).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Routing table coverage
// ---------------------------------------------------------------------------

describe("ModelRouter — Routing table coverage", () => {
  it("has a routing decision for every JobType enum value", () => {
    const routingTable = router.getRoutingTable();
    const routedTypes = new Set(routingTable.map((r) => r.jobType));
    const allTypes = Object.values(JobType);

    allTypes.forEach((jobType) => {
      expect(routedTypes.has(jobType)).toBe(true);
    });
  });

  it("returns a config summary with correct structure", () => {
    const config = router.getConfigSummary();
    expect(config).toHaveProperty("costThresholdUsd");
    expect(config).toHaveProperty("forceClaudeForToolUse");
    expect(config).toHaveProperty("forceClaudeForWebAccess");
    expect(config).toHaveProperty("claudeJobCount");
    expect(config).toHaveProperty("nanoJobCount");
    expect(typeof config.costThresholdUsd).toBe("number");
    expect(config.claudeJobCount).toBeGreaterThan(0);
    expect(config.nanoJobCount).toBeGreaterThan(0);
  });

  it("getModelRouter singleton returns same instance", () => {
    const r1 = getModelRouter();
    const r2 = getModelRouter();
    expect(r1).toBe(r2);
  });
});
