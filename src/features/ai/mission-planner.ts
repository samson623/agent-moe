/**
 * Mission Planner — Natural Language → Structured Job Workflow
 *
 * The Mission Planner is the entry point for all operator activity.
 * A user types one instruction → the planner decomposes it into 3-8
 * typed jobs, each assigned to the right operator team with priorities
 * and dependency graph.
 *
 * This is exclusively a Claude task — it requires:
 * - Understanding natural language intent
 * - Business context awareness (workspace, offers, brand rules)
 * - Strategic thinking about what tasks to create and in what order
 * - Knowledge of operator capabilities
 *
 * After planning, decompose() converts the plan into executable Job entities
 * ready for the job queue.
 */

import { getClaudeClient } from "@/features/ai/claude-client";
import { getModelRouter } from "@/features/ai/model-router";
import {
  type ExecutionResult,
  type Job,
  JobStatus,
  JobType,
  type MissionPlan,
  MissionPlanSchema,
  ModelChoice,
  Platform,
  RiskLevel,
  type Workspace,
  type AIError,
  AIErrorCode,
} from "@/features/ai/types";

// ---------------------------------------------------------------------------
// UUID shim — use crypto.randomUUID if uuid package unavailable
// ---------------------------------------------------------------------------

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Simple fallback that works in any JS environment
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ---------------------------------------------------------------------------
// JSON extraction helper
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
// MissionPlanner class
// ---------------------------------------------------------------------------

export class MissionPlanner {
  private readonly claude = getClaudeClient();
  private readonly router = getModelRouter();

  // ---------------------------------------------------------------------------
  // Primary planning interface
  // ---------------------------------------------------------------------------

