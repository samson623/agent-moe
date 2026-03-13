/**
 * AI Layer — Core Type Definitions
 *
 * This file defines the complete type system for the dual-model AI architecture:
 * - Claude (via @anthropic-ai/sdk): heavy reasoning, tool use, content generation
 * - GPT-5 Nano (via openai): light tasks, classification, scoring, formatting
 *
 * Every operator input and output is strongly typed here. No `any` anywhere.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** All job types supported by the platform. */
export enum JobType {
  // --- Claude-handled (heavy reasoning / tool use) ---
  MISSION_PLANNING = "mission_planning",
  CONTENT_GENERATION = "content_generation",
  THREAD_GENERATION = "thread_generation",
  SCRIPT_GENERATION = "script_generation",
  CAPTION_GENERATION = "caption_generation",
  CONTENT_REPURPOSING = "content_repurposing",
  RESEARCH = "research",
  TREND_ANALYSIS = "trend_analysis",
  TREND_SCAN = "trend_scan",
  MARKET_ANGLE_FINDING = "market_angle_finding",
  AUDIENCE_ANALYSIS = "audience_analysis",
  OFFER_MAPPING = "offer_mapping",
  FUNNEL_DESIGN = "funnel_design",
  LEAD_MAGNET_CREATION = "lead_magnet_creation",
  SAFETY_REVIEW = "safety_review",
  OPPORTUNITY_GENERATION = "opportunity_generation",
  PRICING_STRATEGY = "pricing_strategy",
  VIDEO_PACKAGE = "video_package",

  // --- Browser Agent (Playwright automation via Claude) ---
  BROWSER_SCRAPE = "browser_scrape",
  BROWSER_SCREENSHOT = "browser_screenshot",
  BROWSER_CLICK = "browser_click",
  BROWSER_FILL_FORM = "browser_fill_form",
  BROWSER_NAVIGATE = "browser_navigate",
  BROWSER_MONITOR = "browser_monitor",
  BROWSER_EXTRACT_DATA = "browser_extract_data",
  BROWSER_SUBMIT_FORM = "browser_submit_form",

  // --- GPT-5 Nano-handled (light / high-volume / cheap) ---
  TOPIC_SCORING = "topic_scoring",
  SAFETY_TONE_CHECK = "safety_tone_check",
  CTA_GENERATION = "cta_generation",
  CONTENT_FORMATTING = "content_formatting",
  STATUS_SUMMARY = "status_summary",
  TAG_ASSIGNMENT = "tag_assignment",
  CONFIDENCE_SCORING = "confidence_scoring",
  CONTENT_CLASSIFICATION = "content_classification",
  CLAIM_FLAGGING = "claim_flagging",
  TONAL_ALIGNMENT_CHECK = "tonal_alignment_check",
}

/** Which AI model handles a job. */
export enum ModelChoice {
  CLAUDE = "claude",
  GPT5_NANO = "gpt5_nano",
}

/** The operator teams on the platform. */
export enum OperatorTeam {
  CONTENT_STRIKE = "content_strike",
  GROWTH_OPERATOR = "growth_operator",
  REVENUE_CLOSER = "revenue_closer",
  BRAND_GUARDIAN = "brand_guardian",
  BROWSER_AGENT = "browser_agent",
}

/** Content platform targets. */
export enum Platform {
  X = "x",
  LINKEDIN = "linkedin",
  INSTAGRAM = "instagram",
  TIKTOK = "tiktok",
  YOUTUBE = "youtube",
  EMAIL = "email",
  GENERIC = "generic",
}

/** Job execution status. */
export enum JobStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  BLOCKED = "blocked",
}

/** Risk level returned by Brand Guardian. */
export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// ---------------------------------------------------------------------------
// Core execution types
// ---------------------------------------------------------------------------

/** Generic wrapper for all operator outputs. T is the structured payload. */
export type ExecutionResult<T> =
  | {
      success: true;
      data: T;
      model: ModelChoice;
      jobType: JobType;
      tokensUsed?: number;
      durationMs: number;
      timestamp: string;
    }
  | {
      success: false;
      error: AIError;
      model: ModelChoice;
      jobType: JobType;
      durationMs: number;
      timestamp: string;
    };

