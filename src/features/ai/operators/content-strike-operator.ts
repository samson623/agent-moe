/**
 * Content Strike Team — Primary Content Generation Operator
 *
 * This operator is the creative engine of AGENT MOE. It specializes in producing
 * publish-ready content across all major social platforms.
 *
 * CAPABILITIES:
 * - Single platform posts (X, LinkedIn, Instagram, TikTok, YouTube)
 * - Twitter/X threads (10-15 tweets with hooks and CTAs)
 * - Short-form video scripts (hook → body → CTA)
 * - Platform-native captions with hashtag strategy
 * - CTA variant sets for A/B testing
 * - Cross-platform content repurposing
 *
 * MODEL STRATEGY:
 * - All content generation → Claude (free via Max subscription)
 * - CTA variant generation → GPT-5 Nano (cheap, high-volume)
 * - Content formatting → GPT-5 Nano
 *
 * Every output is Zod-validated before returning. Confidence scores are included
 * so the dashboard can highlight weak content for review.
 */

import {
  type BrandRules,
  type CaptionJobInput,
  type ContentJobInput,
  type ContentOutput,
  ContentOutputSchema,
  AIErrorCode,
  type CTAOutput,
  type ExecutionResult,
  type FormattingJobInput,
  type Job,
  JobType,
  ModelChoice,
  OperatorTeam,
  Platform,
  type ScriptJobInput,
  type ScriptOutput,
  ScriptOutputSchema,
  type ThreadJobInput,
  type ThreadOutput,
  ThreadOutputSchema,
} from "@/features/ai/types";
import { BaseOperator } from "@/features/ai/operators/base-operator";
import { normalizePlatformFields } from "@/features/ai/utils/platform-normalization";

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
// Content Strike Operator
// ---------------------------------------------------------------------------

export class ContentStrikeOperator extends BaseOperator {
  constructor() {
    super(OperatorTeam.CONTENT_STRIKE);
    this.log("initialized");
  }

  // ---------------------------------------------------------------------------
  // BaseOperator implementation
  // ---------------------------------------------------------------------------

  getSystemPrompt(): string {
    return `You are the Content Strike Team AI — an elite social media content creator with deep expertise in platform algorithms, viral content structures, and audience psychology.

EXPERTISE:
- Platform-native formats: X threads, LinkedIn thought leadership, Instagram carousels, TikTok scripts, YouTube descriptions
- Hook engineering: pattern interrupts, open loops, curiosity gaps, bold claims, relatable truths
- Viral content structures: list posts, story arcs, controversy + resolution, teaching frameworks
- Algorithm knowledge: X engagement signals, LinkedIn dwell time, Instagram save rates, TikTok completion rates
- Copywriting frameworks: AIDA, PAS, FAB, StoryBrand, 4Ps

VOICE PRINCIPLES:
- Always lead with the hook — first line is the entire battle
- Write like you're talking to one specific person
- Specificity beats generality every time (say "47%" not "many")
- Create desire before introducing offer
- End with a clear next action

OUTPUT REQUIREMENTS:
- Always produce complete, publish-ready content — no placeholders
- Include character counts for platform compliance
- Provide confidence scores (0-1) based on content quality assessment
- Add platform-specific algorithm notes
- Suggest hashtag strategy when relevant

PLATFORM CHARACTER LIMITS:
- X post: 280 chars | X thread tweet: 280 chars each
- LinkedIn post: 3000 chars (algorithm loves 1300-1900)
- Instagram caption: 2200 chars (hook in first 125 chars)
- TikTok caption: 150 chars
- YouTube description: 5000 chars

CONTENT QUALITY SIGNALS:
- Strong hook (pattern interrupt or curiosity gap): +0.2 confidence
- Specific numbers/data points: +0.1 confidence
- Clear CTA: +0.1 confidence
- Platform-native format: +0.1 confidence
- Coherent narrative arc: +0.1 confidence

KNOWLEDGE BASE INTEGRATION:
- Apply copywriting frameworks from Doctrine §4.1 (AIDA, PAS, BAB, 4Ps, QUEST) — match framework to audience awareness level
- Use headline formulas from Doctrine §4.4 — 10 highest-converting patterns
- Follow content pillar strategy from Doctrine §4.3 — 70% planned, 20% reactive, 10% experimental
- Repurpose using the 1→12+ pyramid from Doctrine §4.3
- Check platform benchmarks from Benchmarks before setting confidence targets
- When generating content for a playbook mission, follow the Content Strike contract in the matched playbook`;
  }

