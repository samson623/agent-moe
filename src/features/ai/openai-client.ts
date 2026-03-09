/**
 * OpenAI Client — GPT-5 Nano Wrapper
 *
 * Handles all light, high-volume, low-cost tasks.
 * Current model: "gpt-4o-mini" — same cost profile as the forthcoming gpt-5-nano.
 * When gpt-5-nano is released, update GPT_NANO_MODEL below.
 *
 * Cost profile: ~$0.00025 per typical task (0.15/1M input, 0.60/1M output for gpt-4o-mini).
 *
 * These tasks are intentionally simple:
 * - No tool use (Claude handles tool-using tasks)
 * - Single turn (prompt → response)
 * - Structured JSON output via response_format
 * - High-volume friendly (scoring, tagging, formatting batches)
 */

import OpenAI from "openai";
import { z } from "zod";
import {
  type AIError,
  AIErrorCode,
  type ExecutionResult,
  JobType,
  ModelChoice,
  type Platform,
} from "@/features/ai/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * GPT-5 Nano stand-in.
 * Update to "gpt-5-nano" when it becomes available on the OpenAI API.
 */
const GPT_NANO_MODEL = process.env["OPENAI_NANO_MODEL"] ?? "gpt-4o-mini";

const DEFAULT_MAX_TOKENS = 1024;

// ---------------------------------------------------------------------------
// Zod schemas for OpenAI structured outputs
// ---------------------------------------------------------------------------

const ScoreOutputSchema = z.object({
  score: z.number().min(0).max(1),
  reasoning: z.string(),
});