/** Structured error type — no throwing untyped Error objects. */
export interface AIError {
  code: AIErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export enum AIErrorCode {
  AUTH_FAILED = "AUTH_FAILED",
  RATE_LIMITED = "RATE_LIMITED",
  CONTEXT_TOO_LONG = "CONTEXT_TOO_LONG",
  INVALID_OUTPUT = "INVALID_OUTPUT",
  TIMEOUT = "TIMEOUT",
  UPSTREAM_ERROR = "UPSTREAM_ERROR",
  SCHEMA_VALIDATION_FAILED = "SCHEMA_VALIDATION_FAILED",
  MISSING_ENV = "MISSING_ENV",
}

// ---------------------------------------------------------------------------
// Job input types
// ---------------------------------------------------------------------------

/** A job that gets routed to an operator. */
export interface Job {
  id: string;
  missionId: string;
  type: JobType;
  operatorTeam: OperatorTeam;
  status: JobStatus;
  priority: number; // 1 = highest
  dependsOn: string[]; // job IDs that must complete first
  input: JobInput;
  output?: unknown;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: AIError;
}

/** Polymorphic input — each job type has its own shape. */
export type JobInput =
  | ContentJobInput
  | ThreadJobInput
  | ScriptJobInput
  | CaptionJobInput
  | ResearchJobInput
  | TrendJobInput
  | OfferJobInput
  | SafetyReviewJobInput
  | ScoringJobInput
  | FormattingJobInput
  | MissionPlanningJobInput;

export interface ContentJobInput {
  kind: "content";
  topic: string;
  platform: Platform;
  tone?: string;
  offerContext?: string;
  keywords?: string[];
  brandRules?: BrandRules;
  existingContent?: string;
}

export interface ThreadJobInput {
  kind: "thread";
  topic: string;
  targetTweetCount?: number; // default 12
  hookStyle?: "question" | "statement" | "controversial" | "listicle";
  offerContext?: string;
  brandRules?: BrandRules;
}

export interface ScriptJobInput {
  kind: "script";
  topic: string;
  platform: Platform.TIKTOK | Platform.YOUTUBE | Platform.INSTAGRAM;
  durationSeconds?: number;
  hookGoal?: string;
  offerContext?: string;
  brandRules?: BrandRules;
}

export interface CaptionJobInput {
  kind: "caption";
  topic: string;
  platform: Platform.INSTAGRAM | Platform.TIKTOK;
  imageDescription?: string;
  hashtagCount?: number;
  brandRules?: BrandRules;
}

export interface ResearchJobInput {
  kind: "research";
  query: string;
  depth?: "surface" | "deep";
  format?: "bullet" | "paragraph" | "structured";
}

export interface TrendJobInput {
  kind: "trend";
  niche: string;
  platforms?: Platform[];
  timeframe?: "24h" | "7d" | "30d";
}

export interface OfferJobInput {
  kind: "offer";
  contentSummary: string;
  audienceProfile?: string;
  availableOffers?: Offer[];
  funnelStage?: "awareness" | "consideration" | "conversion";
}

export interface SafetyReviewJobInput {
  kind: "safety";
  content: string;
  platform: Platform;
  brandRules: BrandRules;
}

export interface ScoringJobInput {
  kind: "scoring";
  items: Array<{ id: string; text: string }>;
  criteria: string;
}

export interface FormattingJobInput {
  kind: "formatting";
  content: string;
  targetPlatform: Platform;
  constraints?: Record<string, unknown>;
}

export interface MissionPlanningJobInput {
  kind: "mission_planning";
  instruction: string;
  workspace: Workspace;
}

// ---------------------------------------------------------------------------
// Workspace & business context
// ---------------------------------------------------------------------------

/** The user's workspace — business context loaded before every mission. */
export interface Workspace {
  id: string;
  name: string;
  niche: string;
  targetAudience: string;
  brandVoice: string;
  activeOffers: Offer[];
  brandRules: BrandRules;
  connectedPlatforms: Platform[];
}

/** A monetization offer that operators can reference. */
export interface Offer {
  id: string;
  name: string;
  description: string;
  pricePoint: string;
  funnelStage: "awareness" | "consideration" | "conversion";
  cta: string;
  url?: string;
}

/** Brand safety and tone guidelines. */
export interface BrandRules {
  allowedTone: string[];
  blockedPhrases: string[];
  blockedClaims: string[];
  requiresDisclaimer: boolean;
  disclaimerText?: string;
  maxRiskLevel: RiskLevel;
  platformGuidelines?: Partial<Record<Platform, string>>;
}

// ---------------------------------------------------------------------------
// Mission Plan types
// ---------------------------------------------------------------------------

/** A structured mission plan returned by the Mission Planner. */
export interface MissionPlan {
  missionId: string;
  instruction: string;
  objective: string;
  rationale: string;
  jobs: PlannedJob[];
  estimatedDurationMinutes: number;
  createdAt: string;
}

/** A job as planned (before it's hydrated into a full Job entity). */
export interface PlannedJob {
  localId: string; // e.g. "job-1", used for depends_on references
  title: string;
  description: string;
  type: JobType;
  operatorTeam: OperatorTeam;
  priority: number;
  dependsOn: string[]; // references localId
  modelRecommendation: ModelChoice;
}

// ---------------------------------------------------------------------------
// Content Strike Team output types
// ---------------------------------------------------------------------------

/** A fully generated content post for any platform. */
export interface ContentOutput {
  platform: Platform;
  contentType: "post" | "thread" | "script" | "caption" | "cta";
  body: string;
  hook?: string;
  hashtags?: string[];
  characterCount: number;
  confidenceScore: number; // 0-1
  metadata: ContentMetadata;
}

export interface ContentMetadata {
  toneUsed: string;
  estimatedReach?: string;
  algorithmNotes?: string;
  revisionSuggestions?: string[];
  linkedOfferId?: string;
}

/** A full X/Twitter thread. */
export interface ThreadOutput {
  tweets: Tweet[];
  totalCharacters: number;
  threadHook: string;
  threadCTA: string;
  confidenceScore: number;
}

export interface Tweet {
  index: number;
  body: string;
  characterCount: number;
}

/** A short-form video script. */
export interface ScriptOutput {
  platform: Platform;
  durationSeconds: number;
  hook: string;
  body: ScriptSection[];
  cta: string;
  thumbnailSuggestion: string;
  captionSuggestion: string;
  confidenceScore: number;
}

export interface ScriptSection {
  timecode: string;
  narration: string;
  visualNote: string;
}

/** A set of CTA variants. */
export interface CTAOutput {
  variants: CTAVariant[];
  recommendedVariant: number; // index into variants
  rationale: string;
}

export interface CTAVariant {
  text: string;
  style: "soft" | "direct" | "urgency" | "curiosity";
  platform: Platform;
}

// ---------------------------------------------------------------------------
// Growth Operator output types
// ---------------------------------------------------------------------------

/** A trend signal with momentum data. */
export interface GrowthSignal {
  topic: string;
  momentumScore: number; // 0-100
  opportunityScore: number; // 0-100
  platforms: Platform[];
  angle: string;
  competitorActivity: "low" | "medium" | "high";
  timeframe: string;
  rationale: string;
}

/** Scored topic list for the Growth Operator. */
export interface ScoredTopic {
  topic: string;
  opportunityScore: number; // 0-100
  audienceFitScore: number; // 0-100
  competitiveGap: number; // 0-100, higher = less competition
  recommendedAction: string;
}

/** A market positioning angle. */
export interface MarketAngle {
  angle: string;
  targetSegment: string;
  differentiator: string;
  contentFramework: string;
  estimatedConversionLift: string;
}

/** An opportunity for the opportunity board. */
export interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: "trend" | "competitor_gap" | "audience_need" | "seasonal";
  urgency: "low" | "medium" | "high";
  recommendedActions: string[];
  estimatedValue: string;
}

