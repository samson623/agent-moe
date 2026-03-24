/**
 * Claude Client — Claude Agent SDK Wrapper
 *
 * Uses @anthropic-ai/claude-agent-sdk to route all AI calls through Claude Code,
 * which authenticates with the CLAUDE_CODE_OAUTH_TOKEN from the Claude Max
 * subscription. This means all Claude calls are $0 cost.
 *
 * The Agent SDK spawns a Claude Code subprocess for each query. The subprocess
 * handles authentication, model selection, and token management automatically.
 *
 * Fallback: if ANTHROPIC_API_KEY is set, uses the standard @anthropic-ai/sdk
 * for direct API access (pay-per-token).
 */

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
// Structured output helpers
// ---------------------------------------------------------------------------

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1) {
    return raw.slice(jsonStart, jsonEnd + 1);
  }
  return raw.trim();
}

function buildAIError(err: unknown, fallbackCode = AIErrorCode.UPSTREAM_ERROR): AIError {
  if (err instanceof Error) {
    const message = err.message;
    const isTimeout = message.includes("timed out") || message.includes("timeout");
    const code =
      message.includes("401") || message.includes("auth")
        ? AIErrorCode.AUTH_FAILED
        : message.includes("429") || message.includes("rate")
          ? AIErrorCode.RATE_LIMITED
          : message.includes("context")
            ? AIErrorCode.CONTEXT_TOO_LONG
            : isTimeout
              ? AIErrorCode.TIMEOUT
              : fallbackCode;

    return {
      code,
      message,
      retryable: code === AIErrorCode.RATE_LIMITED || code === AIErrorCode.TIMEOUT,
    };
  }

  return {
    code: fallbackCode,
    message: "An unknown error occurred in ClaudeClient",
    retryable: false,
  };
}

// ---------------------------------------------------------------------------
// Timeout helper
// ---------------------------------------------------------------------------

const AI_CALL_TIMEOUT_MS = 240_000; // 240s — fits within Vercel Pro 300s maxDuration limit

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
      ms,
    );
    promise
      .then((v) => { clearTimeout(timer); resolve(v); })
      .catch((e) => { clearTimeout(timer); reject(e); });
  });
}

// ---------------------------------------------------------------------------
// Agent SDK query helper
// ---------------------------------------------------------------------------

/**
 * Run a prompt through the Claude Agent SDK.
 * Uses the bundled cli.js inside @anthropic-ai/claude-agent-sdk — no global
 * binary required. Authenticates via CLAUDE_CODE_OAUTH_TOKEN automatically.
 */
async function queryViaAgentSDK(
  prompt: string,
  systemPrompt?: string,
  allowedTools?: string[],
): Promise<string> {
  const { query } = await import("@anthropic-ai/claude-agent-sdk");

  const gen = query({
    prompt,
    options: {
      ...(systemPrompt ? { systemPrompt } : {}),
      ...(allowedTools ? { allowedTools } : {}),
    },
  });

  for await (const message of gen) {
    if (message.type === "result" && message.subtype === "success") {
      return message.result;
    }
    if (message.type === "result") {
      throw new Error(`Claude Agent SDK error: ${message.subtype}`);
    }
  }

  throw new Error("Claude Agent SDK: no result message received");
}

// ---------------------------------------------------------------------------
// Direct API fallback (when ANTHROPIC_API_KEY is available)
// ---------------------------------------------------------------------------

async function queryDirectAPI(
  prompt: string,
  options: { systemPrompt?: string; maxTokens?: number } = {}
): Promise<{ text: string; tokensUsed: number }> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({
    apiKey: process.env["ANTHROPIC_API_KEY"],
    timeout: AI_CALL_TIMEOUT_MS,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: options.maxTokens ?? 4096,
    system: options.systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock?.type === "text" ? textBlock.text : "";

  return {
    text,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}

/**
 * Direct API call with Anthropic's built-in web_search tool enabled.
 * Used for research jobs on Vercel where the Agent SDK is not available.
 * The model autonomously searches the web and returns results as text.
 */
async function queryDirectAPIWithSearch(
  prompt: string,
  options: { systemPrompt?: string; maxTokens?: number } = {}
): Promise<{ text: string; tokensUsed: number }> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({
    apiKey: process.env["ANTHROPIC_API_KEY"],
    timeout: AI_CALL_TIMEOUT_MS,
  });

  const response = await (client.beta.messages.create as Function)({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: options.maxTokens ?? 4096,
    ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: prompt }],
    betas: ["web-search-2025-03-05"],
  });

  const textBlocks = (response.content as Array<{ type: string; text?: string }>)
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "");
  const text = textBlocks.join("\n").trim();

  return {
    text,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}

