/**
 * Claude Client — Anthropic SDK Wrapper
 *
 * Authenticates using CLAUDE_CODE_OAUTH_TOKEN — an OAuth bearer token from the
 * Claude.ai Max subscription. The Anthropic SDK sends it as:
 *   Authorization: Bearer {token}
 *
 * This gives us Claude for free (within Max subscription limits), making it the
 * right choice for all heavy, reasoning-intensive, content-generating tasks.
 *
 * Model: claude-opus-4-5-20251101 for complex tasks.
 *
 * IMPORTANT: This client never throws raw errors — it always returns typed
 * AIError structures so callers can handle failures predictably.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  type AIError,
  AIErrorCode,
  type ContentOutput,
  ContentOutputSchema,
  type ExecutionResult,
  JobType,
  type MissionPlan,
  MissionPlanSchema,
  ModelChoice,
  Platform,
  type SafetyReview,
  SafetyReviewSchema,
  type Workspace,
  type BrandRules,
} from "@/features/ai/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Primary model for heavy operator tasks.
 * Claude Opus 4.5 — best reasoning, longest context.
 */
const CLAUDE_HEAVY_MODEL = "claude-opus-4-5-20251101";

/**
 * Maximum tokens for content generation tasks.
 * High ceiling to allow long-form scripts and threads.
 */
const DEFAULT_MAX_TOKENS = 4096;

// ---------------------------------------------------------------------------
// Structured output helpers
// ---------------------------------------------------------------------------

/**
 * Strip markdown code fences from AI JSON output.
 * Claude often wraps JSON in ```json ... ``` — this removes that safely.
 */
function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  // Try to find a raw JSON object or array
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1) {
    return raw.slice(jsonStart, jsonEnd + 1);
  }
  return raw.trim();
}

/** Build a typed AIError from any caught exception. */
function buildAIError(err: unknown, fallbackCode = AIErrorCode.UPSTREAM_ERROR): AIError {
  if (err instanceof Anthropic.APIError) {
    const code =
      err.status === 401
        ? AIErrorCode.AUTH_FAILED
        : err.status === 429
          ? AIErrorCode.RATE_LIMITED
          : err.status === 400 && err.message.includes("context")
            ? AIErrorCode.CONTEXT_TOO_LONG
            : AIErrorCode.UPSTREAM_ERROR;

    return {
      code,
      message: err.message,
      retryable: err.status === 429 || err.status >= 500,
      details: { status: err.status, type: err.name },
    };
  }

  if (err instanceof Error) {
    return {
      code: fallbackCode,
      message: err.message,
      retryable: false,
    };
  }

  return {
    code: fallbackCode,
    message: "An unknown error occurred in ClaudeClient",
    retryable: false,
  };
}

// ---------------------------------------------------------------------------
// ClaudeClient class
// ---------------------------------------------------------------------------

export class ClaudeClient {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor() {
    const token = process.env["CLAUDE_CODE_OAUTH_TOKEN"];

    if (!token) {
      // Don't throw at construction time — let callers get a typed error.
      // But we do log loudly so it's obvious during startup.
      console.error(
        "[ClaudeClient] CRITICAL: CLAUDE_CODE_OAUTH_TOKEN is not set. " +
          "All Claude API calls will fail. Run `claude setup-token` to obtain a token."
      );
    }

    // The Anthropic SDK uses the apiKey value as the Bearer token.
    // For Claude Code OAuth tokens, it sends: Authorization: Bearer {apiKey}
    // which is exactly what the Claude Code OAuth flow expects.
    this.client = new Anthropic({
      apiKey: token ?? "missing-token",
    });

    this.model = CLAUDE_HEAVY_MODEL;

    console.log("[ClaudeClient] Initialized", {
      model: this.model,
      tokenConfigured: !!token,
    });
  }

  // ---------------------------------------------------------------------------
  // Core execution methods
  // ---------------------------------------------------------------------------