// ---------------------------------------------------------------------------
// Revenue Closer output types
// ---------------------------------------------------------------------------

/** Structured revenue and monetization strategy. */
export interface RevenueStrategy {
  recommendedOffer: Offer;
  rationale: string;
  ctaStrategy: CTAStrategy;
  funnelPath: FunnelStage[];
  confidenceScore: number; // 0-1
}

export interface CTAStrategy {
  primaryCTA: string;
  secondaryCTA: string;
  placementRecommendations: string[];
  psychologicalFrame: string;
}

export interface FunnelStage {
  stage: "awareness" | "consideration" | "conversion" | "retention";
  contentType: string;
  message: string;
  kpiTarget: string;
}

/** Lead magnet concept from Revenue Closer. */
export interface LeadMagnetConcept {
  title: string;
  format: "pdf" | "video" | "template" | "checklist" | "mini-course";
  description: string;
  deliverableOutline: string[];
  estimatedConversionRate: string;
  linkedOffer: string;
}

/** Pricing strategy output. */
export interface PricingStrategy {
  recommendedPrice: string;
  priceAnchors: string[];
  framingStrategy: string;
  objectionHandlers: string[];
  guaranteeRecommendation: string;
}

// ---------------------------------------------------------------------------
// Brand Guardian output types
// ---------------------------------------------------------------------------

/** Full safety review of a piece of content. */
export interface SafetyReview {
  approved: boolean;
  riskLevel: RiskLevel;
  flags: SafetyFlag[];
  toneScore: number; // 0-1, how close to brand voice
  revisedContent?: string | null;
  revisionNotes?: string | null;
  reviewedAt: string;
}

export interface SafetyFlag {
  type: "blocked_phrase" | "risky_claim" | "tone_mismatch" | "missing_disclaimer" | "platform_violation";
  severity: "warning" | "error" | "critical";
  excerpt: string;
  suggestion: string;
}

