/**
 * Brand Guardian — Safety, Compliance & Brand Protection Operator
 *
 * This operator protects the brand from reputational, legal, and tonal risk.
 * It reviews every piece of content before it moves to the approval queue.
 * Firm but fair — it's not a gatekeeper, it's a quality partner.
 *
 * CAPABILITIES:
 * - Full content safety review (risk level + flags)
 * - Tonal alignment check (GPT-5 Nano — fast + cheap)
 * - Risky claim flagging (GPT-5 Nano for initial scan, Claude for deep review)
 * - Brand guideline enforcement with revision suggestions
 *
 * MODEL STRATEGY:
 * - Full safety review → Claude (nuanced reasoning about brand context)
 * - Tone checks → GPT-5 Nano (cheap, deterministic scoring)
 * - Claim flagging → GPT-5 Nano (classification task)
 * - Guideline enforcement → Claude (requires context + revision writing)
 */

import { z } from "zod";
import {
  type BrandRules,
  type ExecutionResult,
  type Job,
  JobType,
  ModelChoice,
  OperatorTeam,
  type Platform,
  RiskLevel,
  type SafetyFlag,
  type SafetyReview,
  SafetyReviewSchema,
  type SafetyReviewJobInput,
  type ToneCheckResult,
} from "@/features/ai/types";
import { BaseOperator } from "@/features/ai/operators/base-operator";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const ToneCheckSchema = z.object({
  toneScore: z.number().min(0).max(1),
  detectedTone: z.array(z.string()),
  brandTone: z.array(z.string()),
  mismatches: z.array(z.string()),
  suggestion: z.string().optional(),
});

const ClaimFlagsSchema = z.object({
  flags: z.array(
    z.object({
      claim: z.string(),
      riskLevel: z.enum(["low", "medium", "high"]),
      reason: z.string(),
    })
  ),
});