  /**
   * Basic text generation — single turn, no tool use.
   * Returns the raw text string wrapped in an ExecutionResult.
   */
  async run(
    prompt: string,
    options: {
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<ExecutionResult<string>> {
    const start = Date.now();

    try {
      const messages: Anthropic.MessageParam[] = [
        { role: "user", content: prompt },
      ];

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        system: options.systemPrompt,
        messages,
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const text = textBlock?.type === "text" ? textBlock.text : "";

      return {
        success: true,
        data: text,
        model: ModelChoice.CLAUDE,
        jobType: JobType.CONTENT_GENERATION,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        error: buildAIError(err),
        model: ModelChoice.CLAUDE,
        jobType: JobType.CONTENT_GENERATION,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Tool-using agent execution.
   * Runs an agentic loop until Claude stops calling tools.
   * Returns the final text response.
   */
  async runWithTools(
    prompt: string,
    tools: Anthropic.Tool[],
    options: {
      systemPrompt?: string;
      maxTokens?: number;
      maxIterations?: number;
    } = {}
  ): Promise<ExecutionResult<string>> {
    const start = Date.now();
    const maxIterations = options.maxIterations ?? 10;
    let totalTokens = 0;

    try {
      const messages: Anthropic.MessageParam[] = [
        { role: "user", content: prompt },
      ];

      for (let i = 0; i < maxIterations; i++) {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
          system: options.systemPrompt,
          tools,
          messages,
        });

        totalTokens += response.usage.input_tokens + response.usage.output_tokens;

        if (response.stop_reason === "end_turn") {
          const textBlock = response.content.find((b) => b.type === "text");
          const text = textBlock?.type === "text" ? textBlock.text : "";
          return {
            success: true,
            data: text,
            model: ModelChoice.CLAUDE,
            jobType: JobType.RESEARCH,
            tokensUsed: totalTokens,
            durationMs: Date.now() - start,
            timestamp: new Date().toISOString(),
          };
        }

        if (response.stop_reason === "tool_use") {
          // Collect all tool use blocks
          const toolUseBlocks = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );

          // Add assistant turn
          messages.push({ role: "assistant", content: response.content });

          // Build tool results (stub — actual tool execution handled by operator layer)
          const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
            (block) => ({
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: `Tool "${block.name}" execution acknowledged. Result: pending.`,
            })
          );

          messages.push({ role: "user", content: toolResults });
          continue;
        }

        // Unexpected stop reason
        break;
      }

      return {
        success: false,
        error: {
          code: AIErrorCode.UPSTREAM_ERROR,
          message: `Agent loop exhausted after ${maxIterations} iterations`,
          retryable: false,
        },
        model: ModelChoice.CLAUDE,
        jobType: JobType.RESEARCH,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        error: buildAIError(err),
        model: ModelChoice.CLAUDE,
        jobType: JobType.RESEARCH,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Mission Planning
  // ---------------------------------------------------------------------------

  /**
   * Plan a mission: take a natural language instruction and decompose it into
   * a structured MissionPlan with typed jobs.
   *
   * This is the most critical Claude call — it defines the entire workflow.
   */
  async planMission(
    instruction: string,
    workspace: Workspace
  ): Promise<ExecutionResult<MissionPlan>> {
    const start = Date.now();

    const systemPrompt = `You are the Mission Planner for AGENT MOE, a private AI operator platform.
Your job is to decompose a natural language mission instruction into a structured plan of 3-8 jobs.

WORKSPACE CONTEXT:
- Business: ${workspace.name}
- Niche: ${workspace.niche}
- Target Audience: ${workspace.targetAudience}
- Brand Voice: ${workspace.brandVoice}
- Connected Platforms: ${workspace.connectedPlatforms.join(", ")}

AVAILABLE OPERATOR TEAMS:
- content_strike: content generation, posts, threads, scripts, captions, CTAs, repurposing
- growth_operator: trend analysis, research, market angles, audience analysis, opportunities
- revenue_closer: offer mapping, funnel design, CTA strategy, lead magnets, pricing
- brand_guardian: safety review, tone checks, claim flagging

AVAILABLE JOB TYPES (use exact enum values):
- mission_planning, content_generation, thread_generation, script_generation
- caption_generation, content_repurposing, research, trend_analysis
- market_angle_finding, audience_analysis, offer_mapping, funnel_design
- lead_magnet_creation, safety_review, opportunity_generation, pricing_strategy
- topic_scoring, safety_tone_check, cta_generation, content_formatting
- status_summary, tag_assignment, confidence_scoring, content_classification
- claim_flagging, tonal_alignment_check

MODEL RECOMMENDATIONS:
- Use "claude" for: content generation, research, planning, analysis, offer mapping, funnel design
- Use "gpt5_nano" for: topic_scoring, safety_tone_check, cta_generation, content_formatting,
  status_summary, tag_assignment, confidence_scoring, content_classification, claim_flagging,
  tonal_alignment_check

RESPONSE FORMAT: Return ONLY valid JSON matching this exact schema:
{
  "missionId": "<string>",
  "instruction": "<the original instruction>",
  "objective": "<1-sentence clear objective>",
  "rationale": "<why this plan structure>",
  "estimatedDurationMinutes": <number>,
  "createdAt": "<ISO timestamp>",
  "jobs": [
    {
      "localId": "job-1",
      "title": "<concise title>",
      "description": "<what this job does>",
      "type": "<JobType enum value>",
      "operatorTeam": "<OperatorTeam enum value>",
      "priority": <1-8, 1=highest>,
      "dependsOn": ["job-1"],
      "modelRecommendation": "claude" | "gpt5_nano"
    }
  ]
}`;

    const userPrompt = `Plan this mission: "${instruction}"

Current date: ${new Date().toISOString()}
Return only the JSON plan. No explanation.`;

    try {
      const result = await this.run(userPrompt, {
        systemPrompt,
        maxTokens: 2048,
      });

      if (!result.success) {
        return {
          ...result,
          jobType: JobType.MISSION_PLANNING,
        } as ExecutionResult<MissionPlan>;
      }

      const jsonStr = extractJSON(result.data);
      const parsed: unknown = JSON.parse(jsonStr);
      const validated = MissionPlanSchema.parse(parsed);

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.MISSION_PLANNING,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const isParseError =
        err instanceof SyntaxError || (err instanceof Error && err.name === "ZodError");

      return {
        success: false,
        error: {
          code: isParseError
            ? AIErrorCode.SCHEMA_VALIDATION_FAILED
            : AIErrorCode.UPSTREAM_ERROR,
          message: err instanceof Error ? err.message : "Failed to plan mission",
          retryable: !isParseError,
        },
        model: ModelChoice.CLAUDE,
        jobType: JobType.MISSION_PLANNING,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Content Generation
  // ---------------------------------------------------------------------------

  /**
   * Generate a single piece of platform-targeted content.
   * Returns a validated ContentOutput with confidence score.
   */
  async generateContent(job: {
    topic: string;
    platform: Platform;
    tone?: string;
    systemPrompt: string;
    offerContext?: string;
    brandVoice?: string;
  }): Promise<ExecutionResult<ContentOutput>> {
    const start = Date.now();

    const userPrompt = `Generate a ${job.platform} post about: "${job.topic}"

${job.tone ? `Tone: ${job.tone}` : ""}
${job.offerContext ? `Offer to incorporate: ${job.offerContext}` : ""}
${job.brandVoice ? `Brand voice: ${job.brandVoice}` : ""}

Return ONLY valid JSON:
{
  "platform": "${job.platform}",
  "contentType": "post",
  "body": "<the complete post content>",
  "hook": "<the opening hook>",
  "hashtags": ["<tag1>", "<tag2>"],
  "characterCount": <number>,
  "confidenceScore": <0.0-1.0>,
  "metadata": {
    "toneUsed": "<tone applied>",
    "estimatedReach": "<low|medium|high>",
    "algorithmNotes": "<platform-specific notes>",
    "revisionSuggestions": ["<optional suggestions>"]
  }
}`;

    try {
      const result = await this.run(userPrompt, {
        systemPrompt: job.systemPrompt,
        maxTokens: DEFAULT_MAX_TOKENS,
      });

      if (!result.success) {
        return {
          ...result,
          jobType: JobType.CONTENT_GENERATION,
        } as ExecutionResult<ContentOutput>;
      }

      const jsonStr = extractJSON(result.data);
      const parsed: unknown = JSON.parse(jsonStr);
      const validated = ContentOutputSchema.parse(parsed);

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.CONTENT_GENERATION,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        error: buildAIError(err, AIErrorCode.SCHEMA_VALIDATION_FAILED),
        model: ModelChoice.CLAUDE,
        jobType: JobType.CONTENT_GENERATION,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Research
  // ---------------------------------------------------------------------------

  /**
   * Run a structured research query.
   * Returns a markdown-formatted research document.
   */
  async research(
    query: string,
    options: { depth?: "surface" | "deep"; format?: "bullet" | "paragraph" | "structured" } = {}
  ): Promise<ExecutionResult<string>> {
    const systemPrompt = `You are a professional market researcher and trend analyst.
Produce factual, actionable research. Cite your reasoning. Structure output clearly.
Format: ${options.format ?? "structured"}
Depth: ${options.depth ?? "deep"}`;

    return this.run(`Research: ${query}`, { systemPrompt, maxTokens: 4096 });
  }

  // ---------------------------------------------------------------------------
  // Safety Review
  // ---------------------------------------------------------------------------

  /**
   * Full safety review of content against brand rules.
   * This is a Claude task (not Nano) because it requires nuanced reasoning about
   * brand voice, claim accuracy, and platform-specific guidelines.
   */
  async reviewSafety(
    content: string,
    brandRules: BrandRules,
    platform: Platform
  ): Promise<ExecutionResult<SafetyReview>> {
    const start = Date.now();

    const systemPrompt = `You are the Brand Guardian AI for AGENT MOE.
Your job is to review content for brand safety, tone alignment, and risky claims.
Be firm but fair. Protect the brand without being overly restrictive.`;

    const userPrompt = `Review this content for brand safety:

CONTENT:
${content}

PLATFORM: ${platform}

BRAND RULES:
- Allowed tones: ${brandRules.allowedTone.join(", ")}
- Blocked phrases: ${brandRules.blockedPhrases.join(", ") || "none"}
- Blocked claims: ${brandRules.blockedClaims.join(", ") || "none"}
- Requires disclaimer: ${brandRules.requiresDisclaimer}
- Max risk level: ${brandRules.maxRiskLevel}
${brandRules.disclaimerText ? `- Disclaimer text: ${brandRules.disclaimerText}` : ""}

Return ONLY valid JSON:
{
  "approved": <boolean>,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "flags": [
    {
      "type": "blocked_phrase" | "risky_claim" | "tone_mismatch" | "missing_disclaimer" | "platform_violation",
      "severity": "warning" | "error" | "critical",
      "excerpt": "<the problematic text>",
      "suggestion": "<how to fix it>"
    }
  ],
  "toneScore": <0.0-1.0>,
  "revisedContent": "<optional improved version>",
  "revisionNotes": "<optional notes>",
  "reviewedAt": "<ISO timestamp>"
}`;

    try {
      const result = await this.run(userPrompt, { systemPrompt, maxTokens: 2048 });

      if (!result.success) {
        return {
          ...result,
          jobType: JobType.SAFETY_REVIEW,
        } as ExecutionResult<SafetyReview>;
      }

      const jsonStr = extractJSON(result.data);
      const parsed: unknown = JSON.parse(jsonStr);
      const validated = SafetyReviewSchema.parse(parsed);

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.SAFETY_REVIEW,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        error: buildAIError(err, AIErrorCode.SCHEMA_VALIDATION_FAILED),
        model: ModelChoice.CLAUDE,
        jobType: JobType.SAFETY_REVIEW,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Health check
  // ---------------------------------------------------------------------------

  /**
   * Verify the token is configured (does not make an API call).
   * Returns 'ok' if token is present, 'missing_token' otherwise.
   */
  healthCheck(): "ok" | "missing_token" {
    return process.env["CLAUDE_CODE_OAUTH_TOKEN"] ? "ok" : "missing_token";
  }
}

// Singleton — one client per server process.
let _clientInstance: ClaudeClient | null = null;

export function getClaudeClient(): ClaudeClient {
  if (!_clientInstance) {
    _clientInstance = new ClaudeClient();
  }
  return _clientInstance;
}
