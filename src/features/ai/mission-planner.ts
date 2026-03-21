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
  type PlannedJob,
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
        input: this.buildDefaultInput(pj.type, plan.instruction, pj),
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

PLAYBOOK MATCHING:
When decomposing a mission, match it to one of these playbook types and follow its agent sequence:
1. Content Engine — recurring content production → Growth Operator → Content Strike → Brand Guardian
2. Lead Gen Campaign — lead generation → Growth Operator → Content Strike → Revenue Closer → Brand Guardian
3. Product/Offer Launch — new product to market → Brand Guardian → Growth Operator → Content Strike → Revenue Closer
4. Brand Positioning — establish/reposition identity → Growth Operator → Brand Guardian → Content Strike → Brand Guardian
5. Paid Media Campaign — paid ads → Growth Operator → Content Strike → Revenue Closer → Growth Operator
6. Retention/Win-Back — re-engage churned users → Growth Operator → Revenue Closer → Content Strike → Brand Guardian
7. Competitive Response — react to competitor → Growth Operator → Brand Guardian → Content Strike → Revenue Closer
8. Growth Diagnostics — funnel audit → Growth Operator → Revenue Closer → Content Strike → Growth Operator

Match the user's mission to the closest playbook. Use the playbook's agent sequence to determine job order and operator assignments. If no playbook matches cleanly, use your judgment but still end with Brand Guardian review.

CRITICAL — PLATFORM AND JOB TYPE RULES:
- When the user mentions a specific platform (TikTok, Instagram, YouTube, LinkedIn, X/Twitter), set "platform" to the correct value
- Platform enum values: "x", "linkedin", "instagram", "tiktok", "youtube", "email", "generic"
- For TikTok reels, Instagram reels, or YouTube shorts → use type "script_generation" (NOT "content_generation")
- For Twitter/X threads → use type "thread_generation"
- For Instagram/TikTok captions → use type "caption_generation"
- For regular posts → use type "content_generation"
- For video scripts, include "durationSeconds" (e.g. 30, 45, 60, 90)
- The safety_review job should use the SAME platform as the content it reviews

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
      "modelRecommendation": "claude" | "gpt5_nano",
      "platform": "<platform enum value — REQUIRED for content/script/caption/safety jobs>",
      "durationSeconds": <number — REQUIRED for script_generation jobs>
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
   * Build a job input using the planned job's context (platform, description, duration).
   * Falls back to sensible defaults when the plan doesn't specify a field.
   */
  private buildDefaultInput(
    jobType: JobType,
    instruction: string,
    plannedJob?: PlannedJob,
  ): Job["input"] {
    const platform = plannedJob?.platform ?? this.inferPlatform(instruction);
    const topic = plannedJob?.description || instruction;

    switch (jobType) {
      // ── Script jobs (TikTok reels, YouTube Shorts, IG Reels) ───────
      case JobType.SCRIPT_GENERATION:
        return {
          kind: "script",
          topic,
          platform: platform as Platform.TIKTOK | Platform.YOUTUBE | Platform.INSTAGRAM,
          durationSeconds: plannedJob?.durationSeconds ?? 60,
        };

      // ── Caption jobs (Instagram, TikTok) ───────────────────────────
      case JobType.CAPTION_GENERATION:
        return {
          kind: "caption",
          topic,
          platform: platform as Platform.INSTAGRAM | Platform.TIKTOK,
        };

      // ── Thread jobs (X/Twitter) ────────────────────────────────────
      case JobType.THREAD_GENERATION:
        return {
          kind: "thread",
          topic,
        };

      // ── Post / CTA / Repurpose jobs ────────────────────────────────
      case JobType.CONTENT_GENERATION:
      case JobType.CTA_GENERATION:
      case JobType.CONTENT_REPURPOSING:
        return {
          kind: "content",
          topic,
          platform,
        };

      // ── Content formatting ─────────────────────────────────────────
      case JobType.CONTENT_FORMATTING:
        return {
          kind: "formatting",
          content: topic,
          targetPlatform: platform,
        };

      // ── Trend / research ───────────────────────────────────────────
      case JobType.TREND_ANALYSIS:
      case JobType.MARKET_ANGLE_FINDING:
      case JobType.AUDIENCE_ANALYSIS:
      case JobType.OPPORTUNITY_GENERATION:
        return {
          kind: "trend",
          niche: instruction,
        };

      case JobType.RESEARCH:
        return {
          kind: "research",
          query: instruction,
        };

      // ── Offer / funnel ─────────────────────────────────────────────
      case JobType.OFFER_MAPPING:
      case JobType.FUNNEL_DESIGN:
      case JobType.LEAD_MAGNET_CREATION:
      case JobType.PRICING_STRATEGY:
        return {
          kind: "offer",
          contentSummary: instruction,
        };

      // ── Safety ─────────────────────────────────────────────────────
      case JobType.SAFETY_REVIEW:
      case JobType.SAFETY_TONE_CHECK:
      case JobType.CLAIM_FLAGGING:
      case JobType.TONAL_ALIGNMENT_CHECK:
        return {
          kind: "safety",
          content: instruction,
          platform,
          brandRules: {
            allowedTone: ["professional", "friendly"],
            blockedPhrases: [],
            blockedClaims: [],
            requiresDisclaimer: false,
            maxRiskLevel: RiskLevel.MEDIUM,
          },
        };

      // ── Scoring / formatting fallback ──────────────────────────────
      default:
        return {
          kind: "scoring",
          items: [{ id: "item-1", text: instruction }],
          criteria: "relevance and quality",
        };
    }
  }

  /**
   * Infer the target platform from the mission instruction text.
   * Falls back to Platform.GENERIC if no platform is detected.
   */
  private inferPlatform(instruction: string): Platform {
    const lower = instruction.toLowerCase();
    if (lower.includes("tiktok") || lower.includes("tik tok") || lower.includes("reel")) return Platform.TIKTOK;
    if (lower.includes("instagram") || lower.includes("ig ")) return Platform.INSTAGRAM;
    if (lower.includes("youtube") || lower.includes("yt ") || lower.includes("shorts")) return Platform.YOUTUBE;
    if (lower.includes("linkedin")) return Platform.LINKEDIN;
    if (lower.includes("twitter") || lower.includes(" x post") || lower.includes("tweet")) return Platform.X;
    if (lower.includes("email") || lower.includes("newsletter")) return Platform.EMAIL;
    return Platform.GENERIC;
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