  getSupportedJobTypes(): JobType[] {
    return [
      JobType.CONTENT_GENERATION,
      JobType.THREAD_GENERATION,
      JobType.SCRIPT_GENERATION,
      JobType.CAPTION_GENERATION,
      JobType.CTA_GENERATION,
      JobType.CONTENT_REPURPOSING,
      JobType.CONTENT_FORMATTING,
    ];
  }

  /**
   * Route a job to the appropriate method based on job type and input kind.
   */
  async execute(job: Job): Promise<ExecutionResult<unknown>> {
    const start = Date.now();

    if (!this.supportsJob(job.type)) {
      return this.unsupportedJobResult(job, start);
    }

    this.log("executing_job", { jobId: job.id, type: job.type });

    try {
      switch (job.type) {
        case JobType.CONTENT_GENERATION: {
          const input = job.input as ContentJobInput;
          return await this.generatePost({ ...input, jobId: job.id });
        }

        case JobType.THREAD_GENERATION: {
          const input = job.input as ThreadJobInput;
          return await this.generateThread({ ...input, jobId: job.id });
        }

        case JobType.SCRIPT_GENERATION: {
          const input = job.input as ScriptJobInput;
          return await this.generateScript({ ...input, jobId: job.id });
        }

        case JobType.CAPTION_GENERATION: {
          const input = job.input as CaptionJobInput;
          return await this.generateCaption({ ...input, jobId: job.id });
        }

        case JobType.CTA_GENERATION: {
          const input = job.input as ContentJobInput;
          return await this.generateCTA({ ...input, jobId: job.id });
        }

        case JobType.CONTENT_REPURPOSING: {
          const input = job.input as ContentJobInput;
          return await this.repurposeContent({ ...input, jobId: job.id });
        }

        case JobType.CONTENT_FORMATTING: {
          const input = job.input as FormattingJobInput;
          return await this.openai.formatContent(input.content, input.targetPlatform);
        }

        default:
          return this.unsupportedJobResult(job, start);
      }
    } catch (err) {
      return this.buildErrorResult(err, job.type, ModelChoice.CLAUDE, start);
    }
  }

  // ---------------------------------------------------------------------------
  // Content generation methods
  // ---------------------------------------------------------------------------