const ClassifyOutputSchema = z.object({
  category: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

const VariantsOutputSchema = z.object({
  variants: z.array(z.string()),
});

const TagsOutputSchema = z.object({
  tags: z.array(z.string()),
});

const SummaryOutputSchema = z.object({
  summary: z.string(),
});

const FormattedContentOutputSchema = z.object({
  formattedContent: z.string(),
  changesSummary: z.string(),
});

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------

function buildAIError(err: unknown, fallbackCode = AIErrorCode.UPSTREAM_ERROR): AIError {
  if (err instanceof OpenAI.APIError) {
    const code =
      err.status === 401
        ? AIErrorCode.AUTH_FAILED
        : err.status === 429
          ? AIErrorCode.RATE_LIMITED
          : AIErrorCode.UPSTREAM_ERROR;

    return {
      code,
      message: err.message,
      retryable: err.status === 429 || err.status >= 500,
      details: { status: err.status },
    };
  }

  if (err instanceof Error && err.name === "ZodError") {
    return {
      code: AIErrorCode.SCHEMA_VALIDATION_FAILED,
      message: err.message,
      retryable: false,
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
    message: "Unknown OpenAI client error",
    retryable: false,
  };
}

// ---------------------------------------------------------------------------
// Internal helper for JSON chat completion
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// OpenAIClient class
// ---------------------------------------------------------------------------

export class OpenAIClient {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env["OPENAI_API_KEY"];

    if (!apiKey) {
      console.error(
        "[OpenAIClient] CRITICAL: OPENAI_API_KEY is not set. " +
          "All GPT-5 Nano calls will fail. Set OPENAI_API_KEY in .env.local."
      );
    }

    this.client = new OpenAI({
      apiKey: apiKey ?? "missing-key",
    });

    this.model = GPT_NANO_MODEL;

    console.log("[OpenAIClient] Initialized", {
      model: this.model,
      apiKeyConfigured: !!apiKey,
    });
  }

  // ---------------------------------------------------------------------------
  // Core private helper
  // ---------------------------------------------------------------------------

  /**
   * Run a single JSON-output chat completion.
   * All public methods delegate here.
   */
  private async completeJSON<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodSchema<T>,
    jobType: JobType,
    maxTokens = DEFAULT_MAX_TOKENS
  ): Promise<ExecutionResult<T>> {
    const start = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? "{}";
      const parsed: unknown = JSON.parse(raw);
      const validated = schema.parse(parsed);

      return {
        success: true,
        data: validated,
        model: ModelChoice.GPT5_NANO,
        jobType,
        tokensUsed:
          (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0),
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        error: buildAIError(err),
        model: ModelChoice.GPT5_NANO,
        jobType,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Public methods
  // ---------------------------------------------------------------------------

  /**
   * Score a piece of text against given criteria.
   * Returns a normalized 0-1 score with reasoning.
   *
   * Usage: topic scoring, confidence scoring, opportunity scoring.
   */
  async score(
    text: string,
    criteria: string
  ): Promise<ExecutionResult<{ score: number; reasoning: string }>> {
    const systemPrompt = `You are a precise scoring system. Score content against criteria.
Always respond with valid JSON: {"score": <0.0-1.0>, "reasoning": "<brief explanation>"}`;

    const userPrompt = `Score the following text against the criteria.

TEXT:
${text}

CRITERIA:
${criteria}

Respond with JSON only.`;

    return this.completeJSON(
      systemPrompt,
      userPrompt,
      ScoreOutputSchema,
      JobType.TOPIC_SCORING
    );
  }

  /**
   * Classify text into one of the provided categories.
   * Returns the best-fit category with confidence.
   *
   * Usage: content classification, tag assignment pre-work.
   */
  async classify(
    text: string,
    categories: string[]
  ): Promise<ExecutionResult<{ category: string; confidence: number; reasoning: string }>> {
    const systemPrompt = `You are a text classification system.
Classify the input into exactly one of the provided categories.
Respond with valid JSON: {"category": "<one of the categories>", "confidence": <0.0-1.0>, "reasoning": "<brief>"}`;

    const userPrompt = `Classify this text:

TEXT:
${text}

CATEGORIES: ${categories.join(", ")}

Pick exactly one. Respond with JSON only.`;

    return this.completeJSON(
      systemPrompt,
      userPrompt,
      ClassifyOutputSchema,
      JobType.CONTENT_CLASSIFICATION
    );
  }

  /**
   * Generate N variants of a given text.
   * Returns an array of string variants.
   *
   * Usage: CTA variant generation, headline variants, A/B test copy.
   */
  async generateVariants(
    text: string,
    count: number
  ): Promise<ExecutionResult<{ variants: string[] }>> {
    const systemPrompt = `You are a copywriting variation engine.
Generate ${count} distinct variants of the given text.
Each variant should be meaningfully different in structure or angle.
Respond with valid JSON: {"variants": ["<variant1>", "<variant2>", ...]}`;

    const userPrompt = `Generate ${count} variants of:

"${text}"

Respond with JSON only.`;

    return this.completeJSON(
      systemPrompt,
      userPrompt,
      VariantsOutputSchema,
      JobType.CTA_GENERATION,
      Math.min(count * 200 + 100, 2048) // scale tokens with count
    );
  }

  /**
   * Format content for a specific platform.
   * Handles character limits, platform conventions, line breaks, etc.
   *
   * Usage: adapting content to platform specs before publishing.
   */
  async formatContent(
    content: string,
    targetPlatform: Platform
  ): Promise<ExecutionResult<{ formattedContent: string; changesSummary: string }>> {
    const platformRules: Record<string, string> = {
      x: "Max 280 characters. Punchy. No unnecessary filler. Hashtags at end if used.",
      linkedin: "Professional tone. Up to 3000 chars. Line breaks for readability. Hook in first line.",
      instagram: "Engaging caption. Up to 2200 chars. Hashtags at end. Emojis welcome.",
      tiktok: "Energetic. Short. Hook in first 3 words. Trending hashtags.",
      youtube: "Descriptive. SEO-friendly title and description structure.",
      email: "Subject line under 60 chars. Personalized opener. Clear CTA.",
      generic: "Clear, concise, professional.",
    };

    const systemPrompt = `You are a content formatting specialist for social media platforms.
Format content precisely for the target platform's requirements.
Respond with valid JSON: {"formattedContent": "<formatted>", "changesSummary": "<what changed>"}`;

    const userPrompt = `Format this content for ${targetPlatform}:

CONTENT:
${content}

PLATFORM RULES:
${platformRules[targetPlatform] ?? platformRules["generic"]}

Respond with JSON only.`;

    return this.completeJSON(
      systemPrompt,
      userPrompt,
      FormattedContentOutputSchema,
      JobType.CONTENT_FORMATTING
    );
  }

  /**
   * Summarize a status or data payload into a concise human-readable string.
   *
   * Usage: mission status updates, job completion summaries, activity log entries.
   */
  async summarize(data: string): Promise<ExecutionResult<{ summary: string }>> {
    const systemPrompt = `You are a status summarization engine.
Convert data or verbose text into a concise 1-3 sentence summary.
Respond with valid JSON: {"summary": "<concise summary>"}`;

    const userPrompt = `Summarize this:

${data}

Respond with JSON only.`;

    return this.completeJSON(
      systemPrompt,
      userPrompt,
      SummaryOutputSchema,
      JobType.STATUS_SUMMARY,
      512
    );
  }

  /**
   * Extract semantic tags from content.
   * Returns an array of lowercase tag strings.
   *
   * Usage: tagging assets for search/filter, auto-categorization.
   */
  async extractTags(content: string): Promise<ExecutionResult<{ tags: string[] }>> {
    const systemPrompt = `You are a content tagging engine.
Extract 3-10 relevant tags from content. Tags should be lowercase, single words or hyphenated phrases.
Respond with valid JSON: {"tags": ["<tag1>", "<tag2>", ...]}`;

    const userPrompt = `Extract tags from:

${content}

Respond with JSON only.`;

    return this.completeJSON(
      systemPrompt,
      userPrompt,
      TagsOutputSchema,
      JobType.TAG_ASSIGNMENT,
      256
    );
  }

  // ---------------------------------------------------------------------------
  // Health check
  // ---------------------------------------------------------------------------

  /**
   * Verify the API key is configured (does not make an API call).
   */
  healthCheck(): "ok" | "missing_key" {
    return process.env["OPENAI_API_KEY"] ? "ok" : "missing_key";
  }
}

// Singleton — one client per server process.
let _clientInstance: OpenAIClient | null = null;

export function getOpenAIClient(): OpenAIClient {
  if (!_clientInstance) {
    _clientInstance = new OpenAIClient();
  }
  return _clientInstance;
}
