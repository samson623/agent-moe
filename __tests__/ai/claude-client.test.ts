/**
 * Claude Client Tests
 *
 * Tests the ClaudeClient wrapper without making real API calls.
 * All Anthropic SDK calls are mocked at the module level.
 */

import { ClaudeClient, getClaudeClient } from "@/features/ai/claude-client";
import {
  AIErrorCode,
  JobType,
  ModelChoice,
  Platform,
  RiskLevel,
} from "@/features/ai/types";

// ---------------------------------------------------------------------------
// Mock Anthropic SDK
// ---------------------------------------------------------------------------

const mockCreate = jest.fn();

jest.mock("@anthropic-ai/sdk", () => {
  class MockAPIError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = "APIError";
    }
  }

  const MockConstructor = jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  }));

  // Attach APIError as static property (matches real Anthropic SDK shape)
  Object.defineProperty(MockConstructor, "APIError", { value: MockAPIError });

  return {
    __esModule: true,
    default: MockConstructor,
    APIError: MockAPIError,
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMockResponse(text: string, inputTokens = 100, outputTokens = 200) {
  return {
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
  };
}

function buildMockWorkspace() {
  return {
    id: "ws-test",
    name: "Test Business",
    niche: "Digital Marketing",
    targetAudience: "Entrepreneurs",
    brandVoice: "Professional, direct",
    activeOffers: [],
    brandRules: {
      allowedTone: ["professional", "friendly"],
      blockedPhrases: [],
      blockedClaims: [],
      requiresDisclaimer: false,
      maxRiskLevel: RiskLevel.MEDIUM,
    },
    connectedPlatforms: [Platform.X, Platform.LINKEDIN],
  };
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let client: ClaudeClient;
const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

// ---------------------------------------------------------------------------
// Instantiation
// ---------------------------------------------------------------------------

describe("ClaudeClient — instantiation", () => {
  it("instantiates without throwing when token is present", () => {
    process.env["CLAUDE_CODE_OAUTH_TOKEN"] = "test-token-abc123";
    expect(() => new ClaudeClient()).not.toThrow();
  });

  it("instantiates without throwing when token is missing (deferred error)", () => {
    delete process.env["CLAUDE_CODE_OAUTH_TOKEN"];
    // Should not throw at construction — errors surface at call time
    expect(() => new ClaudeClient()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

describe("ClaudeClient — healthCheck()", () => {
  it('returns "ok" when CLAUDE_CODE_OAUTH_TOKEN is set', () => {
    process.env["CLAUDE_CODE_OAUTH_TOKEN"] = "valid-token";
    client = new ClaudeClient();
    expect(client.healthCheck()).toBe("ok");
  });

  it('returns "missing_token" when CLAUDE_CODE_OAUTH_TOKEN is not set', () => {
    delete process.env["CLAUDE_CODE_OAUTH_TOKEN"];
    client = new ClaudeClient();
    expect(client.healthCheck()).toBe("missing_token");
  });
});

// ---------------------------------------------------------------------------
// run() — basic text generation
// ---------------------------------------------------------------------------

describe("ClaudeClient — run()", () => {
  beforeEach(() => {
    process.env["CLAUDE_CODE_OAUTH_TOKEN"] = "test-token";
    client = new ClaudeClient();
  });

  it("returns a successful result with text data", async () => {
    const mockText = "Here is the generated content.";
    mockCreate.mockResolvedValueOnce(buildMockResponse(mockText));

    const result = await client.run("Generate something");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(mockText);
      expect(result.model).toBe(ModelChoice.CLAUDE);
      expect(result.jobType).toBe(JobType.CONTENT_GENERATION);
      expect(typeof result.durationMs).toBe("number");
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.tokensUsed).toBe(300); // 100 input + 200 output
    }
  });

  it("returns a failure result on API error", async () => {
    const { APIError } = jest.requireMock("@anthropic-ai/sdk") as {
      APIError: new (status: number, msg: string) => Error & { status: number };
    };
    mockCreate.mockRejectedValueOnce(new APIError(401, "Unauthorized"));

    const result = await client.run("Generate something");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(AIErrorCode.AUTH_FAILED);
      expect(result.error.retryable).toBe(false);
    }
  });

  it("returns rate limit error as retryable", async () => {
    const { APIError } = jest.requireMock("@anthropic-ai/sdk") as {
      APIError: new (status: number, msg: string) => Error & { status: number };
    };
    mockCreate.mockRejectedValueOnce(new APIError(429, "Rate limited"));

    const result = await client.run("Generate");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(AIErrorCode.RATE_LIMITED);
      expect(result.error.retryable).toBe(true);
    }
  });

  it("includes timestamp in result", async () => {
    mockCreate.mockResolvedValueOnce(buildMockResponse("Hello"));
    const result = await client.run("Hello");

    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("passes systemPrompt to the API", async () => {
    mockCreate.mockResolvedValueOnce(buildMockResponse("OK"));
    await client.run("Hello", { systemPrompt: "You are a test assistant." });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: "You are a test assistant.",
      })
    );
  });
});

// ---------------------------------------------------------------------------
// planMission()
// ---------------------------------------------------------------------------

describe("ClaudeClient — planMission()", () => {
  beforeEach(() => {
    process.env["CLAUDE_CODE_OAUTH_TOKEN"] = "test-token";
    client = new ClaudeClient();
  });

  it("returns a valid MissionPlan on success", async () => {
    const mockPlan = {
      missionId: "mission-123",
      instruction: "Create content about AI",
      objective: "Generate a social media content series about AI tools",
      rationale: "Multi-step approach ensures research informs content",
      estimatedDurationMinutes: 15,
      createdAt: new Date().toISOString(),
      jobs: [
        {
          localId: "job-1",
          title: "Research AI Tools",
          description: "Research current AI tool landscape",
          type: "research",
          operatorTeam: "growth_operator",
          priority: 1,
          dependsOn: [],
          modelRecommendation: "claude",
        },
        {
          localId: "job-2",
          title: "Generate X Post",
          description: "Create X post about top AI tools",
          type: "content_generation",
          operatorTeam: "content_strike",
          priority: 2,
          dependsOn: ["job-1"],
          modelRecommendation: "claude",
        },
      ],
    };

    mockCreate.mockResolvedValueOnce(
      buildMockResponse(JSON.stringify(mockPlan))
    );

    const workspace = buildMockWorkspace();
    const result = await client.planMission("Create content about AI", workspace);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.missionId).toBe("mission-123");
      expect(result.data.jobs).toHaveLength(2);
      expect(result.data.jobs[0]?.title).toBe("Research AI Tools");
      expect(result.jobType).toBe(JobType.MISSION_PLANNING);
    }
  });

  it("returns schema validation failure on malformed JSON", async () => {
    mockCreate.mockResolvedValueOnce(buildMockResponse("not valid json at all !!!"));

    const workspace = buildMockWorkspace();
    const result = await client.planMission("Create content", workspace);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(AIErrorCode.SCHEMA_VALIDATION_FAILED);
      expect(result.error.retryable).toBe(false);
    }
  });

  it("returns schema validation failure when plan is missing required fields", async () => {
    const incompletePlan = { missionId: "123", jobs: [] }; // missing required fields
    mockCreate.mockResolvedValueOnce(
      buildMockResponse(JSON.stringify(incompletePlan))
    );

    const workspace = buildMockWorkspace();
    const result = await client.planMission("Test", workspace);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(AIErrorCode.SCHEMA_VALIDATION_FAILED);
    }
  });

  it("extracts JSON from markdown code fences", async () => {
    const mockPlan = {
      missionId: "mission-456",
      instruction: "Test",
      objective: "Test objective",
      rationale: "Test rationale",
      estimatedDurationMinutes: 10,
      createdAt: new Date().toISOString(),
      jobs: [
        {
          localId: "job-1",
          title: "Test Job",
          description: "Test description",
          type: "research",
          operatorTeam: "growth_operator",
          priority: 1,
          dependsOn: [],
          modelRecommendation: "claude",
        },
      ],
    };

    // Claude sometimes wraps JSON in ```json ... ```
    const withFences = `\`\`\`json\n${JSON.stringify(mockPlan)}\n\`\`\``;
    mockCreate.mockResolvedValueOnce(buildMockResponse(withFences));

    const workspace = buildMockWorkspace();
    const result = await client.planMission("Test", workspace);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.missionId).toBe("mission-456");
    }
  });
});

