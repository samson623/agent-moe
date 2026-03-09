/**
 * Content Strike Operator Tests
 *
 * Tests the ContentStrikeOperator's system prompt, supported job types,
 * and output schema validation. All API calls are mocked.
 */

import { ContentStrikeOperator } from "@/features/ai/operators/content-strike-operator";
import {
  JobStatus,
  JobType,
  ModelChoice,
  OperatorTeam,
  Platform,
  RiskLevel,
  type Job,
} from "@/features/ai/types";
import {
  ContentOutputSchema,
  ThreadOutputSchema,
  ScriptOutputSchema,
} from "@/features/ai/types";

// ---------------------------------------------------------------------------
// Mock all AI clients so no real API calls are made
// ---------------------------------------------------------------------------

const mockClaudeRun = jest.fn();
const mockOpenAIGenerateVariants = jest.fn();

jest.mock("@/features/ai/claude-client", () => ({
  getClaudeClient: jest.fn(() => ({
    run: mockClaudeRun,
    healthCheck: jest.fn().mockReturnValue("ok"),
  })),
  ClaudeClient: jest.fn().mockImplementation(() => ({
    run: mockClaudeRun,
    healthCheck: jest.fn().mockReturnValue("ok"),
  })),
}));

jest.mock("@/features/ai/openai-client", () => ({
  getOpenAIClient: jest.fn(() => ({
    generateVariants: mockOpenAIGenerateVariants,
    score: jest.fn().mockResolvedValue({
      success: true,
      data: { score: 0.8, reasoning: "good" },
      model: "gpt5_nano",
      jobType: "cta_generation",
      durationMs: 100,
      timestamp: new Date().toISOString(),
    }),
    healthCheck: jest.fn().mockReturnValue("ok"),
  })),
  OpenAIClient: jest.fn(),
}));

