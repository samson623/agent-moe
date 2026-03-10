/**
 * Video Package Operator — Content Strike Team Video Specialist
 *
 * Produces complete short-form video packages: hook, scene breakdown,
 * thumbnail concept, caption, and CTA — all in one structured output.
 *
 * MODEL STRATEGY:
 * - generateVideoPackage → Claude (heavy creative reasoning, structured output)
 * - generateHookVariants → GPT-5 Nano (light, fast, high-volume variant generation)
 * - refineThumbnailConcept → Claude (nuanced creative refinement)
 *
 * All outputs are Zod-validated before returning. Confidence scores allow
 * the dashboard to flag low-quality packages for human review.
 */

import "server-only";

import {
  type ExecutionResult,
  type Job,
  JobType,
  ModelChoice,
  OperatorTeam,
} from "@/features/ai/types";
import { BaseOperator } from "@/features/ai/operators/base-operator";
import {
  type ThumbnailConcept,
  type VideoPackageInput,
  type VideoPackageOutput,
  VideoPackageOutputSchema,
} from "./types";

// ---------------------------------------------------------------------------
// Helper: extract + parse JSON from Claude response
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
// VideoPackageOperator
// ---------------------------------------------------------------------------

export class VideoPackageOperator extends BaseOperator {
  constructor() {
    super(OperatorTeam.CONTENT_STRIKE);
    this.log("initialized");
  }

  // ---------------------------------------------------------------------------
  // BaseOperator implementation
  // ---------------------------------------------------------------------------

  getSystemPrompt(): string {
    return `You are the Content Strike Team's Video Specialist — an expert in short-form video content that stops scroll and drives action.

EXPERTISE:
- Platform-native video formats: TikTok (15-60s), Instagram Reels (15-90s), YouTube Shorts (≤60s), X video posts (≤2m20s)
- Hook engineering: visual pattern interrupts, bold text reveals, curiosity gaps in the first 3 seconds
- Scene architecture: one idea per scene, punchy narration, vivid visual direction
- Thumbnail psychology: single dominant emotion, high-contrast text, clear focal point
- CTA strategy: lowest-friction action matched to the platform and content goal

VOICE PRINCIPLES:
- Every video starts with a hook that answers "why should I keep watching?"
- Script narration must sound natural spoken aloud — no academic language
- Visual direction should be concrete and achievable, not abstract
- One CTA only — never split the viewer's attention

OUTPUT REQUIREMENTS:
- Always produce complete, publish-ready packages — no placeholders
- Confidence score (0-1) based on hook strength, scene clarity, and CTA relevance
- Rationale explains what makes this package strong (or where it may need polish)`;
  }

  getSupportedJobTypes(): JobType[] {
    return [JobType.VIDEO_PACKAGE];
  }

  /**
   * Route a job to the appropriate method based on job type.
   */
  async execute(job: Job): Promise<ExecutionResult<unknown>> {
    const start = Date.now();

    if (!this.supportsJob(job.type)) {
      return this.unsupportedJobResult(job, start);
    }

    this.log("executing_job", { jobId: job.id, type: job.type });

    try {
      switch (job.type) {
        case JobType.VIDEO_PACKAGE: {
          const input = job.input as VideoPackageInput;
          return await this.generateVideoPackage(input);
        }

        default:
          return this.unsupportedJobResult(job, start);
      }
    } catch (err) {
      return this.buildErrorResult(err, job.type, ModelChoice.CLAUDE, start);
    }
  }

  // ---------------------------------------------------------------------------
  // Primary generation methods
  // ---------------------------------------------------------------------------