const RevisionSchema = z.object({
  revisedContent: z.string(),
  changes: z.array(z.string()),
  complianceScore: z.number().min(0).max(1),
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

function normalizeSafetyReviewPayload(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const payload = value as Record<string, unknown>;

  return {
    ...payload,
    revisedContent: payload.revisedContent ?? null,
    revisionNotes: payload.revisionNotes ?? null,
  };
}

// ---------------------------------------------------------------------------
// Brand Guardian Operator
// ---------------------------------------------------------------------------

export class BrandGuardianOperator extends BaseOperator {
  constructor() {
    super(OperatorTeam.BRAND_GUARDIAN);
    this.log("initialized");
  }

  // ---------------------------------------------------------------------------
  // BaseOperator implementation
  // ---------------------------------------------------------------------------

  getSystemPrompt(): string {
    return `You are the Brand Guardian AI — the safety and compliance reviewer for a private AI operator platform.

YOUR ROLE:
You review content for brand safety, tonal alignment, risky claims, and platform compliance.
You are firm but fair. Your job is to protect the brand without killing creativity.
When you flag content, you always provide specific, actionable revision suggestions.

REVIEW FRAMEWORK:
1. BLOCKED CONTENT: Phrases or claims the brand explicitly prohibits (always flag as critical)
2. RISKY CLAIMS: Unsubstantiated promises, results claims without disclaimers, legal gray areas
3. TONE MISMATCHES: Content that doesn't match the brand's voice (allowed tones)
4. PLATFORM VIOLATIONS: Content that violates platform terms of service
5. MISSING DISCLAIMERS: Content that requires legal/ethical disclaimers that are absent

RISK LEVELS:
- low: Minor issue, content can publish with small edits
- medium: Significant issue, requires revision before approval
- high: Serious issue, recommend rejection and rewrite
- critical: Content must be blocked — legal/reputation risk

REVIEW PRINCIPLES:
- Be specific: quote the exact problematic text, not general observations
- Be constructive: every flag has a clear fix suggestion
- Be calibrated: not every imperfect sentence is a flag
- Approve content that's good enough — don't hold back strong content for minor style issues
- If revising, preserve the voice and intent while fixing the compliance issue

OUTPUT FORMAT:
Always return the approved/rejected decision, risk level, specific flags, and tonal score.
Include revised content when you can make it better while keeping the core message.`;
  }

  getSupportedJobTypes(): JobType[] {
    return [
      JobType.SAFETY_REVIEW,
      JobType.SAFETY_TONE_CHECK,
      JobType.CLAIM_FLAGGING,
      JobType.TONAL_ALIGNMENT_CHECK,
      JobType.CONTENT_CLASSIFICATION,
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
        case JobType.SAFETY_REVIEW: {
          const input = job.input as SafetyReviewJobInput;
          return await this.reviewContent(input.content, input.brandRules, input.platform);
        }

        case JobType.SAFETY_TONE_CHECK:
        case JobType.TONAL_ALIGNMENT_CHECK: {
          const input = job.input as SafetyReviewJobInput;
          return await this.checkTonalAlignment(input.content, input.brandRules);
        }

        case JobType.CLAIM_FLAGGING: {
          const input = job.input as SafetyReviewJobInput;
          return await this.flagRiskyClaims(input.content);
        }

        default:
          return this.unsupportedJobResult(job, start);
      }
    } catch (err) {
      return this.buildErrorResult(err, job.type, ModelChoice.CLAUDE, start);
    }
  }

  // ---------------------------------------------------------------------------
  // Brand Guardian methods
  // ---------------------------------------------------------------------------

  /**
   * Full content safety review.
   * This is Claude's job — it requires brand context, nuanced reasoning, and
   * the ability to generate a revised version of the content.
   */
  async reviewContent(
    content: string,
    brandRules: BrandRules,
    platform: Platform
  ): Promise<ExecutionResult<SafetyReview>> {
    const start = Date.now();
    this.log("reviewing_content", { platform, maxRisk: brandRules.maxRiskLevel });

    const userPrompt = `Review this content for brand safety.

CONTENT TO REVIEW:
${content}

PLATFORM: ${platform}

BRAND RULES:
- Allowed tones: ${brandRules.allowedTone.join(", ")}
- Blocked phrases (never allowed): ${brandRules.blockedPhrases.join(", ") || "none specified"}
- Blocked claims (never make these): ${brandRules.blockedClaims.join(", ") || "none specified"}
- Requires disclaimer: ${brandRules.requiresDisclaimer}
${brandRules.disclaimerText ? `- Disclaimer text: "${brandRules.disclaimerText}"` : ""}
- Maximum acceptable risk level: ${brandRules.maxRiskLevel}
${brandRules.platformGuidelines?.[platform] ? `- Platform-specific guideline: ${brandRules.platformGuidelines[platform]}` : ""}

Review the content and return your decision. For each flag:
- Quote the exact problematic text
- Explain why it's flagged
- Provide a specific fix suggestion

If approved, set approved: true. If any critical or high flags exist, set approved: false.
Include revised content if you can improve it significantly.

Return ONLY valid JSON:
{
  "approved": <boolean>,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "flags": [
    {
      "type": "blocked_phrase" | "risky_claim" | "tone_mismatch" | "missing_disclaimer" | "platform_violation",
      "severity": "warning" | "error" | "critical",
      "excerpt": "<exact text from content>",
      "suggestion": "<specific fix>"
    }
  ],
  "toneScore": <0.0-1.0>,
  "revisedContent": "<optional improved version or null>",
  "revisionNotes": "<optional notes on what was changed or null>",
  "reviewedAt": "${new Date().toISOString()}"
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 2048,
      });

      if (!result.success) {
        return { ...result, jobType: JobType.SAFETY_REVIEW } as ExecutionResult<SafetyReview>;
      }

      const parsed: unknown = normalizeSafetyReviewPayload(
        JSON.parse(extractJSON(result.data))
      );
      const validated = this.validateOutput(parsed, SafetyReviewSchema);

      this.log("content_reviewed", {
        approved: validated.approved,
        riskLevel: validated.riskLevel,
        flagCount: validated.flags.length,
      });

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
      return this.buildErrorResult(err, JobType.SAFETY_REVIEW, ModelChoice.CLAUDE, start);
    }
  }

  /**
   * Quick tonal alignment check using GPT-5 Nano.
   * Cheap, fast — used for pre-screening before full safety review.
   */
  async checkTonalAlignment(
    content: string,
    brandRules: BrandRules
  ): Promise<ExecutionResult<ToneCheckResult>> {
    const start = Date.now();
    this.log("checking_tonal_alignment");

    // Use GPT-5 Nano score for tonal alignment — it's a simple classification task
    const toneCheckText = `Content: "${content.slice(0, 500)}"\n\nAllowed brand tones: ${brandRules.allowedTone.join(", ")}`;
    const criteria = `Tonal alignment with brand voice (${brandRules.allowedTone.join(", ")}). Score 1.0 = perfect alignment, 0.0 = complete mismatch`;

    const scoreResult = await this.openai.score(toneCheckText, criteria);

    if (!scoreResult.success) {
      return { ...scoreResult, jobType: JobType.TONAL_ALIGNMENT_CHECK } as ExecutionResult<ToneCheckResult>;
    }

    // Classify detected tone
    const classifyResult = await this.openai.classify(
      content.slice(0, 500),
      [...brandRules.allowedTone, "formal", "casual", "aggressive", "passive", "neutral"]
    );

    const detectedTone = classifyResult.success
      ? [classifyResult.data.category]
      : ["unknown"];

    const mismatches = !brandRules.allowedTone.includes(detectedTone[0] ?? "")
      ? [`Detected "${detectedTone[0]}" tone — brand allows: ${brandRules.allowedTone.join(", ")}`]
      : [];

    const toneResult: ToneCheckResult = {
      toneScore: scoreResult.data.score,
      detectedTone,
      brandTone: brandRules.allowedTone,
      mismatches,
      suggestion:
        mismatches.length > 0
          ? `Rewrite using a ${brandRules.allowedTone[0] ?? "on-brand"} tone.`
          : undefined,
    };

    const validated = this.validateOutput(toneResult, ToneCheckSchema);

    this.log("tonal_check_complete", {
      score: validated.toneScore,
      mismatches: validated.mismatches.length,
    });

    return {
      success: true,
      data: validated,
      model: ModelChoice.GPT5_NANO,
      jobType: JobType.TONAL_ALIGNMENT_CHECK,
      tokensUsed: scoreResult.tokensUsed,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Scan content for risky claims using GPT-5 Nano.
   * Fast pre-screening — flags unsubstantiated promises and legal gray areas.
   */
  async flagRiskyClaims(
    content: string
  ): Promise<ExecutionResult<{ flags: Array<{ claim: string; riskLevel: string; reason: string }> }>> {
    const start = Date.now();
    this.log("flagging_risky_claims");

    // Use classify for each major sentence — batch via extractTags
    const tagsResult = await this.openai.extractTags(content);

    // Build a structured claim analysis using score
    const claimsAnalysis = tagsResult.success
      ? tagsResult.data.tags
      : ["content analysis"];

    // Score each extracted concept for risk
    const flaggedClaims = await Promise.all(
      claimsAnalysis.slice(0, 5).map(async (concept) => {
        const riskScore = await this.openai.score(
          concept,
          "Risk of unsubstantiated claim, false promise, or legal gray area. Higher score = higher risk."
        );

        const riskLevel =
          riskScore.success && riskScore.data.score > 0.7
            ? "high"
            : riskScore.success && riskScore.data.score > 0.4
              ? "medium"
              : "low";

        return {
          claim: concept,
          riskLevel,
          reason: riskScore.success ? riskScore.data.reasoning : "Unable to assess",
        };
      })
    );

    // Filter to only medium+ risk
    const significantFlags = flaggedClaims.filter(
      (f) => f.riskLevel === "medium" || f.riskLevel === "high"
    );

    const validated = this.validateOutput(
      { flags: significantFlags },
      ClaimFlagsSchema
    );

    this.log("claims_flagged", { count: validated.flags.length });

    return {
      success: true,
      data: validated,
      model: ModelChoice.GPT5_NANO,
      jobType: JobType.CLAIM_FLAGGING,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Enforce brand guidelines and return revised content.
   * Claude handles this — it needs to rewrite while preserving intent.
   */
  async enforceGuidelines(
    content: string,
    brandRules: BrandRules
  ): Promise<ExecutionResult<{ revisedContent: string; changes: string[]; complianceScore: number }>> {
    const start = Date.now();
    this.log("enforcing_guidelines");

    const userPrompt = `Revise this content to comply with brand guidelines.

ORIGINAL CONTENT:
${content}

BRAND GUIDELINES:
- Allowed tones: ${brandRules.allowedTone.join(", ")}
- Blocked phrases: ${brandRules.blockedPhrases.join(", ") || "none"}
- Blocked claims: ${brandRules.blockedClaims.join(", ") || "none"}
${brandRules.requiresDisclaimer && brandRules.disclaimerText
  ? `- MUST ADD DISCLAIMER: "${brandRules.disclaimerText}"`
  : ""}

Rewrite the content to:
1. Remove all blocked phrases (replace with acceptable alternatives)
2. Remove or soften blocked claims (add qualifications or remove entirely)
3. Match the allowed tone
4. Add any required disclaimers

Preserve the core message, voice, and intent. Make minimal changes necessary for compliance.

Return ONLY valid JSON:
{
  "revisedContent": "<the compliant revised version>",
  "changes": ["<change 1>", "<change 2>"],
  "complianceScore": <0.0-1.0 — how compliant is the revised version>
}`;

    try {
      const result = await this.claude.run(userPrompt, {
        systemPrompt: this.getSystemPrompt(),
        maxTokens: 2048,
      });

      if (!result.success) {
        return { ...result, jobType: JobType.SAFETY_REVIEW } as ExecutionResult<{ revisedContent: string; changes: string[]; complianceScore: number }>;
      }

      const parsed: unknown = JSON.parse(extractJSON(result.data));
      const validated = this.validateOutput(parsed, RevisionSchema);

      this.log("guidelines_enforced", {
        changeCount: validated.changes.length,
        compliance: validated.complianceScore,
      });

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
      return this.buildErrorResult(err, JobType.SAFETY_REVIEW, ModelChoice.CLAUDE, start);
    }
  }

  // ---------------------------------------------------------------------------
  // Convenience: batch review multiple flags
  // ---------------------------------------------------------------------------

  /** Check if content would be auto-approved based on brand rules. */
  wouldAutoApprove(review: SafetyReview, brandRules: BrandRules): boolean {
    const riskOrder: RiskLevel[] = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL];
    const contentRiskIndex = riskOrder.indexOf(review.riskLevel);
    const maxRiskIndex = riskOrder.indexOf(brandRules.maxRiskLevel);
    return contentRiskIndex <= maxRiskIndex && review.flags.every((f) => f.severity !== "critical");
  }

  /** Build a human-readable summary of a safety review. */
  summarizeReview(review: SafetyReview): string {
    const criticalFlags = review.flags.filter((f) => f.severity === "critical");
    const errorFlags = review.flags.filter((f) => f.severity === "error");
    const warningFlags = review.flags.filter((f) => f.severity === "warning");

    if (review.approved) {
      if (review.flags.length === 0) return "Content approved — no issues found.";
      return `Content approved with ${warningFlags.length} warning(s). Tone score: ${Math.round(review.toneScore * 100)}%.`;
    }

    return `Content rejected — ${criticalFlags.length} critical, ${errorFlags.length} error, ${warningFlags.length} warning flag(s). Risk: ${review.riskLevel}.`;
  }

  /** Extract only blocking flags (error + critical severity). */
  getBlockingFlags(review: SafetyReview): SafetyFlag[] {
    return review.flags.filter(
      (f) => f.severity === "error" || f.severity === "critical"
    );
  }
}