jest.mock("@/features/ai/model-router", () => ({
  getModelRouter: jest.fn(() => ({
    route: jest.fn().mockReturnValue("claude"),
    getModelForJob: jest.fn().mockReturnValue("claude"),
  })),
  ModelRouter: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSuccessResult(data: unknown) {
  return {
    success: true as const,
    data: JSON.stringify(data),
    model: ModelChoice.CLAUDE,
    jobType: JobType.CONTENT_GENERATION,
    tokensUsed: 300,
    durationMs: 500,
    timestamp: new Date().toISOString(),
  };
}

function buildJob(type: JobType, overrides: Partial<Job> = {}): Job {
  return {
    id: "test-job-id",
    missionId: "test-mission-id",
    type,
    operatorTeam: OperatorTeam.CONTENT_STRIKE,
    status: JobStatus.PENDING,
    priority: 1,
    dependsOn: [],
    input: {
      kind: "content",
      topic: "AI productivity tools for entrepreneurs",
      platform: Platform.X,
      tone: "professional",
    },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let operator: ContentStrikeOperator;

beforeEach(() => {
  jest.clearAllMocks();
  operator = new ContentStrikeOperator();
});

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

describe("ContentStrikeOperator — system prompt", () => {
  it("includes expertise in platform-native formats", () => {
    const prompt = operator.getSystemPrompt();
    expect(prompt.toLowerCase()).toContain("platform");
  });

  it("includes hook engineering concepts", () => {
    const prompt = operator.getSystemPrompt();
    expect(prompt.toLowerCase()).toContain("hook");
  });

  it("includes algorithm knowledge", () => {
    const prompt = operator.getSystemPrompt();
    expect(prompt.toLowerCase()).toContain("algorithm");
  });

  it("includes confidence score mention", () => {
    const prompt = operator.getSystemPrompt();
    expect(prompt.toLowerCase()).toContain("confidence");
  });

  it("is non-trivially long (at least 500 chars)", () => {
    const prompt = operator.getSystemPrompt();
    expect(prompt.length).toBeGreaterThan(500);
  });

  it("mentions specific platforms", () => {
    const prompt = operator.getSystemPrompt();
    // Should mention at least some of the key platforms
    const mentionedPlatforms = ["linkedin", "instagram", "tiktok"].filter((p) =>
      prompt.toLowerCase().includes(p)
    );
    expect(mentionedPlatforms.length).toBeGreaterThan(0);
  });

  it("includes copywriting frameworks", () => {
    const prompt = operator.getSystemPrompt();
    // Should reference at least one framework
    const frameworks = ["aida", "pas", "hook", "viral"].filter((f) =>
      prompt.toLowerCase().includes(f)
    );
    expect(frameworks.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Supported job types
// ---------------------------------------------------------------------------

describe("ContentStrikeOperator — supported job types", () => {
  it("includes content_generation", () => {
    expect(operator.getSupportedJobTypes()).toContain(JobType.CONTENT_GENERATION);
  });

  it("includes thread_generation", () => {
    expect(operator.getSupportedJobTypes()).toContain(JobType.THREAD_GENERATION);
  });

  it("includes script_generation", () => {
    expect(operator.getSupportedJobTypes()).toContain(JobType.SCRIPT_GENERATION);
  });

  it("includes caption_generation", () => {
    expect(operator.getSupportedJobTypes()).toContain(JobType.CAPTION_GENERATION);
  });

  it("includes cta_generation", () => {
    expect(operator.getSupportedJobTypes()).toContain(JobType.CTA_GENERATION);
  });

  it("includes content_repurposing", () => {
    expect(operator.getSupportedJobTypes()).toContain(JobType.CONTENT_REPURPOSING);
  });

  it("does NOT include mission_planning (wrong operator)", () => {
    expect(operator.getSupportedJobTypes()).not.toContain(JobType.MISSION_PLANNING);
  });

  it("does NOT include safety_review (Brand Guardian's job)", () => {
    expect(operator.getSupportedJobTypes()).not.toContain(JobType.SAFETY_REVIEW);
  });

  it("does NOT include trend_analysis (Growth Operator's job)", () => {
    expect(operator.getSupportedJobTypes()).not.toContain(JobType.TREND_ANALYSIS);
  });
});

// ---------------------------------------------------------------------------
// Output schema validation
// ---------------------------------------------------------------------------

describe("ContentStrikeOperator — output schema validation", () => {
  it("ContentOutputSchema rejects empty body", () => {
    const result = ContentOutputSchema.safeParse({
      platform: Platform.X,
      contentType: "post",
      body: "", // empty — should fail
      characterCount: 0,
      confidenceScore: 0.8,
      metadata: { toneUsed: "professional" },
    });
    expect(result.success).toBe(false);
  });

  it("ContentOutputSchema rejects confidence score above 1", () => {
    const result = ContentOutputSchema.safeParse({
      platform: Platform.X,
      contentType: "post",
      body: "Valid content here",
      characterCount: 18,
      confidenceScore: 1.5, // out of range
      metadata: { toneUsed: "professional" },
    });
    expect(result.success).toBe(false);
  });

  it("ContentOutputSchema accepts valid post output", () => {
    const result = ContentOutputSchema.safeParse({
      platform: Platform.X,
      contentType: "post",
      body: "This is a great X post about AI tools for entrepreneurs.",
      hook: "AI tools are changing everything.",
      hashtags: ["#AI", "#productivity"],
      characterCount: 56,
      confidenceScore: 0.85,
      metadata: {
        toneUsed: "professional",
        estimatedReach: "high",
        algorithmNotes: "Engagement-driven format",
      },
    });
    expect(result.success).toBe(true);
  });

  it("ThreadOutputSchema rejects threads with 0 tweets", () => {
    const result = ThreadOutputSchema.safeParse({
      tweets: [], // must have at least 3
      totalCharacters: 0,
      threadHook: "A hook",
      threadCTA: "A CTA",
      confidenceScore: 0.8,
    });
    expect(result.success).toBe(false);
  });

  it("ThreadOutputSchema accepts valid thread with 3+ tweets", () => {
    const result = ThreadOutputSchema.safeParse({
      tweets: [
        { index: 1, body: "Tweet 1 content here (1/3)", characterCount: 26 },
        { index: 2, body: "Tweet 2 content here (2/3)", characterCount: 26 },
        { index: 3, body: "Tweet 3 CTA content (3/3)", characterCount: 25 },
      ],
      totalCharacters: 77,
      threadHook: "Tweet 1 content here (1/3)",
      threadCTA: "Tweet 3 CTA content (3/3)",
      confidenceScore: 0.9,
    });
    expect(result.success).toBe(true);
  });

  it("ScriptOutputSchema rejects zero-duration scripts", () => {
    const result = ScriptOutputSchema.safeParse({
      platform: Platform.TIKTOK,
      durationSeconds: 0, // must be positive
      hook: "Hook text",
      body: [],
      cta: "CTA text",
      thumbnailSuggestion: "Thumbnail idea",
      captionSuggestion: "Caption text",
      confidenceScore: 0.8,
    });
    expect(result.success).toBe(false);
  });

  it("ScriptOutputSchema accepts valid 60-second script", () => {
    const result = ScriptOutputSchema.safeParse({
      platform: Platform.TIKTOK,
      durationSeconds: 60,
      hook: "Did you know AI can write your content in 10 seconds?",
      body: [
        {
          timecode: "0:03",
          narration: "Here is the key insight for you.",
          visualNote: "Show a split screen of before/after",
        },
      ],
      cta: "Follow for more AI productivity tips.",
      thumbnailSuggestion: "Bold text: '10x your output' on dark background",
      captionSuggestion: "AI tools are changing content creation. #AI #productivity",
      confidenceScore: 0.87,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// execute() — routing and output
// ---------------------------------------------------------------------------

describe("ContentStrikeOperator — execute()", () => {
  it("returns error result for unsupported job types", async () => {
    const unsupportedJob = buildJob(JobType.MISSION_PLANNING);
    const result = await operator.execute(unsupportedJob);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("does not support");
    }
  });

  it("generates a post successfully with mocked Claude response", async () => {
    const mockContent = {
      platform: "x",
      contentType: "post",
      body: "AI tools are transforming how entrepreneurs work. Here are the top 5 you should know about in 2026.",
      hook: "AI tools are transforming how entrepreneurs work.",
      hashtags: ["#AI", "#entrepreneur"],
      characterCount: 99,
      confidenceScore: 0.88,
      metadata: {
        toneUsed: "professional",
        estimatedReach: "high",
        algorithmNotes: "High engagement pattern — question + data",
      },
    };

    mockClaudeRun.mockResolvedValueOnce(buildSuccessResult(mockContent));

    const job = buildJob(JobType.CONTENT_GENERATION);
    const result = await operator.execute(job);

    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as typeof mockContent;
      expect(data.platform).toBe("x");
      expect(data.contentType).toBe("post");
      expect(data.confidenceScore).toBeGreaterThan(0);
      expect(typeof data.body).toBe("string");
      expect(data.body.length).toBeGreaterThan(0);
    }
  });

  it("returns failure result when Claude returns an error", async () => {
    mockClaudeRun.mockResolvedValueOnce({
      success: false,
      error: {
        code: "UPSTREAM_ERROR",
        message: "API unavailable",
        retryable: true,
      },
      model: ModelChoice.CLAUDE,
      jobType: JobType.CONTENT_GENERATION,
      durationMs: 100,
      timestamp: new Date().toISOString(),
    });

    const job = buildJob(JobType.CONTENT_GENERATION);
    const result = await operator.execute(job);

    expect(result.success).toBe(false);
  });

  it("returns failure result when Claude returns invalid JSON", async () => {
    mockClaudeRun.mockResolvedValueOnce({
      success: true,
      data: "This is not JSON at all! {{broken",
      model: ModelChoice.CLAUDE,
      jobType: JobType.CONTENT_GENERATION,
      tokensUsed: 100,
      durationMs: 300,
      timestamp: new Date().toISOString(),
    });

    const job = buildJob(JobType.CONTENT_GENERATION);
    const result = await operator.execute(job);

    expect(result.success).toBe(false);
  });

  it("uses GPT-5 Nano (via OpenAI) for CTA generation", async () => {
    mockOpenAIGenerateVariants.mockResolvedValueOnce({
      success: true,
      data: { variants: ["Click here", "Get started now", "Try it free"] },
      model: ModelChoice.GPT5_NANO,
      jobType: JobType.CTA_GENERATION,
      tokensUsed: 50,
      durationMs: 200,
      timestamp: new Date().toISOString(),
    });

    const job = buildJob(JobType.CTA_GENERATION);
    const result = await operator.execute(job);

    expect(result.success).toBe(true);
    if (result.success) {
      // CTA generation uses GPT-5 Nano
      expect(result.model).toBe(ModelChoice.GPT5_NANO);
    }
    // Claude should NOT have been called for CTA generation
    expect(mockClaudeRun).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Team assignment
// ---------------------------------------------------------------------------

describe("ContentStrikeOperator — team assignment", () => {
  it("belongs to CONTENT_STRIKE team", () => {
    // @ts-expect-error — accessing protected property for test verification
    expect(operator.team).toBe(OperatorTeam.CONTENT_STRIKE);
  });
});