  /**
   * Generate a complete video package: title, hook, scenes, thumbnail, caption, CTA.
   * Claude handles this — it requires multi-step creative reasoning across all components.
   */
  async generateVideoPackage(
    input: VideoPackageInput
  ): Promise<ExecutionResult<VideoPackageOutput>> {
    const start = Date.now();
    const hookCount = input.hook_count ?? 3;
    const sceneCount = input.scene_count ?? 5;

    this.log("generating_video_package", {
      platform: input.platform,
      topic: input.topic,
      hookCount,
      sceneCount,
    });

    const brandRulesSection = input.brand_rules
      ? `BRAND RULES:
- Tone: ${input.brand_rules.tone ?? "not specified"}
- Blocked phrases (never use): ${input.brand_rules.blocked_phrases?.join(", ") || "none"}`
      : "";

    const userPrompt = `Create a complete short-form video package.

TOPIC: ${input.topic}
PLATFORM: ${input.platform}
${input.tone ? `TONE: ${input.tone}` : ""}
${input.targetAudience ? `TARGET AUDIENCE: ${input.targetAudience}` : ""}
${input.linked_offer ? `LINKED OFFER (for CTA): ${input.linked_offer}` : ""}
${brandRulesSection}

REQUIREMENTS:
- Generate exactly ${hookCount} hook variants (primary + ${hookCount - 1} alternates)
- Generate exactly ${sceneCount} scenes
- Scenes must flow logically from hook → body → close
- CTA must match the platform and linked offer (if provided)

Return ONLY valid JSON:
{
  "title": "<video title, optimized for the platform>",
  "platform": "${input.platform}",
  "hook": {
    "primary": "<the strongest hook — first 3 seconds of narration>",
    "variants": ["<alt hook 1>", "<alt hook 2>", ...]
  },
  "scenes": [
    {
      "order": 1,
      "title": "<scene name>",
      "script": "<spoken narration for this scene>",
      "visual_direction": "<what to show on screen — concrete and specific>",
      "duration_seconds": <estimated seconds for this scene>
    }
  ],
  "thumbnail_concept": {
    "headline": "<big thumbnail text — 2-5 words max>",
    "visual_description": "<what image or scene to use as the background>",
    "color_scheme": "<e.g. Dark navy with bright yellow accent>",
    "text_overlay": "<any additional text overlays beyond the headline>"
  },
  "caption": "<platform-native caption with relevant hashtags>",
  "cta": {
    "text": "<the exact CTA narration>",
    "type": "subscribe" | "link_in_bio" | "dm" | "comment" | "visit" | "buy",
    "destination": "<optional URL or destination>"
  },
  "confidence_score": <0.0-1.0>,
  "rationale": "<brief explanation of what makes this package strong>"
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 3000,
      });

      if (!result.success) {
        return {
          ...result,
          jobType: JobType.VIDEO_PACKAGE,
        } as ExecutionResult<VideoPackageOutput>;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));
      const validated = this.validateOutput(parsed, VideoPackageOutputSchema);

      this.log("video_package_generated", {
        platform: input.platform,
        confidence: validated.confidence_score,
        sceneCount: validated.scenes.length,
        hookVariants: validated.hook.variants.length,
      });

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.VIDEO_PACKAGE,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.VIDEO_PACKAGE, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Generate hook text variants using GPT-5 Nano.
   * Fast, cheap, high-volume — ideal for rapid A/B iteration on hooks.
   */
  async generateHookVariants(
    topic: string,
    platform: string,
    count = 3
  ): Promise<string[]> {
    this.log("generating_hook_variants", { topic, platform, count });

    const prompt = `Hook variants for a ${platform} video about: "${topic}". Generate ${count} distinct opening hooks (first 3 seconds of narration) that stop scroll.`;

    const result = await this.openai.generateVariants(prompt, count);

    if (!result.success) {
      this.log("hook_variants_failed", { error: result.error.code });
      return [];
    }

    return result.data.variants;
  }

  /**
   * Refine an existing thumbnail concept based on user feedback.
   * Claude handles this — creative refinement requires contextual reasoning.
   * On any error, returns the original concept unchanged.
   */
  async refineThumbnailConcept(
    existing: ThumbnailConcept,
    feedback: string
  ): Promise<ThumbnailConcept> {
    this.log("refining_thumbnail_concept", { feedback });

    const userPrompt = `Refine this thumbnail concept based on the feedback provided.

EXISTING THUMBNAIL CONCEPT:
- Headline: "${existing.headline}"
- Visual description: "${existing.visual_description}"
- Color scheme: "${existing.color_scheme}"
- Text overlay: "${existing.text_overlay}"

FEEDBACK:
${feedback}

Return ONLY valid JSON with the improved concept:
{
  "headline": "<revised or unchanged>",
  "visual_description": "<revised or unchanged>",
  "color_scheme": "<revised or unchanged>",
  "text_overlay": "<revised or unchanged>"
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 512,
      });

      if (!result.success) {
        this.log("thumbnail_refinement_failed", { error: result.error.code });
        return existing;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));

      // Validate the refined concept shape before returning
      const refined = parsed as Record<string, unknown>;

      if (
        typeof refined["headline"] !== "string" ||
        typeof refined["visual_description"] !== "string" ||
        typeof refined["color_scheme"] !== "string" ||
        typeof refined["text_overlay"] !== "string"
      ) {
        this.log("thumbnail_refinement_invalid_shape", {});
        return existing;
      }

      const concept: ThumbnailConcept = {
        headline: refined["headline"],
        visual_description: refined["visual_description"],
        color_scheme: refined["color_scheme"],
        text_overlay: refined["text_overlay"],
      };

      this.log("thumbnail_concept_refined", { headline: concept.headline });

      return concept;
    } catch (err) {
      this.log("thumbnail_refinement_error", {
        error: err instanceof Error ? err.message : "unknown",
      });
      return existing;
    }
  }
}