// ---------------------------------------------------------------------------
// reviewSafety()
// ---------------------------------------------------------------------------

describe("ClaudeClient — reviewSafety()", () => {
  beforeEach(() => {
    process.env["CLAUDE_CODE_OAUTH_TOKEN"] = "test-token";
    client = new ClaudeClient();
  });

  it("returns a valid SafetyReview on success", async () => {
    const mockReview = {
      approved: true,
      riskLevel: "low",
      flags: [],
      toneScore: 0.9,
      reviewedAt: new Date().toISOString(),
    };

    mockCreate.mockResolvedValueOnce(
      buildMockResponse(JSON.stringify(mockReview))
    );

    const brandRules = {
      allowedTone: ["professional"],
      blockedPhrases: [],
      blockedClaims: [],
      requiresDisclaimer: false,
      maxRiskLevel: RiskLevel.MEDIUM,
    };

    const result = await client.reviewSafety(
      "This is great content!",
      brandRules,
      Platform.X
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.approved).toBe(true);
      expect(result.data.riskLevel).toBe("low");
      expect(result.data.toneScore).toBe(0.9);
      expect(result.jobType).toBe(JobType.SAFETY_REVIEW);
    }
  });

  it("returns failure result when API call fails", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Network error"));

    const brandRules = {
      allowedTone: ["professional"],
      blockedPhrases: [],
      blockedClaims: [],
      requiresDisclaimer: false,
      maxRiskLevel: RiskLevel.MEDIUM,
    };

    const result = await client.reviewSafety("Content", brandRules, Platform.X);

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

describe("ClaudeClient — singleton", () => {
  it("getClaudeClient returns the same instance on repeated calls", () => {
    process.env["CLAUDE_CODE_OAUTH_TOKEN"] = "test-token";
    const c1 = getClaudeClient();
    const c2 = getClaudeClient();
    expect(c1).toBe(c2);
  });
});