// ---------------------------------------------------------------------------
// ClaudeClient class
// ---------------------------------------------------------------------------

export class ClaudeClient {
  constructor() {
    const hasApiKey = !!process.env["ANTHROPIC_API_KEY"];
    const hasOAuthToken = !!process.env["CLAUDE_CODE_OAUTH_TOKEN"];

    if (!hasApiKey && !hasOAuthToken) {
      console.error(
        "[ClaudeClient] CRITICAL: Neither ANTHROPIC_API_KEY nor CLAUDE_CODE_OAUTH_TOKEN is set."
      );
    }

    console.log("[ClaudeClient] Initialized", {
      method: hasOAuthToken && !hasApiKey ? "agent-sdk (Max subscription, $0)" : "direct_api",
      hasApiKey,
      hasOAuthToken,
    });
  }

  // ---------------------------------------------------------------------------
  // Core execution
  // ---------------------------------------------------------------------------

  async run(
    prompt: string,
    options: {
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
      allowedTools?: string[];
      useWebSearch?: boolean;
    } = {}
  ): Promise<ExecutionResult<string>> {
    const start = Date.now();

    try {
      let text: string;
      let tokensUsed: number | undefined;

      const useDirectAPI = !!process.env["ANTHROPIC_API_KEY"];

      if (useDirectAPI) {
        if (options.useWebSearch) {
          const result = await queryDirectAPIWithSearch(prompt, options);
          text = result.text;
          tokensUsed = result.tokensUsed;
        } else {
          const result = await queryDirectAPI(prompt, options);
          text = result.text;
          tokensUsed = result.tokensUsed;
        }
      } else {
        // Agent SDK via bundled cli.js (Max subscription, $0)
        text = await withTimeout(
          queryViaAgentSDK(prompt, options.systemPrompt, options.allowedTools),
          AI_CALL_TIMEOUT_MS,
          "claude-agent-sdk"
        );
      }

      return {
        success: true,
        data: text,
        model: ModelChoice.CLAUDE,
        jobType: JobType.CONTENT_GENERATION,
        tokensUsed,
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

  async runWithTools(
    prompt: string,
    _tools: unknown[],
    options: {
      systemPrompt?: string;
      maxTokens?: number;
      maxIterations?: number;
    } = {}
  ): Promise<ExecutionResult<string>> {
    // Agent SDK handles tools internally; for direct API this is a basic call
    return this.run(prompt, options);
  }

  // ---------------------------------------------------------------------------
  // Mission Planning
  // ---------------------------------------------------------------------------

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

CRITICAL — PLATFORM AND JOB TYPE RULES:
- When the user mentions a platform (TikTok, Instagram, YouTube, LinkedIn, X/Twitter), set "platform" to the correct value
- Platform enum values: "x", "linkedin", "instagram", "tiktok", "youtube", "email", "generic"
- For TikTok reels, Instagram reels, YouTube shorts → use type "script_generation" (NOT "content_generation")
- For Twitter/X threads → use type "thread_generation"
- For Instagram/TikTok captions → use type "caption_generation"
- For regular posts → use type "content_generation"
- For video scripts, include "durationSeconds" (e.g. 30, 45, 60, 90)
- The safety_review job should use the SAME platform as the content it reviews

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
      "dependsOn": [],
      "modelRecommendation": "claude" | "gpt5_nano",
      "platform": "<platform enum value — REQUIRED for content/script/caption/safety jobs>",
      "durationSeconds": <number — REQUIRED for script_generation jobs>
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
        maxTokens: 4096,
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

  async research(
    query: string,
    options: { depth?: "surface" | "deep"; format?: "bullet" | "paragraph" | "structured" } = {}
  ): Promise<ExecutionResult<string>> {
    const systemPrompt = `You are a professional market researcher and trend analyst.
Search the web for real, current information. Produce factual, actionable research with sources.
Format: ${options.format ?? "structured"}
Depth: ${options.depth ?? "deep"}`;

    return this.run(`Research the following using live web search: ${query}`, {
      systemPrompt,
      maxTokens: 4096,
      // Agent SDK path: grant WebSearch permission without prompting
      allowedTools: ["WebSearch"],
      // Direct API path: use Anthropic's built-in web_search tool
      useWebSearch: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Safety Review
  // ---------------------------------------------------------------------------

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

  healthCheck(): "ok" | "missing_token" {
    return (process.env["ANTHROPIC_API_KEY"] || process.env["CLAUDE_CODE_OAUTH_TOKEN"])
      ? "ok"
      : "missing_token";
  }
}

// Singleton
let _clientInstance: ClaudeClient | null = null;

export function getClaudeClient(): ClaudeClient {
  if (!_clientInstance) {
    _clientInstance = new ClaudeClient();
  }
  return _clientInstance;
}