  /**
   * Take a natural language mission instruction and produce a structured plan.
   *
   * The plan contains 3-8 jobs with:
   * - Assigned operator teams
   * - Job types (for model routing)
   * - Priority ordering
   * - Dependency graph (which jobs must complete before others start)
   *
   * Returns a typed ExecutionResult — callers should check result.success before using data.
   */
  async plan(
    instruction: string,
    workspace: Workspace
  ): Promise<ExecutionResult<MissionPlan>> {
    const start = Date.now();

    console.log("[MissionPlanner] Planning mission", {
      instruction: instruction.slice(0, 100),
      workspace: workspace.name,
    });

    const systemPrompt = this.buildSystemPrompt(workspace);

    const userPrompt = `Plan this mission: "${instruction}"

Current date/time: ${new Date().toISOString()}
Mission ID: ${generateId()}

Return ONLY valid JSON. No explanation before or after the JSON.`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt,
        maxTokens: 2048,
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          model: ModelChoice.CLAUDE,
          jobType: JobType.MISSION_PLANNING,
          durationMs: Date.now() - start,
          timestamp: new Date().toISOString(),
        };
      }

      const plan = this.parseOutput(result.data);

      console.log("[MissionPlanner] Plan created", {
        jobCount: plan.jobs.length,
        estimatedDuration: plan.estimatedDurationMinutes,
      });

      return {
        success: true,
        data: plan,
        model: ModelChoice.CLAUDE,
        jobType: JobType.MISSION_PLANNING,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const error = this.buildError(err);
      console.error("[MissionPlanner] Planning failed", error);

      return {
        success: false,
        error,
        model: ModelChoice.CLAUDE,
        jobType: JobType.MISSION_PLANNING,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Decompose a MissionPlan into executable Job entities.
   *
   * Converts the plan's PlannedJobs (which use local IDs for dependencies)
   * into full Job entities with real UUIDs, resolving dependency references.
   *
   * The returned jobs are ready to be inserted into the job queue.
   */
  async decompose(plan: MissionPlan): Promise<Job[]> {
    console.log("[MissionPlanner] Decomposing plan", {
      missionId: plan.missionId,
      jobCount: plan.jobs.length,
    });

    // Build a map from localId → real UUID
    const idMap = new Map<string, string>();
    plan.jobs.forEach((pj) => {
      idMap.set(pj.localId, generateId());
    });

    const jobs: Job[] = plan.jobs.map((pj) => {
      const jobId = idMap.get(pj.localId) ?? generateId();
      const resolvedDependencies = pj.dependsOn
        .map((localId) => idMap.get(localId))
        .filter((id): id is string => id !== undefined);

      return {
        id: jobId,
        missionId: plan.missionId,
        type: pj.type,
        operatorTeam: pj.operatorTeam,
        status: JobStatus.PENDING,
        priority: pj.priority,
        dependsOn: resolvedDependencies,
        input: this.buildDefaultInput(pj.type, plan.instruction),
        createdAt: new Date().toISOString(),
      };
    });

    console.log("[MissionPlanner] Decomposition complete", {
      jobCount: jobs.length,
      pendingJobs: jobs.filter((j) => j.status === JobStatus.PENDING).length,
    });

    return jobs;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Build the system prompt for the mission planner.
   * Loads workspace context so the AI understands the business.
   */
  private buildSystemPrompt(workspace: Workspace): string {
    const offersContext =
      workspace.activeOffers.length > 0
        ? workspace.activeOffers
            .map((o) => `  - ${o.name} (${o.pricePoint}, ${o.funnelStage} stage): ${o.description}`)
            .join("\n")
        : "  - No active offers configured";

    return `You are the Mission Planner for AGENT MOE — a private AI operator platform.
Your job is to decompose a natural language instruction into a structured job plan.

WORKSPACE CONTEXT:
- Business: ${workspace.name}
- Niche: ${workspace.niche}
- Target Audience: ${workspace.targetAudience}
- Brand Voice: ${workspace.brandVoice}
- Connected Platforms: ${workspace.connectedPlatforms.join(", ")}

ACTIVE OFFERS:
${offersContext}

BRAND RULES:
- Allowed tones: ${workspace.brandRules.allowedTone.join(", ")}
- Max risk level: ${workspace.brandRules.maxRiskLevel}
${workspace.brandRules.requiresDisclaimer ? `- Requires disclaimer: "${workspace.brandRules.disclaimerText ?? "Results may vary."}"` : ""}

OPERATOR TEAMS AND CAPABILITIES:
- content_strike: content_generation, thread_generation, script_generation, caption_generation, content_repurposing, cta_generation
- growth_operator: trend_analysis, research, market_angle_finding, audience_analysis, opportunity_generation, topic_scoring
- revenue_closer: offer_mapping, funnel_design, lead_magnet_creation, pricing_strategy, cta_generation
- brand_guardian: safety_review, safety_tone_check, claim_flagging, tonal_alignment_check

MODEL ROUTING RULES:
- Use "claude" for: anything requiring reasoning, generation, analysis, planning
- Use "gpt5_nano" for: topic_scoring, safety_tone_check, cta_generation (variants only), content_formatting, status_summary, tag_assignment, confidence_scoring, content_classification, claim_flagging, tonal_alignment_check

PLANNING PRINCIPLES:
1. ALWAYS end with a safety_review job from brand_guardian — content must be reviewed
2. Research/trend jobs should come BEFORE content generation jobs (they feed into them)
3. Offer mapping should come BEFORE final content jobs (content needs the CTA)
4. Keep plans focused: 3-5 jobs for simple missions, 6-8 for complex ones
5. Jobs at the same priority level can run in parallel
6. Use dependsOn to encode the dependency graph (localIds only)

RESPONSE FORMAT — return ONLY valid JSON:
{
  "missionId": "<uuid>",
  "instruction": "<exact instruction text>",
  "objective": "<1-sentence what this plan achieves>",
  "rationale": "<1-2 sentences why this plan structure>",
  "estimatedDurationMinutes": <realistic estimate>,
  "createdAt": "<ISO 8601 timestamp>",
  "jobs": [
    {
      "localId": "job-1",
      "title": "<concise action title>",
      "description": "<what this job does and why>",
      "type": "<exact JobType enum value>",
      "operatorTeam": "<exact OperatorTeam enum value>",
      "priority": <1-8, lower = higher priority>,
      "dependsOn": [],
      "modelRecommendation": "claude" | "gpt5_nano"
    }
  ]
}`;
  }

  /**
   * Parse and validate the raw Claude output into a MissionPlan.
   * Throws with a typed error code if parsing fails.
   */
  private parseOutput(raw: string): MissionPlan {
    let parsed: unknown;

    try {
      parsed = JSON.parse(extractJSON(raw));
    } catch {
      throw Object.assign(
        new Error(`Invalid JSON from mission planner: ${raw.slice(0, 200)}`),
        { code: AIErrorCode.SCHEMA_VALIDATION_FAILED }
      );
    }

    try {
      return MissionPlanSchema.parse(parsed);
    } catch (err) {
      const zodMessage =
        err instanceof Error ? err.message : "Unknown validation error";
      throw Object.assign(
        new Error(`Mission plan schema validation failed: ${zodMessage}`),
        { code: AIErrorCode.SCHEMA_VALIDATION_FAILED }
      );
    }
  }

  /**
   * Build a minimal default job input for each job type.
   * In practice, the caller should override this with real context.
   * This default keeps the decompose() method functional without requiring
   * the caller to manually build every input object.
   */
  private buildDefaultInput(
    jobType: JobType,
    instruction: string
  ): Job["input"] {
    // Map job types to their default input shapes
    const contentTypes: JobType[] = [
      JobType.CONTENT_GENERATION,
      JobType.THREAD_GENERATION,
      JobType.SCRIPT_GENERATION,
      JobType.CAPTION_GENERATION,
      JobType.CONTENT_REPURPOSING,
      JobType.CTA_GENERATION,
    ];

    const trendTypes: JobType[] = [
      JobType.TREND_ANALYSIS,
      JobType.MARKET_ANGLE_FINDING,
      JobType.AUDIENCE_ANALYSIS,
      JobType.OPPORTUNITY_GENERATION,
    ];

    const researchTypes: JobType[] = [
      JobType.RESEARCH,
    ];

    const offerTypes: JobType[] = [
      JobType.OFFER_MAPPING,
      JobType.FUNNEL_DESIGN,
      JobType.LEAD_MAGNET_CREATION,
      JobType.PRICING_STRATEGY,
    ];

    const safetyTypes: JobType[] = [
      JobType.SAFETY_REVIEW,
      JobType.SAFETY_TONE_CHECK,
      JobType.CLAIM_FLAGGING,
      JobType.TONAL_ALIGNMENT_CHECK,
    ];

    if (contentTypes.includes(jobType)) {
      return {
        kind: "content",
        topic: instruction,
        platform: Platform.X,
      };
    }

    if (trendTypes.includes(jobType)) {
      return {
        kind: "trend",
        niche: instruction,
      };
    }

    if (researchTypes.includes(jobType)) {
      return {
        kind: "research",
        query: instruction,
      };
    }

    if (offerTypes.includes(jobType)) {
      return {
        kind: "offer",
        contentSummary: instruction,
      };
    }

    if (safetyTypes.includes(jobType)) {
      return {
        kind: "safety",
        content: instruction,
        platform: Platform.X,
        brandRules: {
          allowedTone: ["professional", "friendly"],
          blockedPhrases: [],
          blockedClaims: [],
          requiresDisclaimer: false,
          maxRiskLevel: RiskLevel.MEDIUM,
        },
      };
    }

    // Scoring / formatting fallback
    return {
      kind: "scoring",
      items: [{ id: "item-1", text: instruction }],
      criteria: "relevance and quality",
    };
  }

  private buildError(err: unknown): AIError {
    const isValidationError =
      err instanceof Error &&
      ("code" in err
        ? (err as Record<string, unknown>)["code"] === AIErrorCode.SCHEMA_VALIDATION_FAILED
        : err.name === "ZodError");

    if (err instanceof Error) {
      return {
        code: isValidationError
          ? AIErrorCode.SCHEMA_VALIDATION_FAILED
          : AIErrorCode.UPSTREAM_ERROR,
        message: err.message,
        retryable: !isValidationError,
      };
    }

    return {
      code: AIErrorCode.UPSTREAM_ERROR,
      message: "Unknown error in MissionPlanner",
      retryable: false,
    };
  }
}

// Singleton
let _plannerInstance: MissionPlanner | null = null;

export function getMissionPlanner(): MissionPlanner {
  if (!_plannerInstance) {
    _plannerInstance = new MissionPlanner();
  }
  return _plannerInstance;
}