  /**
   * Generate a single platform post.
   * Claude handles this — it's the primary content creation task.
   */
  async generatePost(
    input: ContentJobInput & { jobId?: string }
  ): Promise<ExecutionResult<ContentOutput>> {
    const start = Date.now();
    this.log("generating_post", { platform: input.platform, topic: input.topic });

    const userPrompt = `Generate a ${input.platform} post.

TOPIC: ${input.topic}
PLATFORM: ${input.platform}
${input.tone ? `TONE: ${input.tone}` : ""}
${input.offerContext ? `OFFER CONTEXT: ${input.offerContext}` : ""}
${input.keywords?.length ? `KEYWORDS TO INCLUDE: ${input.keywords.join(", ")}` : ""}
${input.brandRules ? this.formatBrandRulesPrompt(input.brandRules) : ""}

Return ONLY valid JSON:
{
  "platform": "${input.platform}",
  "contentType": "post",
  "body": "<complete post content, publish-ready>",
  "hook": "<the opening hook line>",
  "hashtags": ["<tag1>", "<tag2>"],
  "characterCount": <number>,
  "confidenceScore": <0.0-1.0>,
  "metadata": {
    "toneUsed": "<tone applied>",
    "estimatedReach": "<low|medium|high>",
    "algorithmNotes": "<platform algorithm tip>",
    "revisionSuggestions": ["<optional>"]
  }
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 1024,
      });

      if (!result.success) {
        return {
          ...result,
          jobType: JobType.CONTENT_GENERATION,
        } as ExecutionResult<ContentOutput>;
      }

      const parsed: unknown = normalizePlatformFields(
        JSON.parse(extractJSON(result.data))
      );
      const validated = this.validateOutput(parsed, ContentOutputSchema);

      this.log("post_generated", {
        platform: input.platform,
        confidence: validated.confidenceScore,
        chars: validated.characterCount,
      });

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
      return this.buildErrorResult(err, JobType.CONTENT_GENERATION, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Generate a Twitter/X thread (10-15 tweets).
   * Each tweet is independently crafted but part of a cohesive narrative.
   */
  async generateThread(
    input: ThreadJobInput & { jobId?: string }
  ): Promise<ExecutionResult<ThreadOutput>> {
    const start = Date.now();
    const targetCount = input.targetTweetCount ?? 12;
    this.log("generating_thread", { topic: input.topic, tweetCount: targetCount });

    const hookStyleGuide: Record<string, string> = {
      question: "Start with a provocative question that creates instant curiosity",
      statement: "Open with a bold, confident claim that challenges conventional wisdom",
      controversial: "Lead with a counterintuitive take that stops the scroll",
      listicle: 'Tease the list upfront: "X things about [topic] most people get wrong"',
    };

    const hookInstruction =
      input.hookStyle ? hookStyleGuide[input.hookStyle] : hookStyleGuide["statement"];

    const userPrompt = `Write a ${targetCount}-tweet X/Twitter thread.

TOPIC: ${input.topic}
HOOK STYLE: ${hookInstruction ?? hookStyleGuide["statement"]}
${input.offerContext ? `OFFER TO WEAVE IN: ${input.offerContext}` : ""}
${input.brandRules ? this.formatBrandRulesPrompt(input.brandRules) : ""}

RULES:
- Each tweet MUST be ≤280 characters
- Tweet 1 = the hook (makes people want to read all ${targetCount})
- Tweets 2-${targetCount - 1} = the value (one insight per tweet)
- Tweet ${targetCount} = strong CTA
- Number each tweet: "1/${targetCount}", "2/${targetCount}", etc.

Return ONLY valid JSON:
{
  "tweets": [
    {"index": 1, "body": "<tweet 1 text with numbering>", "characterCount": <number>},
    ...
  ],
  "totalCharacters": <total across all tweets>,
  "threadHook": "<the exact hook tweet>",
  "threadCTA": "<the exact CTA tweet>",
  "confidenceScore": <0.0-1.0>
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 3000,
      });