/** Tonal alignment check output (GPT-5 Nano). */
export interface ToneCheckResult {
  toneScore: number; // 0-1
  detectedTone: string[];
  brandTone: string[];
  mismatches: string[];
  suggestion?: string;
}

// ---------------------------------------------------------------------------
// Model Router config
// ---------------------------------------------------------------------------

export interface ModelRouterConfig {
  costThresholdUsd: number;
  forceClaudeForToolUse: boolean;
  forceClaudeForWebAccess: boolean;
  nanoJobTypes: Set<JobType>;
  claudeJobTypes: Set<JobType>;
}

// ---------------------------------------------------------------------------
// Zod schemas for runtime validation of AI outputs
// ---------------------------------------------------------------------------

export const MissionPlanSchema = z.object({
  missionId: z.string(),
  instruction: z.string(),
  objective: z.string(),
  rationale: z.string(),
  jobs: z
    .array(
      z.object({
        localId: z.string(),
        title: z.string(),
        description: z.string(),
        type: z.nativeEnum(JobType),
        operatorTeam: z.nativeEnum(OperatorTeam),
        priority: z.number().int().min(1),
        dependsOn: z.array(z.string()),
        modelRecommendation: z.nativeEnum(ModelChoice),
      })
    )
    .min(1)
    .max(10),
  estimatedDurationMinutes: z.number().positive(),
  createdAt: z.string(),
});

export const ContentOutputSchema = z.object({
  platform: z.nativeEnum(Platform),
  contentType: z.enum(["post", "thread", "script", "caption", "cta"]),
  body: z.string().min(1),
  hook: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  characterCount: z.number().nonnegative(),
  confidenceScore: z.number().min(0).max(1),
  metadata: z.object({
    toneUsed: z.string(),
    estimatedReach: z.string().optional(),
    algorithmNotes: z.string().optional(),
    revisionSuggestions: z.array(z.string()).optional(),
    linkedOfferId: z.string().optional(),
  }),
});

export const SafetyReviewSchema = z.object({
  approved: z.boolean(),
  riskLevel: z.nativeEnum(RiskLevel),
  flags: z.array(
    z.object({
      type: z.enum([
        "blocked_phrase",
        "risky_claim",
        "tone_mismatch",
        "missing_disclaimer",
        "platform_violation",
      ]),
      severity: z.enum(["warning", "error", "critical"]),
      excerpt: z.string(),
      suggestion: z.string(),
    })
  ),
  toneScore: z.number().min(0).max(1),
  revisedContent: z.string().nullable().optional(),
  revisionNotes: z.string().nullable().optional(),
  reviewedAt: z.string(),
});

export const GrowthSignalSchema = z.object({
  topic: z.string(),
  momentumScore: z.number().min(0).max(100),
  opportunityScore: z.number().min(0).max(100),
  platforms: z.array(z.nativeEnum(Platform)),
  angle: z.string(),
  competitorActivity: z.enum(["low", "medium", "high"]),
  timeframe: z.string(),
  rationale: z.string(),
});

export const RevenueStrategySchema = z.object({
  recommendedOffer: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    pricePoint: z.string(),
    funnelStage: z.enum(["awareness", "consideration", "conversion"]),
    cta: z.string(),
    url: z.string().optional(),
  }),
  rationale: z.string(),
  ctaStrategy: z.object({
    primaryCTA: z.string(),
    secondaryCTA: z.string(),
    placementRecommendations: z.array(z.string()),
    psychologicalFrame: z.string(),
  }),
  funnelPath: z.array(
    z.object({
      stage: z.enum(["awareness", "consideration", "conversion", "retention"]),
      contentType: z.string(),
      message: z.string(),
      kpiTarget: z.string(),
    })
  ),
  confidenceScore: z.number().min(0).max(1),
});

export const ThreadOutputSchema = z.object({
  tweets: z
    .array(
      z.object({
        index: z.number(),
        body: z.string().max(280),
        characterCount: z.number(),
      })
    )
    .min(3)
    .max(20),
  totalCharacters: z.number(),
  threadHook: z.string(),
  threadCTA: z.string(),
  confidenceScore: z.number().min(0).max(1),
});

export const ScriptOutputSchema = z.object({
  platform: z.nativeEnum(Platform),
  durationSeconds: z.number().positive(),
  hook: z.string(),
  body: z.array(
    z.object({
      timecode: z.string(),
      narration: z.string(),
      visualNote: z.string(),
    })
  ),
  cta: z.string(),
  thumbnailSuggestion: z.string(),
  captionSuggestion: z.string(),
  confidenceScore: z.number().min(0).max(1),
});

// Re-export zod for convenience downstream
export type { ZodSchema } from "zod";