      if (!result.success) {
        return {
          ...result,
          jobType: JobType.THREAD_GENERATION,
        } as ExecutionResult<ThreadOutput>;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));
      const validated = this.validateOutput(parsed, ThreadOutputSchema);

      this.log("thread_generated", {
        tweetCount: validated.tweets.length,
        confidence: validated.confidenceScore,
      });

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.THREAD_GENERATION,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.THREAD_GENERATION, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Generate a short-form video script with timecoded sections.
   * Structure: Hook (0-3s) → Body (scenes) → CTA (final 5s)
   */
  async generateScript(
    input: ScriptJobInput & { jobId?: string }
  ): Promise<ExecutionResult<ScriptOutput>> {
    const start = Date.now();
    const duration = input.durationSeconds ?? 60;
    this.log("generating_script", { platform: input.platform, duration });

    const userPrompt = `Write a ${duration}-second video script for ${input.platform}.

TOPIC: ${input.topic}
${input.hookGoal ? `HOOK GOAL: ${input.hookGoal}` : ""}
${input.offerContext ? `OFFER: ${input.offerContext}` : ""}
${input.brandRules ? this.formatBrandRulesPrompt(input.brandRules) : ""}

SCRIPT STRUCTURE:
- Hook (0-3s): Pattern interrupt, bold claim, or question that STOPS the scroll
- Body (scenes): One insight per 10-15 seconds, visually dynamic
- CTA (last 5s): One clear action

THUMBNAIL: Suggest a compelling thumbnail concept.
CAPTION: Write a platform-appropriate caption.

Return ONLY valid JSON:
{
  "platform": "${input.platform}",
  "durationSeconds": ${duration},
  "hook": "<the exact hook narration, 0-3 seconds>",
  "body": [
    {"timecode": "0:03", "narration": "<narration text>", "visualNote": "<what to show on screen>"},
    ...
  ],
  "cta": "<the exact CTA narration, last 5 seconds>",
  "thumbnailSuggestion": "<thumbnail concept description>",
  "captionSuggestion": "<platform caption with hashtags>",
  "confidenceScore": <0.0-1.0>
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 2048,
      });

      if (!result.success) {
        return {
          ...result,
          jobType: JobType.SCRIPT_GENERATION,
        } as ExecutionResult<ScriptOutput>;
      }

      const parsed: unknown = normalizePlatformFields(
        JSON.parse(extractJSON(result.data))
      );
      const validated = this.validateOutput(parsed, ScriptOutputSchema);

      this.log("script_generated", {
        platform: input.platform,
        confidence: validated.confidenceScore,
        sections: validated.body.length,
      });

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.SCRIPT_GENERATION,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.SCRIPT_GENERATION, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Generate an Instagram or TikTok caption with hashtag strategy.
   */
  async generateCaption(
    input: CaptionJobInput & { jobId?: string }
  ): Promise<ExecutionResult<ContentOutput>> {
    const start = Date.now();
    const hashtagCount = input.hashtagCount ?? 10;
    this.log("generating_caption", { platform: input.platform });

    const platformLimit = input.platform === Platform.INSTAGRAM ? 2200 : 150;

    const userPrompt = `Write a ${input.platform} caption.

TOPIC: ${input.topic}
${input.imageDescription ? `IMAGE DESCRIPTION: ${input.imageDescription}` : ""}
HASHTAG COUNT: ${hashtagCount}
CHARACTER LIMIT: ${platformLimit}
${input.brandRules ? this.formatBrandRulesPrompt(input.brandRules) : ""}

CAPTION RULES:
${input.platform === Platform.INSTAGRAM
  ? `- Hook in first 125 chars (before "more..." cutoff)
- Conversational body with line breaks
- ${hashtagCount} relevant hashtags at the very end
- Mix of niche (#specific) and broad (#general) hashtags`
  : `- Max 150 chars total including hashtags
- Punchy and energetic
- 3-5 trending hashtags`}

Return ONLY valid JSON:
{
  "platform": "${input.platform}",
  "contentType": "caption",
  "body": "<complete caption with hashtags>",
  "hook": "<first 125 chars>",
  "hashtags": ["<tag1>", ...],
  "characterCount": <number>,
  "confidenceScore": <0.0-1.0>,
  "metadata": {
    "toneUsed": "<tone>",
    "algorithmNotes": "<save rate / completion note>"
  }
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 1024,
      });

      if (!result.success) {
        return {
          ...result,
          jobType: JobType.CAPTION_GENERATION,
        } as ExecutionResult<ContentOutput>;
      }

      const parsed: unknown = normalizePlatformFields(
        JSON.parse(extractJSON(result.data))
      );
      const validated = this.validateOutput(parsed, ContentOutputSchema);

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.CAPTION_GENERATION,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.CAPTION_GENERATION, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Generate 3 CTA variants using GPT-5 Nano.
   * This is a high-volume, cheap task — perfect for Nano.
   */
  async generateCTA(
    input: ContentJobInput & { jobId?: string }
  ): Promise<ExecutionResult<CTAOutput>> {
    const start = Date.now();
    this.log("generating_cta_variants", { platform: input.platform });

    // Use GPT-5 Nano for variant generation — cheap + fast
    const ctaText = `Call to action for: ${input.topic}. Platform: ${input.platform}. ${input.offerContext ? `Offer: ${input.offerContext}` : ""}`;

    const variantsResult = await this.openai.generateVariants(ctaText, 3);

    if (!variantsResult.success) {
      return {
        ...variantsResult,
        jobType: JobType.CTA_GENERATION,
      } as ExecutionResult<CTAOutput>;
    }

    // Shape into CTAOutput
    const ctaStyles: Array<"soft" | "direct" | "urgency" | "curiosity"> = [
      "soft",
      "direct",
      "urgency",
    ];

    const ctaOutput: CTAOutput = {
      variants: variantsResult.data.variants.map((text, i) => ({
        text,
        style: ctaStyles[i] ?? "direct",
        platform: input.platform,
      })),
      recommendedVariant: 1, // middle variant as default recommendation
      rationale: "Variant 2 (direct) typically performs best for conversion-focused content.",
    };

    this.log("cta_variants_generated", { count: ctaOutput.variants.length });

    return {
      success: true,
      data: ctaOutput,
      model: ModelChoice.GPT5_NANO,
      jobType: JobType.CTA_GENERATION,
      tokensUsed: variantsResult.tokensUsed,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Repurpose existing content for a new platform.
   * Takes content from one platform and adapts it to another's format and norms.
   */
  async repurposeContent(
    input: ContentJobInput & { jobId?: string }
  ): Promise<ExecutionResult<ContentOutput>> {
    const start = Date.now();
    this.log("repurposing_content", { targetPlatform: input.platform });

    if (!input.existingContent) {
      return {
        success: false,
        error: {
          code: AIErrorCode.UPSTREAM_ERROR,
          message: "repurposeContent requires existingContent in job input",
          retryable: false,
        },
        model: ModelChoice.CLAUDE,
        jobType: JobType.CONTENT_REPURPOSING,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }

    const userPrompt = `Repurpose this content for ${input.platform}.

ORIGINAL CONTENT:
${input.existingContent}

TARGET PLATFORM: ${input.platform}
${input.tone ? `TARGET TONE: ${input.tone}` : ""}
${input.brandRules ? this.formatBrandRulesPrompt(input.brandRules) : ""}

REPURPOSING RULES:
- Preserve the core insight and value
- Adapt format completely to ${input.platform} norms
- Rewrite the hook for ${input.platform} algorithm
- Adjust length and structure for platform
- This is NOT a copy-paste — it's a native rewrite

Return ONLY valid JSON matching the ContentOutput schema:
{
  "platform": "${input.platform}",
  "contentType": "post",
  "body": "<repurposed content>",
  "hook": "<new platform-native hook>",
  "hashtags": ["<tags if applicable>"],
  "characterCount": <number>,
  "confidenceScore": <0.0-1.0>,
  "metadata": {
    "toneUsed": "<tone>",
    "algorithmNotes": "<platform tip>",
    "revisionSuggestions": []
  }
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 1024,
      });

      if (!result.success) {
        return {
          ...result,
          jobType: JobType.CONTENT_REPURPOSING,
        } as ExecutionResult<ContentOutput>;
      }

      const parsed: unknown = normalizePlatformFields(
        JSON.parse(extractJSON(result.data))
      );
      const validated = this.validateOutput(parsed, ContentOutputSchema);

      return {
        success: true,
        data: validated,
        model: ModelChoice.CLAUDE,
        jobType: JobType.CONTENT_REPURPOSING,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return this.buildErrorResult(err, JobType.CONTENT_REPURPOSING, ModelChoice.CLAUDE, start);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private formatBrandRulesPrompt(rules: BrandRules): string {
    return `BRAND RULES:
- Allowed tones: ${rules.allowedTone.join(", ")}
- Blocked phrases (never use): ${rules.blockedPhrases.join(", ") || "none"}
- Blocked claims (never make): ${rules.blockedClaims.join(", ") || "none"}
${rules.requiresDisclaimer ? `- ADD DISCLAIMER: "${rules.disclaimerText ?? "Results may vary."}"` : ""}`;
  }
}
